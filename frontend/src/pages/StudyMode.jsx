import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, RotateCcw, BookOpen } from 'lucide-react';
import Layout from '../components/Layout';
import EmptyState from '../components/EmptyState';
import { FlashcardGridSkeleton } from '../components/Skeleton';
import flashcardService from '../services/flashcardService';

// SM-2 recall quality buttons shown after revealing the answer
const qualityOptions = [
  { label: 'Blackout', quality: 0, color: 'bg-red-500' },
  { label: 'Hard', quality: 3, color: 'bg-amber-500' },
  { label: 'Good', quality: 4, color: 'bg-primary-500' },
  { label: 'Easy', quality: 5, color: 'bg-emerald-500' },
];

export default function StudyMode() {
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionDone, setSessionDone] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  useEffect(() => {
    loadDueCards();
  }, []);

  const loadDueCards = async () => {
    setLoading(true);
    try {
      const data = await flashcardService.getDueFlashcards({ limit: 50 });
      setQueue(data.flashcards);
      setIndex(0);
      setSessionDone(data.flashcards.length === 0);
    } finally {
      setLoading(false);
    }
  };

  const currentCard = queue[index];

  const handleReview = async (quality) => {
    if (!currentCard) return;
    try {
      await flashcardService.reviewFlashcard(currentCard._id, quality);
      setReviewedCount((c) => c + 1);
    } catch {
      // toast already shown globally
    }

    setRevealed(false);
    if (index + 1 < queue.length) {
      setIndex((i) => i + 1);
    } else {
      setSessionDone(true);
      toast.success('Study session complete! 🎉');
    }
  };

  if (loading) {
    return (
      <Layout>
        <FlashcardGridSkeleton count={1} />
      </Layout>
    );
  }

  if (sessionDone) {
    return (
      <Layout>
        <EmptyState
          icon={CheckCircle2}
          title={reviewedCount > 0 ? 'Session complete!' : 'Nothing due right now'}
          description={
            reviewedCount > 0
              ? `You reviewed ${reviewedCount} flashcard${reviewedCount === 1 ? '' : 's'}. Come back later for your next spaced-repetition session.`
              : 'All your flashcards are scheduled for a future date. Check back later, or add new ones.'
          }
          action={
            <button onClick={loadDueCards} className="btn-primary mt-2">
              <RotateCcw size={16} /> Refresh
            </button>
          }
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-xl">
        <div className="mb-5 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <BookOpen className="text-primary-500" size={22} />
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Study Mode</h1>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {index + 1} / {queue.length}
          </span>
        </div>

        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <div
            className="h-full rounded-full bg-primary-600 transition-all duration-300"
            style={{ width: `${((index) / queue.length) * 100}%` }}
          />
        </div>

        <div className="glass-card min-h-[280px] p-8 animate-slide-up">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-primary-500">
            {currentCard.subject} • {currentCard.chapter} • {currentCard.topic}
          </p>
          <p className="mb-6 text-center text-lg font-semibold text-gray-800 dark:text-gray-100">
            {currentCard.question}
          </p>

          {revealed && (
            <div className="animate-fade-in border-t border-gray-200/60 pt-5 dark:border-gray-700/60">
              <p className="mb-3 text-center text-sm text-gray-600 dark:text-gray-300">{currentCard.answer}</p>
              {currentCard.mnemonic && (
                <p className="text-center text-xs italic text-primary-500">💡 {currentCard.mnemonic}</p>
              )}
            </div>
          )}
        </div>

        {!revealed ? (
          <button onClick={() => setRevealed(true)} className="btn-primary mt-5 w-full">
            Show Answer
          </button>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {qualityOptions.map((opt) => (
              <button
                key={opt.label}
                onClick={() => handleReview(opt.quality)}
                className={`${opt.color} rounded-lg py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
