const API_BASE_URL = '/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function request<T>(method: HttpMethod, endpoint: string, body?: unknown, timeoutMs?: number): Promise<T> {
  const controller = new AbortController();
  const timer = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null;

  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
  };

  // GET은 Chrome에서 body를 제거하므로 POST/PUT/DELETE만 body 포함
  if (body !== undefined && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    const data = await response.json().catch(() => {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    });

    return data as T;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.');
    }
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const apiClient = {
  get: <T>(endpoint: string) => request<T>('GET', endpoint),
  post: <T>(endpoint: string, body?: unknown, timeoutMs?: number) => request<T>('POST', endpoint, body, timeoutMs),
  put: <T>(endpoint: string, body?: unknown) => request<T>('PUT', endpoint, body),
  delete: <T>(endpoint: string, body?: unknown) => request<T>('DELETE', endpoint, body),
};
