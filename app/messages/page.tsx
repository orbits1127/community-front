'use client';

import React from 'react';
import MessagesView from '../../views/MessagesView';
import { useApp } from '../../contexts/AppContext';
import { useSearchParams } from 'next/navigation';

export default function MessagesPage() {
  const { currentUser } = useApp();
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get('userId') ?? undefined;
  const initialUsername = searchParams.get('username') ?? undefined;
  return (
    <MessagesView
      currentUser={currentUser}
      initialUserId={initialUserId || undefined}
      initialUsername={initialUsername || undefined}
    />
  );
}
