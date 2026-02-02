'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  LogOut,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const navItems = [
  { id: 'home', label: 'Home', icon: Home, href: '/feed' },
  { id: 'search', label: 'Search', icon: Search, href: '/search' },
  { id: 'explore', label: 'Explore', icon: Compass, href: '/explore' },
  { id: 'reels', label: 'Reels', icon: Film, href: '/reels' },
  { id: 'messages', label: 'Messages', icon: MessageCircle, href: '/messages' },
  { id: 'notif', label: 'Notifications', icon: Heart, href: '/notifications' },
  { id: 'create', label: 'Create', icon: PlusSquare, href: null },
  { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
];

const THEME_STORAGE_KEY = 'app-theme';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { openCreateModal, logout } = useApp();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(THEME_STORAGE_KEY) : null;
    const dark = stored === 'dark';
    setIsDarkMode(dark);
    if (typeof document !== 'undefined') {
      if (dark) document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.removeAttribute('data-theme');
    }
  }, []);

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.id === 'home') return pathname === '/feed' || pathname === '/';
    if (item.id === 'profile') return pathname.startsWith('/profile');
    return pathname === item.href;
  };

  const moreMenuItems = [
    { id: 'settings', label: 'Settings', icon: <Settings size={18} />, href: '/settings' },
    { id: 'activity', label: 'Your activity', icon: <Activity size={18} />, href: null },
    { id: 'saved', label: 'Saved', icon: <Bookmark size={18} />, href: '/profile?tab=saved' },
    { id: 'appearance', label: 'Switch appearance', icon: isDarkMode ? <Moon size={18} /> : <Sun size={18} />, hasToggle: true, href: null },
    { id: 'report', label: 'Report a problem', icon: <AlertCircle size={18} />, href: null },
    { id: 'separator1', type: 'separator' as const, icon: null, href: null },
    { id: 'switch', label: 'Switch accounts', icon: <RefreshCw size={18} />, href: null },
    { id: 'separator2', type: 'separator' as const, icon: null, href: null },
    { id: 'logout', label: 'Log out', icon: <LogOut size={18} />, href: null },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreMenu]);

  const handleMoreMenuClick = (itemId: string, href: string | null) => {
    if (itemId === 'appearance') {
      const next = !isDarkMode;
      setIsDarkMode(next);
      if (typeof document !== 'undefined') {
        if (next) {
          document.documentElement.setAttribute('data-theme', 'dark');
          localStorage.setItem(THEME_STORAGE_KEY, 'dark');
        } else {
          document.documentElement.removeAttribute('data-theme');
          localStorage.setItem(THEME_STORAGE_KEY, 'light');
        }
      }
      setShowMoreMenu(false);
      return;
    }
    if (itemId === 'logout') {
      logout();
      setShowMoreMenu(false);
      return;
    }
    if (href) {
      router.push(href);
    }
    setShowMoreMenu(false);
  };

  return (
    <nav className="sidebar">
      <div className="sidebar__logo-area">
        <Link href="/feed" className="sidebar__logo-link">
          <Instagram className="sidebar__logo-icon" size={24} />
          <span className="sidebar__logo-text">Instagram</span>
        </Link>
      </div>

      <div className="sidebar__nav">
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          if (item.id === 'create') {
            return (
              <div
                key={item.id}
                className="sidebar__item sidebar__item--create"
                onClick={openCreateModal}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && openCreateModal()}
              >
                <div className="sidebar__icon-wrapper">
                  <Icon size={24} strokeWidth={2} fill="none" />
                </div>
                <span className="sidebar__label">{item.label}</span>
              </div>
            );
          }
          return (
            <Link key={item.id} href={item.href!} className={`sidebar__item ${active ? 'sidebar__item--active' : ''}`}>
              <div className="sidebar__icon-wrapper">
                <Icon
                  size={24}
                  strokeWidth={active ? 2.5 : 2}
                  fill={active && !['search', 'notif'].includes(item.id) ? 'currentColor' : 'none'}
                />
              </div>
              <span className="sidebar__label">{item.label}</span>
            </Link>
          );
        })}
      </div>

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
                  onClick={() => handleMoreMenuClick(item.id, item.href)}
                >
                  <div className="more-menu__icon">{item.icon}</div>
                  <span className="more-menu__label">{item.label}</span>
                  {'hasToggle' in item && item.hasToggle && (
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
}
