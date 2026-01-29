'use client';

import React from 'react';
import ExploreView from '../../views/ExploreView';
import { useApp } from '../../contexts/AppContext';

export default function ExplorePage() {
  const { currentUser } = useApp();
  return <ExploreView currentUser={currentUser} />;
}
