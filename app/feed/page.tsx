'use client';

import React from 'react';
import FeedView from '../../views/FeedView';
import { useApp } from '../../contexts/AppContext';

export default function FeedPage() {
  const { currentUser, setSelectedPost, refreshKey } = useApp();
  return (
    <FeedView
      key={`feed-${refreshKey}`}
      currentUser={currentUser}
      onOpenComments={setSelectedPost}
      refreshKey={refreshKey}
    />
  );
}
