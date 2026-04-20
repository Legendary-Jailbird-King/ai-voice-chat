import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || '';

export default function KnowledgePage() {
  const [knowledge, setKnowledge] = useState([]);
  const [loading, setLoading] = useState(true);
  const [urlInput, setUrlInput] = useState('');
  const [fetching, setFetching] = useState(false);
  const [filter, setFilter] = useState('all'); // all, marked

  useEffect(() => {
    loadKnowledge();
  }, [filter]);

  const loadKnowledge = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/knowledge`);
      const data = await res.json();
      if (data.success) {
        let items = data.data;
        if (filter === 'marked') {
          items = items.filter(k => k.user_marked);
        }
        setKnowledge(items);
      }
    } catch (e) {
      console.error('Failed to load knowledge:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUrl = async () => {
    if (!urlInput.trim()) return;

    const url = urlInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      alert('请输入完整的 URL');
      return;
    }

    setFetching(true);
    try {
      const res = await fetch(`${API}/api/mcp/read-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`成功读取：${data.data.title}\n\n知识已自动存入题库！`);
        setUrlInput('');
        loadKnowledge();
      } else {
        alert(`读取失败：${data.error}`);
      }
    } catch (e) {
      alert('读取失败，请检查 URL 是否正确');
    } finally {
      setFetching(false);
    }
  };

  const toggleMark = async (id, currentMarked) => {
    try {
      await fetch(`${API}/api/knowledge/${id}/mark`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marked: !currentMarked }),
      });
      loadKnowledge();
    } catch {}
  };

  const deleteItem = async (id) => {
    if (!confirm('确定删除这条知识？')) return;
    try {
      await fetch(`${API}/api/knowledge/${id}`, { method: 'DELETE' });
      loadKnowledge();
    } catch {}
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const getSourceIcon = (type) => {
    switch (type) {
      case 'url': return '🔗';
      case 'voice_chat': return '🎤';
      case 'mcp': return '🤖';
      default: return '📄';
    }
  };

  const getExpiryText = (expiresAt) => {
    if (!expiresAt) return '';
    const now = new Date();
    const expiry = new Date(expiresAt);
    const days = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    if (days <= 0) return '已过期';
    if (days === 1) return '明天过期';
    return `${days}天后过期`;
  };

  return (
    <div className="fade-in">
      <h1 className="page-title"><span className="icon">🧠</span> 知识库</h1>

      <div className="section">
        <div className="section-title">🔗 添加知识</div>
        <div className="url-input-group">
          <input
            type="url"
            className="glass-input"
            placeholder="输入网址，自动读取并提取知识..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUrl()}
          />
          <button
            className="glass-btn primary"
            onClick={fetchUrl}
            disabled={fetching || !urlInput.trim()}
          >
            {fetching ? (
              <>
                <span className="loading-dots"><span/><span/><span/></span>
              </>
            ) : (
              <>📖 读取</>
            )}
          </button>
        </div>

        <div style={{
          padding: '1rem',
          background: 'rgba(26, 18, 22, 0.6)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--glass-border)',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          💡 提示：阅读网页后，知识会自动提取并存入题库。标记为"有用"的知识会长期保留。
        </div>
      </div>

      <div className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div className="section-title" style={{ marginBottom: 0 }}>
            📚 知识列表
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`glass-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              全部
            </button>
            <button
              className={`glass-btn ${filter === 'marked' ? 'active' : ''}`}
              onClick={() => setFilter('marked')}
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              ⭐ 已标记
            </button>
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><div className="loading-dots"><span/><span/><span/></div></div>
        ) : knowledge.length === 0 ? (
          <div className="empty-state glass-card" style={{ padding: '3rem' }}>
            <div className="icon">📭</div>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
              {filter === 'marked' ? '暂无标记的知识' : '暂无知识'}
            </h3>
            <p style={{ color: 'var(--text-muted)' }}>
              {filter === 'marked'
                ? '点击知识卡片上的 ⭐ 将其标记为有用'
                : '在上方输入网址，开始添加知识'}
            </p>
          </div>
        ) : (
          knowledge.map((item) => (
            <div key={item.id} className="glass-card knowledge-item">
              <div className="knowledge-header">
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>{getSourceIcon(item.source_type)}</span>
                    <span className="knowledge-title">{item.source_title || '未命名'}</span>
                  </div>
                  <div className="knowledge-meta">
                    {formatDate(item.created_at)} · {getExpiryText(item.expires_at)}
                    {item.tags?.length > 0 && (
                      <span style={{ marginLeft: '0.5rem' }}>
                        {item.tags.map((t, i) => (
                          <span key={i} className="tag" style={{ marginLeft: '0.25rem' }}>{t}</span>
                        ))}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="glass-btn"
                  onClick={() => toggleMark(item.id, item.user_marked)}
                  style={{
                    padding: '0.5rem',
                    fontSize: '1.2rem',
                    background: item.user_marked ? 'rgba(212, 165, 116, 0.2)' : undefined,
                  }}
                >
                  {item.user_marked ? '⭐' : '☆'}
                </button>
              </div>

              {item.summary && (
                <div className="knowledge-summary">{item.summary}</div>
              )}

              {item.source_url && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--text-accent)', textDecoration: 'none' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    🔗 {item.source_url.substring(0, 60)}...
                  </a>
                </div>
              )}

              <div className="knowledge-actions">
                <button
                  className="glass-btn"
                  onClick={() => toggleMark(item.id, item.user_marked)}
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                >
                  {item.user_marked ? '✓ 已标记有用' : '标记为有用'}
                </button>
                <button
                  className="glass-btn"
                  onClick={() => deleteItem(item.id)}
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', color: 'var(--danger)' }}
                >
                  🗑️ 删除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
