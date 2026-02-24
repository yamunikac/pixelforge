import axios from 'axios';

const api = axios.create({
  baseURL: "https://pixelforge-backend-yv2b.onrender.com/api",
  timeout: 60000,
});

// ❌ Removed JWT interceptor
// ❌ Removed 401 redirect
// ❌ Removed token logic

// Image API calls (public)
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
