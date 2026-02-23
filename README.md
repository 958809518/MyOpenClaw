# 🌆 智慧城市多模态 AI 生成系统

> 基于多模态大语言模型（MLLM）的实时 3D 场景生成平台

![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

---

## 🎯 项目概述

这是一个**全栈多模态 AI 系统**，通过文本、语音、图像三种输入方式，实现智能化的 3D 城市场景实时生成和可视化。

### 核心特性

✅ **多模态输入**
- 📝 文本模态：精确的指令输入
- 🎤 语音模态：自然的语音交互（支持简体中文）
- 📷 图像模态：计算机视觉驱动的生成

✅ **高性能 3D 渲染**
- Three.js 实时引擎，支持数百个建筑物
- InstancedMesh 优化，减少 GPU 开销
- 动态相机动画，自动聚焦生成内容

---

## 🚀 快速开始

### 安装依赖
```bash
cd /workspaces/MyOpenClaw && npm install
```

### 启动服务器
```bash
npm start              # 生产模式
npm run dev           # 开发模式（自动重载）
```

访问 `http://localhost:3000`

### 使用示例

**文本模式：**
```
1. 输入框输入：生成一个黄塔
2. 点击 [生成]
3. 黄塔出现在 3D 场景中
```

**语音模式：**
```
1. 点击 [语音] 标签
2. 说出：生成一个黄塔
3. 系统自动识别并生成
```

---

## 📁 项目结构

```
MyOpenClaw/
├── server/app.js              # Express 服务器
├── server/aiMock.js           # MLLM 意图解析
├── public/index.html          # UI 界面
├── public/main.js             # 核心逻辑
├── public/cityGenerator.js    # 3D 场景生成
├── tools/test-multimodal.js   # 测试脚本
└── 文档文件
```

---

## 🎮 支持的指令一览

| 指令 | 效果 |
|------|------|
| 生成一个黄塔 | 单个黄色高塔 |
| 生成一个白塔 | 单个白色高塔 |
| 生成城市 | 100 个随机建筑 |

---

## 🧪 自动化测试

```bash
node tools/test-multimodal.js
```

---

## 📚 完整文档

- [MULTIMODAL_GUIDE.md](MULTIMODAL_GUIDE.md) - 详细的多模态使用指南
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - 快速参考卡与 API 文档

---

## 🛠️ 技术栈

- **前端:** Three.js r128, Web Speech API, CSS Glassmorphism
- **后端:** Node.js + Express 4.18.2
- **部署:** Ubuntu 24.04 LTS Docker 环境

---

**祝您使用愉快！🚀**
