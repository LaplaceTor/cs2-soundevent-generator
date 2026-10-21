import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { rollup } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import alias from '@rollup/plugin-alias';
import { babel } from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';
import esbuild from 'esbuild-wasm';

async function build() {
  console.log('Starting pure JS Rollup build with minification & code-splitting...');

  const distDir = path.resolve('dist');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  // Copy public files
  const publicDir = path.resolve('public');
  if (fs.existsSync(publicDir)) {
    fs.cpSync(publicDir, distDir, { recursive: true });
  }

  const bundle = await rollup({
    input: path.resolve('src/main.tsx'),
    plugins: [
      alias({
        entries: [
          { find: '@', replacement: path.resolve('src') },
        ],
      }),
      replace({
        preventAssignment: true,
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
      resolve({
        extensions: ['.mjs', '.js', '.json', '.node', '.ts', '.tsx'],
        browser: true,
      }),
      babel({
        babelHelpers: 'bundled',
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        presets: [
          ['@babel/preset-react', { runtime: 'automatic', development: false }],
          '@babel/preset-typescript',
        ],
      }),
      commonjs(),
      json(),
      postcss({
        extract: 'assets/index.css',
        minimize: true,
      }),
      {
        name: 'esbuild-minify',
        async renderChunk(code) {
          const res = await esbuild.transform(code, {
            minify: true,
            target: 'es2020',
            legalComments: 'none',
          });
          return { code: res.code, map: res.map };
        },
      },
    ],
  });

  const { output } = await bundle.write({
    dir: distDir,
    format: 'es',
    entryFileNames: 'assets/[name]-[hash].js',
    chunkFileNames: 'assets/[name]-[hash].js',
    assetFileNames: 'assets/[name]-[hash][extname]',
    manualChunks(id) {
      if (id.includes('node_modules')) {
        if (
          id.includes('@codemirror') ||
          id.includes('w3c-keyname') ||
          id.includes('crelt') ||
          id.includes('style-mod')
        ) {
          return 'codemirror';
        }
        return 'vendor';
      }
    },
  });

  await bundle.close();

  // Find generated entry JS and CSS filenames
  const entryChunk = output.find((chunk) => chunk.type === 'chunk' && chunk.isEntry);
  const jsFile = entryChunk?.fileName || 'assets/main.js';
  const cssFile = output.find((chunk) => chunk.type === 'asset' && chunk.fileName.endsWith('.css'))?.fileName || 'assets/index.css';

  // Collect entry imports for modulepreload
  const preloadLinks = output
    .filter((chunk) => chunk.type === 'chunk' && !chunk.isEntry && entryChunk?.imports?.includes(chunk.fileName))
    .map((chunk) => `    <link rel="modulepreload" crossorigin href="./${chunk.fileName}" />`)
    .join('\n');

  // Read index.html template and inject
  let html = fs.readFileSync('index.html', 'utf8');
  let headTags = `    <link rel="stylesheet" href="./${cssFile}" />\n`;
  if (preloadLinks) {
    headTags += `${preloadLinks}\n`;
  }
  html = html.replace('</head>', `${headTags}  </head>`);
  html = html.replace(
    '<script type="module" src="/src/main.tsx"></script>',
    `<script type="module" src="./${jsFile}"></script>`
  );
  fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf8');

  console.log('\n--- Build Asset Size Report ---');
  let totalRaw = 0;
  let totalGzip = 0;
  for (const item of output) {
    if (item.type === 'chunk') {
      const rawBytes = Buffer.byteLength(item.code, 'utf8');
      const gzipBytes = zlib.gzipSync(item.code).length;
      totalRaw += rawBytes;
      totalGzip += gzipBytes;
      console.log(
        `  ${item.fileName.padEnd(36)} ${(rawBytes / 1024).toFixed(1).padStart(7)} KB  (gzip: ${(gzipBytes / 1024).toFixed(1).padStart(6)} KB) ${item.isEntry ? '[entry]' : ''}`
      );
    } else if (item.type === 'asset') {
      const source = typeof item.source === 'string' ? item.source : Buffer.from(item.source);
      const rawBytes = Buffer.byteLength(source);
      const gzipBytes = zlib.gzipSync(source).length;
      totalRaw += rawBytes;
      totalGzip += gzipBytes;
      console.log(
        `  ${item.fileName.padEnd(36)} ${(rawBytes / 1024).toFixed(1).padStart(7)} KB  (gzip: ${(gzipBytes / 1024).toFixed(1).padStart(6)} KB) [asset]`
      );
    }
  }
  console.log('--------------------------------');
  console.log(`  Total: ${(totalRaw / 1024).toFixed(1)} KB (gzip: ${(totalGzip / 1024).toFixed(1)} KB)`);
  console.log('Build completed successfully!\n');
}

build().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
