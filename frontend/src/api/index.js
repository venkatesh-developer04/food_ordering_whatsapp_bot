import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use((config) => {
    const tenantId = localStorage.getItem('tenantId');
    if (tenantId) config.headers['x-tenant-id'] = tenantId;
    return config;
});

export const menuAPI = {
    getAll: (params) => API.get('/menu', { params }),
    create: (data) => API.post('/menu', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    update: (id, data) => API.put(`/menu/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    delete: (id) => API.delete(`/menu/${id}`),
};

export const orderAPI = {
    getAll: (params) => API.get('/orders', { params }), // updated to accept all params for pagination
    getStats: () => API.get('/orders/stats'),
    updateStatus: (id, status) => API.patch(`/orders/${id}/status`, { status }),
};

export const settingsAPI = {
    get: () => API.get('/settings'),
    update: (data) => API.put('/settings', data),
};

export default API;
