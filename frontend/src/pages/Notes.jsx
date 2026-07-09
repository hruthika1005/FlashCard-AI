import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  Loader2,
  Upload,
  Star,
} from 'lucide-react';
import Layout from '../components/Layout';
import EmptyState from '../components/EmptyState';
import { ListRowSkeleton } from '../components/Skeleton';
import uploadService from '../services/uploadService';
import flashcardService from '../services/flashcardService';

const statusStyles = {
  uploaded: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  ocr_processing: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  generating_flashcards: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  failed: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
};

const statusLabels = {
  uploaded: 'No flashcards yet',
  ocr_processing: 'Processing...',
  generating_flashcards: 'Generating...',
  completed: 'Completed',
  failed: 'Failed',
};

/**
 * A single note row that expands to show its child flashcards
 * (fetched lazily via GET /flashcards?sourceNoteId=...).
 */
function NoteRow({ note, onDeleted, onGenerated }) {
  const [expanded, setExpanded] = useState(false);
  const [flashcards, setFlashcards] = useState(null);
  const [loadingCards, setLoadingCards] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const hasFlashcards = note.flashcardsGenerated > 0;

  const loadFlashcards = useCallback(async () => {
    setLoadingCards(true);
    try {
      const data = await flashcardService.getFlashcards({ sourceNoteId: note._id, limit: 100 });
      setFlashcards(data.flashcards);
    } catch (err) {
      // error toast already shown globally
    } finally {
      setLoadingCards(false);
    }
  }, [note._id]);

  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && hasFlashcards && flashcards === null) {
      loadFlashcards();
    }
  };

  const handleGenerate = async (e) => {
    e.stopPropagation();
    setGenerating(true);
    try {
      const result = await uploadService.generateForNote(note._id);
      toast.success(`Generated ${result.flashcards.length} flashcards!`);
      onGenerated(result.note);
      setFlashcards(result.flashcards);
      setExpanded(true);
    } catch (err) {
      // error toast already shown globally
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${note.originalFileName}" and all its flashcards? This cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    try {
      await uploadService.deleteNote(note._id);
      toast.success('Note deleted');
      onDeleted(note._id);
    } catch (err) {
      // error toast already shown globally
      setDeleting(false);
    }
  };

  return (
    <div className="glass-card mb-3 overflow-hidden animate-fade-in">
      <div
        onClick={toggleExpanded}
        className="flex cursor-pointer items-center justify-between gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/60"
      >
        <div className="flex min-w-0 items-center gap-3">
          {hasFlashcards ? (
            expanded ? (
              <ChevronDown size={18} className="shrink-0 text-gray-400" />
            ) : (
              <ChevronRight size={18} className="shrink-0 text-gray-400" />
            )
          ) : (
            <span className="w-[18px] shrink-0" />
          )}
          {note.fileType === 'pdf' ? (
            <FileText size={20} className="shrink-0 text-primary-500" />
          ) : (
            <ImageIcon size={20} className="shrink-0 text-primary-500" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
              {note.originalFileName}
            </p>
            <p className="truncate text-xs text-gray-400">
              {note.subject} • {note.chapter} • {note.topic}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[note.status] || statusStyles.uploaded}`}>
            {hasFlashcards ? `${note.flashcardsGenerated} card${note.flashcardsGenerated === 1 ? '' : 's'}` : statusLabels[note.status] || 'No flashcards yet'}
          </span>

          {!hasFlashcards && note.status !== 'ocr_processing' && note.status !== 'generating_flashcards' && (
            <button onClick={handleGenerate} disabled={generating} className="btn-primary px-3 py-1.5 text-xs">
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Generate
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
          >
            {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
          </button>
        </div>
      </div>

      {expanded && hasFlashcards && (
        <div className="border-t border-gray-200/60 p-4 dark:border-gray-700/60">
          {loadingCards && <ListRowSkeleton />}
          {!loadingCards && flashcards?.length === 0 && (
            <p className="text-sm text-gray-400">No flashcards found for this note.</p>
          )}
          {!loadingCards && flashcards?.length > 0 && (
            <ul className="space-y-2">
              {flashcards.map((card) => (
                <li
                  key={card._id}
                  className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800/60"
                >
                  <Star
                    size={14}
                    className="mt-0.5 shrink-0"
                    fill={card.isFavorite ? '#fbbf24' : 'none'}
                    color={card.isFavorite ? '#fbbf24' : 'currentColor'}
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 dark:text-gray-100">{card.question}</p>
                    <p className="mt-0.5 text-gray-500 dark:text-gray-400">{card.answer}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link to="/flashcards" className="mt-3 inline-block text-xs font-semibold text-primary-600 hover:underline">
            View & edit in Flashcards →
          </Link>
        </div>
      )}
    </div>
  );
}

export default function Notes() {
  const [notes, setNotes] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await uploadService.getUploadHistory({ limit: 50 });
      setNotes(data.notes);
    } catch (err) {
      // error toast already shown globally
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleDeleted = (noteId) => {
    setNotes((prev) => prev.filter((n) => n._id !== noteId));
  };

  const handleGenerated = (updatedNote) => {
    setNotes((prev) => prev.map((n) => (n._id === updatedNote._id ? updatedNote : n)));
  };

  return (
    <Layout>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Notes</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Every uploaded file or photo, with the flashcards generated from it.
            </p>
          </div>
          <Link to="/upload" className="btn-primary">
            <Upload size={18} /> Upload
          </Link>
        </div>

        {loading && (
          <div className="space-y-3">
            <ListRowSkeleton />
            <ListRowSkeleton />
            <ListRowSkeleton />
          </div>
        )}

        {!loading && notes?.length === 0 && (
          <EmptyState
            icon={FileText}
            title="No notes yet"
            description="Upload a file or take a photo of your notes to get started."
            action={
              <Link to="/upload" className="btn-primary">
                <Upload size={18} /> Upload Notes
              </Link>
            }
          />
        )}

        {!loading &&
          notes?.length > 0 &&
          notes.map((note) => (
            <NoteRow key={note._id} note={note} onDeleted={handleDeleted} onGenerated={handleGenerated} />
          ))}
      </div>
    </Layout>
  );
}
