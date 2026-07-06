import axios from 'axios';
import toast from 'react-hot-toast';
import { TOKEN_KEY } from '../context/AuthContext';

const API_URL = 'https://flashcard-ai-baun.onrender.com/api';



const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the JWT to every outgoing request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handling: surface backend error messages as toasts,
// and force logout on 401 (expired/invalid token).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong. Please try again.';

    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      if (!window.location.pathname.includes('/login')) {
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
      }
    } else if (error.response?.status === 429) {
      toast.error(message);
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again shortly.');
    } else {
      toast.error(message);
    }
    console.log("Axios error:", error);
    console.log("Response:", error.response);
    console.log("Request:", error.request);
    console.log("Message:", error.message);

   
    return Promise.reject(error);
  }
);

export default api;
