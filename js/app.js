/**
 * CS2 SoundEvent Generator - Modern Minimalist Application Controller
 * Pure Vanilla ES Modules, Responsive Split-Pane Layout.
 */

import { GROUPS, SPECS, DEFAULTS, TOGGLE_DEPENDENTS, PRESETS, MIXGROUPS, DSP_PRESETS, TYPE_OBJECTS, TYPE_DESCRIPTIONS, typeNeedsValue, MIN_MAX_MAP, CHILD_TO_PARENT_MAP } from "./schema.js";
import { I18N } from "./i18n.js";
import { SoundEventState } from "./state.js";
import { serializeSoundEvent, normalizeVsndPath, validateKv3, formatKv3Text } from "./kv3.js";
import { drawCurveCanvas, attachInteractiveCurve, CURVE_PRESETS, generateCurveFromEndpoints, getCurveAxisInfo } from "./curve.js";
import { Kv3Autocomplete } from "./autocomplete.js";

// Global App State
const state = new SoundEventState();

// View / Filter state
let filterSearch = "";
let filterActiveOnly = false;
const expandedGroups = new Set(["general", "playback", "position"]);

// DOM Elements
const eventNameInput = document.getElementById("eventNameInput");
const presetSelect = document.getElementById("presetSelect");
const shareBtn = document.getElementById("shareBtn");
const resetBtn = document.getElementById("resetBtn");
const langToggleBtn = document.getElementById("langToggleBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn");

const searchInput = document.getElementById("searchInput");
const expandAllBtn = document.getElementById("expandAllBtn");
const collapseAllBtn = document.getElementById("collapseAllBtn");
const filterAllBtn = document.getElementById("filterAllBtn");
const filterActiveBtn = document.getElementById("filterActiveBtn");
const activeFilterBadge = document.getElementById("activeFilterBadge");
const groupsContainer = document.getElementById("groupsContainer");

// Right Column: Live Code Editor & Diagnostics
const codeEditor = document.getElementById("codeEditor");
const editorGutter = document.getElementById("editorGutter");
const editorContainer = document.getElementById("editorContainer");
const errorBanner = document.getElementById("errorBanner");
const errorMessage = document.getElementById("errorMessage");
const editorStatusBadge = document.getElementById("editorStatusBadge");
const editorStatusDot = document.getElementById("editorStatusDot");
const editorStatusText = document.getElementById("editorStatusText");
const cursorPosIndicator = document.getElementById("cursorPosIndicator");
const autocompletePopup = document.getElementById("autocompletePopup");
const formatBtn = document.getElementById("formatBtn");

// Mobile/Narrow Screen Drawer Elements
const openEditorDrawerBtn = document.getElementById("openEditorDrawerBtn");
const closeEditorDrawerBtn = document.getElementById("closeEditorDrawerBtn");
const drawerBackdrop = document.getElementById("drawerBackdrop");
const drawerStatusDot = document.getElementById("drawerStatusDot");
const rightEditorSection = document.getElementById("rightEditorSection");

const includeCommentsCheck = document.getElementById("includeCommentsCheck");
const copyCodeBtn = document.getElementById("copyCodeBtn");
const toast = document.getElementById("toast");

// How To Use Hammer Sound Entities Modal Elements
const howToUseBtn = document.getElementById("howToUseBtn");
const howToUseModal = document.getElementById("howToUseModal");
const closeHowToUseModalBtn = document.getElementById("closeHowToUseModalBtn");
const confirmHowToUseModalBtn = document.getElementById("confirmHowToUseModalBtn");
const howToUseModalTitle = document.getElementById("howToUseModalTitle");
const howToUseModalBody = document.getElementById("howToUseModalBody");

let autocomplete = null;
let currentErrorLine = null;
let codeDebounceTimer = null;

/**
 * Toast helper
 */
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

/**
 * Render How To Use Sound Entities Guide Modal
 */
