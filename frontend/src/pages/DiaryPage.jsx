import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || '';

export default function DiaryPage() {
  const [diaries, setDiaries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [diary, setDiary] = useState(null);
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [todayReport, setTodayReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDiaries();
    loadTodayReport();
  }, []);

  const loadDiaries = async () => {
    try {
      const res = await fetch(`${API}/api/diary`);
      const data = await res.json();
      if (data.success) setDiaries(data.data);
    } catch (e) {
      console.error('Failed to load diaries:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadTodayReport = async () => {
    try {
      const res = await fetch(`${API}/api/report/today`);
      const data = await res.json();
      if (data.success && data.data) setTodayReport(data.data);
    } catch {}
  };

  const loadDiary = async (date) => {
    setSelectedDate(date);
    try {
      const res = await fetch(`${API}/api/diary/${date}`);
      const data = await res.json();
      if (data.success && data.data) {
        setDiary(data.data);
        setContent(data.data.content || '');
        setMood(data.data.mood || '');
      } else {
        setDiary(null);
        setContent('');
        setMood('');
      }
    } catch {}
  };

  const saveDiary = async () => {
    try {
      await fetch(`${API}/api/diary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, content, mood }),
      });
      loadDiaries();
      alert('日记已保存！');
    } catch (e) {
      alert('保存失败');
    }
  };

  const generateReport = async () => {
    if (!confirm('是否生成今日日报？')) return;
    try {
      const res = await fetch(`${API}/api/report/generate`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTodayReport(data.data);
        loadTodayReport();
        alert('日报生成成功！');
      }
    } catch {
      alert('生成失败');
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const getDayOfWeek = (dateStr) => {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[new Date(dateStr).getDay()];
  };

  const moods = ['😊', '😐', '😢', '🤔', '😴'];

  if (loading) {
    return <div className="empty-state"><div className="loading-dots"><span/><span/><span/></div></div>;
  }

  return (
    <div className="fade-in">
      <h1 className="page-title"><span className="icon">📅</span> 日记</h1>

      <div className="stats-row">
        <div className="glass-card stat-card">
          <div className="stat-value">{todayReport?.message_count || 0}</div>
          <div className="stat-label">今日对话</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-value">{todayReport?.topics?.length || 0}</div>
          <div className="stat-label">话题数</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-value">{diaries.length}</div>
          <div className="stat-label">日记总数</div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">
          <span>📊 今日摘要</span>
          {!todayReport && (
            <button className="glass-btn" onClick={generateReport}>
              生成日报
            </button>
          )}
        </div>

        {todayReport ? (
          <div className="glass-card diary-entry">
            <div className="diary-date">{formatDate(new Date().toISOString().split('T')[0])}</div>
            <div className="diary-topics">
              {todayReport.topics?.map((t, i) => (
                <span key={i} className="tag">{t}</span>
              ))}
            </div>
            <div className="diary-content">{todayReport.summary}</div>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            暂无今日摘要，点击上方按钮生成
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-title">✏️ 写日记</div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <input
              type="date"
              className="glass-input"
              style={{ width: 'auto' }}
              value={selectedDate}
              onChange={(e) => loadDiary(e.target.value)}
            />
            <span style={{ color: 'var(--text-secondary)', lineHeight: '2.5rem' }}>
              {formatDate(selectedDate)} · {getDayOfWeek(selectedDate)}
            </span>
          </div>

          <div className="section-title" style={{ fontSize: '0.9rem' }}>今日心情</div>
          <div className="mood-picker">
            {moods.map((m) => (
              <button
                key={m}
                className={`mood-btn ${mood === m ? 'selected' : ''}`}
                onClick={() => setMood(mood === m ? '' : m)}
              >
                {m}
              </button>
            ))}
          </div>

          <textarea
            className="glass-input"
            style={{ width: '100%', minHeight: '200px', resize: 'vertical', marginBottom: '1rem' }}
            placeholder="记录今天的想法..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <button className="glass-btn primary" onClick={saveDiary} style={{ width: '100%' }}>
            💾 保存日记
          </button>
        </div>
      </div>

      <div className="section">
        <div className="section-title">📖 历史日记</div>

        {diaries.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📝</div>
            <p>暂无日记</p>
          </div>
        ) : (
          <div className="cards-grid">
            {diaries.map((d) => (
              <div
                key={d.date}
                className="glass-card knowledge-item"
                style={{ cursor: 'pointer' }}
                onClick={() => loadDiary(d.date)}
              >
                <div className="knowledge-header">
                  <div>
                    <div className="knowledge-title">{formatDate(d.date)}</div>
                    <div className="knowledge-meta">{getDayOfWeek(d.date)}</div>
                  </div>
                  {d.mood && <span style={{ fontSize: '1.5rem' }}>{d.mood}</span>}
                </div>
                {d.auto_summary && (
                  <div className="knowledge-summary" style={{ fontSize: '0.85rem' }}>
                    {d.auto_summary.substring(0, 100)}...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
