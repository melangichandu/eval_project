const API_BASE = import.meta.env.VITE_API_URL || '';

function getToken() {
  return localStorage.getItem('grant_token');
}

function headers(includeAuth = true) {
  const h = { 'Content-Type': 'application/json' };
  if (includeAuth) {
    const t = getToken();
    if (t) h['Authorization'] = `Bearer ${t}`;
  }
  return h;
}

export async function register(body) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: headers(false),
    body: JSON.stringify({
      email: body.email,
      password: body.password,
      fullName: body.fullName,
      phone: body.phone,
      organizationName: body.organizationName,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: headers(false),
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Invalid email or password');
  return data;
}

export async function getMyApplications() {
  const res = await fetch(`${API_BASE}/api/applications`, { headers: headers() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to load applications');
  return data;
}

export async function getAllApplications(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/api/applications/all${q ? `?${q}` : ''}`, { headers: headers() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = res.status === 403
      ? 'You don\'t have permission to view all applications.'
      : (data.error || 'Failed to load applications');
    throw new Error(message);
  }
  return data;
}

export async function getApplication(id) {
  const res = await fetch(`${API_BASE}/api/applications/${id}`, { headers: headers() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to load application');
  return data;
}

export async function getDocumentBlob(applicationId, docId, { download = false } = {}) {
  const url = `${API_BASE}/api/applications/${applicationId}/documents/${docId}${download ? '?download=1' : ''}`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load document');
  }
  return res.blob();
}

export async function submitApplication(body) {
  const res = await fetch(`${API_BASE}/api/applications`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to submit');
  return data;
}

export async function uploadDocument(applicationId, file) {
  const form = new FormData();
  form.append('document', file);
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/applications/${applicationId}/documents`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

export async function updateStatus(applicationId, status, comments = '') {
  const res = await fetch(`${API_BASE}/api/applications/${applicationId}/status`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ status, comments }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Update failed');
  return data;
}

export async function calculateAward(applicationId) {
  const res = await fetch(`${API_BASE}/api/applications/${applicationId}/award`, {
    method: 'POST',
    headers: headers(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Calculation failed');
  return data;
}

export async function checkEligibility(formData) {
  const res = await fetch(`${API_BASE}/api/eligibility/check`, {
    method: 'POST',
    headers: headers(false),
    body: JSON.stringify(formData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Check failed');
  return data;
}

export function logout() {
  localStorage.removeItem('grant_token');
  localStorage.removeItem('grant_user');
}

export function setAuth(token, user) {
  localStorage.setItem('grant_token', token);
  localStorage.setItem('grant_user', JSON.stringify(user));
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('grant_user') || 'null');
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!getToken();
}
