# AI Voice Chat - 项目规格说明书

## 1. 项目概述

- **项目名称**: AI Voice Chat
- **类型**: 实时语音对话应用
- **核心功能**: 用户通过语音与AI对话，AI调用MCP读取文档并总结回复
- **目标用户**: 需要通过语音快速获取信息、总结文档的用户

## 2. 系统架构

### 2.1 整体架构
```
用户语音 → WebRTC → 前端(React) → WebSocket → 后端(Node.js) → AI(LLM/TTS)
```

### 2.2 核心技术栈
| 模块 | 技术选型 | 说明 |
|------|---------|------|
| 前端框架 | React + Vite | 快速开发，符合技术栈 |
| 语音捕获 | WebRTC/MediaRecorder | 浏览器原生 |
| 实时通信 | WebSocket | 低延迟双向通信 |
| 后端Runtime | Node.js | 轻量级WebSocket服务 |
| AI模型 | GLM-5.1 (Z.AI) | 核心对话引擎 |
| 语音合成 | GLM TTS / Web Speech API | 语音输出 |
| MCP | 文档读取+总结 | 工具调用 |
| 部署 | GitHub Pages (前端) + 容器化(后端) | 免费可预览 |
| CI/CD | GitHub Actions | 自动化流水线 |

## 3. Agent Team 角色定义

### 3.1 四个核心Agent角色
| 角色 | 职责 | 技术重点 |
|------|------|---------|
| **architect** | 系统设计、架构决策 | 系统架构、接口设计 |
| **frontend-dev** | 前端开发 | React、Voice UI、WebRTC |
| **backend-dev** | 后端开发 | Node.js、WebSocket、AI集成 |
| **product-manager** | 产品规划、文档撰写 | PRD、进度跟踪 |

### 3.2 Agent间协作流程
1. **PM** 规划任务 → 分发给各Agent
2. **Architect** 设计架构 → 输出给前端/后端
3. **Frontend** + **Backend** 并行开发
4. **PM** 验证质量，汇报进度

## 4. 开发阶段

### Phase 1: 基础架构 (W1)
- [ ] 项目初始化，Git仓库结构
- [ ] 前端：语音捕获界面
- [ ] 后端：WebSocket基础服务
- [ ] AI：GLM对话集成

### Phase 2: 核心功能 (W2)
- [ ] MCP文档读取
- [ ] 语音流式传输
- [ ] 多Agent协作测试

### Phase 3: 部署上线 (W3)
- [ ] GitHub Pages前端部署
- [ ] GitHub Actions CI/CD
- [ ] 实时预览环境

## 5. Git协作规范

- **分支策略**: `main` / `develop` / `feature/*`
- **PR流程**: Feature → Develop → Main
- **Commit规范**: Conventional Commits
- **版本控制**: SemVer (v0.1.0起始)

## 6. 部署方案

- **前端**: GitHub Pages (master分支自动部署)
- **后端**: 容器化，支持 Railway/Fly.io
- **状态**: 开发中，可实时查看进度

