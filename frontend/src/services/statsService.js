import api from './api';

const statsService = {
  getDashboardStats: () => api.get('/stats/dashboard').then((res) => res.data.data),
  getDetailedStats: () => api.get('/stats/detailed').then((res) => res.data.data),
};

export default statsService;
