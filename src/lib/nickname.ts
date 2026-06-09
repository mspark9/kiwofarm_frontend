// 커뮤니티 작성자 닉네임 — 게스트는 전원 'demo' device 를 공유하므로
// 글마다 표시할 이름을 localStorage 에 기억한다. 로그인 사용자는 사용자명 프리필.
import { getUsername } from '@/lib/auth';

const KEY = 'kiwofarm:nickname';

export function getNickname(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(KEY) ?? getUsername() ?? '';
  } catch {
    return '';
  }
}

export function setNickname(value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, value.trim().slice(0, 40));
  } catch {
    /* ignore */
  }
}
