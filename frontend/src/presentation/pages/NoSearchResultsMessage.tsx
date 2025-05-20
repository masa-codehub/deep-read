// 検索結果が0件のときのメッセージコンポーネント
import React from 'react';
import './NoSearchResultsMessage.css';

const NoSearchResultsMessage: React.FC = () => (
  <div className="no-search-results-message" data-testid="no-search-results-message">
    検索結果はありませんでした。
  </div>
);

export default NoSearchResultsMessage;
