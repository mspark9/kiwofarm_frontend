import { apiClient } from './client';
import type { GardenDetail, GardenItem, GardenSummary } from '@/lib/types';

// 텃밭가꾸기 본문을 GPT로 요약한 재배 핵심 정리(+근거 원문). 첫 호출은 GPT로 수초 소요.
export async function fetchGardenSummary(q: string): Promise<GardenSummary> {
  const trimmed = q.trim();
  const { data } = await apiClient.get<GardenSummary>('/api/v1/garden/summary', {
    params: { q: trimmed },
    timeout: 60_000,
  });
  return data;
}

// 텃밭가꾸기(재배 정보) 검색 — 제목에 키워드가 든 글 목록.
export async function searchGarden(q: string): Promise<GardenItem[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];
  const { data } = await apiClient.get<GardenItem[]>('/api/v1/garden/search', {
    params: { q: trimmed },
    timeout: 30_000,
  });
  return data;
}

// 텃밭가꾸기 글 상세(본문 + 첨부 링크).
export async function getGardenDetail(cntntsNo: string): Promise<GardenDetail> {
  const { data } = await apiClient.get<GardenDetail>(`/api/v1/garden/${cntntsNo}`, {
    timeout: 30_000,
  });
  return data;
}
