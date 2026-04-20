import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '../../data.db');

let db = null;

// 初始化数据库
async function initDb() {
  const SQL = await initSqlJs();

  // 尝试加载现有数据库
  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // 初始化表
  db.run(`
    CREATE TABLE IF NOT EXISTS knowledge_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default',
      session_id TEXT,
      source_type TEXT NOT NULL,
      source_url TEXT,
      source_title TEXT,
      content TEXT NOT NULL,
      summary TEXT,
      tags TEXT,
      user_marked INTEGER DEFAULT 0,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default',
      knowledge_id INTEGER,
      question_type TEXT NOT NULL,
      question TEXT NOT NULL,
      options TEXT,
      correct_answer TEXT NOT NULL,
      explanation TEXT,
      difficulty INTEGER DEFAULT 2,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL,
      user_id TEXT NOT NULL DEFAULT 'default',
      user_answer TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      answered_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS daily_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default',
      report_date TEXT NOT NULL UNIQUE,
      summary TEXT NOT NULL,
      topics TEXT,
      session_count INTEGER DEFAULT 0,
      message_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_diary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default',
      date TEXT NOT NULL UNIQUE,
      content TEXT,
      auto_summary TEXT,
      mood TEXT,
      is_pinned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS chat_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default',
      session_id TEXT,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp TEXT DEFAULT (datetime('now')),
      date TEXT NOT NULL
    )
  `);

  saveDb();
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(DB_PATH, buffer);
}

// 同步封装
function getDb() {
  if (!db) throw new Error('DB not initialized');
  return db;
}

// ============ 知识条目 ============

export function addKnowledge({ userId = 'default', sessionId, sourceType, sourceUrl, sourceTitle, content, summary, tags = [] }) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const stmt = getDb().prepare(`INSERT INTO knowledge_entries (user_id, session_id, source_type, source_url, source_title, content, summary, tags, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  stmt.run([userId, sessionId || null, sourceType, sourceUrl || null, sourceTitle || null, content, summary || null, JSON.stringify(tags), expiresAt]);
  stmt.free();
  const result = getDb().exec('SELECT last_insert_rowid() as id');
  saveDb();
  return result[0]?.values[0]?.[0];
}

export function getKnowledgeList(userId = 'default', { includeExpired = false, onlyMarked = false } = {}) {
  let sql = `SELECT * FROM knowledge_entries WHERE user_id = ?`;
  if (!includeExpired) {
    sql += ` AND expires_at > datetime('now')`;
  }
  if (onlyMarked) {
    sql += ` AND user_marked = 1`;
  }
  sql += ` ORDER BY created_at DESC`;
  const result = getDb().exec(sql, [userId]);
  if (!result.length) return [];
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, i) => obj[col] = row[i]);
    obj.tags = JSON.parse(obj.tags || '[]');
    return obj;
  });
}

export function markKnowledge(id, marked, userId = 'default') {
  getDb().run(`UPDATE knowledge_entries SET user_marked = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?`, [marked ? 1 : 0, id, userId]);
  saveDb();
}

export function deleteKnowledge(id, userId = 'default') {
  getDb().run(`DELETE FROM knowledge_entries WHERE id = ? AND user_id = ?`, [id, userId]);
  saveDb();
}

export function cleanupExpiredKnowledge() {
  getDb().run(`DELETE FROM knowledge_entries WHERE expires_at <= datetime('now') AND user_marked = 0`);
  saveDb();
}

// ============ 题目 ============

export function generateQuiz({ userId = 'default', knowledgeId, questionType, question, options, correctAnswer, explanation, difficulty = 2 }) {
  const stmt = getDb().prepare(`INSERT INTO quizzes (user_id, knowledge_id, question_type, question, options, correct_answer, explanation, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  stmt.run([userId, knowledgeId || null, questionType, question, JSON.stringify(options || []), correctAnswer, explanation || null, difficulty]);
  stmt.free();
  const result = getDb().exec('SELECT last_insert_rowid() as id');
  saveDb();
  return result[0]?.values[0]?.[0];
}

export function getQuizzes(userId = 'default', { count = 5, knowledgeId } = {}) {
  let sql = `SELECT * FROM quizzes WHERE user_id = ?`;
  const params = [userId];
  if (knowledgeId) {
    sql += ` AND knowledge_id = ?`;
    params.push(knowledgeId);
  }
  sql += ` ORDER BY RANDOM() LIMIT ?`;
  params.push(count);
  const result = getDb().exec(sql, params);
  if (!result.length) return [];
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, i) => obj[col] = row[i]);
    obj.options = JSON.parse(obj.options || '[]');
    return obj;
  });
}

