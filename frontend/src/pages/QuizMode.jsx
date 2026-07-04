import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Brain, CheckCircle2, XCircle, RotateCcw, Trophy } from 'lucide-react';
import Layout from '../components/Layout';
import EmptyState from '../components/EmptyState';
import { FlashcardGridSkeleton } from '../components/Skeleton';
import flashcardService from '../services/flashcardService';

const QUIZ_SIZE = 10;

// Shuffles an array using Fisher-Yates
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Builds a 4-option multiple choice question for each flashcard by pulling
 * 3 distractor answers from other flashcards in the pool.
 */
function buildQuizQuestions(cards) {
  return cards.map((card) => {
    const distractors = shuffle(cards.filter((c) => c._id !== card._id))
      .slice(0, 3)
      .map((c) => c.answer);
    const options = shuffle([card.answer, ...distractors]);
    return { ...card, options, correctAnswer: card.answer };
  });
}

export default function QuizMode() {
  const [pool, setPool] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    flashcardService
      .getFlashcards({ limit: 100 })
      .then((data) => {
        setPool(data.flashcards);
        if (data.flashcards.length >= 4) {
          const quizCards = shuffle(data.flashcards).slice(0, QUIZ_SIZE);
          setQuestions(buildQuizQuestions(quizCards));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const currentQuestion = questions[index];

  const handleAnswer = async (option) => {
    if (selected) return;
    setSelected(option);
    const correct = option === currentQuestion.correctAnswer;
    if (correct) setScore((s) => s + 1);

    try {
      await flashcardService.submitQuizResult(currentQuestion._id, correct);
    } catch {
      // toast handled globally
    }
  };

  const handleNext = () => {
    setSelected(null);
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
    } else {
      setFinished(true);
      toast.success('Quiz complete!');
    }
  };

  const restart = () => {
    const quizCards = shuffle(pool).slice(0, QUIZ_SIZE);
    setQuestions(buildQuizQuestions(quizCards));
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  if (loading) {
    return (
      <Layout>
        <FlashcardGridSkeleton count={1} />
      </Layout>
    );
  }

  if (pool.length < 4) {
    return (
      <Layout>
        <EmptyState
          icon={Brain}
          title="Not enough flashcards for a quiz"
          description="You need at least 4 flashcards to generate multiple-choice quiz questions. Add more flashcards or upload notes first."
        />
      </Layout>
    );
  }

  if (finished) {
    const percent = Math.round((score / questions.length) * 100);
    return (
      <Layout>
        <EmptyState
          icon={Trophy}
          title={`You scored ${score}/${questions.length} (${percent}%)`}
          description={
            percent >= 80
              ? 'Excellent work! Your recall is strong.'
              : percent >= 50
              ? 'Good effort — keep reviewing to improve retention.'
              : 'Keep practicing — spaced repetition in Study Mode will help.'
          }
          action={
            <button onClick={restart} className="btn-primary mt-2">
              <RotateCcw size={16} /> Take Another Quiz
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
            <Brain className="text-accent-500" size={22} />
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Quiz Mode</h1>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {index + 1} / {questions.length} • Score: {score}
          </span>
        </div>

        <div className="glass-card p-8 animate-slide-up">
          <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-accent-500">
            {currentQuestion.subject} • {currentQuestion.topic}
          </p>
          <p className="mb-6 text-center text-lg font-semibold text-gray-800 dark:text-gray-100">
            {currentQuestion.question}
          </p>

          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const isCorrect = option === currentQuestion.correctAnswer;
              const isSelected = option === selected;
              let style = 'border-gray-200 dark:border-gray-700 hover:border-primary-300';
              if (selected) {
                if (isCorrect) style = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30';
                else if (isSelected) style = 'border-red-500 bg-red-50 dark:bg-red-950/30';
              }

              return (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  disabled={!!selected}
                  className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left text-sm transition-colors ${style}`}
                >
                  <span className="text-gray-700 dark:text-gray-200">{option}</span>
                  {selected && isCorrect && <CheckCircle2 size={18} className="text-emerald-500" />}
                  {selected && isSelected && !isCorrect && <XCircle size={18} className="text-red-500" />}
                </button>
              );
            })}
          </div>
        </div>

        {selected && (
          <button onClick={handleNext} className="btn-primary mt-5 w-full animate-fade-in">
            {index + 1 < questions.length ? 'Next Question' : 'Finish Quiz'}
          </button>
        )}
      </div>
    </Layout>
  );
}
