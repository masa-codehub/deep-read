import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from '../../../types/chat';
import AnswerDisplay from './AnswerDisplay';

type Props = {
  messages: ChatMessage[];
};

const MessageList: React.FC<Props> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-message-list" style={{ overflowY: 'auto', maxHeight: 320 }}>
      {messages.map((msg) => (
        <div key={msg.id} className={`chat-message chat-message-${msg.type}`}>
          {msg.type === 'question' ? (
            <div className="chat-question">{msg.text}</div>
          ) : (
            <AnswerDisplay text={msg.text} sources={msg.sources} />
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
