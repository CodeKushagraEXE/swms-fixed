import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    window.location.href = '/login';
  }
  return Promise.reject(err);
});

export const authApi = {
  register: (d: any) => api.post('/auth/register', d),
  login: (d: any) => api.post('/auth/login', d),
  me: () => api.get('/auth/me'),
};
export const projectsApi = {
  getAll: () => api.get('/projects'),
  getById: (id: number) => api.get(`/projects/${id}`),
  create: (d: any) => api.post('/projects', d),
  update: (id: number, d: any) => api.put(`/projects/${id}`, d),
  delete: (id: number) => api.delete(`/projects/${id}`),
  addMember: (pid: number, uid: number) => api.post(`/projects/${pid}/members/${uid}`),
};
export const tasksApi = {
  getByProject: (pid: number, search?: string, status?: string) =>
    api.get(`/tasks/project/${pid}`, { params: { search, status } }),
  getById: (id: number) => api.get(`/tasks/${id}`),
  create: (d: any) => api.post('/tasks', d),
  update: (id: number, d: any) => api.put(`/tasks/${id}`, d),
  updateStatus: (id: number, status: string, position?: number) =>
    api.patch(`/tasks/${id}/status`, { status, position }),
  delete: (id: number) => api.delete(`/tasks/${id}`),
  addDependency: (taskId: number, dependsOnTaskId: number, type?: string) =>
    api.post('/tasks/dependency', { taskId, dependsOnTaskId, type }),
  removeDependency: (taskId: number, dependsOnId: number) =>
    api.delete(`/tasks/${taskId}/dependency/${dependsOnId}`),
};
export const dashboardApi = { getStats: () => api.get('/dashboard/stats') };
export const logsApi = { getProjectLogs: (pid: number) => api.get(`/logs/project/${pid}`) };
export const usersApi = { getAll: () => api.get('/users') };
export default api;
