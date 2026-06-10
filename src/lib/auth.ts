// 자체 인증(아이디+비밀번호) — 토큰은 localStorage 보관, api/client.ts 가
// Authorization 헤더로 전달. 비로그인 = 게스트(공용 체험 데이터).

import axios from 'axios';
import { API_BASE_URL } from '@/lib/constants';

const TOKEN_KEY = 'kiwofarm:authToken';
const NAME_KEY = 'kiwofarm:authUsername';
const NICK_KEY = 'kiwofarm:authNickname';
const ADDR_KEY = 'kiwofarm:authAddress';

interface AuthResponse {
  token: string;
  username: string;
  nickname: string;
  address: string | null;
}

function read(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return read(TOKEN_KEY);
}

export function getUsername(): string | null {
  return read(NAME_KEY);
}

// 로그인 사용자의 회원가입 닉네임(커뮤니티 표시용). 비로그인이면 null.
export function getAuthNickname(): string | null {
  return read(NICK_KEY);
}

// 회원가입 시 입력한 주소(시·군·구, "경기도 성남시"). 없으면 null.
export function getAddress(): string | null {
  return read(ADDR_KEY) || null;
}

function save(data: AuthResponse): void {
  window.localStorage.setItem(TOKEN_KEY, data.token);
  window.localStorage.setItem(NAME_KEY, data.username);
  window.localStorage.setItem(NICK_KEY, data.nickname);
  if (data.address) window.localStorage.setItem(ADDR_KEY, data.address);
  else window.localStorage.removeItem(ADDR_KEY);
}

export function clearAuth(): void {
  [TOKEN_KEY, NAME_KEY, NICK_KEY, ADDR_KEY].forEach((k) =>
    window.localStorage.removeItem(k),
  );
}

// 인터셉터(client.ts)와의 순환 의존을 피하려고 인증 호출은 생짜 axios 사용.
export async function signup(
  username: string,
  password: string,
  nickname: string,
  address?: string | null,
): Promise<string> {
  const { data } = await axios.post<AuthResponse>(
    `${API_BASE_URL}/api/v1/auth/signup`,
    { username, password, nickname, address: address || null },
  );
  save(data);
  return data.username;
}

export async function login(username: string, password: string): Promise<string> {
  const { data } = await axios.post<AuthResponse>(
    `${API_BASE_URL}/api/v1/auth/login`,
    { username, password },
  );
  save(data);
  return data.username;
}
