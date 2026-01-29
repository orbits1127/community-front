'use client';

import React from 'react';
import SearchView from '../../views/SearchView';
import { useApp } from '../../contexts/AppContext';

export default function SearchPage() {
  const { currentUser, setSelectedPost } = useApp();
  return <SearchView currentUser={currentUser} onOpenComments={setSelectedPost} />;
}
