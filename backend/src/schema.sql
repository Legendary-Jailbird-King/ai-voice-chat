-- AI Voice Chat Database Schema
-- SQLite

-- 知识条目表（7天TTL）
CREATE TABLE IF NOT EXISTS knowledge_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL DEFAULT 'default',
  session_id TEXT,
  source_type TEXT NOT NULL, -- 'url' | 'voice_chat' | 'mcp'
  source_url TEXT,
  source_title TEXT,
  content TEXT NOT NULL,
  summary TEXT,
  tags TEXT, -- JSON array
  user_marked INTEGER DEFAULT 0, -- 0=未标记, 1=有用
  expires_at TEXT NOT NULL, -- ISO date
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 题目表
CREATE TABLE IF NOT EXISTS quizzes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL DEFAULT 'default',
  knowledge_id INTEGER REFERENCES knowledge_entries(id),
  question_type TEXT NOT NULL, -- 'multiple_choice' | 'fill_in_blank'
  question TEXT NOT NULL,
  options TEXT, -- JSON array for multiple choice
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty INTEGER DEFAULT 2, -- 1-3
  created_at TEXT DEFAULT (datetime('now'))
);

-- 答题记录表
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id INTEGER NOT NULL REFERENCES quizzes(id),
  user_id TEXT NOT NULL DEFAULT 'default',
  user_answer TEXT NOT NULL,
  is_correct INTEGER NOT NULL, -- 0 or 1
  answered_at TEXT DEFAULT (datetime('now'))
);

-- 每日报告表
CREATE TABLE IF NOT EXISTS daily_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL DEFAULT 'default',
  report_date TEXT NOT NULL, -- YYYY-MM-DD
  summary TEXT NOT NULL, -- Markdown
  topics TEXT, -- JSON array
  session_count INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, report_date)
);

-- 用户日记表
CREATE TABLE IF NOT EXISTS user_diary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL DEFAULT 'default',
  date TEXT NOT NULL, -- YYYY-MM-DD
  content TEXT, -- 用户编辑内容
  auto_summary TEXT, -- AI自动摘要
  mood TEXT, -- 😊 😐 😢 🤔
  is_pinned INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, date)
);

-- 对话记录表（用于日报生成）
CREATE TABLE IF NOT EXISTS chat_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL DEFAULT 'default',
  session_id TEXT,
  role TEXT NOT NULL, -- 'user' | 'assistant'
  content TEXT NOT NULL,
  timestamp TEXT DEFAULT (datetime('now')),
  date TEXT NOT NULL -- YYYY-MM-DD, 便于聚合
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_ke_user_expires ON knowledge_entries(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_ke_marked ON knowledge_entries(user_id, user_marked) WHERE user_marked = 1;
CREATE INDEX IF NOT EXISTS idx_quiz_user ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_user_date ON user_diary(user_id, date);
CREATE INDEX IF NOT EXISTS idx_report_user_date ON daily_reports(user_id, report_date);
CREATE INDEX IF NOT EXISTS idx_chat_user_date ON chat_logs(user_id, date);
