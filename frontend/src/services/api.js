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

/** On 401 or token/expired error: logout and redirect to login. Returns true if handled. */
function handleAuthError(res, data) {
  if (res.status === 401) {
    logout();
    window.location.href = '/login';
    return true;
  }
  const msg = (data && data.error) ? String(data.error).toLowerCase() : '';
  if (msg.includes('expired') || (msg.includes('invalid') && msg.includes('token'))) {
    logout();
    window.location.href = '/login';
    return true;
  }
  return false;
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
  if (handleAuthError(res, data)) throw new Error('Session expired');
  if (!res.ok) throw new Error(data.error || 'Failed to load applications');
  return data;
}

export async function getAllApplications(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/api/applications/all${q ? `?${q}` : ''}`, { headers: headers() });
  const data = await res.json().catch(() => ({}));
  if (handleAuthError(res, data)) throw new Error('Session expired');
  if (!res.ok) {
    const message = res.status === 403
      ? 'You don\'t have permission to view all applications.'
      : (data.error || 'Failed to load applications');
    throw new Error(message);
  }
  return data;
}

export async function getApplicationsSummary() {
  const res = await fetch(`${API_BASE}/api/applications/summary`, { headers: headers() });
  const data = await res.json().catch(() => ({}));
  if (handleAuthError(res, data)) throw new Error('Session expired');
  if (!res.ok) {
    const message = res.status === 403
      ? 'You don\'t have permission to view the summary.'
      : (data.error || 'Failed to load summary');
    throw new Error(message);
  }
  return data;
}

export async function getAdminSummary() {
  const res = await fetch(`${API_BASE}/api/admin/summary`, { headers: headers() });
  const data = await res.json().catch(() => ({}));
  if (handleAuthError(res, data)) throw new Error('Session expired');
  if (!res.ok) {
    const message = res.status === 403
      ? 'Access denied. Administrator access required.'
      : (data.error || 'Failed to load admin summary');
    throw new Error(message);
  }
  return data;
}

export async function getApplication(id) {
  const res = await fetch(`${API_BASE}/api/applications/${id}`, { headers: headers() });
  const data = await res.json().catch(() => ({}));
  if (handleAuthError(res, data)) throw new Error('Session expired');
  if (!res.ok) throw new Error(data.error || 'Failed to load application');
  return data;
}

export async function getDocumentBlob(applicationId, docId, { download = false } = {}) {
  const url = `${API_BASE}/api/applications/${applicationId}/documents/${docId}${download ? '?download=1' : ''}`;
  const res = await fetch(url, { headers: headers() });
  if (res.status === 401) {
    logout();
    window.location.href = '/login';
    throw new Error('Session expired');
  }
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
  if (handleAuthError(res, data)) throw new Error('Session expired');
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
  if (handleAuthError(res, data)) throw new Error('Session expired');
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

/** Upload multiple documents in one request (each file max 5 MB). */
export async function uploadDocuments(applicationId, files) {
  if (!files?.length) return { count: 0 };
  const form = new FormData();
  for (const file of files) form.append('document', file);
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/applications/${applicationId}/documents`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (handleAuthError(res, data)) throw new Error('Session expired');
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
  if (handleAuthError(res, data)) throw new Error('Session expired');
  if (!res.ok) throw new Error(data.error || 'Update failed');
  return data;
}

export async function calculateAward(applicationId) {
  const res = await fetch(`${API_BASE}/api/applications/${applicationId}/award`, {
    method: 'POST',
    headers: headers(),
  });
  const data = await res.json().catch(() => ({}));
  if (handleAuthError(res, data)) throw new Error('Session expired');
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
