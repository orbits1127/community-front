'use client';

import React from 'react';
import NotificationsView from '../../views/NotificationsView';
import { useApp } from '../../contexts/AppContext';

export default function NotificationsPage() {
  const { currentUser } = useApp();
  return <NotificationsView currentUser={currentUser} />;
}
