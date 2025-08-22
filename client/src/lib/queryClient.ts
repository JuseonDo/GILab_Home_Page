// client/src/lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";
import { getAuthToken, clearAuthToken, parseJSONSafe, ApiError } from "@/lib/utils";

/**
 * 전역 QueryClient
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 필요 시 공통 설정
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * 공통 Fetch 래퍼: 인증/에러 처리
 */
async function fetchWithAuth(
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(init.headers || {});

  // JSON 요청에 기본 헤더 추가 (FormData는 자동)
  const isFormData = init.body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, { ...init, headers });

  // 인증 실패 처리
  if (res.status === 401) {
    // 토큰 제거
    clearAuthToken();
    const payload = await parseJSONSafe(res);
    throw new ApiError(
      (payload as any)?.detail || "Could not validate credentials",
      401,
      payload
    );
  }

  if (!res.ok) {
    const payload = await parseJSONSafe(res);
    throw new ApiError(
      (payload as any)?.detail || (payload as any)?.message || "Request failed",
      res.status,
      payload
    );
  }

  return res;
}

/**
 * 백엔드 호출 유틸: login.tsx 등에서 사용하는 시그니처 유지
 *
 * 예)
 *   apiRequest("POST", "/auth/login", { email, password })
 *   apiRequest("GET", "/members?grouped=true")
 */
export async function apiRequest<T = any>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  // 프록시가 잡혀있으면 /api 로, 아니면 절대경로를 넘겨도 됨
  const base = "/api";
  const url = path.startsWith("http") ? path : `${base}${path}`;

  const isFormData = body instanceof FormData;
  const res = await fetchWithAuth(url, {
    method,
    body: body == null ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    ...init,
  });

  // 비어있는 응답 본문 처리
  const text = await res.text();
  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    // JSON 이 아니면 그대로 반환 (string 등)
    return text as unknown as T;
  }
}

// 선택적으로, 간편 메서드도 제공 가능
export const api = {
  get: <T = any>(path: string, init?: RequestInit) => apiRequest<T>("GET", path, undefined, init),
  post: <T = any>(path: string, body?: unknown, init?: RequestInit) => apiRequest<T>("POST", path, body, init),
  put:  <T = any>(path: string, body?: unknown, init?: RequestInit) => apiRequest<T>("PUT", path, body, init),
  patch:<T = any>(path: string, body?: unknown, init?: RequestInit) => apiRequest<T>("PATCH", path, body, init),
  delete:<T = any>(path: string, body?: unknown, init?: RequestInit) => apiRequest<T>("DELETE", path, body, init),
};
