import axios from 'axios';
import { getToken } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/constants';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// 사용자 식별: 로그인 상태면 토큰을 Authorization 으로 전달(계정별 데이터),
// 비로그인이면 헤더 없음 → 백엔드가 게스트(공용 demo 데이터)로 처리.
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
