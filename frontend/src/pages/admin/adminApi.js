const API = process.env.REACT_APP_BACKEND_URL + '/api';

export const getToken = () => localStorage.getItem('admin_token') || '';
export const setToken = (t) => localStorage.setItem('admin_token', t);
export const clearToken = () => localStorage.removeItem('admin_token');

async function req(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      ...(opts.body && !(opts.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${getToken()}`,
      ...(opts.headers || {}),
    },
  });
  if (res.status === 401) { clearToken(); window.dispatchEvent(new Event('admin:logout')); throw new Error('unauthorized'); }
  if (!res.ok) {
    let detail = 'Помилка запиту';
    try { detail = (await res.json()).detail || detail; } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export const adminApi = {
  login: async (email, password) => {
    const res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    if (!res.ok) throw new Error('bad-credentials');
    return res.json();
  },
  stats: () => req('/admin/stats'),
  orders: () => req('/admin/orders'),
  contacts: () => req('/admin/contacts'),
  setOrderStatus: (id, status) => {
    const fd = new FormData(); fd.append('status', status);
    return req(`/admin/orders/${id}`, { method: 'PATCH', body: fd });
  },
  getSettings: () => req('/admin/settings'),
  saveSettings: (payload) => req('/admin/settings', { method: 'PUT', body: JSON.stringify(payload) }),
  testEmail: () => req('/admin/settings/test-email', { method: 'POST' }),
  // work examples
  work: () => req('/admin/work'),
  createWork: (payload) => req('/admin/work', { method: 'POST', body: JSON.stringify(payload) }),
  updateWork: (id, payload) => req(`/admin/work/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteWork: (id) => req(`/admin/work/${id}`, { method: 'DELETE' }),
  reorderWork: (ids) => req('/admin/work/reorder', { method: 'POST', body: JSON.stringify(ids) }),
  uploadWorkImage: (file) => {
    const fd = new FormData(); fd.append('file', file);
    return req('/admin/work/upload', { method: 'POST', body: fd });
  },
  // reviews
  reviews: () => req('/admin/reviews'),
  createReview: (payload) => req('/admin/reviews', { method: 'POST', body: JSON.stringify(payload) }),
  updateReview: (id, payload) => req(`/admin/reviews/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteReview: (id) => req(`/admin/reviews/${id}`, { method: 'DELETE' }),
  reorderReviews: (ids) => req('/admin/reviews/reorder', { method: 'POST', body: JSON.stringify(ids) }),
  // pricing
  getPricing: () => req('/admin/pricing'),
  savePricing: (payload) => req('/admin/pricing', { method: 'PUT', body: JSON.stringify(payload) }),
  // legal pages
  legal: () => req('/legal'),
  saveLegal: (slug, payload) => req(`/admin/legal/${slug}`, { method: 'PUT', body: JSON.stringify(payload) }),
  // site content (CMS)
  content: () => req('/content'),
  saveContent: (lang, payload) => req(`/admin/content/${lang}`, { method: 'PUT', body: JSON.stringify(payload) }),
  resetContent: (lang) => req(`/admin/content/${lang}`, { method: 'DELETE' }),
  downloadFile: async (path, fname) => {
    const res = await fetch(`${API}/admin/files/${path}?auth=${getToken()}`);
    if (!res.ok) throw new Error('download-failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = fname || 'document'; a.click();
    URL.revokeObjectURL(url);
  },
};

export const STATUS_OPTIONS = [
  { value: 'new', label: 'Нова' },
  { value: 'in_progress', label: 'В роботі' },
  { value: 'done', label: 'Виконано' },
  { value: 'declined', label: 'Відхилено' },
];

export const statusLabel = (v) => (STATUS_OPTIONS.find((s) => s.value === v) || STATUS_OPTIONS[0]).label;
