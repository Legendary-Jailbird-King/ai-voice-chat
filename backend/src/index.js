import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readUrl } from './services/url-mcp.js';
import {
  initDb,
  addKnowledge, getKnowledgeList, markKnowledge, deleteKnowledge, cleanupExpiredKnowledge,
  getQuizzes, submitQuizAnswer, getQuizStats, generateQuiz,
  getTodayChats, saveChatLog, saveDailyReport, getDailyReport, getDailyReports,
  saveDiary, getDiary, getDiaries
} from './services/database.js';
import { generateDailySummary, generateQuizzesFromKnowledge, extractKnowledgeSummary, callAI } from './services/ai-service.js';

// ===== 配置 =====
const PORT = process.env.PORT || 3001;
const __dirname = dirname(fileURLToPath(import.meta.url));

// ===== HTTP Server =====
const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  if (path === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
    return;
  }

  if (path.startsWith('/api/')) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = body ? JSON.parse(body) : {};
        const userId = data.user_id || 'default';

        // ===== 知识库 API =====
        if (path === '/api/knowledge' && req.method === 'GET') {
          const list = getKnowledgeList(userId);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data: list }));
          return;
        }

        if (path === '/api/knowledge' && req.method === 'POST') {
          const { source_type, source_url, source_title, content, summary, tags } = data;
          const id = addKnowledge({ userId, sourceType: source_type, sourceUrl: source_url, sourceTitle: source_title, content, summary, tags });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, id }));
          return;
        }

        if (path.startsWith('/api/knowledge/') && path.endsWith('/mark') && req.method === 'PUT') {
          const id = path.split('/')[3];
          const { marked } = data;
          markKnowledge(parseInt(id), marked, userId);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }

        if (path.startsWith('/api/knowledge/') && req.method === 'DELETE') {
          const id = path.split('/')[3];
          deleteKnowledge(parseInt(id), userId);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }

        // ===== URL MCP =====
        if (path === '/api/mcp/read-url' && req.method === 'POST') {
          const { url: targetUrl } = data;
          try {
            const result = await readUrl(targetUrl);
            if (result.content && result.content.length > 100) {
              const summaries = await extractKnowledgeSummary(result.content, result.title);
              const knowledgeId = addKnowledge({
                userId,
                sourceType: 'url',
                sourceUrl: targetUrl,
                sourceTitle: result.title,
                content: result.content.substring(0, 2000),
                summary: summaries[0]?.summary || result.description || '',
                tags: summaries[0]?.tags || [],
              });
              result.knowledge_id = knowledgeId;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, data: result }));
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: error.message }));
          }
          return;
        }

        // ===== Quiz API =====
        if (path === '/api/quiz' && req.method === 'GET') {
          const count = parseInt(url.searchParams.get('count') || '5');
          const knowledgeId = url.searchParams.get('knowledge_id');
          const quizzes = getQuizzes(userId, { count, knowledgeId: knowledgeId ? parseInt(knowledgeId) : null });
          const safeQuizzes = quizzes.map(q => ({ id: q.id, question_type: q.question_type, question: q.question, options: q.options, difficulty: q.difficulty }));
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data: safeQuizzes }));
          return;
        }

        if (path.startsWith('/api/quiz/') && path.endsWith('/answer') && req.method === 'POST') {
          const quizId = path.split('/')[3];
          const { answer } = data;
          const result = submitQuizAnswer(parseInt(quizId), userId, answer);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data: result }));
          return;
        }

        if (path === '/api/quiz/stats' && req.method === 'GET') {
          const stats = getQuizStats(userId);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data: stats }));
          return;
        }

        if (path === '/api/quiz/generate' && req.method === 'POST') {
          const knowledgeList = getKnowledgeList(userId, { onlyMarked: false });
          if (knowledgeList.length === 0) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, generated: 0, message: '暂无知识条目' }));
            return;
          }
          const quizzes = await generateQuizzesFromKnowledge(knowledgeList.slice(0, 5));
          for (const q of quizzes) {
            generateQuiz({ userId, knowledgeId: knowledgeList[0].id, ...q });
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, generated: quizzes.length }));
          return;
        }

        // ===== 日报 & 日记 API =====
        if (path === '/api/report/today' && req.method === 'GET') {
          const today = new Date().toISOString().split('T')[0];
          const report = getDailyReport(userId, today);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data: report }));
          return;
        }

        if (path === '/api/report/generate' && req.method === 'POST') {
          const today = new Date().toISOString().split('T')[0];
          const chats = getTodayChats(userId);
          const summaryData = await generateDailySummary(chats);
          saveDailyReport({
            userId,
            reportDate: today,
            summary: summaryData.summary,
            topics: summaryData.topics || [],
            sessionCount: summaryData.sessionCount || 1,
            messageCount: chats.length,
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data: summaryData }));
          return;
        }

        if (path.startsWith('/api/report/') && req.method === 'GET') {
          const date = path.split('/')[3];
          const report = getDailyReport(userId, date);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data: report }));
          return;
        }

        if (path === '/api/diary' && req.method === 'GET') {
          const from = url.searchParams.get('from');
          const to = url.searchParams.get('to');
          const diaries = getDiaries(userId, { from: from || null, to: to || null });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data: diaries }));
          return;
        }

        if (path === '/api/diary' && req.method === 'POST') {
          const { date: reqDate, content, mood } = data;
          const today = reqDate || new Date().toISOString().split('T')[0];
          let autoSummary = null;
          const existingDiary = getDiary(userId, today);
          if (!existingDiary?.auto_summary && content) {
            const chats = getTodayChats(userId);
            const summaryData = await generateDailySummary(chats);
            autoSummary = summaryData.summary;
          }
          saveDiary({ userId, date: today, content, autoSummary: autoSummary || existingDiary?.auto_summary, mood });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }

        if (path.startsWith('/api/diary/') && req.method === 'GET') {
          const date = path.split('/')[3];
          const diary = getDiary(userId, date);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data: diary }));
          return;
        }

        if (path === '/api/chat/log' && req.method === 'POST') {
          const { session_id, role, content } = data;
          saveChatLog({ userId, sessionId: session_id, role, content });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // 静态文件
  if (req.method === 'GET') {
    let filePath = path === '/' ? '/index.html' : path;
    const distPath = join(__dirname, '../../frontend/dist', filePath);
    try {
      const content = readFileSync(distPath);
      const ext = filePath.split('.').pop();
      const mimeTypes = { html: 'text/html', js: 'application/javascript', css: 'text/css', json: 'application/json', png: 'image/png', jpg: 'image/jpeg', ico: 'image/x-icon' };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
    return;
  }

  res.writeHead(404);
  res.end();
});

