# CS2 SoundEvent Generator

Valve Source 2（Counter-Strike 2）游戏音频事件（SoundEvent）可视化配置与 KeyValues3 (KV3) 双向编辑工具。

在线体验：<https://laplacetor.github.io/cs2-soundevent-generator/>

## 功能特性

- **可视化与代码双向同步**：左侧可视化属性表单与右侧 KV3 代码编辑器实时双向解析同步。
- **90+ 属性完整支持**：涵盖通用基础、播放参数、淡入淡出、3D 空间定位、距离衰减曲线、时间包络曲线、遮挡混响、DSP、子事件、混音器等 16 大分类。
- **交互式曲线与权重编辑**：内置 Canvas 曲线可视化编辑器（支持三次 Hermite 插值与预设切换）以及多音频随机权重分配表。
- **内置常用预设**：提供环境音效、3D 空间循环音效、UI 音效、武器开火、角色脚步、CS2 音乐盒等多种开箱即用的场景模板。
- **代码补全与语法校验**：基于 CodeMirror 6 提供 KV3 语法高亮、属性自动补全、实时类型与依赖校验。
- **便捷分享与偏好记忆**：支持通过 URL Hash 一键分享当前配置，支持中/英双语切换与明/暗主题切换。

## 本地开发

环境要求：**Node.js >= 20**

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查
npm run check

# 构建生产版本
npm run build

# 本地预览构建产物
npm run preview
```

## 技术栈

- **框架**：React 19 + TypeScript + Vite
- **样式**：Tailwind CSS v4
- **状态管理**：Zustand + Immer
- **编辑器**：CodeMirror 6
- **国际化**：i18next + react-i18next

## 开源协议

本项目基于 [Apache License 2.0](./LICENSE) 协议开源。
