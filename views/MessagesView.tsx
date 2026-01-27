'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Send, Search } from 'lucide-react';
import { Conversation, Message, AuthUser } from '../types';
import { messageService } from '../services/dataService';

interface MessagesViewProps {
  currentUser?: AuthUser | null;
}

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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Fetch conversations
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

  // Fetch messages for selected conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation?.id) return;
      
      setLoadingMessages(true);
      try {
        const response = await fetch(`/api/messages/${selectedConversation.id}`);
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
    };

    fetchMessages();
  }, [selectedConversation?.id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Send message
  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || !currentUser?.id || !selectedConversation || sending) return;

    setSending(true);
    try {
      const otherParticipant = selectedConversation.participants.find(p => p.id !== currentUser.id);
      if (!otherParticipant) return;

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: otherParticipant.id,
          content: messageText.trim(),
        }),
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        // Add new message to list
        const newMessage: Message = {
          id: data.data.id,
          conversationId: data.data.conversationId,
          senderId: data.data.senderId,
          sender: data.data.sender || currentUser,
          content: data.data.content,
          isRead: data.data.isRead || false,
          createdAt: data.data.createdAt,
        };
        
        setMessages(prev => [...prev, newMessage]);
        setMessageText('');
        
        // Update selected conversation's last message
        if (selectedConversation) {
          setSelectedConversation({
            ...selectedConversation,
            lastMessage: newMessage,
            updatedAt: new Date().toISOString(),
          });
        }
        
        // Refresh conversations to update last message
        const convResponse = await fetch(`/api/messages?userId=${currentUser.id}`);
        const convData = await convResponse.json();
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
          
          // Update selected conversation if it's in the list
          const updatedSelected = formattedConversations.find(c => c.id === selectedConversation?.id);
          if (updatedSelected) {
            setSelectedConversation(updatedSelected);
          }
        }
      } else {
        console.error('Failed to send message:', data.error);
        alert(data.error || '메시지 전송에 실패했습니다.');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  }, [messageText, currentUser, selectedConversation, sending]);

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
      {/* 1. 좌측 (대화 리스트) */}
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

      {/* 2. 우측 (대화 영역) */}
      <main className="messages-content">
        {selectedConversation && otherParticipant ? (
          <>
            {/* 상단: 사용자 정보 바 */}
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

            {/* 중앙: 메시지 bubble */}
            <div className="messages-content__body" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {loadingMessages ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--ig-secondary-text)' }}>
                  메시지 로딩 중...
                </div>
              ) : messages.length > 0 ? (
                <>
                  {messages.map((message) => {
                    const isSent = message.senderId === currentUser?.id;
                    
                    return (
                      <div
                        key={message.id}
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
                            backgroundColor: isSent ? 'var(--ig-primary-button)' : 'var(--ig-secondary-background)',
                            color: isSent ? 'white' : 'var(--ig-primary-text)',
                            fontSize: '14px',
                            lineHeight: '1.4',
                            wordBreak: 'break-word',
                          }}
                        >
                          {message.content}
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

            {/* 하단: 메시지 입력창 */}
            <footer className="messages-content__footer">
              <div className="messages-input-bar" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px' }}>
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
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: '22px',
                    border: '1px solid var(--ig-separator)',
                    backgroundColor: 'var(--ig-primary-background)',
                    color: 'var(--ig-primary-text)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sending}
                  style={{
                    padding: '10px',
                    background: 'none',
                    border: 'none',
                    cursor: messageText.trim() && !sending ? 'pointer' : 'not-allowed',
                    opacity: messageText.trim() && !sending ? 1 : 0.5,
                    transition: 'opacity 0.2s',
                  }}
                  title={messageText.trim() && !sending ? '전송' : '메시지를 입력하세요'}
                >
                  <Send 
                    size={24} 
                    color={messageText.trim() && !sending ? 'var(--ig-primary-button)' : 'var(--ig-secondary-text)'} 
                    style={{
                      transition: 'color 0.2s',
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
