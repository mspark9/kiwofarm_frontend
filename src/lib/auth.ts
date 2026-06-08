// 자체 인증(아이디+비밀번호) — 토큰은 localStorage 보관, api/client.ts 가
// Authorization 헤더로 전달. 비로그인 = 게스트(공용 체험 데이터).

import axios from 'axios';
import { API_BASE_URL } from '@/lib/constants';

const TOKEN_KEY = 'kiwofarm:authToken';
const NAME_KEY = 'kiwofarm:authUsername';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getUsername(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(NAME_KEY);
  } catch {
    return null;
  }
}

function save(token: string, username: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(NAME_KEY, username);
}

export function clearAuth(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(NAME_KEY);
}

// 인터셉터(client.ts)와의 순환 의존을 피하려고 인증 호출은 생짜 axios 사용.
export async function signup(username: string, password: string): Promise<string> {
  const { data } = await axios.post<{ token: string; username: string }>(
    `${API_BASE_URL}/api/v1/auth/signup`,
    { username, password },
  );
  save(data.token, data.username);
  return data.username;
}

export async function login(username: string, password: string): Promise<string> {
  const { data } = await axios.post<{ token: string; username: string }>(
    `${API_BASE_URL}/api/v1/auth/login`,
    { username, password },
  );
  save(data.token, data.username);
  return data.username;
}
