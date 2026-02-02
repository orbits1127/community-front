'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Send, Search } from 'lucide-react';
import { Conversation, Message, AuthUser } from '../types';
import { messageService } from '../services/dataService';

// =============================================================================
// Types
// =============================================================================

interface MessagesViewProps {
  currentUser?: AuthUser | null;
}

// =============================================================================
// Skeleton: conversation list item placeholder
// =============================================================================

const ConversationItemPlaceholder: React.FC = () => (
  <div className="messages-item">
    <div className="messages-item__avatar"></div>
    <div className="messages-item__info">
      <div className="messages-item__username"></div>
      <div className="messages-item__last-msg"></div>
    </div>
  </div>
);

const MessagesView: React.FC<MessagesViewProps> = ({ currentUser }) => {
  // =============================================================================
  // State: conversations list, selected conversation, messages, input text, loading/sending
  // =============================================================================
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // =============================================================================
  // Load conversations (service → store, auto-select first)
  // =============================================================================
  useEffect(() => {
    const loadConversations = async () => {
      if (!currentUser?.id) return;

      setLoading(true);
      try {
        const res = await messageService.getConversations(currentUser.id);
        if (res.success && res.data) {
          setConversations(res.data);
          if (res.data.length > 0 && !selectedConversation) {
            setSelectedConversation(res.data[0]);
          }
        }
      } catch (err) {
        console.error('Error loading conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [currentUser?.id]);

  // =============================================================================
  // Load messages for selected conversation (service → store)
  // =============================================================================
  const fetchMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const res = await messageService.getMessages(conversationId);
      if (res.success && res.data) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Current conversation ID (avoid unnecessary refetch)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedConversation?.id) {
      setCurrentConversationId(selectedConversation.id);
    } else {
      setCurrentConversationId(null);
      setMessages([]);
    }
  }, [selectedConversation?.id]);

  useEffect(() => {
    if (currentConversationId) {
      fetchMessages(currentConversationId);
    }
  }, [currentConversationId, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // =============================================================================
  // Send message: optimistic update → API send → refresh conversations on success
  // =============================================================================
  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || !currentUser?.id || !selectedConversation || sending) return;

    const textToSend = messageText.trim();
    const conversationId = selectedConversation.id;
    const otherParticipant = selectedConversation.participants.find(p => p.id !== currentUser.id);
    
    if (!otherParticipant) return;

    // Clear input immediately for better UX
    setMessageText('');
    setSending(true);

    // Create optimistic message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId: conversationId,
      senderId: currentUser.id,
      sender: {
        id: currentUser.id,
        username: currentUser.username,
        fullName: currentUser.fullName || currentUser.username,
        avatar: currentUser.avatar || '',
      },
      content: textToSend,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    // Add optimistic message immediately
    setMessages(prev => {
      // Avoid duplicates
      if (prev.some(msg => msg.id === optimisticMessage.id)) {
        return prev;
      }
      return [...prev, optimisticMessage];
    });

    try {
      const res = await messageService.sendMessage(
        currentUser.id,
        otherParticipant.id,
        textToSend
      );

      if (!res.success || !res.data) {
        console.error('Failed to send message:', res.error);
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        setMessageText(textToSend);
        alert(res.error || '메시지 전송에 실패했습니다.');
        return;
      }

      const newMessage: Message = res.data;

      // Replace optimistic message with real message
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== optimisticMessage.id);
        if (filtered.some(msg => msg.id === newMessage.id)) return filtered;
        return [...filtered, newMessage];
      });

      // Refresh conversations to update last message
      const convRes = await messageService.getConversations(currentUser.id);
      if (convRes.success && convRes.data) {
        setConversations(convRes.data);
        setSelectedConversation(prev => {
          if (!prev || prev.id !== conversationId) return prev;
          const updatedConv = convRes.data!.find(c => c.id === conversationId);
          if (updatedConv) {
            return { ...prev, lastMessage: updatedConv.lastMessage, updatedAt: updatedConv.updatedAt };
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setMessageText(textToSend);
    } finally {
      setSending(false);
    }
  }, [messageText, currentUser, selectedConversation, sending]);

  // Time format (just now / n mins ago / n hours ago / n days ago / date)
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString();
  };

  const otherParticipant = selectedConversation?.participants.find(p => p.id !== currentUser?.id);

  return (
    <div className="messages-page">
      {/* ---------- Section: left sidebar (conversation list, search button) ---------- */}
      <aside className="messages-sidebar">
        <header className="messages-sidebar__header">
          <div className="messages-sidebar__header-text" style={{ fontSize: '20px', fontWeight: 600 }}>
            {currentUser?.username || 'Messages'}
          </div>
          <button className="messages-input-icon" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <Search size={24} />
          </button>
        </header>
        <div className="messages-sidebar__list">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <ConversationItemPlaceholder key={`loading-${i}`} />
            ))
          ) : conversations.length > 0 ? (
            conversations.map((conv) => {
              const otherUser = conv.participants[0];
              const isSelected = selectedConversation?.id === conv.id;
              
              return (
                <div
                  key={conv.id}
                  className={`messages-item ${isSelected ? 'messages-item--active' : ''}`}
                  onClick={() => setSelectedConversation(conv)}
                  style={{
                    backgroundColor: isSelected ? 'var(--ig-secondary-background)' : 'transparent',
                  }}
                >
                  <img
                    src={otherUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'}
                    alt={otherUser?.username || 'User'}
                    className="messages-item__avatar"
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                  <div className="messages-item__info">
                    <div className="messages-item__username" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ig-primary-text)' }}>
                      {otherUser?.username || 'unknown'}
                    </div>
                    <div className="messages-item__last-msg" style={{ fontSize: '12px', color: 'var(--ig-secondary-text)' }}>
                      {conv.lastMessage?.content || '메시지 없음'}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ig-secondary-text)' }}>
              대화가 없습니다
            </div>
          )}
        </div>
      </aside>

      {/* ---------- Section: right conversation area (header, message list, input) ---------- */}
      <main className="messages-content">
        {selectedConversation && otherParticipant ? (
          <>
            {/* Header: other user info bar */}
            <header className="messages-content__header">
              <img
                src={otherParticipant.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'}
                alt={otherParticipant.username}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
              <div className="messages-content__header-name" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ig-primary-text)' }}>
                {otherParticipant.username}
              </div>
            </header>

            {/* Body: message bubbles (sent/received) */}
            <div className="messages-content__body" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {loadingMessages ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--ig-secondary-text)' }}>
                  메시지 로딩 중...
                </div>
              ) : messages.length > 0 ? (
                <>
                  {messages.map((message, index) => {
                    const isSent = message.senderId === currentUser?.id;
                    
                    return (
                      <div
                        key={message.id || `msg-${index}`}
                        style={{
                          display: 'flex',
                          justifyContent: isSent ? 'flex-end' : 'flex-start',
                          marginBottom: '12px',
                        }}
                      >
                        <div
                          className={`messages-bubble ${isSent ? 'messages-bubble--sent' : 'messages-bubble--received'}`}
                          style={{
                            maxWidth: '60%',
                            padding: '12px 16px',
                            borderRadius: '22px',
                            backgroundColor: isSent ? '#0095f6' : '#efefef',
                            color: isSent ? 'white' : '#000000',
                            fontSize: '14px',
                            lineHeight: '1.4',
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {message.content || ''}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--ig-secondary-text)' }}>
                  메시지가 없습니다
                </div>
              )}
            </div>

            {/* Footer: message input + send button (Enter to send) */}
            <footer className="messages-content__footer">
              <div className="messages-input-bar" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '0 16px',
                height: '44px',
                border: '1px solid var(--ig-separator)',
                borderRadius: '22px',
                backgroundColor: 'var(--ig-primary-background)',
              }}>
                <input
                  type="text"
                  placeholder="메시지 보내기..."
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && messageText.trim() && !sending) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: '22px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--ig-primary-text)',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    lineHeight: '1.4',
                    minWidth: 0,
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sending}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px',
                    background: 'none',
                    border: 'none',
                    cursor: messageText.trim() && !sending ? 'pointer' : 'not-allowed',
                    opacity: messageText.trim() && !sending ? 1 : 0.5,
                    transition: 'opacity 0.2s',
                    visibility: 'visible',
                    minWidth: '44px',
                    minHeight: '44px',
                    flexShrink: 0,
                  }}
                  title={messageText.trim() && !sending ? '전송' : '메시지를 입력하세요'}
                >
                  <Send 
                    size={24} 
                    color={messageText.trim() && !sending ? '#0095f6' : '#737373'} 
                    style={{
                      transition: 'color 0.2s',
                      display: 'block',
                      flexShrink: 0,
                      pointerEvents: 'none',
                      width: '24px',
                      height: '24px',
                    }}
                  />
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ig-secondary-text)' }}>
            대화를 선택하세요
          </div>
        )}
      </main>
    </div>
  );
};

export default MessagesView;