export function submitQuizAnswer(quizId, userId = 'default', userAnswer) {
  const result = getDb().exec(`SELECT * FROM quizzes WHERE id = ? AND user_id = ?`, [quizId, userId]);
  if (!result.length || !result[0].values.length) return null;

  const columns = result[0].columns;
  const quiz = {};
  columns.forEach((col, i) => quiz[col] = result[0].values[0][i]);

  const isCorrect = quiz.correct_answer === userAnswer;

  getDb().run(`INSERT INTO quiz_attempts (quiz_id, user_id, user_answer, is_correct) VALUES (?, ?, ?, ?)`, [quizId, userId, userAnswer, isCorrect ? 1 : 0]);
  saveDb();

  return { isCorrect, correctAnswer: quiz.correct_answer, explanation: quiz.explanation };
}

export function getQuizStats(userId = 'default') {
  const totalResult = getDb().exec(`SELECT COUNT(*) as count FROM quiz_attempts WHERE user_id = ?`, [userId]);
  const total = totalResult[0]?.values[0]?.[0] || 0;
  const correctResult = getDb().exec(`SELECT COUNT(*) as count FROM quiz_attempts WHERE user_id = ? AND is_correct = 1`, [userId]);
  const correct = correctResult[0]?.values[0]?.[0] || 0;
  return { total, correct, accuracy: total > 0 ? Math.round(correct / total * 100) : 0 };
}

// ============ 日报 & 日记 ============

export function saveChatLog({ userId = 'default', sessionId, role, content }) {
  const now = new Date().toISOString();
  const date = now.split('T')[0];
  getDb().run(`INSERT INTO chat_logs (user_id, session_id, role, content, date) VALUES (?, ?, ?, ?, ?)`, [userId, sessionId || null, role, content, date]);
  saveDb();
}

export function getTodayChats(userId = 'default') {
  const date = new Date().toISOString().split('T')[0];
  const result = getDb().exec(`SELECT * FROM chat_logs WHERE user_id = ? AND date = ? ORDER BY timestamp`, [userId, date]);
  if (!result.length) return [];
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, i) => obj[col] = row[i]);
    return obj;
  });
}

export function saveDailyReport({ userId = 'default', reportDate, summary, topics = [], sessionCount = 0, messageCount = 0 }) {
  getDb().run(`INSERT OR REPLACE INTO daily_reports (user_id, report_date, summary, topics, session_count, message_count) VALUES (?, ?, ?, ?, ?, ?)`, [userId, reportDate, summary, JSON.stringify(topics), sessionCount, messageCount]);
  saveDb();
}

export function getDailyReport(userId = 'default', date) {
  const result = getDb().exec(`SELECT * FROM daily_reports WHERE user_id = ? AND report_date = ?`, [userId, date]);
  if (!result.length || !result[0].values.length) return null;
  const columns = result[0].columns;
  const obj = {};
  columns.forEach((col, i) => obj[col] = result[0].values[0][i]);
  obj.topics = JSON.parse(obj.topics || '[]');
  return obj;
}

export function getDailyReports(userId = 'default', { from, to } = {}) {
  let sql = `SELECT * FROM daily_reports WHERE user_id = ?`;
  const params = [userId];
  if (from) { sql += ` AND report_date >= ?`; params.push(from); }
  if (to) { sql += ` AND report_date <= ?`; params.push(to); }
  sql += ` ORDER BY report_date DESC`;
  const result = getDb().exec(sql, params);
  if (!result.length) return [];
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, i) => obj[col] = row[i]);
    obj.topics = JSON.parse(obj.topics || '[]');
    return obj;
  });
}

export function saveDiary({ userId = 'default', date, content, autoSummary, mood }) {
  getDb().run(`INSERT OR REPLACE INTO user_diary (user_id, date, content, auto_summary, mood, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`, [userId, date, content || null, autoSummary || null, mood || null]);
  saveDb();
}

export function getDiary(userId = 'default', date) {
  const result = getDb().exec(`SELECT * FROM user_diary WHERE user_id = ? AND date = ?`, [userId, date]);
  if (!result.length || !result[0].values.length) return null;
  const columns = result[0].columns;
  const obj = {};
  columns.forEach((col, i) => obj[col] = result[0].values[0][i]);
  return obj;
}

export function getDiaries(userId = 'default', { from, to } = {}) {
  let sql = `SELECT * FROM user_diary WHERE user_id = ?`;
  const params = [userId];
  if (from) { sql += ` AND date >= ?`; params.push(from); }
  if (to) { sql += ` AND date <= ?`; params.push(to); }
  sql += ` ORDER BY date DESC`;
  const result = getDb().exec(sql, params);
  if (!result.length) return [];
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, i) => obj[col] = row[i]);
    return obj;
  });
}

export { initDb, getDb };