function renderHowToUseModal() {
  if (!howToUseModalBody) return;
  const isZh = state.lang === "zh";

  if (howToUseModalTitle) {
    howToUseModalTitle.textContent = isZh
      ? "CS2 地图声音实体与发声机制指南"
      : "CS2 Hammer Sound Entities & Playback Guide";
  }

  if (confirmHowToUseModalBtn) {
    confirmHowToUseModalBtn.textContent = isZh ? "关闭 (Close)" : "Close";
  }

  if (isZh) {
    howToUseModalBody.innerHTML = `
      <!-- Section 1: Core Concept -->
      <div class="p-3.5 rounded-lg border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
        <h4 class="font-bold text-blue-900 dark:text-blue-300 text-xs flex items-center gap-1.5">
          <span>🎯</span> 核心概念：SoundEvent 与地图实体的关系
        </h4>
        <p class="text-gray-700 dark:text-gray-300">
          <strong>SoundEvent (<code class="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-[10px] font-mono">.vsndevts</code>)</strong> 是声音的“配置模板与算法内核”，定义音量、3D距离衰减曲线、空间混响与几何遮挡。<strong>绝大多数情况下无需在配置中写死 <code class="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-[10px] font-mono">position</code> 坐标</strong>。
        </p>
        <p class="text-gray-700 dark:text-gray-300">
          <strong>地图实体 (Hammer Entities)</strong> 是关卡中的“3D发声原点与播放控制器”，负责提供世界空间坐标、响应触发逻辑 (I/O) 以及追踪模型运动。
        </p>
      </div>

      <!-- Section 2: Entity Types Grid -->
      <div class="space-y-2.5">
        <h4 class="font-bold text-gray-900 dark:text-gray-100 text-xs flex items-center gap-1.5">
          <span>🔊</span> CS2 官方核心发声实体选型指南（在 Hammer 中使用）
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          
          <!-- snd_event_point -->
          <div class="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-gray-900 dark:text-gray-100 text-xs">snd_event_point</span>
              <span class="px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded">标准单点</span>
            </div>
            <p class="text-gray-600 dark:text-gray-400 text-[11px]">
              <strong>机制</strong>：从该实体自身的单一点坐标向四周辐射。<br>
              <strong>场景</strong>：按钮交互音、发电机、警报喇叭、开关音效。<br>
              <strong>常用 I/O</strong>：<code class="font-mono text-[10px]">StartSound</code>（播放）、<code class="font-mono text-[10px]">StopSound</code>（停止）。
            </p>
          </div>

          <!-- snd_event_sphere -->
          <div class="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-gray-900 dark:text-gray-100 text-xs">snd_event_sphere</span>
              <span class="px-1.5 py-0.5 text-[9px] font-semibold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded">球体音源</span>
            </div>
            <p class="text-gray-600 dark:text-gray-400 text-[11px]">
              <strong>机制</strong>：设置半径 <code class="font-mono text-[10px]">radius</code>，发声点<strong>实时吸附在球体表面距离玩家最近的点</strong>。<br>
              <strong>场景</strong>：大型球形火球、穹顶核心、大型旋转球体机械。
            </p>
          </div>

          <!-- snd_event_orientedbox -->
          <div class="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-gray-900 dark:text-gray-100 text-xs">snd_event_orientedbox</span>
              <span class="px-1.5 py-0.5 text-[9px] font-semibold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded">长方体包围盒</span>
            </div>
            <p class="text-gray-600 dark:text-gray-400 text-[11px]">
              <strong>机制</strong>：设置长宽高包围盒，发声点<strong>实时投影在盒体表面距离玩家最近的接触面</strong>。<br>
              <strong>场景</strong>：长条形河流、大型瀑布水幕、地下风道管道、开阔水面。
            </p>
          </div>

          <!-- snd_event_cone -->
          <div class="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-gray-900 dark:text-gray-100 text-xs">snd_event_cone</span>
              <span class="px-1.5 py-0.5 text-[9px] font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 rounded">圆锥定向音源</span>
            </div>
            <p class="text-gray-600 dark:text-gray-400 text-[11px]">
              <strong>机制</strong>：带有朝向角与夹角，正面清脆洪亮，背面被阻尼与低通滤波遮蔽。<br>
              <strong>场景</strong>：扩音喊话喇叭、防空号角、聚光型扩音设备。
            </p>
          </div>

          <!-- snd_event_path_corner -->
          <div class="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-gray-900 dark:text-gray-100 text-xs">snd_event_path_corner</span>
              <span class="px-1.5 py-0.5 text-[9px] font-semibold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 rounded">路径网络音源</span>
            </div>
            <p class="text-gray-600 dark:text-gray-400 text-[11px]">
              <strong>机制</strong>：沿着地图中的路径拐角网络连续平滑移动。<br>
              <strong>场景</strong>：高空呼啸掠过的战机、地下铁轨呼啸的地铁列车。
            </p>
          </div>

          <!-- snd_opvar_set_* -->
          <div class="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-gray-900 dark:text-gray-100 text-xs">snd_opvar_set_*</span>
              <span class="px-1.5 py-0.5 text-[9px] font-semibold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 rounded">参数控制器</span>
            </div>
            <p class="text-gray-600 dark:text-gray-400 text-[11px]">
              <strong>机制</strong>：<strong>本身不发声</strong>。根据玩家距离动态修改 SoundEvent 内部的变量。<br>
              <strong>场景</strong>：玩家靠近特定区域时调节低通截频、环境混音过渡。
            </p>
          </div>

        </div>
      </div>

      <!-- Section 3: Step-by-Step Implementation -->
      <div class="p-3.5 rounded-lg border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
        <h4 class="font-bold text-emerald-900 dark:text-emerald-300 text-xs flex items-center gap-1.5">
          <span>🚀</span> 四步落地实操流程
        </h4>
        <ol class="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300 text-[11px]">
          <li><strong>配置与复制</strong>：在当前网页生成器调整属性或选用预设，点击右侧工具栏的“📋 复制”按钮。</li>
          <li><strong>保存文件</strong>：在你的 CS2 模组目录下保存为：<code class="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-[10px] font-mono">game/csgo_addons/&lt;你的Addon&gt;/soundevents/soundevents_addon.vsndevts</code>。</li>
          <li><strong>在 Hammer 中放置实体</strong>：在地图中放置声音实体（如 <code class="font-mono text-[10px]">snd_event_point</code>），在其实体属性 <code class="font-mono text-[10px]">Sound Event Name</code>（或 <code class="font-mono text-[10px]">soundName</code>）填入你的事件名（例如 <code class="font-mono text-[10px]">Weapon_Custom.Single</code>）。</li>
          <li><strong>逻辑联动 (I/O)</strong>：如需按键交互，在触发实体（如 <code class="font-mono text-[10px]">func_button</code>）的 Outputs 添加：<code class="font-mono text-[10px]">OnPressed -&gt; 你的声音实体 -&gt; StartSound</code>。编译地图即可体验！</li>
        </ol>
      </div>
    `;
  } else {
    howToUseModalBody.innerHTML = `
      <!-- Section 1: Core Concept -->
      <div class="p-3.5 rounded-lg border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
        <h4 class="font-bold text-blue-900 dark:text-blue-300 text-xs flex items-center gap-1.5">
          <span>🎯</span> Core Concept: SoundEvents vs. Map Entities
        </h4>
        <p class="text-gray-700 dark:text-gray-300">
          <strong>SoundEvent (<code class="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-[10px] font-mono">.vsndevts</code>)</strong> is the blueprint and DSP processing engine defining volume, 3D falloff curves, reverb, and occlusion. In almost all cases, <strong>you do NOT hardcode <code class="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-[10px] font-mono">position</code> in the KV3 definition</strong>.
        </p>
        <p class="text-gray-700 dark:text-gray-300">
          <strong>Map Entities (Hammer Entities)</strong> serve as the 3D origin and playback controllers in the level, responsible for providing coordinates, receiving I/O triggers, and tracking movement.
        </p>
      </div>

      <!-- Section 2: Entity Types Grid -->
      <div class="space-y-2.5">
        <h4 class="font-bold text-gray-900 dark:text-gray-100 text-xs flex items-center gap-1.5">
          <span>🔊</span> Official CS2 Sound Entity Selection Guide
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          
          <!-- snd_event_point -->
          <div class="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-gray-900 dark:text-gray-100 text-xs">snd_event_point</span>
              <span class="px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded">Standard Point</span>
            </div>
            <p class="text-gray-600 dark:text-gray-400 text-[11px]">
              <strong>Mechanism</strong>: Emits from a 0D single point in world space.<br>
              <strong>Use Cases</strong>: Button clicks, generators, alarms, door switches.<br>
              <strong>Common I/O</strong>: <code class="font-mono text-[10px]">StartSound</code>, <code class="font-mono text-[10px]">StopSound</code>.
            </p>
          </div>

          <!-- snd_event_sphere -->
          <div class="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-gray-900 dark:text-gray-100 text-xs">snd_event_sphere</span>
              <span class="px-1.5 py-0.5 text-[9px] font-semibold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded">Sphere Surface</span>
            </div>
            <p class="text-gray-600 dark:text-gray-400 text-[11px]">
              <strong>Mechanism</strong>: Specified by <code class="font-mono text-[10px]">radius</code>. Sound dynamically originates from <strong>the closest point on the sphere surface to the player</strong>.<br>
              <strong>Use Cases</strong>: Large bonfires, spherical reactors, dome machinery.
            </p>
          </div>

          <!-- snd_event_orientedbox -->
          <div class="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-gray-900 dark:text-gray-100 text-xs">snd_event_orientedbox</span>
              <span class="px-1.5 py-0.5 text-[9px] font-semibold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded">Box / OBB</span>
            </div>
            <p class="text-gray-600 dark:text-gray-400 text-[11px]">
              <strong>Mechanism</strong>: Defined by bounding box bounds. Sound dynamically originates from <strong>the closest point on the box surface to the player</strong>.<br>
              <strong>Use Cases</strong>: Long rivers, waterfalls, ventilation conduits, open water.
            </p>
          </div>

          <!-- snd_event_cone -->
          <div class="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-gray-900 dark:text-gray-100 text-xs">snd_event_cone</span>
              <span class="px-1.5 py-0.5 text-[9px] font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 rounded">Directional Cone</span>
            </div>
            <p class="text-gray-600 dark:text-gray-400 text-[11px]">
              <strong>Mechanism</strong>: Has forward direction and field-of-view angle. Loud and crisp on front, heavily occluded and low-passed behind.<br>
              <strong>Use Cases</strong>: Megaphones, air raid sirens, directional public address systems.
            </p>
          </div>

          <!-- snd_event_path_corner -->
          <div class="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-gray-900 dark:text-gray-100 text-xs">snd_event_path_corner</span>
              <span class="px-1.5 py-0.5 text-[9px] font-semibold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 rounded">Path Network</span>
            </div>
            <p class="text-gray-600 dark:text-gray-400 text-[11px]">
              <strong>Mechanism</strong>: Smoothly travels along segments of a <code class="font-mono text-[10px]">path_corner</code> network.<br>
              <strong>Use Cases</strong>: Flyby aircraft, overhead drones, subway trains.
            </p>
          </div>

          <!-- snd_opvar_set_* -->
          <div class="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-gray-900 dark:text-gray-100 text-xs">snd_opvar_set_*</span>
              <span class="px-1.5 py-0.5 text-[9px] font-semibold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 rounded">OpVar Modifier</span>
            </div>
            <p class="text-gray-600 dark:text-gray-400 text-[11px]">
              <strong>Mechanism</strong>: <strong>Does NOT play audio directly</strong>. Dynamically modifies SoundEvent OpVar variables based on player distance.<br>
              <strong>Use Cases</strong>: Dynamic low-pass filters or ambient crossfade when entering specific zones.
            </p>
          </div>

        </div>
      </div>

      <!-- Section 3: Step-by-Step Implementation -->
      <div class="p-3.5 rounded-lg border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
        <h4 class="font-bold text-emerald-900 dark:text-emerald-300 text-xs flex items-center gap-1.5">
          <span>🚀</span> 4-Step Practical Implementation
        </h4>
        <ol class="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300 text-[11px]">
          <li><strong>Configure & Copy</strong>: Fine-tune properties or select a preset, then click "📋 Copy" in the right editor toolbar.</li>
          <li><strong>Save File</strong>: Save in your addon directory: <code class="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-[10px] font-mono">game/csgo_addons/&lt;addon&gt;/soundevents/soundevents_addon.vsndevts</code>.</li>
          <li><strong>Place in Hammer</strong>: Place a sound entity (e.g. <code class="font-mono text-[10px]">snd_event_point</code>), and set its <code class="font-mono text-[10px]">Sound Event Name</code> (or <code class="font-mono text-[10px]">soundName</code>) to your event name (e.g. <code class="font-mono text-[10px]">Weapon_Custom.Single</code>).</li>
          <li><strong>Link I/O</strong>: For interactions, add an output to a trigger entity (e.g. <code class="font-mono text-[10px]">func_button</code>: <code class="font-mono text-[10px]">OnPressed -&gt; YourSoundEntity -&gt; StartSound</code>). Compile map and enjoy!</li>
        </ol>
      </div>
    `;
  }
}

function openHowToUseModal() {
  if (!howToUseModal) return;
  renderHowToUseModal();
  howToUseModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeHowToUseModal() {
  if (!howToUseModal) return;
  howToUseModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

/**
 * Sync UI Text with current language
 */
function updateI18nUI() {
  const t = I18N[state.lang] || I18N.zh;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (t[key]) el.textContent = t[key];
  });

  searchInput.placeholder = t.searchPlaceholder;
  eventNameInput.placeholder = t.eventNamePlaceholder;
  langToggleBtn.textContent = state.lang === "zh" ? "EN" : "中文";
  if (shareBtn) shareBtn.title = state.lang === "zh" ? "分享配置链接" : "Share Configuration Link";
  if (resetBtn) resetBtn.title = state.lang === "zh" ? "重置为默认 3D 空间预设" : "Reset to Default 3D Preset";

  // Re-populate preset options
  const curPreset = presetSelect.value;
  presetSelect.innerHTML = "";
  for (const [pId, pObj] of Object.entries(PRESETS)) {
    if (pId !== pObj.id) continue;
    const opt = document.createElement("option");
    opt.value = pId;
    opt.textContent = state.lang === "zh" ? pObj.name_zh : pObj.name_en;
    presetSelect.appendChild(opt);
  }
  presetSelect.value = curPreset || "csgo_mega_basic";

  // Re-render modal if open
  if (howToUseModal && !howToUseModal.classList.contains("hidden")) {
    renderHowToUseModal();
  }
}

