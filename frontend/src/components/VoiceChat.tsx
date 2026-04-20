import { useState, useRef, useCallback, useEffect } from 'react';
import '../styles.css';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useSpeechToText } from '../hooks/useSpeechToText';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://111.229.183.250:3001';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  platform?: string;
  timestamp: Date;
}

export default function VoiceChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { speak, stop } = useTextToSpeech();
  const { isListening, transcript, startListening, stopListening } = useSpeechToText();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (transcript && !isListening) {
      sendMessage(transcript);
    }
  }, [transcript, isListening]);

  const connectWS = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return wsRef.current;
    
    try {
      const ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log('Connected to server');
        setIsConnected(true);
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        // 5秒后自动重连
        reconnectTimer.current = setTimeout(() => {
          console.log('Reconnecting...');
          connectWS();
        }, 5000);
      };
      
      ws.onerror = () => {
        setIsConnected(false);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'response' || data.type === 'status') {
            const newMsg = {
              id: Date.now().toString(),
              role: 'assistant' as const,
              content: data.content,
              platform: data.platform,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, newMsg]);
            
            if (autoSpeak && data.type === 'response') {
              setTimeout(() => speak(data.content), 100);
            }
            
            setIsProcessing(false);
          } else if (data.type === 'error') {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'assistant',
              content: `❌ ${data.content}`,
              timestamp: new Date()
            }]);
            setIsProcessing(false);
          }
        } catch (e) {
          console.error('Parse error:', e);
        }
      };

      wsRef.current = ws;
      return ws;
    } catch (e) {
      console.error('WS connection error:', e);
      return null;
    }
  }, [autoSpeak, speak]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim() || isProcessing) return;
    
    const ws = connectWS();
    if (!ws) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'text', content: text }));
      setIsProcessing(true);
    }
  }, [isProcessing, connectWS]);

  const handleSendText = useCallback(() => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  }, [inputText, sendMessage]);

  const clearMessages = () => {
    setMessages([]);
    stop();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="voice-chat">
      {/* 头部 */}
      <div className="chat-header">
        <div className="header-left">
          <h2>🎙️ AI Voice Chat</h2>
          <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            {isConnected ? '已连接' : '未连接'}
          </span>
        </div>
        <div className="header-actions">
          <label className="auto-speak-toggle">
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => setAutoSpeak(e.target.checked)}
            />
            🔊 朗读
          </label>
          <button className="clear-btn" onClick={clearMessages} title="清空对话">
            🗑️
          </button>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">💬</span>
            <p>开始对话吧！</p>
            <p className="empty-hint">输入文字、粘贴文档链接，或点击麦克风说话</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-bubble">
              <div className="message-header">
                <span className="role-badge">{msg.role === 'user' ? '👤' : '🤖'}</span>
                <span className="message-time">{formatTime(msg.timestamp)}</span>
              </div>
              <p className="message-text">{msg.content}</p>
              {msg.platform && (
                <span className="platform-tag">📄 {msg.platform}</span>
              )}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="message assistant">
            <div className="message-bubble">
              <div className="message-header">
                <span className="role-badge">🤖</span>
                <span className="message-time">{formatTime(new Date())}</span>
              </div>
              <p className="message-text typing">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区 */}
      <div className="input-area">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
          placeholder="输入消息或粘贴文档链接..."
          className="text-input"
        />
        <button onClick={handleSendText} disabled={!inputText.trim()} className="send-btn">
          ➤
        </button>
      </div>

      {/* 语音控制 */}
      <div className="controls">
        <button
          className={`mic-btn ${isListening ? 'listening' : ''}`}
          onClick={isListening ? stopListening : startListening}
          disabled={isProcessing}
        >
          {isListening ? (
            <>
              <span className="pulse-ring"></span>
              ⏹️ 松开停止
            </>
          ) : (
            '🎤 说话'
          )}
        </button>
        <button className="stop-btn" onClick={stop}>
          ⏹️ 停止
        </button>
      </div>

      {/* 底部提示 */}
      <div className="tips">
        💡 支持语雀、Notion、GitHub 等文档链接，AI 自动读取总结
      </div>
    </div>
  );
}
