'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Send, Search } from 'lucide-react';
import { Conversation, Message, AuthUser } from '../types';
import { messageService } from '../services/dataService';

// =============================================================================
// 타입 정의
// =============================================================================

interface MessagesViewProps {
  currentUser?: AuthUser | null;
}

// =============================================================================
// 스켈레톤: 대화 목록 아이템 플레이스홀더
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
  // 상태: 대화 목록, 선택 대화, 메시지 목록, 입력 텍스트, 로딩/전송 중
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
  // 대화 목록 로드 (API → 포맷팅 후 저장, 첫 대화 자동 선택)
  // =============================================================================
  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUser?.id) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/messages?userId=${currentUser.id}`);
        const data = await response.json();
        
        if (data.success && data.data) {
          // Transform API response to Conversation type
          const formattedConversations: Conversation[] = data.data.map((conv: any) => ({
            id: conv.id,
            participants: conv.participants || [],
            lastMessage: conv.lastMessage ? {
              id: conv.lastMessage.id,
              conversationId: conv.lastMessage.conversationId,
              senderId: conv.lastMessage.senderId,
              sender: conv.lastMessage.sender || conv.participants[0],
              content: conv.lastMessage.content,
              isRead: conv.lastMessage.isRead || false,
              createdAt: conv.lastMessage.createdAt,
            } : undefined,
            unreadCount: 0, // TODO: Calculate unread count
            updatedAt: conv.updatedAt,
          }));
          
          setConversations(formattedConversations);
          
          // Auto-select first conversation
          if (formattedConversations.length > 0 && !selectedConversation) {
            setSelectedConversation(formattedConversations[0]);
          }
        }
      } catch (err) {
        console.error('Error loading conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [currentUser?.id]);

  // =============================================================================
  // 선택 대화의 메시지 로드 (API → 포맷팅 후 저장)
  // =============================================================================
  const fetchMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const response = await fetch(`/api/messages/${conversationId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        // Transform API response to Message type
        const formattedMessages: Message[] = data.data.map((msg: any) => ({
          id: msg.id,
          conversationId: msg.conversationId,
          senderId: msg.senderId,
          sender: msg.sender || { id: msg.senderId, username: 'unknown', avatar: '', fullName: 'Unknown' },
          content: msg.content,
          isRead: msg.isRead || false,
          createdAt: msg.createdAt,
        }));
        
        setMessages(formattedMessages);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // 선택된 대화 ID (불필요한 재요청 방지)
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

  // 메시지 변경 시 하단으로 스크롤
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // =============================================================================
  // 메시지 전송: 낙관적 업데이트 → API 전송 → 성공 시 대화 목록 갱신
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
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: otherParticipant.id,
          content: textToSend,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to send message:', errorData);
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        setMessageText(textToSend); // Restore text
        alert(errorData.error || '메시지 전송에 실패했습니다.');
        return;
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        // Transform the new message from server
        const newMessage: Message = {
          id: data.data.id,
          conversationId: data.data.conversationId || conversationId,
          senderId: data.data.senderId,
          sender: data.data.sender || {
            id: currentUser.id,
            username: currentUser.username,
            fullName: currentUser.fullName || currentUser.username,
            avatar: currentUser.avatar || '',
          },
          content: data.data.content,
          isRead: data.data.isRead || false,
          createdAt: data.data.createdAt || new Date().toISOString(),
        };
        
        // Replace optimistic message with real message
        setMessages(prev => {
          // Remove optimistic message
          const filtered = prev.filter(msg => msg.id !== optimisticMessage.id);
          // Check if message already exists (avoid duplicates)
          const exists = filtered.some(msg => msg.id === newMessage.id);
          if (exists) {
            return filtered;
          }
          // Add new message
          const updated = [...filtered, newMessage];
          return updated;
        });
        
        // Refresh conversations to update last message (without triggering message refetch)
        fetch(`/api/messages?userId=${currentUser.id}`)
          .then(res => res.json())
          .then(convData => {
            if (convData.success && convData.data) {
              const formattedConversations: Conversation[] = convData.data.map((conv: any) => ({
                id: conv.id,
                participants: conv.participants || [],
                lastMessage: conv.lastMessage ? {
                  id: conv.lastMessage.id,
                  conversationId: conv.lastMessage.conversationId,
                  senderId: conv.lastMessage.senderId,
                  sender: conv.lastMessage.sender || conv.participants[0],
                  content: conv.lastMessage.content,
                  isRead: conv.lastMessage.isRead || false,
                  createdAt: conv.lastMessage.createdAt,
                } : undefined,
                unreadCount: 0,
                updatedAt: conv.updatedAt,
              }));
              setConversations(formattedConversations);
              
              // Update selected conversation's last message without changing the conversation object
              // This prevents the useEffect from re-fetching messages
              setSelectedConversation(prev => {
                if (!prev || prev.id !== conversationId) return prev;
                const updatedConv = formattedConversations.find(c => c.id === conversationId);
                if (updatedConv) {
                  return {
                    ...prev,
                    lastMessage: updatedConv.lastMessage,
                    updatedAt: updatedConv.updatedAt,
                  };
                }
                return prev;
              });
            }
          })
          .catch(err => {
            console.error('Error refreshing conversations:', err);
          });
      } else {
        console.error('Failed to send message:', data.error);
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        setMessageText(textToSend); // Restore text
        alert(data.error || '메시지 전송에 실패했습니다.');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setMessageText(textToSend); // Restore text
    } finally {
      setSending(false);
    }
  }, [messageText, currentUser, selectedConversation, sending]);

  // 시간 포맷 (방금 / n분 전 / n시간 전 / n일 전 / 날짜)
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
      {/* ---------- 구역: 좌측 사이드바 (대화 리스트, 검색 버튼) ---------- */}
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

      {/* ---------- 구역: 우측 대화 영역 (헤더, 메시지 목록, 입력창) ---------- */}
      <main className="messages-content">
        {selectedConversation && otherParticipant ? (
          <>
            {/* 상단: 상대 사용자 정보 바 */}
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

            {/* 중앙: 메시지 버블 (보낸/받은 구분) */}
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

            {/* 하단: 메시지 입력창 + 전송 버튼 (Enter 전송) */}
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
