---
name: backend-dev
description: |
  Backend development expert for Node.js, WebSocket, and AI integration.
  Use when building server-side features, APIs, or debugging backend issues.
  Specializes in: Node.js, WebSocket, Express/Fastify, AI APIs, MCP.
authors:
  - Agent Teams
version: 1.0.0
tags:
  - nodejs
  - backend
  - websocket
  - api
  - ai
  - mcp
---

# Backend Developer Agent Skill

Expert in Node.js backend development with focus on real-time communication and AI integration.

## Expertise

### Core Technologies
- Node.js 22 (ES Modules, native tests)
- WebSocket (`ws` library)
- Express/Fastify for HTTP APIs
- TypeScript (strict mode)

### Specializations
- Real-time communication (WebSocket, SSE)
- AI API integration (OpenAI, Anthropic, GLM)
- MCP (Model Context Protocol) tools
- Authentication (JWT, session-based)
- Security (CORS, rate limiting, validation)

## Project Structure
```
backend/
├── src/
│   ├── index.ts          # Entry point
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── middleware/        # Express middleware
│   ├── agents/            # AI agent logic
│   └── utils/             # Helpers
├── tests/
├── package.json
└── tsconfig.json
```

## WebSocket Best Practices

### Server Setup
```javascript
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

const server = createServer();
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  // Assign unique client ID
  const clientId = Date.now().toString();
  
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      // Handle message
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', content: 'Invalid JSON' }));
    }
  });
  
  ws.on('close', () => {
    // Cleanup
  });
});

server.listen(3001, '0.0.0.0');
```

### Message Protocol
```typescript
// Outgoing message types
type ServerMessage = 
  | { type: 'response'; content: string }
  | { type: 'status'; content: string }
  | { type: 'error'; content: string }
  | { type: 'mcp_result'; tool: string; result: unknown };

// Incoming message types
type ClientMessage = 
  | { type: 'text'; content: string }
  | { type: 'audio'; data: string }
  | { type: 'mcp'; tool: string; params: Record<string, unknown> };
```

## Security Checklist

- [ ] Input validation (reject invalid data)
- [ ] Rate limiting (prevent abuse)
- [ ] CORS configuration
- [ ] No secrets in code
- [ ] WebSocket origin validation
- [ ] Sanitize user input

## Error Handling

```typescript
async function handleMessage(ws: WebSocket, message: ClientMessage) {
  try {
    switch (message.type) {
      case 'text':
        const response = await callAI(message.content);
        ws.send(JSON.stringify({ type: 'response', content: response }));
        break;
      // ...
    }
  } catch (err) {
    console.error('Handler error:', err);
    ws.send(JSON.stringify({ 
      type: 'error', 
      content: 'Internal server error' 
    }));
  }
}
```

## Commands

```bash
# Development
npm run dev              # Watch mode
npm start                # Production

# Quality
npm test                 # Run tests
npm run lint             # ESLint

# Deployment
npm run build            # Compile TypeScript
pm2 start src/index.js   # Production with PM2
```