/**
 * Apply theme
 */
function applyTheme(theme) {
  state.theme = theme;
  const isDark = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  themeToggleBtn.textContent = isDark ? "☀️" : "🌙";
}

/**
 * Update the active badge of a specific group in-place
 */
function updateGroupBadge(groupId) {
  const badge = document.querySelector(`[data-group-badge="${groupId}"]`);
  if (!badge) return;
  const propsInGroup = Object.entries(SPECS).filter(([_, s]) => s.group === groupId);
  const activeCount = propsInGroup.filter(([k]) => state.enabledProperties.has(k)).length;
  badge.textContent = `${activeCount} / ${propsInGroup.length}`;
  if (activeCount > 0) {
    badge.className = "text-[10px] font-mono px-1.5 py-0.2 bg-black text-white dark:bg-white dark:text-black rounded-none";
  } else {
    badge.className = "text-[10px] font-mono text-gray-400";
  }
}

/**
 * Render all 17 groups and their properties with clean minimal sections
 */
function renderGroups() {
  const t = I18N[state.lang] || I18N.zh;
  const groupsFrag = document.createDocumentFragment();

  // Filter groups
  const visibleGroups = GROUPS.filter(([groupId]) => {
    const props = Object.entries(SPECS).filter(([_, spec]) => spec.group === groupId);
    return props.length > 0;
  });

  let groupIdx = 1;
  for (const [groupId, defaultTitle] of visibleGroups) {
    const localizedGroupTitle = t.groups[groupId] || defaultTitle;
    const props = Object.entries(SPECS)
      .filter(([_, spec]) => spec.group === groupId)
      .filter(([key]) => {
        // 'value' (通用数值参数) only appears if current Type requires it or if already enabled
        if (key === "value") {
          return typeNeedsValue(state.properties.type) || state.enabledProperties.has("value");
        }
        return true;
      })
      .map(([key, spec]) => ({ key, spec }));

    // Filter properties based on search & active filter
    const visibleProps = props.filter(({ key, spec }) => {
      if (filterActiveOnly && !state.enabledProperties.has(key)) return false;

      if (!filterSearch) return true;
      const s = filterSearch.toLowerCase();
      const label = (t.labels[key] || "").toLowerCase();
      const desc = (t.tooltips[key] || "").toLowerCase();
      return key.toLowerCase().includes(s) || label.includes(s) || desc.includes(s);
    });

    const activeCountInGroup = props.filter(p => state.enabledProperties.has(p.key)).length;

    // 1. If filtering active only, hide any group with zero active properties
    if (filterActiveOnly && activeCountInGroup === 0) {
      continue;
    }

    // 2. If searching, hide groups with zero matching properties
    if (filterSearch && visibleProps.length === 0) {
      continue;
    }

    const groupSection = document.createElement("div");
    groupSection.className = "border-b border-gray-200 dark:border-gray-800";

    const isExpanded = expandedGroups.has(groupId);
    const groupNumStr = String(groupIdx++).padStart(2, "0");

    // Group Header (Minimal Accordion)
    const header = document.createElement("div");
    header.className = "px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-gray-50/60 dark:hover:bg-gray-800/40 select-none transition-colors";
    header.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-[10px] font-mono text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}">▶</span>
        <span class="text-[11px] font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
          ${groupNumStr}. ${localizedGroupTitle}
        </span>
      </div>
      <span class="${activeCountInGroup > 0 ? "text-[10px] font-mono px-1.5 py-0.2 bg-black text-white dark:bg-white dark:text-black rounded-none" : "text-[10px] font-mono text-gray-400"}" data-group-badge="${groupId}">
        ${activeCountInGroup} / ${props.length}
      </span>
    `;

    // Group Body
    const body = document.createElement("div");
    body.className = `divide-y divide-gray-100 dark:divide-gray-800/60 ${isExpanded ? "block" : "hidden"}`;

    header.addEventListener("click", () => {
      const chevron = header.querySelector("span");
      if (expandedGroups.has(groupId)) {
        expandedGroups.delete(groupId);
        body.classList.add("hidden");
        body.classList.remove("block");
        chevron.classList.remove("rotate-90");
      } else {
        expandedGroups.add(groupId);
        body.classList.remove("hidden");
        body.classList.add("block");
        chevron.classList.add("rotate-90");
      }
    });

    visibleProps.forEach(({ key, spec }) => {
      const isEnabled = state.enabledProperties.has(key);
      const val = state.propertyValues[key] !== undefined ? state.propertyValues[key] : (DEFAULTS[key] ?? 0);
      const row = createPropertyRow(key, spec, val, isEnabled, t);
      body.appendChild(row);
    });

    groupSection.appendChild(header);
    groupSection.appendChild(body);
    groupsFrag.appendChild(groupSection);
  }

  groupsContainer.innerHTML = "";
  groupsContainer.appendChild(groupsFrag);

  // Update active count badge
  if (activeFilterBadge) {
    activeFilterBadge.textContent = state.enabledProperties.size;
  }
}

/**
 * Create a single property row element with modern minimalist styling
 */
function createPropertyRow(key, spec, val, isEnabled, t) {
  const row = document.createElement("div");
  row.className = `prop-row ${isEnabled ? "enabled" : ""}`;
  row.setAttribute("data-prop-key", key);

  const pairInfo = MIN_MAX_MAP.get(key);
  const children = TOGGLE_DEPENDENTS[key];
  const parentKey = CHILD_TO_PARENT_MAP.get(key);
  const label = t.labels[key] || key;
  const desc = t.tooltips[key] || "";

  // Helper to synchronize any row DOM state (checkbox, highlight class, group badge)
  function setRowEnabledState(propKey, isPropEnabled) {
    const pRow = document.querySelector(`[data-prop-key="${propKey}"]`);
    if (pRow) {
      if (isPropEnabled) {
        pRow.classList.add("enabled");
      } else {
        pRow.classList.remove("enabled");
      }
      const pCb = pRow.querySelector(".custom-checkbox");
      if (pCb) pCb.checked = isPropEnabled;
      const pGroup = SPECS[propKey]?.group;
      if (pGroup) updateGroupBadge(pGroup);
    }
  }

  function syncBoolWidget(propKey, isTrue) {
    const pRow = document.querySelector(`[data-prop-key="${propKey}"]`);
    if (pRow) {
      const btns = pRow.querySelectorAll("button");
      btns.forEach(btn => {
        const txt = btn.textContent.trim().toLowerCase();
        if (txt.includes("true")) {
          btn.className = `px-2 py-0.5 rounded-sm transition-colors ${isTrue ? "bg-black text-white dark:bg-white dark:text-black font-semibold" : "text-gray-500 hover:text-black dark:hover:text-white"}`;
        } else if (txt.includes("false")) {
          btn.className = `px-2 py-0.5 rounded-sm transition-colors ${!isTrue ? "bg-black text-white dark:bg-white dark:text-black font-semibold" : "text-gray-500 hover:text-black dark:hover:text-white"}`;
        }
      });
    }
  }

  function syncPartnerInputs(partnerKey) {
    const partnerVal = state.propertyValues[partnerKey];
    const pRow = document.querySelector(`[data-prop-key="${partnerKey}"]`);
    if (pRow && partnerVal !== undefined) {
      const pSlider = pRow.querySelector("input[type='range']");
      const pNum = pRow.querySelector("input[type='number']");
      const pValNum = Number(partnerVal);
      if (!isNaN(pValNum)) {
        if (pSlider) {
          if (pValNum < parseFloat(pSlider.min)) pSlider.min = pValNum;
          if (pValNum > parseFloat(pSlider.max)) pSlider.max = pValNum;
          pSlider.value = pValNum;
        }
        if (pNum) {
          pNum.value = pValNum;
        }
      }
    }
  }

  // Top header: Checkbox, Label, Key name
  const top = document.createElement("div");
  top.className = "flex items-start justify-between gap-2";

  const left = document.createElement("div");
  left.className = "flex items-start gap-2.5 flex-1 min-w-0";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "custom-checkbox mt-0.5";
  checkbox.checked = isEnabled;

  const pairBadge = pairInfo
    ? `<span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 select-none cursor-help" title="成对关联属性: ${pairInfo.partner}">⇄ ${pairInfo.role.toUpperCase()}</span>`
    : "";

  const parentBadge = children
    ? `<span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 select-none cursor-help" title="父控制项: 勾选附带 ${children.join(', ')}">↱ PARENT</span>`
    : "";

  const childBadge = parentKey
    ? `<span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50 select-none cursor-help" title="依赖父控制项: ${parentKey}">↳ SUB</span>`
    : "";

  const labelWrap = document.createElement("div");
  labelWrap.className = "flex-1 min-w-0 leading-tight";
  labelWrap.innerHTML = `
    <div class="flex items-baseline gap-1.5 flex-wrap">
      <span class="text-xs font-medium text-gray-900 dark:text-gray-100">${label}</span>
      <span class="text-[11px] font-mono text-gray-400 select-all">${key}</span>
      ${pairBadge}
      ${parentBadge}
      ${childBadge}
    </div>
  `;

  left.appendChild(checkbox);
  left.appendChild(labelWrap);
  top.appendChild(left);
  row.appendChild(top);

  // Tooltip description
  if (desc) {
    const descEl = document.createElement("div");
    descEl.className = "text-[11px] text-gray-500 dark:text-gray-400 mt-1 pl-6 leading-normal";
    descEl.textContent = desc;
    row.appendChild(descEl);
  }

  // Ensure property is enabled when user interacts with control
  function ensureEnabled() {
    if (!state.enabledProperties.has(key)) {
      state.setPropertyEnabled(key, true);
      checkbox.checked = true;
      row.classList.add("enabled");
      if (pairInfo) {
        setRowEnabledState(pairInfo.partner, true);
        syncPartnerInputs(pairInfo.partner);
      }
      if (children) {
        syncBoolWidget(key, true);
        children.forEach(ck => setRowEnabledState(ck, true));
      }
      if (parentKey) {
        setRowEnabledState(parentKey, true);
        syncBoolWidget(parentKey, true);
      }
      updateGroupBadge(spec.group);
      if (activeFilterBadge) activeFilterBadge.textContent = state.enabledProperties.size;
      updateOutput();
    }
  }

  checkbox.addEventListener("change", (e) => {
    const isNowChecked = e.target.checked;
    state.setPropertyEnabled(key, isNowChecked);
    if (isNowChecked) {
      row.classList.add("enabled");
      if (children) {
        syncBoolWidget(key, true);
      }
      if (pairInfo) {
        setRowEnabledState(pairInfo.partner, true);
        syncPartnerInputs(pairInfo.partner);
      }
      if (children) {
        children.forEach(ck => {
          setRowEnabledState(ck, true);
          const cPair = MIN_MAX_MAP.get(ck);
          if (cPair) setRowEnabledState(cPair.partner, true);
        });
      }
      if (parentKey) {
        setRowEnabledState(parentKey, true);
        syncBoolWidget(parentKey, true);
      }
    } else {
      row.classList.remove("enabled");
      if (pairInfo) {
        setRowEnabledState(pairInfo.partner, false);
      }
      if (children) {
        children.forEach(ck => {
          setRowEnabledState(ck, false);
          const cPair = MIN_MAX_MAP.get(ck);
          if (cPair) setRowEnabledState(cPair.partner, false);
        });
      }
      if (parentKey && !state.enabledProperties.has(parentKey)) {
        setRowEnabledState(parentKey, false);
      }
    }
    updateGroupBadge(spec.group);
    if (activeFilterBadge) activeFilterBadge.textContent = state.enabledProperties.size;
    updateOutput();
    if (filterActiveOnly) {
      renderGroups();
    }
  });

  // Control Wrap (Omit declaration box for vsnd_files and vsnd_files_track_01)
  if (key !== "vsnd_files" && key !== "vsnd_files_track_01") {
    const controlWrap = document.createElement("div");
    controlWrap.className = "mt-2 pl-6";
    renderControlWidget(controlWrap, key, spec, val, t, (newVal) => {
      ensureEnabled();
      state.setPropertyValue(key, newVal);
      if (pairInfo) {
        syncPartnerInputs(pairInfo.partner);
      }
      if (children) {
        const isFalse = newVal === false || newVal === "false" || newVal === 0;
        children.forEach(ck => {
          setRowEnabledState(ck, !isFalse);
          const cPair = MIN_MAX_MAP.get(ck);
          if (cPair) setRowEnabledState(cPair.partner, !isFalse);
        });
        if (activeFilterBadge) activeFilterBadge.textContent = state.enabledProperties.size;
        if (filterActiveOnly) renderGroups();
      }
      if (parentKey) {
        setRowEnabledState(parentKey, true);
        syncBoolWidget(parentKey, true);
      }
      updateOutput();
    });
    row.appendChild(controlWrap);
  }

  return row;
}

