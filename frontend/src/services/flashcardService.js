import api from './api';

const flashcardService = {
  getFlashcards: (params) => api.get('/flashcards', { params }).then((res) => res.data.data),
  getFlashcardById: (id) => api.get(`/flashcards/${id}`).then((res) => res.data.data.flashcard),
  createFlashcard: (payload) => api.post('/flashcards', payload).then((res) => res.data.data.flashcard),
  updateFlashcard: (id, payload) => api.put(`/flashcards/${id}`, payload).then((res) => res.data.data.flashcard),
  deleteFlashcard: (id) => api.delete(`/flashcards/${id}`).then((res) => res.data),
  toggleFavorite: (id) => api.patch(`/flashcards/${id}/favorite`).then((res) => res.data.data.flashcard),
  getDueFlashcards: (params) => api.get('/flashcards/study/due', { params }).then((res) => res.data.data),
  reviewFlashcard: (id, quality) =>
    api.post(`/flashcards/${id}/review`, { quality }).then((res) => res.data.data.flashcard),
  submitQuizResult: (id, correct) =>
    api.post(`/flashcards/${id}/quiz-result`, { correct }).then((res) => res.data.data.flashcard),
  getCategories: () => api.get('/flashcards/meta/categories').then((res) => res.data.data),
};

export default flashcardService;
