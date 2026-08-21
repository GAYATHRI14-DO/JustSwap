import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  ArrowRightLeft,
  Plus,
  MessageSquare,
  Repeat,
  Compass,
  User,
  Shield,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Phone
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'explore' | 'my_items' | 'offers' | 'chat' | 'admin' | 'profile';
  setActiveTab: (tab: 'explore' | 'my_items' | 'offers' | 'chat' | 'admin' | 'profile') => void;
  onOpenCreateItem?: () => void;
  onOpenCreateModal?: () => void;
  pendingOffersCount?: number;
  unreadChatsCount?: number;
}

export function Navbar({
  activeTab,
  setActiveTab,
  onOpenCreateItem,
  onOpenCreateModal,
  pendingOffersCount = 0,
  unreadChatsCount = 0
}: NavbarProps) {
  const handleOpenCreate = onOpenCreateModal || onOpenCreateItem || (() => {});
  const { userProfile, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8">
            <button
              id="navbar-logo-btn"
              onClick={() => setActiveTab('explore')}
              className="flex items-center gap-2.5 text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-2xs">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Just<span className="text-blue-600 dark:text-blue-400">Swap</span>
                </span>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                id="nav-tab-explore-btn"
                onClick={() => setActiveTab('explore')}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 transition cursor-pointer ${
                  activeTab === 'explore'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Explore</span>
              </button>

              <button
                id="nav-tab-offers-btn"
                onClick={() => setActiveTab('offers')}
                className={`relative px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 transition cursor-pointer ${
                  activeTab === 'offers'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Offers</span>
                {pendingOffersCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold leading-none">
                    {pendingOffersCount}
                  </span>
                )}
              </button>

              <button
                id="nav-tab-chat-btn"
                onClick={() => setActiveTab('chat')}
                className={`relative px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 transition cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat</span>
                {unreadChatsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                )}
              </button>

              <button
                id="nav-tab-profile-btn"
                onClick={() => setActiveTab('profile')}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 transition cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <User className="w-4 h-4" />
                <span>My Items & Profile</span>
              </button>

              {isAdmin && (
                <button
                  id="nav-tab-admin-btn"
                  onClick={() => setActiveTab('admin')}
                  className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 transition cursor-pointer ${
                    activeTab === 'admin'
                      ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                      : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin</span>
                </button>
              )}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* List Item Button */}
            <button
              id="navbar-list-item-btn"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>List Item</span>
            </button>

            {/* Theme Toggle */}
            <button
              id="navbar-theme-toggle-btn"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} theme`}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                id="navbar-user-dropdown-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <img
                  src={userProfile?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${userProfile?.id}`}
                  alt={userProfile?.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                />
                <span className="hidden lg:inline text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
                  {userProfile?.name || 'User'}
                </span>
              </button>

              {showUserMenu && (
                <div
                  id="navbar-user-dropdown-menu"
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {userProfile?.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {userProfile?.email}
                    </p>
                    {userProfile?.whatsappNumber && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                        <Phone className="w-3 h-3" />
                        <span>{userProfile.whatsappNumber}</span>
                      </p>
                    )}
                    {isAdmin && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-semibold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-800">
                        Admin
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>My Profile & Listings</span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setActiveTab('admin');
                        setShowUserMenu(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center gap-2 cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Admin Panel</span>
                    </button>
                  )}

                  <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1">
                    <button
                      id="navbar-logout-btn"
                      onClick={async () => {
                        setShowUserMenu(false);
                        await logout();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              id="navbar-mobile-menu-btn"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="md:hidden py-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
            <button
              onClick={() => {
                setActiveTab('explore');
                setShowMobileMenu(false);
              }}
              className={`w-full px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
                activeTab === 'explore' ? 'bg-blue-50 dark:bg-blue-950 text-blue-700' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Explore</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('offers');
                setShowMobileMenu(false);
              }}
              className={`w-full px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${
                activeTab === 'offers' ? 'bg-blue-50 dark:bg-blue-950 text-blue-700' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" />
                <span>Offers</span>
              </div>
              {pendingOffersCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                  {pendingOffersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('chat');
                setShowMobileMenu(false);
              }}
              className={`w-full px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
                activeTab === 'chat' ? 'bg-blue-50 dark:bg-blue-950 text-blue-700' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('profile');
                setShowMobileMenu(false);
              }}
              className={`w-full px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
                activeTab === 'profile' ? 'bg-blue-50 dark:bg-blue-950 text-blue-700' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <User className="w-4 h-4" />
              <span>My Profile & Listings</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  setActiveTab('admin');
                  setShowMobileMenu(false);
                }}
                className={`w-full px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 text-purple-600 dark:text-purple-400 ${
                  activeTab === 'admin' ? 'bg-purple-50 dark:bg-purple-950/50' : ''
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin Panel</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

