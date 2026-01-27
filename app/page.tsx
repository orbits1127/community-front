'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import FeedView from '../views/FeedView';
import ExploreView from '../views/ExploreView';
import ReelsView from '../views/ReelsView';
import MessagesView from '../views/MessagesView';
import ProfileView from '../views/ProfileView';
import SettingsView from '../views/SettingsView';
import LoginView from '../views/LoginView';
import SearchView from '../views/SearchView';
import NotificationsView from '../views/NotificationsView';
import CommentModal from '../components/CommentModal';
import CreateModal from '../components/CreateModal';
import { Post as PostType, AuthUser } from '../types';
import { authService } from '../services/dataService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [currentTab, setCurrentTab] = useState('home');
  const [selectedPost, setSelectedPost] = useState<PostType | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Set mounted flag to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    if (!isMounted) return;
    
    const checkAuth = async () => {
      try {
        const response = await authService.getCurrentUser();
        if (response.success && response.data) {
          setCurrentUser(response.data);
          setIsLoggedIn(true);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkAuth();
  }, [isMounted]);

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentTab]);

  // Handle login
  const handleLogin = useCallback((user?: AuthUser) => {
    if (user) {
      setCurrentUser(user);
    }
    setIsLoggedIn(true);
  }, []);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setCurrentUser(null);
      setIsLoggedIn(false);
      setCurrentTab('home');
    }
  }, []);

  // Handle tab change
  const handleTabChange = useCallback((tab: string) => {
    if (tab === 'create') {
      setShowCreateModal(true);
    } else {
      setCurrentTab(tab);
    }
  }, []);

  // Prevent hydration mismatch by showing consistent initial render
  if (!isMounted || isAuthLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--ig-primary-background)',
      }}>
        <div style={{ color: 'var(--ig-secondary-text)' }}>Loading...</div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} />;
  }

  // Render main content based on current tab
  const renderContent = () => {
    switch (currentTab) {
      case 'home':
        return (
          <FeedView
            currentUser={currentUser}
            onOpenComments={setSelectedPost}
          />
        );
      case 'search':
        return <SearchView />;
      case 'explore':
        return <ExploreView currentUser={currentUser} />;
      case 'reels':
        return <ReelsView />;
      case 'messages':
        return <MessagesView currentUser={currentUser} />;
      case 'notif':
        return <NotificationsView currentUser={currentUser} />;
      case 'profile':
        return (
          <ProfileView
            userId={currentUser?.id}
            isOwnProfile={true}
            currentUser={currentUser}
          />
        );
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <FeedView
            currentUser={currentUser}
            onOpenComments={setSelectedPost}
          />
        );
    }
  };

  return (
    <div className="l-app">
      <Sidebar currentTab={currentTab} onTabChange={handleTabChange} />
      <main className="l-main">
        {renderContent()}
      </main>
      {selectedPost && (
        <CommentModal 
          post={selectedPost} 
          currentUser={currentUser}
          onClose={() => setSelectedPost(null)} 
        />
      )}
      {showCreateModal && (
        <CreateModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
};

export default App;
