'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import LoginView from '../views/LoginView';
import CommentModal from './CommentModal';
import CreateModal from './CreateModal';
import { AppProvider, useApp } from '../contexts/AppContext';
import { AuthUser } from '../types';
import { authService } from '../services/dataService';

function AppShellContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const {
    currentUser,
    setCurrentUser,
    selectedPost,
    setSelectedPost,
    showCreateModal,
    setShowCreateModal,
    handlePostCreated,
  } = useApp();

  return (
    <div className="l-app">
      <Sidebar />
      <main className="l-main">{children}</main>
      {selectedPost && (
        <CommentModal
          post={selectedPost}
          currentUser={currentUser}
          onClose={() => setSelectedPost(null)}
          onPostDeleted={() => setSelectedPost(null)}
        />
      )}
      {showCreateModal && (
        <CreateModal
          onClose={() => setShowCreateModal(false)}
          currentUser={currentUser}
          onPostCreated={handlePostCreated}
        />
      )}
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  const handleLogin = useCallback((user?: AuthUser) => {
    if (user) setCurrentUser(user);
    setIsLoggedIn(true);
    // Redirect to feed after login
    setTimeout(() => window.location.assign('/feed'), 0);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setCurrentUser(null);
      setIsLoggedIn(false);
      router.push('/');
    }
  }, [router]);

  if (!isMounted || isAuthLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--ig-primary-background)',
        }}
      >
        <div style={{ color: 'var(--ig-secondary-text)' }}>Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <AppProvider initialUser={currentUser} onLogout={handleLogout}>
      <AppShellContent>{children}</AppShellContent>
    </AppProvider>
  );
}
