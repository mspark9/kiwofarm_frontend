// 익명 디바이스 ID — 계정 없이 사용자(브라우저)별 데이터 구분.
// 모든 API 요청에 X-Device-Id 헤더로 실린다 (api/client.ts 인터셉터).
// URL 에 ?device=demo 를 붙이면 그 ID 로 전환·저장된다 (시연 계정 진입용).

const KEY = 'kiwofarm:deviceId';

export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const override = new URLSearchParams(window.location.search).get('device');
    if (override) {
      const id = override.trim().slice(0, 64);
      window.localStorage.setItem(KEY, id);
      return id;
    }
    let id = window.localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return ''; // localStorage 불가(시크릿 모드 등) — 백엔드가 anonymous 처리
  }
}