// ===== WebSocket Server =====
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const clientId = Date.now().toString();
  console.log(`Client connected: ${clientId}`);

  ws.send(JSON.stringify({ type: 'connected', clientId }));

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`[${clientId}]`, message.type, message.content?.substring?.(0, 80) || '');

      switch (message.type) {
        case 'text': {
          saveChatLog({ userId: 'default', sessionId: message.session_id, role: 'user', content: message.content });
          const response = await callAI({
            messages: [{ role: 'user', content: message.content }],
            system: '你是一个有用的 AI 助手。',
            maxTokens: 1024,
            temperature: 0.7,
          });
          saveChatLog({ userId: 'default', sessionId: message.session_id, role: 'assistant', content: response });
          ws.send(JSON.stringify({ type: 'response', content: response, session_id: message.session_id }));
          break;
        }

        case 'mcp_read_url': {
          try {
            const result = await readUrl(message.url);
            ws.send(JSON.stringify({ type: 'mcp_result', tool: 'read_url', data: result }));
          } catch (error) {
            ws.send(JSON.stringify({ type: 'error', content: `URL 读取失败: ${error.message}` }));
          }
          break;
        }

        case 'generate_report': {
          const today = new Date().toISOString().split('T')[0];
          const chats = getTodayChats('default');
          ws.send(JSON.stringify({ type: 'status', content: '正在生成日报...' }));
          const summaryData = await generateDailySummary(chats);
          saveDailyReport({ userId: 'default', reportDate: today, summary: summaryData.summary, topics: summaryData.topics || [], sessionCount: summaryData.sessionCount || 1, messageCount: chats.length });
          ws.send(JSON.stringify({ type: 'report_ready', data: { ...summaryData, date: today } }));
          break;
        }

        case 'generate_quiz': {
          const knowledgeList = getKnowledgeList('default', { onlyMarked: false });
          if (knowledgeList.length === 0) {
            ws.send(JSON.stringify({ type: 'error', content: '暂无知识，无法生成题目' }));
            break;
          }
          ws.send(JSON.stringify({ type: 'status', content: '正在生成题目...' }));
          const quizzes = await generateQuizzesFromKnowledge(knowledgeList.slice(0, 3));
          const generated = [];
          for (const q of quizzes) {
            const id = generateQuiz({ userId: 'default', knowledgeId: knowledgeList[0].id, ...q });
            generated.push({ id, ...q });
          }
          ws.send(JSON.stringify({ type: 'quiz_ready', data: generated }));
          break;
        }

        default:
          ws.send(JSON.stringify({ type: 'error', content: 'Unknown message type' }));
      }
    } catch (error) {
      console.error('WS error:', error);
      ws.send(JSON.stringify({ type: 'error', content: error.message }));
    }
  });

  ws.on('close', () => {
    console.log(`Client disconnected: ${clientId}`);
  });
});

// ===== 启动 =====
async function start() {
  console.log('📦 Initializing database...');
  await initDb();
  console.log('✅ Database ready');

  // 定时任务
  setInterval(() => {
    try { cleanupExpiredKnowledge(); } catch {}
  }, 3600000); // 每小时

  // 每天23点生成日报
  setInterval(() => {
    const now = new Date();
    if (now.getHours() === 23 && now.getMinutes() === 0) {
      const today = now.toISOString().split('T')[0];
      const chats = getTodayChats('default');
      generateDailySummary(chats).then(summaryData => {
        saveDailyReport({ userId: 'default', reportDate: today, summary: summaryData.summary, topics: summaryData.topics || [], sessionCount: summaryData.sessionCount || 1, messageCount: chats.length });
      });
    }
  }, 60000);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 AI Voice Chat Backend running on port ${PORT}`);
    console.log(`   WebSocket: ws://0.0.0.0:${PORT}`);
    console.log(`   HTTP API: http://0.0.0.0:${PORT}/api/`);
  });
}

start().catch(console.error);
