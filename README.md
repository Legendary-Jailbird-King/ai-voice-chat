# 🎙️ AI Voice Chat

基于 Agent Teams 多智能体协作模式的 AI 语音对话应用。

## 团队成员

| Agent | 角色 | 职责 |
|-------|------|------|
| **architect** | 系统架构师 | 技术选型、架构设计 |
| **frontend-dev** | 前端开发 | React + Voice UI |
| **backend-dev** | 后端开发 | Node.js + AI 集成 |
| **design** | UI/UX 设计 | 视觉规范、组件设计 |
| **code-review** | 代码审查 | 质量把控 |
| **pm** | 产品经理 | 需求、规划、进度 |

## 功能

- 🎤 语音输入（STT）
- 🔊 语音播报（TTS）
- 📄 MCP 文档读取
- 🤖 AI 对话
- 🎨 **Google Stitch 2.0** 设计 → 代码
- 🚀 CI/CD 自动部署

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | React 19 + Vite 6 + TypeScript | 快速构建 |
| 设计工具 | **Google Stitch 2.0** | 设计稿 → 生产代码 |
| 后端 | Node.js + WebSocket | 实时通信 |
| AI | GLM-5.1 (智谱 AI) | 智能对话 |
| 部署 | GitHub Pages + PM2 | 托管服务 |

## 设计 → 代码流程

```
Figma 设计稿 → Google Stitch 2.0 → React 组件代码
                                    ↓
                            自动生成响应式 CSS
                            TypeScript 类型定义
                            生产级代码质量
```

## 开发

```bash
# 前端
cd frontend && npm install && npm run dev

# 后端
cd backend && npm install && node src/index.js
```

## 快速访问

- 🌐 在线预览: https://legendary-jailbird-king.github.io/ai-voice-chat/
- 💬 AI 对话: ws://111.229.183.250:3001

## 文档

- [设计-Stitch集成](docs/stitch-integration.md)
- [项目规格说明](SPEC.md)

---

Built with 🤖 Agent Teams Mode (6 Agents)
