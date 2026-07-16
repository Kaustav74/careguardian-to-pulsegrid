// ============================================================
// PULSEGRID — TOP NAVBAR
// ============================================================
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useUIStore } from '../store/uiStore';
import { useNotifications } from '../hooks/useNotifications';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import { ROUTES } from '../constants/routes';

const TopNav: React.FC<{ title?: string; breadcrumbs?: { label: string; path?: string }[] }> = ({
  title,
  breadcrumbs,
}) => {
  const { userProfile, logout } = useAuthContext();
  const { theme, toggleTheme, setMobileMenuOpen, isMobileMenuOpen } = useUIStore();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef   = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-gray-950 border-b border-gray-800 flex-shrink-0">
      {/* Left: mobile menu + breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden text-gray-400 hover:text-white"
          onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Open menu"
        >
          
        </button>
        {breadcrumbs ? (
          <nav className="hidden sm:flex items-center gap-1 text-sm">
            {breadcrumbs.map((bc, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-gray-600">/</span>}
                {bc.path ? (
                  <button
                    className="text-gray-400 hover:text-white transition-colors"
                    onClick={() => bc.path && navigate(bc.path)}
                  >
                    {bc.label}
                  </button>
                ) : (
                  <span className="text-white font-medium">{bc.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        ) : (
          title && <h1 className="text-lg font-semibold text-white">{title}</h1>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/8 transition-all"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '' : ''}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            id="notif-btn"
            onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen && unreadCount > 0) markAllRead(); }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/8 transition-all relative"
            aria-label="Notifications"
          >
            
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-50 animate-fade-in overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Notifications</p>
                <Badge variant="info">{unreadCount} new</Badge>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-800">
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500 text-center">No notifications</p>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div key={n.id} className={`p-3 ${!n.isRead ? 'bg-health-blue/5' : ''}`}>
                      <p className="text-sm font-medium text-white">{n.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            id="profile-btn"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/8 transition-all"
            aria-label="User menu"
          >
            <Avatar
              src={userProfile?.photoURL}
              name={userProfile?.displayName}
              size="sm"
            />
            <span className="hidden md:block text-sm font-medium text-gray-300 max-w-24 truncate">
              {userProfile?.displayName}
            </span>
            <span className="text-gray-500 text-xs">▾</span>
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-12 w-52 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-50 animate-fade-in overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800">
                <p className="text-sm font-semibold text-white truncate">{userProfile?.displayName}</p>
                <p className="text-xs text-gray-400 truncate">{userProfile?.email}</p>
              </div>
              <div className="p-2">
                <button
                  onClick={() => { navigate(ROUTES.PROFILE); setProfileOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/8 rounded-xl transition-colors text-left"
                >
                   My Profile
                </button>
                <button
                  onClick={() => { navigate(ROUTES.ADMIN_SETTINGS); setProfileOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/8 rounded-xl transition-colors text-left"
                >
                   Settings
                </button>
                <div className="border-t border-gray-800 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors text-left"
                >
                   Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNav;
