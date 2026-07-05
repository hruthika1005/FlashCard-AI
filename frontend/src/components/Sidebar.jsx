import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Upload,
  BookOpen,
  Brain,
  BarChart3,
  User,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/flashcards', label: 'Flashcards', icon: Layers },
  { to: '/upload', label: 'Upload Notes', icon: Upload },
  { to: '/study', label: 'Study Mode', icon: BookOpen },
  { to: '/quiz', label: 'Quiz Mode', icon: Brain },
  { to: '/statistics', label: 'Statistics', icon: BarChart3 },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function Sidebar({ open, onClose }) {
  const { logout } = useAuth();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform p-4 transition-transform duration-300 lg:static lg:z-0 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="glass-card flex h-full flex-col p-4">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <span className="text-lg font-bold">Menu</span>
            <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>

          <button
            onClick={logout}
            className="mt-4 flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
