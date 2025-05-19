import React from 'react';
import type { SourceReference } from '../../../types/chat';

type Props = {
  text: string;
  sources?: SourceReference[];
};

const AnswerDisplay: React.FC<Props> = ({ text, sources }) => {
  return (
    <div className="chat-answer-display">
      <div className="answer-text">{text}</div>
      {sources && sources.length > 0 && (
        <ul className="answer-sources">
          {sources.map((src, idx) => (
            <li key={idx}>
              出典: {src.documentId}
              {src.pageNumber && ` (p.${src.pageNumber})`}
              {src.qaId && ` / Q&A #${src.qaId}`}
              {src.snippet && <span> - {src.snippet}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AnswerDisplay;
