
import React from 'react';

const ConversationItemPlaceholder: React.FC = () => (
  <div className="messages-item">
    {/* 원형 프로필 placeholder */}
    <div className="messages-item__avatar"></div>
    <div className="messages-item__info">
      {/* 사용자명 placeholder */}
      <div className="messages-item__username"></div>
      {/* 마지막 메시지 placeholder */}
      <div className="messages-item__last-msg"></div>
    </div>
  </div>
);

const MessageBubblePlaceholder: React.FC<{ sent?: boolean; width?: string }> = ({ sent, width = '60%' }) => (
  <div className={`messages-bubble ${sent ? 'messages-bubble--sent' : 'messages-bubble--received'}`} style={{ width }}>
    <div className="messages-bubble__text-placeholder"></div>
  </div>
);

const MessagesView: React.FC = () => {
  return (
    <div className="messages-page">
      {/* 1. 좌측 (대화 리스트) */}
      <aside className="messages-sidebar">
        <header className="messages-sidebar__header">
          <div className="messages-sidebar__header-text"></div>
          <div className="messages-input-icon" style={{ width: '24px', height: '24px' }}></div>
        </header>
        <div className="messages-sidebar__list">
          {Array.from({ length: 12 }).map((_, i) => (
            <ConversationItemPlaceholder key={`conv-${i}`} />
          ))}
        </div>
      </aside>

      {/* 2. 우측 (대화 영역) */}
      <main className="messages-content">
        {/* 상단: 사용자 정보 바 */}
        <header className="messages-content__header">
          <div className="messages-content__header-avatar"></div>
          <div className="messages-content__header-name"></div>
        </header>

        {/* 중앙: 메시지 bubble placeholder */}
        <div className="messages-content__body">
          <MessageBubblePlaceholder width="40%" />
          <MessageBubblePlaceholder sent width="50%" />
          <MessageBubblePlaceholder width="30%" />
          <MessageBubblePlaceholder sent width="70%" />
          <MessageBubblePlaceholder width="60%" />
          <MessageBubblePlaceholder sent width="45%" />
          <MessageBubblePlaceholder width="55%" />
          <MessageBubblePlaceholder sent width="20%" />
          <MessageBubblePlaceholder width="65%" />
          <MessageBubblePlaceholder sent width="35%" />
        </div>

        {/* 하단: 메시지 입력창 */}
        <footer className="messages-content__footer">
          <div className="messages-input-bar">
            <div className="messages-input-icon"></div>
            <div className="messages-input-placeholder"></div>
            <div className="messages-input-icon"></div>
            <div className="messages-input-icon"></div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default MessagesView;
