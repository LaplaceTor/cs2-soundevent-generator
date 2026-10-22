#!/usr/bin/env node
/**
 * Dependency vulnerability policy gate.
 *
 * Applies a tiered blocking policy to `npm audit --json` output:
 *   - production dependencies: block on severity >= high
 *   - dev-only dependencies:   block on severity >= critical
 *   - everything else is reported as a warning
 *
 * Advisories listed in the allowlist (by GHSA ID) are not blocking until their
 * `expires` date has passed; expired entries become blocking again.
 *
 * Usage:
 *   node audit-policy.mjs --prod prod.json --all all.json [--allowlist file] [--report report.md]
 *   node audit-policy.mjs --allow-ghsas [--allowlist file]
 *
 * Outputs (when running in GitHub Actions):
 *   - Markdown report appended to $GITHUB_STEP_SUMMARY
 *   - `blocking=<count>` / `ghsas=<list>` written to $GITHUB_OUTPUT
 */
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEVERITY_RANK = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };
const POLICY = {
  production: 'high',
  development: 'critical',
};

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ALLOWLIST = join(here, '..', 'audit-allowlist.json');

function parseArgs(argv) {
  const args = { allowlist: DEFAULT_ALLOWLIST };
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    switch (key) {
      case '--prod':
      case '--all':
      case '--allowlist':
      case '--report':
        args[key.slice(2)] = argv[++i];
        break;
      case '--allow-ghsas':
        args.allowGhsas = true;
        break;
      default:
        throw new Error(`Unknown argument: ${key}`);
    }
  }
  return args;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function loadAllowlist(path) {
  if (!path || !existsSync(path)) return [];
  const data = readJson(path);
  const entries = Array.isArray(data) ? data : data.entries ?? [];
  return entries.map((entry, index) => {
    if (!/^GHSA(-[0-9a-z]{4}){3}$/i.test(entry.id ?? '')) {
      throw new Error(`Allowlist entry #${index} has invalid GHSA id: ${entry.id}`);
    }
    if (!entry.reason) {
      throw new Error(`Allowlist entry ${entry.id} is missing "reason"`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.expires ?? '')) {
      throw new Error(`Allowlist entry ${entry.id} needs "expires" as YYYY-MM-DD`);
    }
    return { ...entry, id: entry.id.toUpperCase(), expired: entry.expires < today() };
  });
}

function setOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  }
}

/** Human-readable form of npm audit's `fixAvailable` (false | true | { name, version, isSemVerMajor }). */
function describeFix(fix) {
  if (!fix) return 'no';
  if (fix === true) return 'yes';
  return `${fix.isSemVerMajor ? 'major: ' : ''}\`${fix.name}@${fix.version}\``;
}

/** Collects advisories (keyed by GHSA id) from an `npm audit --json` report. */
function loadAdvisories(path) {
  let report;
  try {
    report = readJson(path);
  } catch {
    throw new Error(`${path} is not valid JSON (did npm audit fail?)`);
  }
  if (report.error) {
    throw new Error(`npm audit error in ${path}: ${report.error.summary ?? JSON.stringify(report.error)}`);
  }
  if (!report.vulnerabilities) {
    throw new Error(`${path} does not look like npm audit v2 output`);
  }

  const advisories = new Map();
  for (const vuln of Object.values(report.vulnerabilities)) {
    for (const via of vuln.via) {
      if (typeof via !== 'object') continue; // transitive reference, advisory is listed elsewhere
      const id = via.url?.match(/GHSA(-[0-9a-z]{4}){3}/i)?.[0]?.toUpperCase() ?? `npm-${via.source}`;
      const existing = advisories.get(id);
      const packages = existing?.packages ?? new Set();
      packages.add(via.name);
      // Packages that pull in the vulnerable one (e.g. tailwindcss -> chokidar -> braces).
      const affected = existing?.affected ?? new Set();
      for (const effect of vuln.effects ?? []) affected.add(effect);
      advisories.set(id, {
        id,
        title: via.title,
        url: via.url,
        severity: via.severity,
        range: via.range,
        fixAvailable: describeFix(vuln.fixAvailable),
        packages,
        affected,
      });
    }
  }
  return advisories;
}

