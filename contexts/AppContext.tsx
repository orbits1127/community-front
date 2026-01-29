'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Post as PostType, AuthUser } from '../types';

interface AppContextValue {
  currentUser: AuthUser | null;
  setCurrentUser: (user: AuthUser | null) => void;
  selectedPost: PostType | null;
  setSelectedPost: (post: PostType | null) => void;
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  refreshKey: number;
  setRefreshKey: (fn: (prev: number) => number) => void;
  openCreateModal: () => void;
  handlePostCreated: () => void;
  logout: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

interface AppProviderProps {
  children: ReactNode;
  initialUser?: AuthUser | null;
  onLogout?: () => void;
}

export function AppProvider({ children, initialUser = null, onLogout }: AppProviderProps) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(initialUser);
  const [selectedPost, setSelectedPost] = useState<PostType | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setCurrentUser(initialUser);
  }, [initialUser]);

  const openCreateModal = useCallback(() => setShowCreateModal(true), []);
  const handlePostCreated = useCallback(() => setRefreshKey((prev) => prev + 1), []);
  const logout = useCallback(() => onLogout?.(), [onLogout]);

  const value: AppContextValue = {
    currentUser,
    setCurrentUser,
    selectedPost,
    setSelectedPost,
    showCreateModal,
    setShowCreateModal,
    refreshKey,
    setRefreshKey,
    openCreateModal,
    handlePostCreated,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
