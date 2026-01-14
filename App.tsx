
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import FeedView from './views/FeedView';
import ExploreView from './views/ExploreView';
import ReelsView from './views/ReelsView';
import MessagesView from './views/MessagesView';
import ProfileView from './views/ProfileView';
import SettingsView from './views/SettingsView';
import LoginView from './views/LoginView';
import SearchView from './views/SearchView';
import NotificationsView from './views/NotificationsView';
import CommentModal from './components/CommentModal';
import { Post as PostType } from './types';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentTab, setCurrentTab] = useState('home');
  const [selectedPost, setSelectedPost] = useState<PostType | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentTab]);

  if (!isLoggedIn) {
    return <LoginView onLogin={() => setIsLoggedIn(true)} />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'home': return <FeedView onOpenComments={setSelectedPost} />;
      case 'search': return <SearchView />;
      case 'explore': return <ExploreView />;
      case 'reels': return <ReelsView />;
      case 'messages': return <MessagesView />;
      case 'notif': return <NotificationsView />;
      case 'profile': return <ProfileView />;
      case 'settings': return <SettingsView />;
      default: return <FeedView onOpenComments={setSelectedPost} />;
    }
  };

  return (
    <div className="l-app">
      <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />
      <main className="l-main">
        {renderContent()}
      </main>
      {selectedPost && (
        <CommentModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
};

export default App;
