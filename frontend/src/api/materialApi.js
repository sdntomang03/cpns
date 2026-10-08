import api from './axios';

export const getMaterials = (params = {}) => api.get('/materials', { params });
export const getMaterial = (id) => api.get(`/materials/${id}`);
