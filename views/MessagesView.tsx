'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Send, Search } from 'lucide-react';
import { Conversation, Message, AuthUser, User } from '../types';
import { messageService } from '../services/dataService';

// =============================================================================
// Types
// =============================================================================

interface MessagesViewProps {
  currentUser?: AuthUser | null;
  initialUserId?: string;
  initialUsername?: string;
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

const MessagesView: React.FC<MessagesViewProps> = ({ currentUser, initialUserId, initialUsername }) => {
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
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const didInitialSelectRef = React.useRef(false);
  const scrollToBottomRef = React.useRef(false);

  // =============================================================================
  // Load conversations (service → store, auto-select first or initialUserId target)
  // =============================================================================
  useEffect(() => {
    const loadConversations = async () => {
      if (!currentUser?.id) return;

      setLoading(true);
      setConversationsError(null);
      try {
        const res = await messageService.getConversations(currentUser.id);
        if (res.success && res.data) {
          setConversations(res.data);
          if (!didInitialSelectRef.current) {
            didInitialSelectRef.current = true;
            if (initialUserId) {
              const existing = res.data.find((c) =>
                c.participants.some((p) => p.id === initialUserId)
              );
              if (existing) {
                setSelectedConversation(existing);
              } else {
                const syntheticUser: User = {
                  id: initialUserId,
                  username: initialUsername ?? '',
                  fullName: initialUsername ?? '',
                  avatar: null,
                };
                setSelectedConversation({
                  id: 'new',
                  participants: [syntheticUser],
                  unreadCount: 0,
                  updatedAt: new Date().toISOString(),
                });
              }
            } else if (res.data.length > 0) {
              setSelectedConversation(res.data[0]);
            }
          }
        } else {
          setConversationsError(res.error || '대화 목록을 불러오지 못했습니다.');
        }
      } catch (err) {
        console.error('Error loading conversations:', err);
        setConversationsError(err instanceof Error ? err.message : '대화 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [currentUser?.id, initialUserId, initialUsername]);

  // =============================================================================
  // Load messages for selected conversation (single effect, no derived state)
  // =============================================================================
  const fetchMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    setMessagesError(null);
    try {
      const res = await messageService.getMessages(conversationId);
      if (res.success && res.data) {
        setMessages(res.data);
      } else {
        setMessagesError(res.error || '메시지를 불러오지 못했습니다.');
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      setMessagesError(err instanceof Error ? err.message : '메시지를 불러오지 못했습니다.');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (selectedConversation?.id && selectedConversation.id !== 'new') {
      fetchMessages(selectedConversation.id);
    } else {
      setMessages([]);
      setMessagesError(null);
    }
  }, [selectedConversation?.id, fetchMessages]);

  // Scroll to bottom only when we intentionally sent a message or added new one (not on initial load)
  useEffect(() => {
    if (scrollToBottomRef.current && messagesEndRef.current) {
      scrollToBottomRef.current = false;
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

    setSendError(null);
    setMessageText('');
    setSending(true);

    const isNewConversation = conversationId === 'new';
    const optimisticId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      conversationId: isNewConversation ? '' : conversationId,
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

    if (!isNewConversation) {
      setMessages(prev => {
        if (prev.some(msg => msg.id === optimisticMessage.id)) return prev;
        return [...prev, optimisticMessage];
      });
    }
    scrollToBottomRef.current = true;

    try {
      const res = await messageService.sendMessage(
        currentUser.id,
        otherParticipant.id,
        textToSend
      );

      if (!res.success || !res.data) {
        console.error('Failed to send message:', res.error);
        if (!isNewConversation) {
          setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        }
        setMessageText(textToSend);
        setSendError(res.error || '메시지 전송에 실패했습니다.');
        return;
      }

      const newMessage: Message = res.data;

      if (isNewConversation) {
        setMessages([newMessage]);
        const convRes = await messageService.getConversations(currentUser.id);
        if (convRes.success && convRes.data) {
          setConversations(convRes.data);
          const newConv = convRes.data.find(c => c.id === newMessage.conversationId);
          if (newConv) setSelectedConversation(newConv);
        }
      } else {
        setMessages(prev => {
          const filtered = prev.filter(msg => msg.id !== optimisticMessage.id);
          if (filtered.some(msg => msg.id === newMessage.id)) return filtered;
          return [...filtered, newMessage];
        });
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
      }
    } catch (err) {
      console.error('Error sending message:', err);
      if (!isNewConversation) {
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      }
      setMessageText(textToSend);
      setSendError(err instanceof Error ? err.message : '메시지 전송에 실패했습니다.');
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
          <button
            type="button"
            className="messages-input-icon"
            onClick={() => setSearchOpen(prev => !prev)}
            aria-label={searchOpen ? '검색 닫기' : '검색'}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <Search size={24} />
          </button>
        </header>
        {searchOpen && (
          <div className="messages-sidebar__search" style={{ padding: '8px 12px', borderBottom: '1px solid var(--ig-separator)' }}>
            <input
              type="text"
              placeholder="사용자 검색..."
              className="messages-input-bar"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--ig-separator)', backgroundColor: 'var(--ig-primary-background)', color: 'var(--ig-primary-text)', fontSize: '14px', outline: 'none' }}
              aria-label="대화 상대 검색"
            />
          </div>
        )}
        <div className="messages-sidebar__list">
          {conversationsError ? (
            <div className="messages-error" style={{ padding: '20px', textAlign: 'center', color: 'var(--ig-secondary-text)' }}>
              <p style={{ marginBottom: '12px' }}>{conversationsError}</p>
              <button
                type="button"
                onClick={() => {
                  setConversationsError(null);
                  if (currentUser?.id) {
                    setLoading(true);
                    messageService.getConversations(currentUser.id).then(res => {
                      if (res.success && res.data) {
                        setConversations(res.data);
                        if (res.data.length > 0 && !didInitialSelectRef.current) {
                          didInitialSelectRef.current = true;
                          setSelectedConversation(res.data[0]);
                        }
                      } else {
                        setConversationsError(res.error || '대화 목록을 불러오지 못했습니다.');
                      }
                      setLoading(false);
                    }).catch(err => {
                      setConversationsError(err instanceof Error ? err.message : '대화 목록을 불러오지 못했습니다.');
                      setLoading(false);
                    });
                  }
                }}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--ig-separator)', backgroundColor: 'var(--ig-secondary-background)', color: 'var(--ig-primary-text)', cursor: 'pointer', fontSize: '14px' }}
              >
                다시 시도
              </button>
            </div>
          ) : loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <ConversationItemPlaceholder key={`loading-${i}`} />
            ))
          ) : conversations.length > 0 ? (
            conversations.map((conv) => {
              const otherUser = conv.participants.find(p => p.id !== currentUser?.id);
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
            <div className="messages-content__body">
              {messagesError ? (
                <div className="messages-error" style={{ padding: '20px', textAlign: 'center', color: 'var(--ig-secondary-text)' }}>
                  <p style={{ marginBottom: '12px' }}>{messagesError}</p>
                  <button
                    type="button"
                    onClick={() => selectedConversation?.id && selectedConversation.id !== 'new' && fetchMessages(selectedConversation.id)}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--ig-separator)', backgroundColor: 'var(--ig-secondary-background)', color: 'var(--ig-primary-text)', cursor: 'pointer', fontSize: '14px' }}
                  >
                    다시 시도
                  </button>
                </div>
              ) : loadingMessages ? (
                <div className="messages-loading" style={{ textAlign: 'center', padding: '20px', color: 'var(--ig-secondary-text)' }}>
                  메시지 로딩 중...
                </div>
              ) : messages.length > 0 ? (
                <>
                  <div
                    className="messages-list"
                    role="log"
                    aria-live="polite"
                    aria-label="메시지 목록"
                    style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                  >
                    {messages.map((message, index) => {
                      const isSent = message.senderId === currentUser?.id;
                      return (
                        <div
                          key={message.id || `msg-${index}`}
                          className={`messages-row ${isSent ? 'messages-row--sent' : 'messages-row--received'}`}
                        >
                          <div
                            className={`messages-bubble ${isSent ? 'messages-bubble--sent' : 'messages-bubble--received'}`}
                          >
                            {message.content || ''}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="messages-empty" style={{ textAlign: 'center', padding: '20px', color: 'var(--ig-secondary-text)' }}>
                  메시지가 없습니다
                </div>
              )}
            </div>

            {/* Footer: message input + send button (Enter to send) */}
            <footer className="messages-content__footer">
              {sendError && (
                <div className="messages-send-error" style={{ padding: '8px 16px', marginBottom: '8px', borderRadius: '8px', backgroundColor: 'var(--ig-secondary-background)', color: 'var(--ig-primary-text)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span>{sendError}</span>
                  <button
                    type="button"
                    onClick={() => setSendError(null)}
                    aria-label="에러 메시지 닫기"
                    style={{ background: 'none', border: 'none', color: 'var(--ig-secondary-text)', cursor: 'pointer', padding: '4px', fontSize: '12px' }}
                  >
                    닫기
                  </button>
                </div>
              )}
              <div className="messages-input-bar">
                <input
                  type="text"
                  placeholder="메시지 보내기..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && messageText.trim() && !sending) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="messages-input-field"
                  aria-label="메시지 입력"
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sending}
                  className="messages-send-button"
                  aria-label={messageText.trim() && !sending ? '메시지 전송' : '메시지를 입력하세요'}
                  title={messageText.trim() && !sending ? '전송' : '메시지를 입력하세요'}
                >
                  <Send
                    size={24}
                    color={messageText.trim() && !sending ? 'var(--ig-link)' : 'var(--ig-secondary-text)'}
                    style={{ flexShrink: 0, pointerEvents: 'none' }}
                    aria-hidden
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
