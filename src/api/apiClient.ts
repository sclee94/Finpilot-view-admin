const API_BASE_URL = '/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function request<T>(method: HttpMethod, endpoint: string, body?: unknown): Promise<T> {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  // GET은 Chrome에서 body를 제거하므로 POST/PUT/DELETE만 body 포함
  if (body !== undefined && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  console.log(`[API] ${method} ${API_BASE_URL}${endpoint}`, body ?? '');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  const data = await response.json().catch(() => {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  });

  console.log(`[API] response`, data);

  return data as T;
}

export const apiClient = {
  get: <T>(endpoint: string) => request<T>('GET', endpoint),
  post: <T>(endpoint: string, body?: unknown) => request<T>('POST', endpoint, body),
  put: <T>(endpoint: string, body?: unknown) => request<T>('PUT', endpoint, body),
  delete: <T>(endpoint: string, body?: unknown) => request<T>('DELETE', endpoint, body),
};
