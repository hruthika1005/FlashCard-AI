import React from 'react';

export function FlashcardSkeleton() {
  return (
    <div className="glass-card h-72 w-full p-5">
      <div className="mb-4 flex justify-between">
        <div className="skeleton h-5 w-16" />
        <div className="skeleton h-5 w-5 rounded-full" />
      </div>
      <div className="skeleton mb-3 h-3 w-2/3" />
      <div className="flex h-32 flex-col items-center justify-center gap-2">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-3/4" />
      </div>
    </div>
  );
}

export function FlashcardGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <FlashcardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass-card p-5">
      <div className="skeleton mb-3 h-4 w-1/2" />
      <div className="skeleton h-8 w-1/3" />
    </div>
  );
}

export function ListRowSkeleton() {
  return (
    <div className="glass-card mb-2 flex items-center justify-between p-4">
      <div className="skeleton h-4 w-1/3" />
      <div className="skeleton h-4 w-16" />
    </div>
  );
}
