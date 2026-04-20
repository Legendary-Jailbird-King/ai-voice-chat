# MCP Document Reader Skill

基于 Model Context Protocol 的多平台文档读取 skill，支持：
- 🌐 任意网页 URL
- 📄 语雀文档
- 📝 Notion 页面
- 📁 GitHub 文件

## 使用方法

### 1. 读取文档
```
请帮我读取这个文档：https://www.yuque.com/xxx/abc
```

### 2. 总结文档
```
请读取这个文档并总结要点：{url}
```

### 3. 多平台支持

| 平台 | 示例 URL | 认证 |
|------|---------|------|
| 网页 | `https://example.com/docs/guide` | 无 |
| 语雀 | `https://www.yuque.com/user/book/doc` | YUQUE_TOKEN |
| Notion | `https://notion.so/page-title-xxx` | NOTION_TOKEN |
| GitHub | `https://github.com/owner/repo/blob/main/README.md` | 无 |

## 工作原理

1. 接收用户 URL
2. 检测平台类型
3. 调用对应平台 API 读取内容
4. AI 总结并回答用户问题

## MCP 工具定义

```json
{
  "tools": {
    "read_document": {
      "description": "读取任意平台的文档内容",
      "inputSchema": {
        "type": "object",
        "properties": {
          "url": { "type": "string", "description": "文档 URL" },
          "query": { "type": "string", "description": "用户想要了解的问题（可选）" }
        },
        "required": ["url"]
      }
    },
    "summarize_document": {
      "description": "读取并总结文档要点",
      "inputSchema": {
        "type": "object",
        "properties": {
          "url": { "type": "string", "description": "文档 URL" },
          "focus": { "type": "string", "description": "总结重点（可选）" }
        },
        "required": ["url"]
      }
    },
    "list_supported_platforms": {
      "description": "列出支持的文档平台",
      "inputSchema": { "type": "object", "properties": {} }
    }
  }
}
```

## 配置

环境变量：
- `YUQUE_TOKEN` — 语雀 API Token
- `NOTION_TOKEN` — Notion Integration Token

## 返回格式

```json
{
  "success": true,
  "platform": "yuque",
  "title": "文档标题",
  "content": "文档内容...",
  "summary": "AI 总结",
  "url": "原始 URL"
}
```
