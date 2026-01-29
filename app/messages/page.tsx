'use client';

import React from 'react';
import MessagesView from '../../views/MessagesView';
import { useApp } from '../../contexts/AppContext';

export default function MessagesPage() {
  const { currentUser } = useApp();
  return <MessagesView currentUser={currentUser} />;
}
