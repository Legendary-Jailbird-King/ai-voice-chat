import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

const PORT = process.env.PORT || 3001;
const GLM_API_KEY = process.env.GLM_API_KEY || 'eb5e8a54aeff453dba9d501f67356eeb.dIZcHbDwfETJxqM7';
const GLM_BASE_URL = process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/anthropic';

// Create HTTP server + WebSocket server
const server = createServer();
const wss = new WebSocketServer({ server });

// Conversation history per client
const conversations = new Map();

wss.on('connection', (ws) => {
  console.log('Client connected');
  const clientId = Date.now().toString();
  conversations.set(clientId, []);

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'audio') {
        // Handle audio data - in production, use STT API
        console.log('Received audio data, processing...');
        
        // For now, simulate AI response
        const response = await callGLM(conversations.get(clientId), '用户发送了语音消息，请回复一段友好的问候。');
        
        // Send response back
        ws.send(JSON.stringify({
          type: 'response',
          content: response,
          timestamp: new Date().toISOString()
        }));
        
        // Add to conversation history
        conversations.get(clientId).push(
          { role: 'user', content: '[语音消息]' },
          { role: 'assistant', content: response }
        );
      } else if (message.type === 'text') {
        // Handle text input
        const response = await callGLM(conversations.get(clientId), message.content);
        
        ws.send(JSON.stringify({
          type: 'response',
          content: response,
          timestamp: new Date().toISOString()
        }));
        
        conversations.get(clientId).push(
          { role: 'user', content: message.content },
          { role: 'assistant', content: response }
        );
      } else if (message.type === 'mcp') {
        // MCP tool call - document reading
        const { tool, params } = message;
        
        if (tool === 'read_document') {
          // Simulate document reading
          const docContent = `文档内容摘要：\n这是关于AI语音助手的文档。\n主要功能包括：\n1. 语音识别\n2. 智能对话\n3. 文档总结`;
          
          const response = await callGLM(
            conversations.get(clientId),
            `请根据以下文档内容回答用户的问题。\n\n文档内容：\n${docContent}\n\n用户问题：${params.query || '总结这个文档'}`
          );
          
          ws.send(JSON.stringify({
            type: 'mcp_response',
            tool,
            content: response,
            timestamp: new Date().toISOString()
          }));
        }
      }
    } catch (err) {
      console.error('Error processing message:', err);
      ws.send(JSON.stringify({
        type: 'error',
        content: '处理消息时出错',
        timestamp: new Date().toISOString()
      }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    conversations.delete(clientId);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

// Call GLM API (Anthropic-compatible)
async function callGLM(history, userMessage) {
  const messages = [...history, { role: 'user', content: userMessage }];
  
  try {
    const response = await fetch(`${GLM_BASE_URL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': GLM_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-sql-access': 'enabled'
      },
      body: JSON.stringify({
        model: 'glm-5.1',
        max_tokens: 1024,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GLM API error:', response.status, errorText);
      return `抱歉，AI 服务暂时不可用 (${response.status})`;
    }

    const data = await response.json();
    return data.content?.[0]?.text || '没有收到回复';
  } catch (err) {
    console.error('Failed to call GLM:', err);
    return '抱歉，连接 AI 服务失败';
  }
}

server.listen(PORT, () => {
  console.log(`🚀 AI Voice Chat server running on ws://localhost:${PORT}`);
  console.log(`   GLM endpoint: ${GLM_BASE_URL}`);
});
