// 커뮤니티 작성자 닉네임.
// - 로그인 사용자: 회원가입 닉네임을 그대로 쓴다(글마다 설정하지 않음).
// - 게스트: 전원 'demo' device 를 공유하므로 표시 이름을 localStorage 에 기억한다.
import { getAuthNickname } from '@/lib/auth';

const KEY = 'kiwofarm:nickname';

export function getNickname(): string {
  if (typeof window === 'undefined') return '';
  // 로그인 사용자는 회원가입 닉네임 우선.
  const authNick = getAuthNickname();
  if (authNick) return authNick;
  try {
    return window.localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}

// 게스트가 직접 설정한 표시 이름 저장(로그인 사용자는 호출하지 않는다).
export function setNickname(value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, value.trim().slice(0, 40));
  } catch {
    /* ignore */
  }
}
