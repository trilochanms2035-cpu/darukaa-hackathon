const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('darukaa_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.detail || `API error: ${response.status} ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  auth: {
    login: (email, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (userData) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    getMe: () => request('/auth/me'),
  },

  projects: {
    getAll: () => request('/projects/'),
    getById: (id) => request(`/projects/${id}`),
    create: (projectData) =>
      request('/projects/', {
        method: 'POST',
        body: JSON.stringify(projectData),
      }),
    update: (id, projectData) =>
      request(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(projectData),
      }),
    delete: (id) =>
      request(`/projects/${id}`, {
        method: 'DELETE',
      }),
  },

  sites: {
    getAll: (projectId) => {
      const qs = projectId ? `?project_id=${projectId}` : '';
      return request(`/sites/${qs}`);
    },
    getGeoJSON: (projectId) => {
      const qs = projectId ? `?project_id=${projectId}` : '';
      return request(`/sites/geojson${qs}`);
    },
    getById: (siteId) => request(`/sites/${siteId}`),
    create: (siteData) =>
      request('/sites/', {
        method: 'POST',
        body: JSON.stringify(siteData),
      }),
    update: (siteId, siteData) =>
      request(`/sites/${siteId}`, {
        method: 'PUT',
        body: JSON.stringify(siteData),
      }),
    delete: (siteId) =>
      request(`/sites/${siteId}`, {
        method: 'DELETE',
      }),
  },

  analytics: {
    getOverview: () => request('/analytics/overview'),
    getSiteAnalytics: (siteId, startDate, endDate) => {
      let qs = '';
      const params = [];
      if (startDate) params.push(`start_date=${startDate}`);
      if (endDate) params.push(`end_date=${endDate}`);
      if (params.length) qs = `?${params.join('&')}`;
      return request(`/analytics/sites/${siteId}${qs}`);
    },
    regenerate: (siteId, months = 36) =>
      request(`/analytics/sites/${siteId}/regenerate?months=${months}`, {
        method: 'POST',
      }),
  },
};
