'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Home, 
  Search, 
  Compass, 
  Film, 
  MessageCircle, 
  Heart, 
  PlusSquare, 
  Menu,
  Instagram,
  User,
  Settings,
  Activity,
  Bookmark,
  Sun,
  Moon,
  AlertCircle,
  RefreshCw,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: 'home', label: 'Home', icon: <Home size={24} /> },
    { id: 'search', label: 'Search', icon: <Search size={24} /> },
    { id: 'explore', label: 'Explore', icon: <Compass size={24} /> },
    { id: 'reels', label: 'Reels', icon: <Film size={24} /> },
    { id: 'messages', label: 'Messages', icon: <MessageCircle size={24} /> },
    { id: 'notif', label: 'Notifications', icon: <Heart size={24} /> },
    { id: 'create', label: 'Create', icon: <PlusSquare size={24} /> },
    { id: 'profile', label: 'Profile', icon: <User size={24} /> },
  ];

  const moreMenuItems = [
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
    { id: 'activity', label: 'Your activity', icon: <Activity size={18} /> },
    { id: 'saved', label: 'Saved', icon: <Bookmark size={18} /> },
    { id: 'appearance', label: 'Switch appearance', icon: isDarkMode ? <Moon size={18} /> : <Sun size={18} />, hasToggle: true },
    { id: 'report', label: 'Report a problem', icon: <AlertCircle size={18} /> },
    { id: 'separator1', type: 'separator' },
    { id: 'switch', label: 'Switch accounts', icon: <RefreshCw size={18} /> },
    { id: 'separator2', type: 'separator' },
    { id: 'logout', label: 'Log out', icon: <LogOut size={18} /> },
  ];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };

    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreMenu]);

  const handleMoreMenuClick = (itemId: string) => {
    if (itemId === 'appearance') {
      setIsDarkMode(!isDarkMode);
      return;
    }
    if (itemId === 'settings') {
      onTabChange('settings');
      setShowMoreMenu(false);
      return;
    }
    if (itemId === 'saved') {
      onTabChange('profile');
      setShowMoreMenu(false);
      return;
    }
    if (itemId === 'logout') {
      // Handle logout - reload the page to go back to login
      window.location.reload();
      return;
    }
    setShowMoreMenu(false);
  };

  return (
    <nav className="sidebar">
      {/* Logo Section */}
      <div className="sidebar__logo-area" onClick={() => onTabChange('home')}>
        <Instagram className="sidebar__logo-icon" size={24} />
        <span className="sidebar__logo-text">Instagram</span>
      </div>

      {/* Navigation Items */}
      <div className="sidebar__nav">
        {navItems.map((item) => (
          <div 
            key={item.id}
            className={`sidebar__item ${currentTab === item.id ? 'sidebar__item--active' : ''}`}
            onClick={() => onTabChange(item.id)}
          >
            <div className="sidebar__icon-wrapper">
              {React.cloneElement(item.icon as React.ReactElement, {
                strokeWidth: currentTab === item.id ? 2.5 : 2,
                fill: currentTab === item.id && !['search', 'create', 'notif'].includes(item.id) ? 'currentColor' : 'none'
              })}
            </div>
            <span className="sidebar__label">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Bottom More Menu */}
      <div className="sidebar__more" ref={moreMenuRef}>
        <div 
          className={`sidebar__item ${showMoreMenu ? 'sidebar__item--active' : ''}`}
          onClick={() => setShowMoreMenu(!showMoreMenu)}
        >
          <div className="sidebar__icon-wrapper">
            <Menu size={24} />
          </div>
          <span className="sidebar__label">More</span>
        </div>

        {/* More Menu Popup */}
        {showMoreMenu && (
          <div className="more-menu">
            {moreMenuItems.map((item) => {
              if (item.type === 'separator') {
                return <div key={item.id} className="more-menu__separator" />;
              }
              return (
                <div 
                  key={item.id}
                  className="more-menu__item"
                  onClick={() => handleMoreMenuClick(item.id)}
                >
                  <div className="more-menu__icon">{item.icon}</div>
                  <span className="more-menu__label">{item.label}</span>
                  {item.hasToggle && (
                    <div className={`more-menu__toggle ${isDarkMode ? 'more-menu__toggle--active' : ''}`}>
                      <div className="more-menu__toggle-circle" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Sidebar;