/**
 * Handle Type change to dynamically add or remove 'value' (通用数值参数)
 */
function handleTypeChange(newType) {
  const needsVal = typeNeedsValue(newType);
  const hasVal = state.enabledProperties.has("value");
  if (needsVal && !hasVal) {
    if (state.properties["value"] === undefined) {
      state.setPropertyValue("value", DEFAULTS["value"] ?? 1.0);
    }
    state.setPropertyEnabled("value", true);
    renderGroups();
  } else if (!needsVal && hasVal) {
    state.setPropertyEnabled("value", false);
    renderGroups();
  }
}

/**
 * Render control input widget by spec.kind
 */
function renderControlWidget(container, key, spec, val, t, onUserEdit) {
  const kind = spec.kind;

  // 1. Float / number
  if (kind === "float") {
    const range = spec.options?.slider_range || [0, 10];
    const onlyPositive = spec.options?.only_positive || false;
    let minVal = range[0];
    let maxVal = range[1];
    let curNum = Number(val);
    if (isNaN(curNum)) curNum = DEFAULTS[key] !== undefined ? DEFAULTS[key] : 0;

    // Dynamically expand min and max if curNum is outside [minVal, maxVal]
    if (curNum < minVal) minVal = curNum;
    if (curNum > maxVal) maxVal = curNum;

    const span = maxVal - minVal;
    let step = "0.01";
    if (span > 200) step = "1";
    else if (span > 20) step = "0.1";
    else if (span <= 2) step = "0.01";

    const wrap = document.createElement("div");
    wrap.className = "flex items-center gap-3";

    const slider = document.createElement("input");
    slider.type = "range";
    slider.className = "minimal-slider flex-1";
    slider.min = minVal;
    slider.max = maxVal;
    slider.step = step;
    slider.value = curNum;

    const numInput = document.createElement("input");
    numInput.type = "number";
    numInput.className = "w-20 px-2 py-0.5 font-mono text-xs bg-transparent border border-gray-200 dark:border-gray-800 rounded outline-none focus:border-black dark:focus:border-white text-right";
    numInput.value = curNum;
    numInput.step = step;
    if (onlyPositive) numInput.min = "0";

    slider.addEventListener("input", (e) => {
      const num = parseFloat(e.target.value);
      numInput.value = num;
      onUserEdit(num);
    });

    numInput.addEventListener("input", (e) => {
      let num = parseFloat(e.target.value);
      if (isNaN(num)) return;
      if (onlyPositive && num < 0) num = 0;
      if (num < parseFloat(slider.min)) slider.min = num;
      if (num > parseFloat(slider.max)) slider.max = num;
      slider.value = num;
      onUserEdit(num);
    });

    wrap.appendChild(slider);
    wrap.appendChild(numInput);
    container.appendChild(wrap);
    return;
  }

  // 2. Bool / string_bool / float_bool / int_bool
  if (kind === "bool" || kind === "string_bool" || kind === "float_bool" || kind === "int_bool") {
    let isTrue = false;
    if (kind === "float_bool") {
      isTrue = val === 1 || val === 1.0 || val === "1.0" || val === true || val === "true";
    } else if (kind === "int_bool") {
      isTrue = val === 1 || val === "1" || val === true || val === "true";
    } else {
      isTrue = val === true || val === "true";
    }

    const wrap = document.createElement("div");
    wrap.className = "inline-flex items-center gap-2";

    const btnGroup = document.createElement("div");
    btnGroup.className = "inline-flex p-0.5 border border-gray-200 dark:border-gray-800 rounded text-[11px] font-mono";

    const trueBtn = document.createElement("button");
    trueBtn.type = "button";
    trueBtn.className = `px-2 py-0.5 rounded-sm transition-colors ${isTrue ? "bg-black text-white dark:bg-white dark:text-black font-semibold" : "text-gray-500 hover:text-black dark:hover:text-white"}`;
    trueBtn.textContent = "true";

    const falseBtn = document.createElement("button");
    falseBtn.type = "button";
    falseBtn.className = `px-2 py-0.5 rounded-sm transition-colors ${!isTrue ? "bg-black text-white dark:bg-white dark:text-black font-semibold" : "text-gray-500 hover:text-black dark:hover:text-white"}`;
    falseBtn.textContent = "false";

    trueBtn.addEventListener("click", () => {
      trueBtn.className = "px-2 py-0.5 rounded-sm bg-black text-white dark:bg-white dark:text-black font-semibold transition-colors";
      falseBtn.className = "px-2 py-0.5 rounded-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors";
      let emitted = true;
      if (kind === "string_bool") emitted = "true";
      else if (kind === "float_bool") emitted = 1.0;
      else if (kind === "int_bool") emitted = 1;
      onUserEdit(emitted);
    });

    falseBtn.addEventListener("click", () => {
      falseBtn.className = "px-2 py-0.5 rounded-sm bg-black text-white dark:bg-white dark:text-black font-semibold transition-colors";
      trueBtn.className = "px-2 py-0.5 rounded-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors";
      let emitted = false;
      if (kind === "string_bool") emitted = "false";
      else if (kind === "float_bool") emitted = 0.0;
      else if (kind === "int_bool") emitted = 0;
      onUserEdit(emitted);
    });

    btnGroup.appendChild(trueBtn);
    btnGroup.appendChild(falseBtn);
    wrap.appendChild(btnGroup);
    container.appendChild(wrap);
    return;
  }

  // 3. Dedicated Type Selector (Strict list only, accompanied by usage scenario description)
  if (key === "type" || kind === "type_select") {
    const wrap = document.createElement("div");
    wrap.className = "w-full space-y-2";

    const select = document.createElement("select");
    select.className = "w-full px-2.5 py-1.5 bg-transparent border border-gray-200 dark:border-gray-800 rounded font-mono text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-black dark:focus:border-white cursor-pointer font-medium";

    for (const tKey of TYPE_OBJECTS) {
      const opt = document.createElement("option");
      opt.value = tKey;
      const desc = TYPE_DESCRIPTIONS[tKey];
      const label = desc ? (state.lang === "zh" ? `${tKey} — ${desc.name_zh}` : `${tKey} — ${desc.name_en}`) : tKey;
      opt.textContent = label;
      select.appendChild(opt);
    }
    select.value = val || TYPE_OBJECTS[0];

    // Scenario description card
    const descCard = document.createElement("div");
    descCard.className = "p-2.5 rounded border border-gray-200/80 dark:border-gray-800/80 bg-gray-50/70 dark:bg-gray-900/40 text-[11px] leading-relaxed";

    const updateDesc = (curType) => {
      const desc = TYPE_DESCRIPTIONS[curType];
      const title = state.lang === "zh" ? "适用场景" : "Usage Scenario";
      const text = desc ? (state.lang === "zh" ? desc.desc_zh : desc.desc_en) : "";
      descCard.innerHTML = `
        <div class="flex items-start gap-1.5">
          <span class="inline-block px-1 py-0.2 text-[9px] font-semibold uppercase tracking-wider bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded whitespace-nowrap flex-shrink-0 mt-0.5">${title}</span>
          <span class="text-gray-600 dark:text-gray-300 font-sans">${text}</span>
        </div>
      `;
    };

    updateDesc(select.value);

    select.addEventListener("change", (e) => {
      const newType = e.target.value;
      updateDesc(newType);
      onUserEdit(newType);
      handleTypeChange(newType);
    });

    wrap.appendChild(select);
    wrap.appendChild(descCard);
    container.appendChild(wrap);
    return;
  }

  // 4. Combobox (Mixgroup, DSP preset)
  if (kind === "combobox") {
    let options = spec.options?.objects || [];
    if (key === "mixgroup") options = MIXGROUPS;
    else if (key === "dsp_preset") options = DSP_PRESETS;

    const wrap = document.createElement("div");
    wrap.className = "flex gap-2";

    const select = document.createElement("select");
    select.className = "flex-1 px-2 py-1 bg-transparent border border-gray-200 dark:border-gray-800 rounded font-mono text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-black dark:focus:border-white cursor-pointer";
    select.innerHTML = options.map(opt => `<option value="${opt}">${opt}</option>`).join("");
    select.value = val;

    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.className = "flex-1 px-2 py-1 bg-transparent border border-gray-200 dark:border-gray-800 rounded font-mono text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-black dark:focus:border-white placeholder:text-gray-400";
    textInput.placeholder = "或自由输入...";
    textInput.value = val || "";

    select.addEventListener("change", (e) => {
      textInput.value = e.target.value;
      onUserEdit(e.target.value);
    });

    textInput.addEventListener("input", (e) => {
      select.value = e.target.value;
      onUserEdit(e.target.value);
    });

    wrap.appendChild(select);
    wrap.appendChild(textInput);
    container.appendChild(wrap);
    return;
  }

  // 4. Base (No dropdown or input box - author directly in right editor)
  if (kind === "base" || key === "base") {
    const hint = document.createElement("div");
    hint.className = "text-[11px] text-gray-500 dark:text-gray-400 font-mono flex items-center gap-1.5 py-0.5";
    container.appendChild(hint);
    return;
  }

  // 5. Vector3
  if (kind === "vector3") {
    const vec = Array.isArray(val) ? [...val] : [0, 0, 0];
    const wrap = document.createElement("div");
    wrap.className = "grid grid-cols-3 gap-2";

    ["X", "Y", "Z"].forEach((axis, idx) => {
      const item = document.createElement("div");
      item.className = "flex items-center gap-1.5 px-2 py-1 border border-gray-200 dark:border-gray-800 rounded";
      item.innerHTML = `<span class="text-[10px] font-mono text-gray-400">${axis}</span>`;

      const numInput = document.createElement("input");
      numInput.type = "number";
      numInput.className = "w-full font-mono text-xs bg-transparent outline-none text-right";
      numInput.value = vec[idx] ?? 0;
      numInput.step = "1";

      numInput.addEventListener("input", (e) => {
        const newVec = [...vec];
        newVec[idx] = parseFloat(e.target.value) || 0;
        onUserEdit(newVec);
      });

      item.appendChild(numInput);
      wrap.appendChild(item);
    });

    container.appendChild(wrap);
    return;
  }

  // 5.1 Vector2
  if (kind === "vector2") {
    const vec = Array.isArray(val) ? [...val] : [0.8, 0.2];
    const wrap = document.createElement("div");
    wrap.className = "grid grid-cols-2 gap-2";

    ["1", "2"].forEach((axis, idx) => {
      const item = document.createElement("div");
      item.className = "flex items-center gap-1.5 px-2 py-1 border border-gray-200 dark:border-gray-800 rounded";
      item.innerHTML = `<span class="text-[10px] font-mono text-gray-400">#${axis}</span>`;

      const numInput = document.createElement("input");
      numInput.type = "number";
      numInput.className = "w-full font-mono text-xs bg-transparent outline-none text-right";
      numInput.value = vec[idx] ?? 0;
      numInput.step = "0.05";

      numInput.addEventListener("input", (e) => {
        const newVec = [...vec];
        newVec[idx] = parseFloat(e.target.value) || 0;
        onUserEdit(newVec);
      });

      item.appendChild(numInput);
      wrap.appendChild(item);
    });

    container.appendChild(wrap);
    return;
  }

  // 5.2 Array of strings or floats (Metadata tags, syncpoints)
  if (kind === "array_string" || kind === "array_float") {
    const isNum = kind === "array_float";
    const textVal = Array.isArray(val) ? val.join(", ") : String(val || "");
    const input = document.createElement("input");
    input.type = "text";
    input.className = "w-full px-2 py-1 bg-transparent border border-gray-200 dark:border-gray-800 rounded font-mono text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-black dark:focus:border-white placeholder:text-gray-400";
    input.value = textVal;
    input.placeholder = isNum ? "例如: 0.0, 2.0, 4.0" : '例如: "meta", "localplayeronly"';
    input.addEventListener("input", (e) => {
      const parts = e.target.value.split(/[\s,]+/).filter(Boolean);
      if (isNum) {
        onUserEdit(parts.map(Number));
      } else {
        onUserEdit(parts.map(p => p.replace(/^["']|["']$/g, "")));
      }
    });
    container.appendChild(input);
    return;
  }

  // 6. Interactive Curve Editor
  if (kind === "curve") {
    let curvePoints = Array.isArray(val) ? JSON.parse(JSON.stringify(val)) : JSON.parse(JSON.stringify(CURVE_PRESETS.linear));
    const wrap = document.createElement("div");
    wrap.className = "space-y-2 border border-gray-200 dark:border-gray-800 p-2.5 rounded";

    // Presets Toolbar
    const toolbar = document.createElement("div");
    toolbar.className = "flex items-center justify-between gap-1 flex-wrap";
    toolbar.innerHTML = `
      <span class="text-[10px] font-mono text-gray-500 uppercase tracking-wider">${t.curveEditor.title}</span>
      <div class="flex items-center gap-1 text-[10px]">
        <button type="button" class="px-1.5 py-0.5 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded" data-cpreset="linear" title="${state.lang === 'zh' ? '在所有控制点之间应用线性连接' : 'Apply linear connection between all points'}">${t.curveEditor.presetLinear}</button>
        <button type="button" class="px-1.5 py-0.5 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded" data-cpreset="smooth" title="${state.lang === 'zh' ? '计算所有控制点并生成最佳平滑曲线' : 'Compute optimal smooth curve across all points'}">${t.curveEditor.presetSmooth}</button>
        <button type="button" class="px-1.5 py-0.5 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded" data-cpreset="fade_in" title="${state.lang === 'zh' ? '生成平滑淡入曲线' : 'Generate smooth fade-in curve'}">${t.curveEditor.presetFadeIn}</button>
        <button type="button" class="px-1.5 py-0.5 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded" data-cpreset="fade_out" title="${state.lang === 'zh' ? '生成平滑淡出曲线' : 'Generate smooth fade-out curve'}">${t.curveEditor.presetFadeOut}</button>
        <button type="button" class="px-1.5 py-0.5 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded" data-cpreset="flat" title="${state.lang === 'zh' ? '保持所有X端点并设为恒定1.0' : 'Set constant 1.0 across all points'}">${t.curveEditor.presetFlat}</button>
      </div>
    `;

    // Canvas Element Wrap
    const canvasWrap = document.createElement("div");
    canvasWrap.className = "relative w-full h-36 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 overflow-hidden";
    const canvas = document.createElement("canvas");
    canvas.className = "w-full h-full block touch-none select-none";
    canvasWrap.appendChild(canvas);

    // Axis indicator: clean compact single-line "X 空间距离 | Y 音量衰减倍率" centered under canvas
    const axisInfo = getCurveAxisInfo(key, state.lang);
    const axisInfoEl = document.createElement("div");
    axisInfoEl.className = "w-full text-[11px] font-mono text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2 py-0.5 select-none truncate";
    axisInfoEl.title = `${axisInfo.descX} | ${axisInfo.descY}`;
    axisInfoEl.innerHTML = `
      <span><strong class="font-bold text-gray-900 dark:text-gray-100">X</strong> ${axisInfo.x}</span>
      <span class="text-gray-300 dark:text-gray-700">|</span>
      <span><strong class="font-bold text-gray-900 dark:text-gray-100">Y</strong> ${axisInfo.y}</span>
    `;

    // Table Container
    const tableWrap = document.createElement("div");
    tableWrap.className = "max-h-40 overflow-y-auto overflow-x-hidden border border-gray-200 dark:border-gray-800 rounded";
    const table = document.createElement("table");
    table.className = "curve-table w-full table-fixed";
    tableWrap.appendChild(table);

    // Add Point Button
    const addPtBtn = document.createElement("button");
    addPtBtn.type = "button";
    addPtBtn.className = "mt-1 px-2.5 py-1 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded text-[11px] font-medium transition-colors";
    addPtBtn.textContent = t.curveEditor.addPoint || "+ 添加控制点";

    // Interactive Controller
    let interactiveCtrl = null;

    function renderTableRows() {
      const firstX = curvePoints[0]?.[0] || 0;
      const lastX = curvePoints[curvePoints.length - 1]?.[0] || 1;
      const currentSpanX = Math.max(0.1, lastX - firstX);
      const xStep = currentSpanX <= 1.5 ? "0.01" : (currentSpanX <= 10 ? "0.05" : (currentSpanX <= 100 ? "0.1" : "1"));

      table.innerHTML = `
        <thead>
          <tr>
            <th style="width: 18%" title="${axisInfo.descX}">X</th>
            <th style="width: 16%" title="${axisInfo.descY}">Y</th>
            <th style="width: 17%" title="${state.lang === 'zh' ? '左切线斜率 (Left Tangent Slope)' : 'Left Tangent Slope'}">${state.lang === 'zh' ? '左斜' : 'L-Slope'}</th>
            <th style="width: 17%" title="${state.lang === 'zh' ? '右切线斜率 (Right Tangent Slope)' : 'Right Tangent Slope'}">${state.lang === 'zh' ? '右斜' : 'R-Slope'}</th>
            <th style="width: 13%" title="${state.lang === 'zh' ? '左端插值模式: 0=线性, 1=快速, 2=慢速, 3=样条, 4=阶梯' : 'Left Mode: 0=Linear, 1=Fast, 2=Slow, 3=Spline, 4=Step'}">${state.lang === 'zh' ? '左模' : 'L-Mode'}</th>
            <th style="width: 13%" title="${state.lang === 'zh' ? '右端插值模式: 0=线性, 1=快速, 2=慢速, 3=样条, 4=阶梯' : 'Right Mode: 0=Linear, 1=Fast, 2=Slow, 3=Spline, 4=Step'}">${state.lang === 'zh' ? '右模' : 'R-Mode'}</th>
            <th style="width: 6%"></th>
          </tr>
        </thead>
        <tbody>
          ${curvePoints.map((pt, pIdx) => `
            <tr>
              <td><input class="curve-cell-input" type="number" step="${xStep}" value="${pt[0]}" data-pidx="${pIdx}" data-c="0"></td>
              <td><input class="curve-cell-input" type="number" step="0.05" value="${pt[1]}" data-pidx="${pIdx}" data-c="1"></td>
              <td><input class="curve-cell-input" type="number" step="0.001" value="${pt[2]}" data-pidx="${pIdx}" data-c="2"></td>
              <td><input class="curve-cell-input" type="number" step="0.001" value="${pt[3]}" data-pidx="${pIdx}" data-c="3"></td>
              <td><input class="curve-cell-input" type="number" step="1" min="0" max="4" value="${pt[4]}" data-pidx="${pIdx}" data-c="4"></td>
              <td><input class="curve-cell-input" type="number" step="1" min="0" max="4" value="${pt[5]}" data-pidx="${pIdx}" data-c="5"></td>
              <td><button type="button" class="px-1 text-gray-400 hover:text-red-500 font-bold" data-del-pt="${pIdx}" title="删除此控制点">✕</button></td>
            </tr>
          `).join("")}
        </tbody>
      `;

      // Cell change / input listeners
      table.querySelectorAll(".curve-cell-input").forEach(cell => {
        const handler = (e) => {
          const pIdx = Number(e.target.getAttribute("data-pidx"));
          const col = Number(e.target.getAttribute("data-c"));
          if (!curvePoints[pIdx]) return;
          curvePoints[pIdx][col] = parseFloat(e.target.value) || 0;
          if (col === 0 && e.type === "change") {
            curvePoints.sort((a, b) => a[0] - b[0]);
            renderTableRows();
          }
          if (interactiveCtrl) interactiveCtrl.redraw();
          onUserEdit(curvePoints);
        };
        cell.addEventListener("input", handler);
        cell.addEventListener("change", handler);
      });

      // Delete point listeners
      table.querySelectorAll("[data-del-pt]").forEach(btn => {
        btn.addEventListener("click", (e) => {
          if (curvePoints.length <= 2) {
            showToast(state.lang === "zh" ? "曲线必须保留至少 2 个控制点" : "Curve must have at least 2 points");
            return;
          }
          const pIdx = Number(e.target.getAttribute("data-del-pt"));
          curvePoints.splice(pIdx, 1);
          renderTableRows();
          if (interactiveCtrl) interactiveCtrl.redraw();
          onUserEdit(curvePoints);
        });
      });
    }

    // Live update table inputs while dragging point on canvas
    function syncTableFromLiveDrag(pts, activeIdx) {
      const trs = table.querySelectorAll("tbody tr");
      if (trs[activeIdx]) {
        const inputs = trs[activeIdx].querySelectorAll("input");
        if (inputs[0]) inputs[0].value = pts[activeIdx][0];
        if (inputs[1]) inputs[1].value = pts[activeIdx][1];
      }
    }

    // Attach interactive canvas with ResizeObserver and Pointer events
    interactiveCtrl = attachInteractiveCurve(canvas, {
      getPoints: () => curvePoints,
      onLiveUpdate: (pts, activeIdx) => {
        syncTableFromLiveDrag(pts, activeIdx);
      },
      onPointsChange: (pts) => {
        curvePoints = pts;
        renderTableRows();
        onUserEdit(curvePoints);
      }
    });

    // Preset button clicks (dynamic generation based on user's current XY endpoints)
    toolbar.querySelectorAll("[data-cpreset]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const presetKey = e.target.getAttribute("data-cpreset");
        curvePoints = generateCurveFromEndpoints(presetKey, curvePoints);
        renderTableRows();
        if (interactiveCtrl) interactiveCtrl.redraw();
        onUserEdit(curvePoints);
      });
    });

    // Add Point Click
    addPtBtn.addEventListener("click", () => {
      const lastPt = curvePoints[curvePoints.length - 1] || [0, 0, 0, 0, 2, 3];
      const firstPt = curvePoints[0] || [0, 0, 0, 0, 2, 3];
      const currentSpan = Math.max(0.1, lastPt[0] - firstPt[0]);
      let addStep = 500;
      if (currentSpan <= 1.5) addStep = 0.2;
      else if (currentSpan <= 10) addStep = 1.0;
      else if (currentSpan <= 50) addStep = 5.0;
      else if (currentSpan <= 100) addStep = 10.0;

      const newX = currentSpan <= 1.5 ? Number((lastPt[0] + addStep).toFixed(2)) : Math.round(lastPt[0] + addStep);
      const newPts = [...curvePoints, [newX, Number(lastPt[1].toFixed(2)), 0, 0, 2, 3]];
      newPts.sort((a, b) => a[0] - b[0]);
      curvePoints = newPts;
      renderTableRows();
      if (interactiveCtrl) interactiveCtrl.redraw();
      onUserEdit(curvePoints);
    });

    renderTableRows();

    wrap.appendChild(toolbar);
    wrap.appendChild(canvasWrap);
    wrap.appendChild(axisInfoEl);
    wrap.appendChild(tableWrap);
    wrap.appendChild(addPtBtn);
    container.appendChild(wrap);
    return;
  }

  // 8. Default string / text / legacy input
  const input = document.createElement("input");
  input.type = "text";
  input.className = "w-full px-2 py-1 bg-transparent border border-gray-200 dark:border-gray-800 rounded font-mono text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-black dark:focus:border-white placeholder:text-gray-400";
  input.value = val !== undefined ? val : "";
  input.placeholder = "输入值...";
  input.addEventListener("input", (e) => {
    onUserEdit(e.target.value);
  });
  container.appendChild(input);
}

let lineMeasurerEl = null;

/**
 * Update Line Numbers in Gutter with dynamic wrap height synchronization
 */
function updateGutter() {
  if (!codeEditor || !editorGutter) return;
  const lines = codeEditor.value.split("\n");
  const count = Math.max(lines.length, 1);

  const cs = window.getComputedStyle(codeEditor);

  if (!lineMeasurerEl) {
    lineMeasurerEl = document.createElement("div");
    lineMeasurerEl.style.position = "absolute";
    lineMeasurerEl.style.visibility = "hidden";
    lineMeasurerEl.style.whiteSpace = "pre-wrap";
    lineMeasurerEl.style.wordBreak = "break-all";
    lineMeasurerEl.style.padding = "0";
    lineMeasurerEl.style.border = "none";
    lineMeasurerEl.style.boxSizing = "border-box";
    lineMeasurerEl.style.pointerEvents = "none";
    document.body.appendChild(lineMeasurerEl);
  }

  lineMeasurerEl.style.fontFamily = cs.fontFamily;
  lineMeasurerEl.style.fontSize = cs.fontSize;
  lineMeasurerEl.style.lineHeight = cs.lineHeight;
  lineMeasurerEl.style.letterSpacing = cs.letterSpacing;

  const padLeft = parseFloat(cs.paddingLeft) || 16;
  const padRight = parseFloat(cs.paddingRight) || 16;
  const contentWidth = Math.max(codeEditor.clientWidth - padLeft - padRight, 50);
  lineMeasurerEl.style.width = `${contentWidth}px`;

  const defaultLineH = parseFloat(cs.lineHeight) || 20;

  let html = "";
  for (let i = 0; i < count; i++) {
    const lineNum = i + 1;
    const isErr = lineNum === currentErrorLine;
    const text = lines[i] || " ";
    lineMeasurerEl.textContent = text;
    const h = Math.max(lineMeasurerEl.offsetHeight, defaultLineH);
    html += `<div class="gutter-line ${isErr ? 'gutter-error-line' : ''}" style="height:${h}px;min-height:${h}px;line-height:${defaultLineH}px" data-line="${lineNum}">${lineNum}</div>`;
  }
  editorGutter.innerHTML = html;
  editorGutter.scrollTop = codeEditor.scrollTop;
}

/**
 * Update Ln & Col indicator
 */
function updateCursorPosition() {
  if (!codeEditor || !cursorPosIndicator) return;
  const pos = codeEditor.selectionStart || 0;
  const text = codeEditor.value.substring(0, pos);
  const lines = text.split("\n");
  const row = lines.length;
  const col = lines[row - 1].length + 1;
  cursorPosIndicator.textContent = `Ln ${row}, Col ${col}`;
}

/**
 * Visual error state - distinctly red
 */
function setErrorState(errorMsg, line = null) {
  currentErrorLine = line;
  if (errorBanner) {
    errorBanner.classList.remove("hidden");
    if (errorMessage) errorMessage.textContent = errorMsg || "语法错误";
  }
  if (editorContainer) {
    editorContainer.classList.add("editor-error");
  }
  if (editorStatusBadge) {
    editorStatusBadge.className = "badge-error inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium border transition-colors";
  }
  if (editorStatusDot) {
    editorStatusDot.className = "w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse";
  }
  if (drawerStatusDot) {
    drawerStatusDot.className = "w-2 h-2 rounded-full bg-red-500 animate-pulse";
  }
  if (editorStatusText) {
    editorStatusText.textContent = (I18N[state.lang] || I18N.zh).statusInvalid || "语法错误";
  }
  updateGutter();
}

/**
 * Visual valid state - clean neutral / green
 */
function clearErrorState() {
  currentErrorLine = null;
  if (errorBanner) {
    errorBanner.classList.add("hidden");
  }
  if (editorContainer) {
    editorContainer.classList.remove("editor-error");
  }
  if (editorStatusBadge) {
    editorStatusBadge.className = "badge-valid inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium border transition-colors";
  }
  if (editorStatusDot) {
    editorStatusDot.className = "w-1.5 h-1.5 rounded-full bg-emerald-500";
  }
  if (drawerStatusDot) {
    drawerStatusDot.className = "w-2 h-2 rounded-full bg-emerald-500";
  }
  if (editorStatusText) {
    editorStatusText.textContent = (I18N[state.lang] || I18N.zh).statusValid || "格式正确";
  }
  updateGutter();
}

/**
 * Synchronize parsed KV3 data back to Left Controls
 */
function syncLeftControlsFromParsed(data) {
  if (!data) return;

  // 1. Sync Event Name
  if (data.eventName && data.eventName !== state.eventName) {
    state.eventName = data.eventName;
    if (eventNameInput && document.activeElement !== eventNameInput) {
      eventNameInput.value = state.eventName;
    }
  }

  // 2. Sync Properties and Enabled Set
  const parsedProps = data.properties || {};
  const parsedKeys = new Set(Object.keys(parsedProps));

  for (const [key, spec] of Object.entries(SPECS)) {
    if (parsedKeys.has(key)) {
      state.enabledProperties.add(key);
      state.properties[key] = parsedProps[key];
    } else {
      state.enabledProperties.delete(key);
    }
  }

  // If Type requires 'value', automatically enable it
  if (typeNeedsValue(state.properties.type) && !state.enabledProperties.has("value")) {
    state.enabledProperties.add("value");
    if (state.properties["value"] === undefined) {
      state.properties["value"] = DEFAULTS["value"] ?? 1.0;
    }
  }

  // Auto-expand groups that have active properties
  GROUPS.forEach(([gid]) => {
    const hasActive = Object.entries(SPECS).some(([k, s]) => s.group === gid && state.enabledProperties.has(k));
    if (hasActive) expandedGroups.add(gid);
  });

  // Re-render Left Panel
  renderGroups();
}

/**
 * User typed in Code Editor
 */
function onCodeEditorInput(immediate = false) {
  updateGutter();
  updateCursorPosition();

  clearTimeout(codeDebounceTimer);

  const validateAndSync = () => {
    if (!codeEditor) return;
    const text = codeEditor.value;
    const res = validateKv3(text);
    if (!res.valid) {
      setErrorState(res.error, res.line);
    } else {
      clearErrorState();
      syncLeftControlsFromParsed(res.data);
    }
  };

  if (immediate) {
    validateAndSync();
  } else {
    codeDebounceTimer = setTimeout(validateAndSync, 200);
  }
}

/**
 * Handle Tab & Enter formatting inside Code Editor
 */
function handleCodeEditorKeyDown(e) {
  if (!codeEditor) return;

  // Tab key
  if (e.key === "Tab" && (!autocomplete || !autocomplete.isOpen)) {
    e.preventDefault();
    const start = codeEditor.selectionStart;
    const end = codeEditor.selectionEnd;
    const val = codeEditor.value;

    if (e.shiftKey) {
      // Shift+Tab: dedent current line
      const lineStart = val.lastIndexOf("\n", start - 1) + 1;
      if (val.charAt(lineStart) === "\t") {
        codeEditor.value = val.substring(0, lineStart) + val.substring(lineStart + 1);
        codeEditor.selectionStart = Math.max(lineStart, start - 1);
        codeEditor.selectionEnd = Math.max(lineStart, end - 1);
      } else if (val.substring(lineStart, lineStart + 4) === "    ") {
        codeEditor.value = val.substring(0, lineStart) + val.substring(lineStart + 4);
        codeEditor.selectionStart = Math.max(lineStart, start - 4);
        codeEditor.selectionEnd = Math.max(lineStart, end - 4);
      }
    } else {
      // Tab: insert tab
      codeEditor.value = val.substring(0, start) + "\t" + val.substring(end);
      codeEditor.selectionStart = codeEditor.selectionEnd = start + 1;
    }
    onCodeEditorInput(false);
    return;
  }

  // Enter key: smart auto-indent
  if (e.key === "Enter" && (!autocomplete || !autocomplete.isOpen)) {
    const start = codeEditor.selectionStart;
    const val = codeEditor.value;
    const lineStart = val.lastIndexOf("\n", start - 1) + 1;
    const currentLine = val.substring(lineStart, start);
    const matchIndent = currentLine.match(/^[\t ]+/);
    const indent = matchIndent ? matchIndent[0] : "";

    if (currentLine.trimEnd().endsWith("{") || currentLine.trimEnd().endsWith("[")) {
      e.preventDefault();
      const extraIndent = indent + "\t";
      const nextChar = val.charAt(start);
      if (nextChar === "}" || nextChar === "]") {
        codeEditor.value = val.substring(0, start) + "\n" + extraIndent + "\n" + indent + val.substring(start);
        codeEditor.selectionStart = codeEditor.selectionEnd = start + 1 + extraIndent.length;
      } else {
        codeEditor.value = val.substring(0, start) + "\n" + extraIndent + val.substring(start);
        codeEditor.selectionStart = codeEditor.selectionEnd = start + 1 + extraIndent.length;
      }
      onCodeEditorInput(false);
      return;
    }

    if (indent) {
      e.preventDefault();
      codeEditor.value = val.substring(0, start) + "\n" + indent + val.substring(start);
      codeEditor.selectionStart = codeEditor.selectionEnd = start + 1 + indent.length;
      onCodeEditorInput(false);
      return;
    }
  }
}

/**
 * Update the Live KV3 code output (Left -> Right)
 */
function updateOutput(force = false) {
  if (!force && document.activeElement === codeEditor) return;
  const code = serializeSoundEvent(state.eventName, state.getActiveProperties(), {
    includeComments: state.includeComments,
    lang: state.lang
  });
  if (codeEditor) {
    codeEditor.value = code;
    updateGutter();
    updateCursorPosition();
    clearErrorState();
  }
}

/**
 * Event Listeners initialization
 */
function initEventListeners() {
  // Event Name
  eventNameInput.addEventListener("input", (e) => {
    state.eventName = e.target.value;
    state.notify();
  });

  // Preset
  presetSelect.addEventListener("change", (e) => {
    state.applyPreset(e.target.value);
    eventNameInput.value = state.eventName;
    renderGroups();
  });

  // Language toggle
  langToggleBtn.addEventListener("click", () => {
    state.lang = state.lang === "zh" ? "en" : "zh";
    state.notify();
    updateI18nUI();
    renderGroups();
  });

  // Theme toggle
  themeToggleBtn.addEventListener("click", () => {
    const nextTheme = state.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    state.notify();
  });

  // Share button
  shareBtn.addEventListener("click", () => {
    const hash = state.exportSharePayload();
    const shareUrl = `${window.location.origin}${window.location.pathname}#s=${hash}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast((I18N[state.lang] || I18N.zh).shareSuccessTip);
    });
  });

  // Reset
  resetBtn.addEventListener("click", () => {
    state.applyPreset("csgo_mega_basic");
    eventNameInput.value = state.eventName;
    presetSelect.value = "csgo_mega_basic";
    renderGroups();
    showToast(state.lang === "zh" ? "已重置为默认 3D 空间预设 (基础版)" : "Reset to default 3D spatial preset (Basic)");
  });

  // Search
  searchInput.addEventListener("input", (e) => {
    filterSearch = e.target.value.trim();
    renderGroups();
  });

  // Filters: All vs Active Only
  filterAllBtn.addEventListener("click", () => {
    filterActiveOnly = false;
    filterAllBtn.className = "py-1 rounded-sm text-black dark:text-white font-semibold transition-all";
    filterActiveBtn.className = "py-1 rounded-sm text-gray-500 hover:text-black dark:hover:text-white transition-all";
    renderGroups();
  });

  filterActiveBtn.addEventListener("click", () => {
    filterActiveOnly = true;
    filterActiveBtn.className = "py-1 rounded-sm text-black dark:text-white font-semibold transition-all";
    filterAllBtn.className = "py-1 rounded-sm text-gray-500 hover:text-black dark:hover:text-white transition-all";
    renderGroups();
  });

  // Expand / Collapse all
  expandAllBtn.addEventListener("click", () => {
    GROUPS.forEach(([id]) => expandedGroups.add(id));
    renderGroups();
  });

  collapseAllBtn.addEventListener("click", () => {
    expandedGroups.clear();
    renderGroups();
  });

  // Code Editor Handlers
  codeEditor.addEventListener("input", () => onCodeEditorInput(false));
  codeEditor.addEventListener("keydown", (e) => handleCodeEditorKeyDown(e));
  codeEditor.addEventListener("keyup", () => updateCursorPosition());
  codeEditor.addEventListener("click", () => updateCursorPosition());
  codeEditor.addEventListener("scroll", () => {
    if (editorGutter) editorGutter.scrollTop = codeEditor.scrollTop;
  });

  codeEditor.addEventListener("focus", () => {
    // Focused on editor
  });

  codeEditor.addEventListener("blur", () => {
    onCodeEditorInput(true);
  });

  // Window resize to update gutter row heights
  window.addEventListener("resize", () => {
    updateGutter();
    if (window.innerWidth >= 1024 && document.body.classList.contains("drawer-open")) {
      document.body.classList.remove("drawer-open");
      const gc = document.getElementById("groupsContainer");
      if (gc) gc.style.overflow = "";
      if (drawerBackdrop) drawerBackdrop.classList.add("hidden");
      if (rightEditorSection) {
        rightEditorSection.classList.add("translate-y-full");
        rightEditorSection.classList.remove("translate-y-0");
      }
    }
  });

  // Initialize Autocompletion
  if (codeEditor && autocompletePopup) {
    autocomplete = new Kv3Autocomplete(codeEditor, autocompletePopup, {
      getLanguage: () => state.lang,
      onApply: () => onCodeEditorInput(true)
    });
  }

  // Format Button
  formatBtn.addEventListener("click", () => {
    const res = formatKv3Text(codeEditor.value, {
      lang: state.lang,
      includeComments: state.includeComments
    });
    if (res.success) {
      codeEditor.value = res.code;
      clearErrorState();
      syncLeftControlsFromParsed(validateKv3(res.code).data);
      showToast((I18N[state.lang] || I18N.zh).formatSuccess || "已重新格式化代码！");
    } else {
      setErrorState(res.error, res.line);
      showToast((I18N[state.lang] || I18N.zh).formatError || "代码存在格式错误，请根据标红提示修正");
    }
  });

  includeCommentsCheck.addEventListener("change", (e) => {
    state.includeComments = e.target.checked;
    state.notify();
  });

  // How To Use Modal
  if (howToUseBtn && howToUseModal) {
    howToUseBtn.addEventListener("click", openHowToUseModal);
    if (closeHowToUseModalBtn) closeHowToUseModalBtn.addEventListener("click", closeHowToUseModal);
    if (confirmHowToUseModalBtn) confirmHowToUseModalBtn.addEventListener("click", closeHowToUseModal);
    howToUseModal.addEventListener("click", (e) => {
      if (e.target === howToUseModal) closeHowToUseModal();
    });
  }

  // Copy
  copyCodeBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(codeEditor.value).then(() => {
      showToast((I18N[state.lang] || I18N.zh).copiedTip);
    });
  });

  // Mobile/Narrow Screen Drawer Handlers
  if (openEditorDrawerBtn && rightEditorSection && drawerBackdrop) {
    const groupsContainer = document.getElementById("groupsContainer");

    const openDrawer = () => {
      rightEditorSection.classList.remove("translate-y-full");
      rightEditorSection.classList.add("translate-y-0");
      drawerBackdrop.classList.remove("hidden");
      document.body.classList.add("drawer-open");
      if (groupsContainer) {
        groupsContainer.style.overflow = "hidden";
      }
      setTimeout(() => {
        updateGutter();
        updateCursorPosition();
        if (codeEditor) {
          codeEditor.focus();
        }
      }, 50);
    };

    const closeDrawer = () => {
      rightEditorSection.classList.add("translate-y-full");
      rightEditorSection.classList.remove("translate-y-0");
      drawerBackdrop.classList.add("hidden");
      document.body.classList.remove("drawer-open");
      if (groupsContainer) {
        groupsContainer.style.overflow = "";
      }
    };

    openEditorDrawerBtn.addEventListener("click", openDrawer);
    if (closeEditorDrawerBtn) closeEditorDrawerBtn.addEventListener("click", closeDrawer);
    drawerBackdrop.addEventListener("click", closeDrawer);

    // Forward wheel events anywhere on rightEditorSection to codeEditor
    // so background property list never scrolls when using mouse wheel over the drawer
    rightEditorSection.addEventListener("wheel", (e) => {
      if (e.target !== codeEditor) {
        codeEditor.scrollTop += e.deltaY;
        e.preventDefault();
      }
    }, { passive: false });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (howToUseModal && !howToUseModal.classList.contains("hidden")) {
          closeHowToUseModal();
          return;
        }
        if (document.body.classList.contains("drawer-open")) {
          closeDrawer();
        }
      }
    });
  }

  // State changes (Left -> Right)
  state.subscribe(() => {
    updateOutput();
  });
}

/**
 * App Entry
 */
function initApp() {
  state.loadFromStorage();
  applyTheme(state.theme);

  // Initial expanded groups
  GROUPS.forEach(([id]) => {
    if (id === "general" || id === "playback" || id === "position") {
      expandedGroups.add(id);
    }
  });

  eventNameInput.value = state.eventName;
  includeCommentsCheck.checked = state.includeComments;

  updateI18nUI();
  initEventListeners();
  renderGroups();
  updateOutput();
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
