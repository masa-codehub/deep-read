import React, { useState, KeyboardEvent } from 'react';

type Props = {
  onSubmit: (question: string) => void;
  disabled?: boolean;
};

const QuestionInput: React.FC<Props> = ({ onSubmit, disabled }) => {
  const [value, setValue] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  const handleSend = () => {
    if (value.trim()) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-question-input">
      <textarea
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="質問を入力..."
        rows={2}
        disabled={disabled}
        aria-label="質問入力"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        aria-label="送信"
      >
        送信
      </button>
    </div>
  );
};

export default QuestionInput;
