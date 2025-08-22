import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// --- shadcn/ui 등에서 쓰는 유틸 함수 ---
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- 인증 토큰 관리 ---
const ACCESS_TOKEN_KEY = "access_token";

function safeLocalStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
  } catch (_e) {}
  return null;
}

export function setAuthToken(token: string) {
  const ls = safeLocalStorage();
  if (ls) ls.setItem(ACCESS_TOKEN_KEY, token);
}

export function getAuthToken(): string | null {
  const ls = safeLocalStorage();
  if (!ls) return null;
  return ls.getItem(ACCESS_TOKEN_KEY);
}

export function clearAuthToken() {
  const ls = safeLocalStorage();
  if (ls) ls.removeItem(ACCESS_TOKEN_KEY);
}

// JSON 응답 안전 파서
export async function parseJSONSafe<T = any>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export class ApiError extends Error {
  status: number;
  payload: any;

  constructor(message: string, status: number, payload?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}
