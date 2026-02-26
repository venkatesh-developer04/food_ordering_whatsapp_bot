import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

export const menuAPI = {
    getAll: () => API.get('/menu'),
    create: (data) => API.post('/menu', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    update: (id, data) => API.put(`/menu/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    delete: (id) => API.delete(`/menu/${id}`),
};

export const orderAPI = {
    getAll: (status) => API.get('/orders', { params: status ? { status } : {} }),
    getStats: () => API.get('/orders/stats'),
    updateStatus: (id, status) => API.patch(`/orders/${id}/status`, { status }),
};

export default API;
