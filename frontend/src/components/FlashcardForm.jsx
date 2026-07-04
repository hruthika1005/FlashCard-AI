import React, { useState, useEffect } from 'react';

const emptyForm = {
  subject: '',
  chapter: '',
  topic: '',
  question: '',
  answer: '',
  mnemonic: '',
  difficulty: 'medium',
  tags: '',
};

/**
 * Shared create/edit form for a flashcard. `initialData` (if provided)
 * pre-fills the form for editing; otherwise it starts blank for creation.
 */
export default function FlashcardForm({ initialData, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (initialData) {
      setForm({
        subject: initialData.subject || '',
        chapter: initialData.chapter || '',
        topic: initialData.topic || '',
        question: initialData.question || '',
        answer: initialData.answer || '',
        mnemonic: initialData.mnemonic || '',
        difficulty: initialData.difficulty || 'medium',
        tags: (initialData.tags || []).join(', '),
      });
    } else {
      setForm(emptyForm);
    }
  }, [initialData]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      tags: form.tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input name="subject" value={form.subject} onChange={handleChange} placeholder="Subject" required className="input-field" />
        <input name="chapter" value={form.chapter} onChange={handleChange} placeholder="Chapter" required className="input-field" />
        <input name="topic" value={form.topic} onChange={handleChange} placeholder="Topic" required className="input-field" />
      </div>

      <textarea
        name="question"
        value={form.question}
        onChange={handleChange}
        placeholder="Question"
        required
        rows={2}
        className="input-field resize-none"
      />
      <textarea
        name="answer"
        value={form.answer}
        onChange={handleChange}
        placeholder="Answer"
        required
        rows={3}
        className="input-field resize-none"
      />
      <input
        name="mnemonic"
        value={form.mnemonic}
        onChange={handleChange}
        placeholder="Mnemonic (optional)"
        className="input-field"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select name="difficulty" value={form.difficulty} onChange={handleChange} className="input-field">
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <input
          name="tags"
          value={form.tags}
          onChange={handleChange}
          placeholder="Tags (comma separated)"
          className="input-field"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Saving...' : initialData ? 'Update Flashcard' : 'Create Flashcard'}
        </button>
      </div>
    </form>
  );
}
