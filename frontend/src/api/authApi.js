import api from './axios';

export const registerUser = (payload) => api.post('/auth/register', payload);
export const loginUser = (payload) => api.post('/auth/login', payload);
export const logoutUser = () => api.post('/auth/logout');
export const getProfile = () => api.get('/profile');
export const updateProfile = (payload) => api.put('/profile', payload);
