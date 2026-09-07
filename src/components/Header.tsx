import React, { useState } from 'react';
import {
  HeartHandshake,
  MapPin,
  Calendar,
  Users,
  Image as ImageIcon,
  Star,
  Phone,
  User,
  ShieldCheck,
  Menu,
  X,
  LogOut,
  Activity,
} from 'lucide-react';
import { Parent } from '../types/index.js';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  parentUser: Parent | null;
  receptionUser: { username: string; branchId: string; name: string } | null;
  onOpenParentLogin: () => void;
  onOpenReceptionLogin: () => void;
  onLogoutParent: () => void;
  onLogoutReception: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  parentUser,
  receptionUser,
  onOpenParentLogin,
  onOpenReceptionLogin,
  onLogoutParent,
  onLogoutReception,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'doctors', label: 'Our Doctors' },
    { id: 'book', label: 'Book Appointment' },
    { id: 'locations', label: 'Locations' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'reviews', label: 'Parents Reviews' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-slate-100 sticky top-0 z-40 shadow-xs">
      {/* Top hospital announcement & branch bar */}
      <div className="bg-gradient-to-r from-teal-800 to-sky-900 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">Trusted Pediatric Care Built on Experience</span>
            <span className="text-teal-200 hidden sm:inline">•</span>
            <span className="text-teal-100 hidden sm:inline">Kakinada &amp; Pithapuram</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-teal-100">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-teal-300" />
              Emergency: <strong className="text-white">+91 944 011 2233</strong>
            </span>
            <span className="hidden md:inline text-teal-200">|</span>
            <span className="hidden md:flex items-center gap-1">
              <MapPin className="w-3 h-3 text-teal-300" />
              Branches: Kakinada &amp; Pithapuram
            </span>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo & Brand Identity */}
          <button
            id="nav-logo-btn"
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 text-left focus:outline-none group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-lg sm:text-xl tracking-tight leading-tight">
                Sri Devi Children Hospital
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-teal-700">
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-3 h-3 text-teal-600" />
                  Kakinada
                </span>
                <span className="text-slate-300">•</span>
                <span>Pithapuram</span>
              </div>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === item.id
                    ? 'text-teal-700 bg-teal-50/80 font-semibold'
                    : 'text-slate-600 hover:text-teal-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Action Portals */}
          <div className="hidden sm:flex items-center space-x-2">
            {/* Parent Section */}
            {parentUser ? (
              <div className="flex items-center gap-2 bg-sky-50 border border-sky-100 px-3 py-1.5 rounded-xl">
                <button
                  id="header-parent-dash-btn"
                  onClick={() => onNavigate('parent-dashboard')}
                  className="text-left"
                >
                  <div className="text-xs font-medium text-sky-700">Parent Portal</div>
                  <div className="text-sm font-semibold text-slate-900">{parentUser.name}</div>
                </button>
                <button
                  id="header-parent-logout-btn"
                  onClick={onLogoutParent}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                  title="Log out parent"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="header-parent-login-btn"
                onClick={onOpenParentLogin}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 hover:bg-teal-100 transition shadow-xs"
              >
                <User className="w-3.5 h-3.5 text-teal-600" />
                <span>Parent Login</span>
              </button>
            )}

            {/* Reception Section */}
            {receptionUser ? (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                <button
                  id="header-reception-dash-btn"
                  onClick={() => onNavigate('reception-dashboard')}
                  className="text-left"
                >
                  <div className="text-[10px] font-semibold tracking-wide uppercase text-amber-800">
                    Reception Desk
                  </div>
                  <div className="text-xs font-bold text-slate-900 capitalize">
                    {receptionUser.branchId} Branch
                  </div>
                </button>
                <button
                  id="header-reception-logout-btn"
                  onClick={onLogoutReception}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                  title="Log out reception"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="header-reception-login-btn"
                onClick={onOpenReceptionLogin}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Reception</span>
              </button>
            )}

            {/* Quick Track button */}
            <button
              id="header-track-btn"
              onClick={() => onNavigate(parentUser ? 'parent-dashboard' : 'track')}
              className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm shadow-teal-600/20 transition"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Track Queue</span>
            </button>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center sm:hidden gap-2">
            <button
              id="mobile-track-btn"
              onClick={() => onNavigate(parentUser ? 'parent-dashboard' : 'track')}
              className="px-2.5 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold"
            >
              Track
            </button>
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-teal-800" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`block w-full text-left px-3 py-2 rounded-lg text-base font-medium ${
                  currentView === item.id
                    ? 'text-teal-700 bg-teal-50 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            {parentUser ? (
              <div className="flex items-center justify-between p-3 bg-sky-50 rounded-xl">
                <div>
                  <div className="text-xs text-sky-700">Logged in Parent</div>
                  <div className="text-sm font-semibold text-slate-900">{parentUser.name}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    id="mobile-dash-btn"
                    onClick={() => handleNavClick('parent-dashboard')}
                    className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-medium"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={onLogoutParent}
                    className="p-1.5 text-rose-600 bg-white border border-rose-200 rounded-lg text-xs"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <button
                id="mobile-parent-login-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenParentLogin();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-teal-800 bg-teal-50 border border-teal-200"
              >
                <User className="w-4 h-4 text-teal-600" />
                Parent Login
              </button>
            )}

            {receptionUser ? (
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                <div>
                  <div className="text-xs text-amber-800">Reception Desk</div>
                  <div className="text-sm font-semibold text-slate-900 capitalize">
                    {receptionUser.branchId} Branch
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    id="mobile-reception-dash-btn"
                    onClick={() => handleNavClick('reception-dashboard')}
                    className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium"
                  >
                    Console
                  </button>
                  <button
                    onClick={onLogoutReception}
                    className="p-1.5 text-rose-600 bg-white border border-rose-200 rounded-lg text-xs"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <button
                id="mobile-reception-login-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenReceptionLogin();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-slate-700 bg-slate-100"
              >
                <ShieldCheck className="w-4 h-4 text-slate-500" />
                Reception Login
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
