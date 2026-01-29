'use client';

import React from 'react';
import ProfileView from '../../views/ProfileView';
import { useApp } from '../../contexts/AppContext';

export default function ProfilePage() {
  const { currentUser, refreshKey } = useApp();
  return (
    <ProfileView
      key={`profile-${refreshKey}`}
      userId={currentUser?.id}
      isOwnProfile={true}
      currentUser={currentUser}
    />
  );
}
