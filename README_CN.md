# CS2 SoundEvent Generator

<p align="center">
  <strong>Valve Source 2 (Counter-Strike 2) 音频事件可视化配置与 KeyValues3 (KV3) 双向编辑工具</strong>
</p>

<p align="center">
  <a href="https://laplacetor.github.io/cs2-soundevent-generator/">🌐 在线体验</a> •
  <a href="./README.md">English</a> •
  <a href="#-功能特性">✨ 功能特性</a> •
  <a href="#-快速上手教程">📖 快速上手</a> •
  <a href="#-本地开发">🛠️ 本地开发</a> •
  <a href="#-技术栈">🧩 技术栈</a> •
  <a href="#-开源协议">📄 开源协议</a>
</p>

---

## 📌 项目简介

在 Counter-Strike 2 (Source 2 引擎) 中，所有游戏音效均基于 **SoundEvent (`.vsndevts`)** 系统驱动。音频文件格式由传统的 WAV/MP3 升级为 Valve 专属的 `.vsnd`，配置语法全面转向 **KeyValues3 (KV3)**。

直接手写与维护复杂的 KV3 音效配置门槛较高且容易出现语法错误。**CS2 SoundEvent Generator** 旨在为 CS2 地图创作者、社区服开发者和 Mod 制作者提供一个直观、高效、防呆的现代化可视化配置工作台。

---

## ✨ 功能特性

### 🔄 可视化与 KV3 代码实时双向同步
- **左侧属性表单 ⇄ 右侧 CodeMirror 编辑器**：在 UI 表单中调节滑块或数值，右侧 KV3 代码毫秒级增量更新；在右侧直接编写或粘贴 KV3 代码，左侧可视化表单即刻同步解析。
- **属性联动与依赖管理**：智能感知属性间的启用与依赖关系（例如只有勾选“启用距离衰减曲线”才会激活曲线编辑），杜绝配置冲突。

### 🎛️ 140+ 属性与 16 大分类全覆盖
涵盖 Valve Source 2 SoundEvent 几乎所有常见及进阶配置项：
- **基础与播放**：基础属性、音量与音调（支持区间随机浮动）、播放延迟、优先级、进图预加载、UI 音效标记。
- **空间定位与物理**：3D 世界坐标、听者相对坐标、位置随机扩散半径、移动速度与多普勒效应。
- **淡入淡出与曲线映射**：停止淡出曲线、时间包络曲线、移动速度曲线、碰撞速度曲线。
- **隔墙遮挡与房间混响**：隔墙高频闷音滤波（Occlusion Intensity）、烘焙遮挡数据支持、DSP 混响预设与湿声比例。
- **进阶逻辑控制**：连带触发子音效（Child Events）、自动重复播放（Retrigger）、并发限制防刷屏（Sound Limiting / Voice Culling）、混音器（Mixgroup）及互动音乐控制。

### 📈 交互式 Canvas 曲线与权重编辑器
- **三次 Hermite 样条曲线编辑器**：直观拖拽控制点调节切线斜率与插值算法，提供线性、平滑 S 型、平滑淡入/淡出等常用预设。
- **随机抽选权重分配表**：支持多音频变体随机播放，可视化配置每个 `.vsnd` 的权重值并实时换算抽选概率百分比。

### 💡 丰富的开箱即用场景预设
内置多种经典预设场景，一键导入并快速定制：
- 武器枪械射击（单发 / 连发 / 空间扩散）
- 3D 空间循环音效（引擎轰鸣、流水、排风扇）
- 环境氛围背景音（全图 2D / 区域空间感）
- 界面 UI 提示音（无衰减、无遮挡）
- 角色脚步声与地面材质碰撞
- CS2 自定义 MVP / 回合互动音乐盒

### 🛡️ 智能校验与工程化辅助
- **严格语法解析与错误提示**：自动拦截分号 `;`、行尾多余逗号、括号不匹配、非法数值格式等常见 KV3 踩坑点并精确定位行号。
- **代码补全与格式化**：CodeMirror 6 深度定制，支持属性键名、常用枚举值智能提示与快捷格式化。
- **属性注释开关**：一键在生成的 KV3 代码中生成规范的中文/英文说明注释，方便团队协作与学习。
- **配置分享与状态记忆**：支持将完整配置编码压缩至 URL Hash 一键生成分享链接；界面支持**中/英双语**与**明/暗主题**切换。

---

## 📖 快速上手教程

### 5 步在 CS2 地图中听见你的自定义音效

1. **配置参数**：在网页左侧选择相似预设，根据需求调整参数（推荐开启右上角“属性注释”便于查阅）。
2. **复制配置**：点击右上角 **「复制代码」** 按钮。
3. **粘贴到项目**：打开你的 CS2 Addon 目录：
   ```text
   game/csgo_addons/<你的项目名>/soundevents/soundevents_addon.vsndevts
   ```
   将生成的代码块粘贴到最外层的大括号 `{ ... }` 内部末尾并保存。
4. **放置地图实体**：在 CS2 Hammer 编辑器中放置一个声音实体（例如 `snd_event_point`），并在属性 **Sound Event Name** 中填入刚刚设置的事件名称（如 `Weapon_Custom.Single`）。
5. **编译与游戏测试**：在 CS2 工具集 Asset Browser 中重新编译 `.vsndevts`，或直接进入地图，在控制台中输入：
   ```console
   play <你的事件名称>
   ```
   即可立即试听！

---

## 🛠️ 本地开发

### 环境要求
- **Node.js** >= 20.0.0
- **npm** >= 10.0.0

### 安装与运行

```bash
# 1. 克隆项目仓库
git clone https://github.com/LaplaceTor/cs2-soundevent-generator.git
cd cs2-soundevent-generator

# 2. 安装依赖
npm install

# 3. 启动本地开发服务器
npm run dev

# 4. 执行 TypeScript 类型检查
npm run check

# 5. 构建生产版本
npm run build

# 6. 本地预览构建产物
npm run preview
```

---

## 🧩 技术栈

- **Core**：[React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)
- **Styling**：[Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**：[Zustand](https://zustand-demo.pmnd.rs/) + [Immer](https://immerjs.github.io/immer/)
- **Code Editor**：[CodeMirror 6](https://codemirror.net/) (`@codemirror/view`, `@codemirror/state`, `@codemirror/lint`, `@codemirror/autocomplete`)
- **Validation**：[Zod 4](https://zod.dev/)
- **Icons & UI**：[Lucide React](https://lucide.dev/) + [Sonner](https://sonner.emilkowal.ski/)
- **Internationalization**：[i18next](https://www.i18next.com/) + [react-i18next](https://react.i18next.com/)

---

## 📄 开源协议

本项目基于 [Apache License 2.0](./LICENSE) 协议开源。
