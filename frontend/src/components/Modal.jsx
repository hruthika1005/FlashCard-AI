import React from 'react';
import { X } from 'lucide-react';

/**
 * Reusable centered modal with glassmorphism styling, used for the
 * create/edit flashcard form and other dialogs.
 */
export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />
      <div className={`glass-card relative z-10 w-full ${maxWidth} max-h-[90vh] overflow-y-auto p-6 animate-slide-up`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
