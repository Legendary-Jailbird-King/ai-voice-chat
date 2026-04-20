# AI Voice Chat - Agent Teams

## 团队成员

| Agent | 角色 | 核心职责 |
|-------|------|---------|
| **architect** | 系统架构师 | 技术选型、架构设计、代码规范 |
| **frontend-dev** | 前端开发 | React 组件、Voice UI、WebRTC |
| **backend-dev** | 后端开发 | Node.js WebSocket、AI 集成、MCP |
| **design** | UI/UX 设计 | 视觉规范、组件设计、交互设计 |
| **code-review** | 代码审查 | PR 审查、Bug 发现、质量把控 |
| **pm** | 产品经理 | 需求分析、任务规划、进度追踪 |

## 团队架构

```
     PM
      ↓
Architect → 设计团队协作
      ↓
Frontend-dev ←→ Design
      ↑
Backend-dev
      ↓
Code-review ←→ PM 验收
```

## 协作流程

### 1. 功能开发流程
1. **PM** 分析需求 → 确定优先级
2. **Architect** 设计架构
3. **Design** 设计 UI/UX
4. **Frontend-dev** + **Backend-dev** 并行开发
5. **Code-review** 审查代码
6. **PM** 验收合并

### 2. 日常协作
- **PM** 每30分钟汇报进度
- **Design** 提供设计规范
- **Code-review** 持续评审
- **Architect** 解决技术问题

## 当前 Sprint

**目标：** 完成 AI Voice Chat MVP

### 任务看板
| 状态 | 任务 | 负责人 |
|------|------|--------|
| ✅ 完成 | 项目初始化 | Architect |
| ✅ 完成 | 前端语音界面 | Frontend-dev |
| ✅ 完成 | 后端 WebSocket 服务 | Backend-dev |
| ✅ 完成 | GLM AI 集成 | Backend-dev |
| ✅ 完成 | MCP 文档读取 | Backend-dev |
| ✅ 完成 | CI/CD 部署 | Architect |
| ✅ 完成 | UI/UX 优化 | Design |
| ⏳ 进行 | SSL/WSS 配置 | Architect |
| 🔲 待做 | 移动端适配 | Design + Frontend-dev |
| 🔲 待做 | 性能优化 | Frontend-dev + Backend-dev |

## 命令

```bash
# 团队状态
/claude teams status

# 分配任务
/claude teams assign <task> to <agent>

# 进度汇报
/claude teams report

# 设计评审
/claude design review <component>

# 代码审查
/claude review <file>
```

## 环境

- AI: GLM-5.1 via Anthropic API
- 前端: React 19 + Vite 6 + TypeScript
- 后端: Node.js + WebSocket
- 部署: GitHub Pages + PM2
- WebSocket: `ws://111.229.183.250:3001`
- SSL: 待配置 (需要域名)
