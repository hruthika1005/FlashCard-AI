import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center dark:bg-slate-900">
      <Compass size={48} className="text-primary-500" />
      <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">404</h1>
      <p className="text-gray-500 dark:text-gray-400">This page doesn't exist.</p>
      <Link to="/dashboard" className="btn-primary">
        Back to Dashboard
      </Link>
    </div>
  );
}
