# CS2 SoundEvent Generator

<p align="center">
  <strong>Interactive Visual Configurator & Bidirectional KeyValues3 (KV3) Editor for Valve Source 2 (Counter-Strike 2) SoundEvents</strong>
</p>

<p align="center">
  <a href="https://laplacetor.github.io/cs2-soundevent-generator/">🌐 Live Demo</a> •
  <a href="./README_CN.md">🇨🇳 简体中文文档</a> •
  <a href="#-features">✨ Features</a> •
  <a href="#-quick-start-guide">📖 Quick Start</a> •
  <a href="#%EF%B8%8F-local-development">🛠️ Local Development</a> •
  <a href="#-tech-stack">🧩 Tech Stack</a> •
  <a href="#-license">📄 License</a>
</p>

---

## 📌 Introduction

In Counter-Strike 2 (Source 2 engine), game audio is entirely driven by the **SoundEvent (`.vsndevts`)** system. Audio assets have evolved from legacy WAV/MP3 files into compiled `.vsnd` formats, and configuration scripts have adopted Valve's modern **KeyValues3 (KV3)** standard.

Writing and debugging KV3 soundevents by hand can be tedious and prone to syntax bugs. **CS2 SoundEvent Generator** provides CS2 map designers, modders, and server developers with an intuitive, real-time, error-preventing visual configuration workbench.

---

## ✨ Features

### 🔄 Bidirectional Real-Time Synchronization
- **Visual Controls ⇄ CodeMirror Editor**: Tweak sliders, dropdowns, and switches on the left to see live KV3 code generated instantly; or edit/paste KV3 code on the right and watch the visual form parse and reflect changes automatically.
- **Dependency & Cascade Management**: Intelligently handles property interdependencies (e.g., automatically enabling and validating distance curve graphs only when distance curve mode is active).

### 🎛️ 140+ Properties Across 16 Categories
Comprehensive support for common and advanced Source 2 sound event parameters:
- **General & Playback**: Core attributes, volume & pitch (with random range deviations), delay, priority, preloading vsnd assets, UI sound flags.
- **3D Spatialization & Physics**: World positions, listener-relative origins, positional randomization radii, velocity tracking, and Doppler shifts.
- **Fades & Curve Mappings**: Stop fade-out curves, time envelope curves, velocity-driven volume, and impact speed volume mappings.
- **Occlusion & Environmental Reverb**: High-frequency muffling filters (Occlusion Intensity), baked occlusion integration, DSP room reverb presets, and wet/dry mix controls.
- **Advanced Logic Controls**: Child event triggers, automatic retriggering/looping, voice culling & concurrency limits (anti-spam), mixgroups, and interactive music system controls.

### 📈 Interactive Canvas Curve & Weight Editors
- **Cubic Hermite Spline Editor**: Direct visual manipulation of curve points and tangents with support for linear, smooth S-curve, fade-in, and fade-out presets.
- **Random Selection Weight Table**: Multi-track `.vsnd` randomization with per-track weight inputs and automatic probability percentage calculations.

### 💡 Production-Ready Presets
A variety of battle-tested templates to jumpstart your audio design:
- Weapon Gunfire (Single shot / Auto burst / Spatial spread)
- 3D Spatial Loops (Engines, flowing water, industrial fans)
- Ambient Backgrounds (Full-map 2D / Positional ambient)
- UI Notification Sounds (Non-attenuated, unoccluded)
- Character Footsteps & Surface Impacts
- CS2 Custom MVP & Round Music Kits

### 🛡️ Smart Validation & Developer Utilities
- **Strict Syntax Linter**: Intercepts misplaced semicolons `;`, trailing array commas, unclosed brackets, and floating-point errors with exact line-level diagnostic markers.
- **Autocomplete & Code Formatting**: Powered by CodeMirror 6 with custom completion dictionaries for property keys, types, and standard enumerations.
- **Descriptive Comments Toggle**: Optionally insert clean explanatory comments for each property into generated KV3 code.
- **State Persistence & Hash Sharing**: Share complete configurations via compressed URL hash links; supports full **English / Simplified Chinese** localization and **Dark / Light** themes.

---

## 📖 Quick Start Guide

### 5 Steps to Hear Your Custom SoundEvent in CS2

1. **Configure Parameters**: Choose a baseline preset from the top bar, adjust properties in the left panel (turn on **Comments** in the top bar for annotated explanations), and click **Copy Code**.
2. **Paste into Addon**: Open your CS2 addon folder:
   ```text
   game/csgo_addons/<your_addon>/soundevents/soundevents_addon.vsndevts
   ```
   Paste the generated configuration block inside the root `{ ... }` structure and save.
3. **Place Sound Entity**: In CS2 Hammer Editor, place a sound entity (such as `snd_event_point`).
4. **Assign Event Name**: In the entity's properties, set **Sound Event Name** to your custom identifier (e.g., `Weapon_Custom.Single`).
5. **Compile & Test in Game**: Recompile the soundevents file via CS2 Asset Browser or compile your map. Open the CS2 in-game console and type:
   ```console
   play <your_soundevent_name>
   ```
   to preview your sound immediately!

---

## 🛠️ Local Development

### Requirements
- **Node.js** >= 20.0.0
- **npm** >= 10.0.0

### Setup & Commands

```bash
# 1. Clone the repository
git clone https://github.com/LaplaceTor/cs2-soundevent-generator.git
cd cs2-soundevent-generator

# 2. Install dependencies
npm install

# 3. Start development server with HMR
npm run dev

# 4. Run TypeScript type checks
npm run check

# 5. Build production bundle
npm run build

# 6. Preview production build locally
npm run preview
```

---

## 🧩 Tech Stack

- **Core**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) + [Immer](https://immerjs.github.io/immer/)
- **Code Editor**: [CodeMirror 6](https://codemirror.net/) (`@codemirror/view`, `@codemirror/state`, `@codemirror/lint`, `@codemirror/autocomplete`)
- **Validation**: [Zod 4](https://zod.dev/)
- **Icons & UI**: [Lucide React](https://lucide.dev/) + [Sonner](https://sonner.emilkowal.ski/)
- **Internationalization**: [i18next](https://www.i18next.com/) + [react-i18next](https://react.i18next.com/)

---

## 📄 License

This project is licensed under the [Apache License 2.0](./LICENSE).
