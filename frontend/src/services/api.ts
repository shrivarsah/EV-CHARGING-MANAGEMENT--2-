const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // If unauthorized, clear token and notify if not already on login
    if (!endpoint.includes('/auth/login')) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.dispatchEvent(new Event('auth_change'));
    }
  }

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorJson.error || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}
