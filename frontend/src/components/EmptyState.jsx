import React from 'react';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center gap-3 p-12 text-center animate-fade-in">
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-500 dark:bg-primary-950/40">
          <Icon size={26} />
        </div>
      )}
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{title}</h3>
      {description && <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">{description}</p>}
      {action}
    </div>
  );
}
