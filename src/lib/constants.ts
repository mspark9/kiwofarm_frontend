const PROD_API_URL = 'https://kiwofarm-backend.fly.dev';
const LOCAL_API_URL = 'http://localhost:8000';

// API 베이스 자동 전환: 로컬 접속(localhost) → 로컬 백엔드, 배포 접속(Vercel 등)
// → fly.io 백엔드. NEXT_PUBLIC_API_URL 환경변수가 있으면 그것이 최우선.
function resolveApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') return PROD_API_URL;
  }
  return LOCAL_API_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();

// 백엔드가 돌려주는 업로드 경로(/uploads/...)를 절대 URL로. 이미 절대 URL이면 그대로.
export function mediaUrl(path: string): string {
  if (!path) return path;
  return /^https?:\/\//.test(path) ? path : `${API_BASE_URL}${path}`;
}
