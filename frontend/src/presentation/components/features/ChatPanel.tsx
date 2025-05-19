import React from 'react';
import { useChat } from '../../hooks/useChat';
import MessageList from './MessageList';
import QuestionInput from './QuestionInput';

interface ChatPanelProps {
  documentId: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ documentId }) => {
  const { messages, isLoading, error, submitQuestion } = useChat(documentId);

  return (
    <div className="chat-panel" style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, width: 400, background: '#fff', display: 'flex', flexDirection: 'column', height: 480 }}>
      <h3 style={{ margin: 0, marginBottom: 8 }}>ドキュメントQ&amp;A</h3>
      <div style={{ flex: 1, minHeight: 0, marginBottom: 8 }}>
        <MessageList messages={messages} />
      </div>
      {error && <div className="chat-error" style={{ color: 'red', marginBottom: 4 }}>{error}</div>}
      {isLoading && <div className="chat-loading" style={{ marginBottom: 4 }}>回答を生成中...</div>}
      <QuestionInput onSubmit={submitQuestion} disabled={isLoading} />
    </div>
  );
};

export default ChatPanel;
