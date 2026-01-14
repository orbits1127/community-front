
import React from 'react';
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
  User
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
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
      <div className="sidebar__more">
        <div 
          className={`sidebar__item ${currentTab === 'settings' ? 'sidebar__item--active' : ''}`}
          onClick={() => onTabChange('settings')}
        >
          <div className="sidebar__icon-wrapper">
            <Menu size={24} />
          </div>
          <span className="sidebar__label">More</span>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