function escapeCell(text) {
  return String(text ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function table(rows) {
  if (rows.length === 0) return '_None_\n';
  const header = '| Severity | Advisory | Package | Scope | Fix | Note |\n|---|---|---|---|---|---|\n';
  return (
    header +
    rows
      .map((r) =>
        [
          `**${r.severity}**`,
          r.url ? `[${r.id}](${r.url}) ${escapeCell(r.title)}` : `${r.id} ${escapeCell(r.title)}`,
          `\`${[...r.packages].join(', ')}\`${r.affected.size ? ` (via ${[...r.affected].map((p) => `\`${p}\``).join(', ')})` : ''}`,
          r.scope,
          r.fixAvailable,
          escapeCell(r.note ?? ''),
        ].join(' | '),
      )
      .map((line) => `| ${line} |`)
      .join('\n') +
    '\n'
  );
}

function runAllowGhsas(args) {
  const active = loadAllowlist(args.allowlist).filter((e) => !e.expired).map((e) => e.id);
  const value = active.join(',');
  setOutput('ghsas', value);
  console.log(value);
}

function runPolicy(args) {
  if (!args.prod || !args.all) {
    throw new Error('--prod and --all are required');
  }
  const allowlist = loadAllowlist(args.allowlist);
  const allowById = new Map(allowlist.map((e) => [e.id, e]));
  const prod = loadAdvisories(args.prod);
  const all = loadAdvisories(args.all);

  const blocking = [];
  const allowed = [];
  const warnings = [];

  for (const [id, advisory] of all) {
    const scope = prod.has(id) ? 'production' : 'development';
    const threshold = POLICY[scope];
    const row = { ...advisory, scope };
    const exceedsThreshold = SEVERITY_RANK[advisory.severity] >= SEVERITY_RANK[threshold];
    const allow = allowById.get(id);

    if (!exceedsThreshold) {
      warnings.push(row);
    } else if (allow && !allow.expired) {
      allowed.push({ ...row, note: `allowlisted until ${allow.expires}: ${allow.reason}` });
    } else if (allow?.expired) {
      blocking.push({ ...row, note: `allowlist entry expired on ${allow.expires}` });
    } else {
      blocking.push(row);
    }
  }

  const bySeverity = (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || a.id.localeCompare(b.id);
  blocking.sort(bySeverity);
  allowed.sort(bySeverity);
  warnings.sort(bySeverity);

  const unusedAllow = allowlist.filter((e) => !all.has(e.id));

  const status = blocking.length
    ? `❌ **${blocking.length} blocking vulnerabilit${blocking.length === 1 ? 'y' : 'ies'}**`
    : '✅ **No blocking vulnerabilities**';

  let md = `## Dependency vulnerability audit\n\n${status}\n\n`;
  md += `Policy: production deps block on **>= ${POLICY.production}**, dev-only deps block on **>= ${POLICY.development}**. `;
  md += 'Exceptions live in `.github/audit-allowlist.json`.\n\n';
  md += `### Blocking (${blocking.length})\n\n${table(blocking)}\n`;
  md += `### Allowlisted (${allowed.length})\n\n${table(allowed)}\n`;
  md += `### Warnings — below threshold (${warnings.length})\n\n${table(warnings)}\n`;
  if (unusedAllow.length) {
    md += `### Stale allowlist entries\n\nThese entries no longer match any finding and can be removed: ${unusedAllow
      .map((e) => `\`${e.id}\``)
      .join(', ')}\n`;
  }

  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
  if (args.report) writeFileSync(args.report, md);
  setOutput('blocking', blocking.length);

  console.log(md);
  for (const row of blocking) {
    // Surfaces as an error annotation in the GitHub UI.
    console.log(`::error title=Vulnerable dependency (${row.scope})::${row.severity} ${row.id} in ${[...row.packages].join(', ')} - ${row.title}`);
  }
  for (const row of warnings.filter((r) => SEVERITY_RANK[r.severity] >= SEVERITY_RANK.high)) {
    console.log(`::warning title=Vulnerable dependency (${row.scope})::${row.severity} ${row.id} in ${[...row.packages].join(', ')} - ${row.title}`);
  }

  process.exitCode = blocking.length ? 1 : 0;
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.allowGhsas) runAllowGhsas(args);
  else runPolicy(args);
} catch (error) {
  console.error(`::error title=audit-policy::${error.message}`);
  process.exitCode = 2;
}
