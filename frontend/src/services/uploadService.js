import api from './api';

const uploadService = {
  uploadAndGenerate: (file, meta, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    if (meta?.subject) formData.append('subject', meta.subject);
    if (meta?.chapter) formData.append('chapter', meta.chapter);
    if (meta?.topic) formData.append('topic', meta.topic);

    return api
      .post('/upload/generate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
      })
      .then((res) => res.data.data);
  },
  getUploadHistory: (params) => api.get('/upload/history', { params }).then((res) => res.data.data),
};

export default uploadService;
