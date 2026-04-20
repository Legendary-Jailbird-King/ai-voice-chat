const { WebSocketServer, WebSocket } = require('ws');
const { createServer } = require('http');
const { readDocument, detectPlatform } = require('./services/mcp-doc-reader.js');

const PORT = process.env.PORT || 3001;
const GLM_API_KEY = process.env.GLM_API_KEY || 'eb5e8a54aeff453dba9d501f67356eeb.dIZcHbDwfETJxqM7';
const GLM_BASE_URL = process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/anthropic';

const server = createServer();
const wss = new WebSocketServer({ server });
const conversations = new Map();

wss.on('connection', (ws) => {
  console.log('Client connected');
  const clientId = Date.now().toString();
  conversations.set(clientId, []);

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'text': {
          const urlMatch = message.content.match(/https?:\/\/[^\s]+/);
          if (urlMatch) {
            const url = urlMatch[0];
            const platform = detectPlatform(url);
            
            ws.send(JSON.stringify({
              type: 'status',
              content: `检测到${platform === 'web' ? '网页' : platform}文档，正在读取...`
            }));

            const result = await readDocument({ platform, url, query: message.content });
            
            if (result.success) {
              const response = await callGLM(conversations.get(clientId), 
                `请根据以下文档内容回答用户的问题。\n\n文档标题：${result.title}\n\n文档内容：\n${result.content.slice(0, 4000)}\n\n用户问题：${message.content}`);
              
              ws.send(JSON.stringify({ type: 'response', content: response, platform }));
              conversations.get(clientId).push(
                { role: 'user', content: message.content },
                { role: 'assistant', content: response }
              );
            } else {
              ws.send(JSON.stringify({ type: 'error', content: `读取文档失败：${result.error}` }));
            }
          } else {
            const response = await callGLM(conversations.get(clientId), message.content);
            ws.send(JSON.stringify({ type: 'response', content: response }));
            conversations.get(clientId).push(
              { role: 'user', content: message.content },
              { role: 'assistant', content: response }
            );
          }
          break;
        }

        case 'mcp': {
          const { tool, params } = message;
          if (tool === 'read_document') {
            const platform = detectPlatform(params.url);
            const result = await readDocument({ platform, url: params.url, query: params.query });
            ws.send(JSON.stringify({ type: 'mcp_result', tool, result }));
          } else if (tool === 'list_platforms') {
            ws.send(JSON.stringify({
              type: 'mcp_result',
              tool,
              result: { platforms: ['web', 'yuque', 'notion', 'github'] }
            }));
          }
          break;
        }

        default:
          ws.send(JSON.stringify({ type: 'error', content: `Unknown message type: ${message.type}` }));
      }
    } catch (err) {
      console.error('Error:', err);
      ws.send(JSON.stringify({ type: 'error', content: '处理消息时出错' }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    conversations.delete(clientId);
  });
});

async function callGLM(history, userMessage) {
  const messages = [...history, { role: 'user', content: userMessage }];
  
  try {
    const response = await fetch(`${GLM_BASE_URL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': GLM_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'glm-5.1',
        max_tokens: 1024,
        messages: messages.map(m => ({ role: m.role, content: m.content }))
      })
    });

    if (!response.ok) {
      return `AI 服务暂时不可用 (${response.status})`;
    }

    const data = await response.json();
    return data.content?.[0]?.text || '没有收到回复';
  } catch (err) {
    console.error('Failed to call GLM:', err);
    return '连接 AI 服务失败';
  }
}

server.listen(PORT, () => {
  console.log(`🚀 AI Voice Chat server running on ws://localhost:${PORT}`);
  console.log(`   MCP Doc Reader: ✅ enabled`);
  console.log(`   Platforms: web, yuque, notion, github`);
});
