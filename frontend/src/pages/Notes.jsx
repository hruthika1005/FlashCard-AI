import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Sparkles,
  Trash2,
  Loader2,
  Upload,
  CheckCircle2,
  Maximize2,
  Layers,
} from 'lucide-react';
import Layout from '../components/Layout';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import FlashcardCard from '../components/FlashcardCard';
import FlashcardForm from '../components/FlashcardForm';
import NoteFileViewer from '../components/NoteFileViewer';
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
 * Small clickable preview: thumbnail for images, icon tile for PDFs.
 * Always reuses the existing Cloudinary fileUrl - never re-uploads.
 */
function FilePreviewThumb({ note, size = 'md', onOpen }) {
  const [imgError, setImgError] = useState(false);
  const dims = size === 'lg' ? 'h-28 w-28 sm:h-36 sm:w-36' : 'h-14 w-14';

  const isImage = note.fileType === 'image' && !imgError;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen(note);
      }}
      className={`group relative shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 ${dims}`}
      title="Open original file"
    >
      {isImage ? (
        <img
          src={note.fileUrl}
          alt={note.originalFileName}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-primary-500">
          <FileText size={size === 'lg' ? 40 : 22} />
        </div>
      )}
      <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
        <Maximize2 size={size === 'lg' ? 22 : 14} />
      </span>
    </button>
  );
}

/**
 * A single note "folder": the uploaded file/photo is the parent, its
 * generated flashcards are the children. Expands in place to reveal
 * preview, metadata, and the real flippable FlashcardCard components
 * (same ones used on the Flashcards page) so the viewer never diverges.
 */
function NoteRow({ note, onDeleted, onGenerated, onOpenFile }) {
  const [expanded, setExpanded] = useState(false);
  const [flashcards, setFlashcards] = useState(null);
  const [loadingCards, setLoadingCards] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [savingCard, setSavingCard] = useState(false);

  const hasFlashcards = note.flashcardsGenerated > 0;
  const isBusy = note.status === 'ocr_processing' || note.status === 'generating_flashcards';

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

  const handleToggleFavorite = async (id) => {
    const updated = await flashcardService.toggleFavorite(id);
    setFlashcards((prev) => prev.map((f) => (f._id === id ? updated : f)));
  };

  const handleDeleteCard = async (id) => {
    if (!window.confirm('Delete this flashcard permanently?')) return;
    await flashcardService.deleteFlashcard(id);
    toast.success('Flashcard deleted');
    setFlashcards((prev) => {
      const next = prev.filter((f) => f._id !== id);
      onGenerated({ ...note, flashcardsGenerated: next.length });
      return next;
    });
  };

  const handleEditCard = (card) => setEditingCard(card);

  const handleCardFormSubmit = async (formData) => {
    setSavingCard(true);
    try {
      const updated = await flashcardService.updateFlashcard(editingCard._id, formData);
      setFlashcards((prev) => prev.map((f) => (f._id === updated._id ? updated : f)));
      toast.success('Flashcard updated');
      setEditingCard(null);
    } finally {
      setSavingCard(false);
    }
  };

  return (
    <div className="glass-card mb-4 overflow-hidden animate-fade-in">
      {/* Parent row: the uploaded file */}
      <div
        onClick={toggleExpanded}
        className="flex cursor-pointer items-center gap-4 p-4 hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-800/60 dark:active:bg-gray-800 sm:p-5"
      >
        <span className="shrink-0 text-gray-400">
          {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </span>

        <FilePreviewThumb note={note} onOpen={onOpenFile} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-gray-800 dark:text-gray-100">
            {note.originalFileName}
          </p>
          <p className="mt-0.5 truncate text-xs text-gray-400">
            {note.subject} • {note.chapter} • {note.topic}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                statusStyles[note.status] || statusStyles.uploaded
              }`}
            >
              {hasFlashcards ? (
                <>
                  <CheckCircle2 size={12} /> Generated
                </>
              ) : (
                statusLabels[note.status] || 'No flashcards yet'
              )}
            </span>
            {hasFlashcards && (
              <span className="text-xs text-gray-400">
                {note.flashcardsGenerated} card{note.flashcardsGenerated === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {!hasFlashcards && !isBusy && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-primary px-3 py-2 text-xs sm:px-4 sm:text-sm"
            >
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              <span className="hidden sm:inline">Generate</span>
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
            aria-label="Delete note"
          >
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          </button>
        </div>
      </div>

      {/* Expandable body: CSS-only grid-rows animation keeps this smooth on Android */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="space-y-5 border-t border-gray-200/60 p-4 dark:border-gray-700/60 sm:p-6">
            {/* Preview */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Preview</p>
              <div className="flex items-center gap-4">
                <FilePreviewThumb note={note} size="lg" onOpen={onOpenFile} />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenFile(note);
                  }}
                  className="btn-secondary"
                >
                  <Maximize2 size={15} /> Open {note.fileType === 'pdf' ? 'PDF' : 'image'}
                </button>
              </div>
            </div>

            {/* Information */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Information</p>
              <div className="flex flex-wrap gap-2">
                {[note.subject, note.chapter, note.topic].map((tag, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Flashcards (children) */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">
                  <Layers size={13} /> Flashcards
                  {hasFlashcards && flashcards && ` (${flashcards.length})`}
                </p>
                {!hasFlashcards && !isBusy && (
                  <button onClick={handleGenerate} disabled={generating} className="btn-primary px-3 py-1.5 text-xs">
                    {generating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    Generate Flashcards
                  </button>
                )}
                {isBusy && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                    <Loader2 size={13} className="animate-spin" /> {statusLabels[note.status]}
                  </span>
                )}
              </div>

              {!hasFlashcards && !isBusy && (
                <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-400 dark:bg-gray-800/60">
                  No flashcards generated yet for this note.
                </p>
              )}

              {hasFlashcards && (
                <>
                  {loadingCards && <ListRowSkeleton />}
                  {!loadingCards && flashcards?.length === 0 && (
                    <p className="text-sm text-gray-400">No flashcards found for this note.</p>
                  )}
                  {!loadingCards && flashcards?.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {flashcards.map((card) => (
                        <FlashcardCard
                          key={card._id}
                          flashcard={card}
                          onToggleFavorite={handleToggleFavorite}
                          onDelete={handleDeleteCard}
                          onEdit={handleEditCard}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(false);
              }}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              Collapse ▲
            </button>
          </div>
        </div>
      </div>

      {/* Edit-in-place modal, reusing the shared flashcard form/component */}
      <Modal isOpen={!!editingCard} onClose={() => setEditingCard(null)} title="Edit Flashcard">
        <FlashcardForm
          initialData={editingCard}
          onSubmit={handleCardFormSubmit}
          onCancel={() => setEditingCard(null)}
          submitting={savingCard}
        />
      </Modal>
    </div>
  );
}

export default function Notes() {
  const [notes, setNotes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewingFile, setViewingFile] = useState(null);

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
      <div className="mx-auto max-w-5xl">
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
            <NoteRow
              key={note._id}
              note={note}
              onDeleted={handleDeleted}
              onGenerated={handleGenerated}
              onOpenFile={setViewingFile}
            />
          ))}
      </div>

      {viewingFile && <NoteFileViewer note={viewingFile} onClose={() => setViewingFile(null)} />}
    </Layout>
  );
}
