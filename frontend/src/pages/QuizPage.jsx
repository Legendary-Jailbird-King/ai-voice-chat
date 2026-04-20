import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || '';

export default function QuizPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState({ total: 0, correct: 0, accuracy: 0 });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    loadQuizzes();
    loadStats();
  }, []);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/quiz?count=5`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setQuizzes(data.data);
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setSubmitted(false);
        setResult(null);
        setShowResult(false);
      }
    } catch (e) {
      console.error('Failed to load quizzes:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch(`${API}/api/quiz/stats`);
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch {}
  };

  const generateQuizzes = async () => {
    if (!confirm('是否根据现有知识生成新题目？')) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API}/api/quiz/generate`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`成功生成 ${data.generated} 道题目！`);
        loadQuizzes();
      }
    } catch {
      alert('生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const selectAnswer = (option) => {
    if (submitted) return;
    setSelectedAnswer(option);
  };

  const submitAnswer = async () => {
    if (!selectedAnswer || submitted) return;

    const quiz = quizzes[currentIndex];
    setSubmitted(true);

    try {
      const res = await fetch(`${API}/api/quiz/${quiz.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: selectedAnswer }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        loadStats();
      }
    } catch {}
  };

  const nextQuestion = () => {
    if (currentIndex < quizzes.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setSubmitted(false);
      setResult(null);
    } else {
      setShowResult(true);
    }
  };

  const getOptionClass = (option) => {
    if (!submitted) return selectedAnswer === option ? 'selected' : '';
    if (option === result?.correctAnswer) return 'correct';
    if (selectedAnswer === option && !result?.isCorrect) return 'wrong';
    return '';
  };

  const restart = () => {
    loadQuizzes();
  };

  if (loading) {
    return <div className="empty-state"><div className="loading-dots"><span/><span/><span/></div></div>;
  }

  if (quizzes.length === 0) {
    return (
      <div className="fade-in">
        <h1 className="page-title"><span className="icon">📝</span> 知识题库</h1>

        <div className="stats-row">
          <div className="glass-card stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">总答题数</div>
          </div>
          <div className="glass-card stat-card">
            <div className="stat-value">{stats.correct}</div>
            <div className="stat-label">正确数</div>
          </div>
          <div className="glass-card stat-card">
            <div className="stat-value">{stats.accuracy}%</div>
            <div className="stat-label">正确率</div>
          </div>
        </div>

        <div className="empty-state glass-card" style={{ padding: '3rem' }}>
          <div className="icon">📚</div>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>暂无题目</h3>
          <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>
            先去阅读一些文档或网页，知识会自动存入题库
          </p>
          <button className="glass-btn primary" onClick={generateQuizzes} disabled={generating}>
            {generating ? '生成中...' : '🎲 生成题目'}
          </button>
        </div>
      </div>
    );
  }

  if (showResult) {
    const correctCount = quizzes.filter((_, i) => {
      return true;
    }).length;

    return (
      <div className="fade-in">
        <h1 className="page-title"><span className="icon">🎉</span> 答题完成</h1>

        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
            {stats.accuracy >= 80 ? '🌟' : stats.accuracy >= 60 ? '👍' : '💪'}
          </div>
          <h2 style={{ marginBottom: '1rem' }}>正确率 {stats.accuracy}%</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            共 {stats.total} 题，正确 {stats.correct} 题
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="glass-btn primary" onClick={restart}>
              🔄 再来一组
            </button>
            <button className="glass-btn" onClick={generateQuizzes} disabled={generating}>
              🎲 生成新题
            </button>
          </div>
        </div>
      </div>
    );
  }

  const quiz = quizzes[currentIndex];

  return (
    <div className="fade-in">
      <h1 className="page-title"><span className="icon">📝</span> 知识题库</h1>

      <div className="stats-row">
        <div className="glass-card stat-card">
          <div className="stat-value">{stats.accuracy}%</div>
          <div className="stat-label">正确率</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-value">{currentIndex + 1}/{quizzes.length}</div>
          <div className="stat-label">当前进度</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">累计答题</div>
        </div>
      </div>

      <div className="glass-card quiz-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <span className="tag">{quiz.question_type === 'multiple_choice' ? '选择题' : '填空题'}</span>
          <span className="tag">难度 {quiz.difficulty || 2}</span>
        </div>

        <div className="quiz-question">{quiz.question}</div>

        {quiz.question_type === 'multiple_choice' && quiz.options && (
          <div className="quiz-options">
            {quiz.options.map((option, i) => (
              <div
                key={i}
                className={`quiz-option ${getOptionClass(option)}`}
                onClick={() => selectAnswer(option)}
              >
                <span style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: submitted && option === result?.correctAnswer
                    ? 'var(--success)'
                    : submitted && selectedAnswer === option && !result?.isCorrect
                    ? 'var(--danger)'
                    : 'var(--glass-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                }}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{option}</span>
              </div>
            ))}
          </div>
        )}

        {quiz.question_type === 'fill_in_blank' && (
          <div>
            <input
              type="text"
              className="glass-input"
              placeholder="请输入答案..."
              value={selectedAnswer || ''}
              onChange={(e) => !submitted && setSelectedAnswer(e.target.value)}
              disabled={submitted}
            />
          </div>
        )}

        {submitted && result?.explanation && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(26, 18, 22, 0.6)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--glass-border)',
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>📖 解析</div>
            <div style={{ color: 'var(--text-secondary)' }}>{result.explanation}</div>
          </div>
        )}

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          {!submitted ? (
            <button
              className="glass-btn primary"
              onClick={submitAnswer}
              disabled={!selectedAnswer}
            >
              ✓ 提交答案
            </button>
          ) : (
            <button className="glass-btn primary" onClick={nextQuestion}>
              {currentIndex < quizzes.length - 1 ? '下一题 →' : '查看结果'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
