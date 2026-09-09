import { authStorage } from '../utils/auth';

const API_BASE_URL = '/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function request<T>(method: HttpMethod, endpoint: string, body?: unknown, timeoutMs?: number, externalSignal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const timer = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null;

  // 호출부(예: 백테스트 취소 버튼)가 넘긴 signal이 abort되면 내부 controller도 같이 abort —
  // fetch는 signal을 하나만 받을 수 있어서 타임아웃용 controller에 연결해준다.
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', onExternalAbort);
  }

  // 로그인 응답의 loginToken(JWT)을 이후 모든 요청에 실어 보낸다 — 백엔드
  // JwtAuthenticationFilter가 이 헤더 없이는 로그인/회원가입 등 공개 경로를 제외한
  // 전부를 401로 거부한다.
  const token = authStorage.get()?.loginToken;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const options: RequestInit = {
    method,
    headers,
    signal: controller.signal,
  };

  // GET은 Chrome에서 body를 제거하므로 POST/PUT/DELETE만 body 포함
  if (body !== undefined && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    // 토큰 만료/무효 - 세션을 지우고 로그인 페이지로. router/index.tsx가 REACT_APP_NAVIGATE를
    // 채워두므로(AppRoutes 마운트 이후) 그걸 통해 리다이렉트, 아직 없으면(초기 로드 등) 세션만
    // 지워도 다음 라우트 렌더에서 authStorage.get()이 null이라 자동으로 로그인 화면으로 빠진다.
    if (response.status === 401) {
      authStorage.clear();
      window.REACT_APP_NAVIGATE?.('/', { replace: true });
    }

    const data = await response.json().catch(() => {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    });

    return data as T;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      // 사용자가 명시적으로 취소한 경우(externalSignal)와 타임아웃을 구분해서 호출부가
      // 정확한 메시지를 보여줄 수 있게 한다.
      if (externalSignal?.aborted) {
        throw new DOMException('요청이 취소되었습니다.', 'AbortError');
      }
      throw new Error('요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.');
    }
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
    if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
  }
}

export const apiClient = {
  get: <T>(endpoint: string) => request<T>('GET', endpoint),
  post: <T>(endpoint: string, body?: unknown, timeoutMs?: number, signal?: AbortSignal) => request<T>('POST', endpoint, body, timeoutMs, signal),
  put: <T>(endpoint: string, body?: unknown) => request<T>('PUT', endpoint, body),
  delete: <T>(endpoint: string, body?: unknown) => request<T>('DELETE', endpoint, body),
};
