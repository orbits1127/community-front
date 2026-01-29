'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import ProfileView from '../../../views/ProfileView';
import { useApp } from '../../../contexts/AppContext';

export default function ProfileByIdPage() {
  const params = useParams();
  const id = params.id as string;
  const { currentUser } = useApp();
  const isOwnProfile = currentUser?.id === id;
  return (
    <ProfileView
      userId={id}
      isOwnProfile={isOwnProfile}
      currentUser={currentUser}
    />
  );
}
