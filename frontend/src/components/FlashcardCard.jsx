import React, { useState } from 'react';
import { Star, Trash2, Pencil, Lightbulb, Tag as TagIcon } from 'lucide-react';

const difficultyStyles = {
  easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  hard: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
};

/**
 * A flippable flashcard: front shows the question, back shows the answer,
 * mnemonic, and highlighted concepts. Click anywhere on the card to flip.
 */
export default function FlashcardCard({ flashcard, onToggleFavorite, onDelete, onEdit }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="flip-card-container h-72 w-full animate-slide-up">
      <div
        className={`flip-card-inner h-full w-full cursor-pointer ${flipped ? 'flipped' : ''}`}
        onClick={() => setFlipped((f) => !f)}
      >
        {/* FRONT */}
        <div className="flip-card-face flip-card-front glass-card flex h-full flex-col p-5">
          <div className="mb-2 flex items-start justify-between gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${difficultyStyles[flashcard.difficulty]}`}>
              {flashcard.difficulty}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(flashcard._id);
              }}
              className="text-gray-400 transition-colors hover:text-amber-400"
            >
              <Star size={18} fill={flashcard.isFavorite ? '#fbbf24' : 'none'} color={flashcard.isFavorite ? '#fbbf24' : 'currentColor'} />
            </button>
          </div>

          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-primary-500">
            {flashcard.subject} • {flashcard.chapter} • {flashcard.topic}
          </p>

          <div className="flex flex-1 items-center justify-center overflow-y-auto">
            <p className="text-center text-base font-semibold leading-snug text-gray-800 dark:text-gray-100">
              {flashcard.question}
            </p>
          </div>

          <p className="mt-2 text-center text-[11px] text-gray-400">Click to reveal answer</p>
        </div>

        {/* BACK */}
        <div className="flip-card-face flip-card-back glass-card flex h-full flex-col p-5">
          <div className="flex-1 overflow-y-auto">
            <p className="mb-3 text-sm leading-relaxed text-gray-700 dark:text-gray-200">{flashcard.answer}</p>

            {flashcard.mnemonic && (
              <div className="mb-3 flex items-start gap-2 rounded-lg bg-primary-50 p-2.5 text-xs text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">
                <Lightbulb size={14} className="mt-0.5 shrink-0" />
                <span>{flashcard.mnemonic}</span>
              </div>
            )}

            {flashcard.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {flashcard.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  >
                    <TagIcon size={10} />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mt-2 flex justify-end gap-2 border-t border-gray-200/60 pt-2 dark:border-gray-700/60">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(flashcard);
              }}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-800"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(flashcard._id);
              }}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
