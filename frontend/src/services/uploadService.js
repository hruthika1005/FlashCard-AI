import api from './api';

const buildFormData = (file, meta) => {
  const formData = new FormData();
  formData.append('file', file);
  if (meta?.subject) formData.append('subject', meta.subject);
  if (meta?.chapter) formData.append('chapter', meta.chapter);
  if (meta?.topic) formData.append('topic', meta.topic);
  return formData;
};

const uploadService = {
  // Save Notes & Generate Flashcards: upload + OCR + AI generation in one pipeline
  uploadAndGenerate: (file, meta, onUploadProgress) =>
    api
      .post('/upload/generate', buildFormData(file, meta), {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
      })
      .then((res) => res.data.data),

  // Save Notes: upload + persist only, no flashcards generated yet
  saveNote: (file, meta, onUploadProgress) =>
    api
      .post('/upload/save', buildFormData(file, meta), {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
      })
      .then((res) => res.data.data),

  // Generate flashcards later for a note that was saved without them
  generateForNote: (noteId) => api.post(`/upload/${noteId}/generate`).then((res) => res.data.data),

  getUploadHistory: (params) => api.get('/upload/history', { params }).then((res) => res.data.data),

  deleteNote: (noteId) => api.delete(`/upload/${noteId}`).then((res) => res.data),
};

export default uploadService;
