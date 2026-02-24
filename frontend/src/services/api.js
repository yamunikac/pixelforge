import axios from 'axios';

const api = axios.create({
  baseURL: "https://pixelforge-backend-yv2b.onrender.com/api",
  timeout: 60000, // 60s for image processing
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Image API calls
export const imageAPI = {
  upload: (formData, onProgress) =>
    api.post('/images/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    }),
  process: (id, options) => api.post(`/images/process/${id}`, options),
  getHistory: (page = 1, limit = 10) =>
    api.get(`/images/history?page=${page}&limit=${limit}`),
  getStats: () => api.get('/images/stats'),
  deleteImage: (id) => api.delete(`/images/${id}`),
};

export default api;
