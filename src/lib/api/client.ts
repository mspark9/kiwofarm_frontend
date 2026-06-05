import axios from 'axios';
import { API_BASE_URL } from '@/lib/constants';
import { getDeviceId } from '@/lib/deviceId';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// 익명 디바이스 ID — 사용자(브라우저)별 데이터 구분.
apiClient.interceptors.request.use((config) => {
  const id = getDeviceId();
  if (id) config.headers['X-Device-Id'] = id;
  return config;
});
