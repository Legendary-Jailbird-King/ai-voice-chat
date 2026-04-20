import { useState } from 'react';

interface TranscriptLine {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export default function Transcript() {
  const [lines] = useState<TranscriptLine[]>([]);

  return (
    <div className="transcript">
      {lines.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center' }}>暂无对话记录</p>
      ) : (
        lines.map(line => (
          <div key={line.id} className={`line ${line.role}`}>
            <span>{line.role === 'user' ? '👤' : '🤖'}</span>
            <span>{line.text}</span>
          </div>
        ))
      )}
    </div>
  );
}
