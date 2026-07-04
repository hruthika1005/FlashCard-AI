import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Search, Plus, Filter, Star, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import Layout from '../components/Layout';
import FlashcardCard from '../components/FlashcardCard';
import FlashcardForm from '../components/FlashcardForm';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { FlashcardGridSkeleton } from '../components/Skeleton';
import flashcardService from '../services/flashcardService';

export default function Flashcards() {
  const [flashcards, setFlashcards] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ subject: '', difficulty: '', favorite: false });
  const [categories, setCategories] = useState({ subjects: [], difficulty: [] });
  const [showFilters, setShowFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchFlashcards = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: 9,
          search: search || undefined,
          subject: filters.subject || undefined,
          difficulty: filters.difficulty || undefined,
          favorite: filters.favorite || undefined,
        };
        const data = await flashcardService.getFlashcards(params);
        setFlashcards(data.flashcards);
        setPagination(data.pagination);
      } finally {
        setLoading(false);
      }
    },
    [search, filters]
  );

  useEffect(() => {
    const timeout = setTimeout(() => fetchFlashcards(1), 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filters]);

  useEffect(() => {
    flashcardService.getCategories().then(setCategories);
  }, []);

  const handleToggleFavorite = async (id) => {
    const updated = await flashcardService.toggleFavorite(id);
    setFlashcards((prev) => prev.map((f) => (f._id === id ? updated : f)));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this flashcard permanently?')) return;
    await flashcardService.deleteFlashcard(id);
    toast.success('Flashcard deleted');
    fetchFlashcards(pagination.page);
  };

  const handleEdit = (card) => {
    setEditingCard(card);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingCard(null);
    setModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (editingCard) {
        await flashcardService.updateFlashcard(editingCard._id, formData);
        toast.success('Flashcard updated');
      } else {
        await flashcardService.createFlashcard(formData);
        toast.success('Flashcard created');
      }
      setModalOpen(false);
      fetchFlashcards(pagination.page);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Flashcards</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{pagination.total} total cards</p>
        </div>
        <button onClick={handleCreate} className="btn-primary">
          <Plus size={18} /> New Flashcard
        </button>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions, answers, tags..."
            className="input-field pl-10"
          />
        </div>
        <button onClick={() => setShowFilters((s) => !s)} className="btn-secondary">
          <Filter size={16} /> Filters
        </button>
        <button
          onClick={() => setFilters((f) => ({ ...f, favorite: !f.favorite }))}
          className={filters.favorite ? 'btn-primary' : 'btn-secondary'}
        >
          <Star size={16} fill={filters.favorite ? 'white' : 'none'} /> Favorites
        </button>
      </div>

      {showFilters && (
        <div className="glass-card mb-5 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 animate-slide-up">
          <select
            value={filters.subject}
            onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
            className="input-field"
          >
            <option value="">All Subjects</option>
            {categories.subjects?.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={filters.difficulty}
            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
            className="input-field"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      )}

      {loading ? (
        <FlashcardGridSkeleton count={9} />
      ) : flashcards.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No flashcards found"
          description="Try adjusting your search or filters, or create your first flashcard."
          action={
            <button onClick={handleCreate} className="btn-primary mt-2">
              <Plus size={16} /> Create Flashcard
            </button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {flashcards.map((card) => (
              <FlashcardCard
                key={card._id}
                flashcard={card}
                onToggleFavorite={handleToggleFavorite}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchFlashcards(pagination.page - 1)}
                className="btn-secondary disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchFlashcards(pagination.page + 1)}
                className="btn-secondary disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingCard ? 'Edit Flashcard' : 'New Flashcard'}>
        <FlashcardForm
          initialData={editingCard}
          onSubmit={handleFormSubmit}
          onCancel={() => setModalOpen(false)}
          submitting={submitting}
        />
      </Modal>
    </Layout>
  );
}
