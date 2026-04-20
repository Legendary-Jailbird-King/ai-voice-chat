import { useState, useEffect, useRef } from 'react';
import VoiceChat from './components/VoiceChat';
import DiaryPage from './pages/DiaryPage';
import QuizPage from './pages/QuizPage';
import KnowledgePage from './pages/KnowledgePage';
import './styles.css';

type Page = 'chat' | 'diary' | 'quiz' | 'knowledge';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://111.229.183.250:3001';

export default function App() {
  const [page, setPage] = useState('chat');
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    connectWS();
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const connectWS = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('Connected to server');
      setConnected(true);
    };

    ws.onclose = () => {
      console.log('Disconnected');
      setConnected(false);
      // 5秒后重连
      setTimeout(connectWS, 5000);
    };

    ws.onerror = (e) => {
      console.error('WebSocket error', e);
    };

    wsRef.current = ws;
  };

  const renderPage = () => {
    switch (page) {
      case 'diary':
        return <DiaryPage />;
      case 'quiz':
        return <QuizPage />;
      case 'knowledge':
        return <KnowledgePage />;
      default:
        return <VoiceChat ws={wsRef.current} />;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">
          <span>🎙️</span>
          <span>AI <span className="accent">Voice</span> Chat</span>
        </div>

        <nav className="app-nav">
          <button
            className={`nav-btn ${page === 'chat' ? 'active' : ''}`}
            onClick={() => setPage('chat')}
          >
            <span>💬</span>
            <span>对话</span>
          </button>
          <button
            className={`nav-btn ${page === 'knowledge' ? 'active' : ''}`}
            onClick={() => setPage('knowledge')}
          >
            <span>🧠</span>
            <span>知识库</span>
          </button>
          <button
            className={`nav-btn ${page === 'quiz' ? 'active' : ''}`}
            onClick={() => setPage('quiz')}
          >
            <span>📝</span>
            <span>题库</span>
          </button>
          <button
            className={`nav-btn ${page === 'diary' ? 'active' : ''}`}
            onClick={() => setPage('diary')}
          >
            <span>📅</span>
            <span>日记</span>
          </button>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className={`status-dot ${connected ? 'online' : 'offline'}`}></span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {connected ? '已连接' : '连接中...'}
          </span>
        </div>
      </header>

      <main className="app-main">
        {renderPage()}
      </main>
    </div>
  );
}
