import { useState, useRef, useCallback } from 'react';
import '../styles.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function VoiceChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(audioBlob);
        }
        setIsProcessing(true);
      };

      mediaRecorder.start();
      setIsRecording(true);

      if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
        wsRef.current = new WebSocket('ws://localhost:3001');
        wsRef.current.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'transcript' || data.type === 'response') {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: data.role || 'assistant',
              content: data.content,
              timestamp: new Date()
            }]);
          }
          if (data.type === 'response') {
            setIsProcessing(false);
          }
        };
      }
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  return (
    <div className="voice-chat">
      <div className="chat-header">
        <h2>🎙️ AI Voice Chat</h2>
        <span className="status">
          {isRecording ? '🔴 Recording...' : isProcessing ? '⚙️ Processing...' : '🟢 Ready'}
        </span>
      </div>

      <div className="messages">
        {messages.length === 0 && (
          <p style={{ textAlign: 'center', color: '#999' }}>
            按住按钮开始说话...
          </p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <span className="role-badge">{msg.role === 'user' ? '👤' : '🤖'}</span>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>

      <div className="controls">
        <button
          className={`record-btn ${isRecording ? 'recording' : ''}`}
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          disabled={isProcessing}
        >
          {isRecording ? '⏹️ 松开停止' : '🎤 按住说话'}
        </button>
      </div>
    </div>
  );
}
