import { apiClient } from './client';
import type { CropOption, CropSummary, CultivationGuide } from '@/lib/types';

export async function searchCrops(q: string, limit = 10): Promise<CropOption[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];
  const { data } = await apiClient.get<CropOption[]>('/api/v1/crops/search', {
    params: { q: trimmed, limit },
  });
  return data;
}

// 농사로 (신)작목별농업기술정보 (cropEbook). 카테고리 트리 순회 + 각 ebook 의
// cropIndexList 까지 받아오므로 첫 호출은 길어질 수 있어 타임아웃을 별도로 둠.
export async function fetchCultivation(
  itemCode: string,
  kindCode: string,
): Promise<CultivationGuide> {
  const { data } = await apiClient.get<CultivationGuide>(
    `/api/v1/crops/${itemCode}/${kindCode}/cultivation`,
    { timeout: 30_000 },
  );
  return data;
}

// RAG(농사로 PDF → 청크 → 임베딩 → pgvector 검색) + GPT 요약. 첫 호출 10~30초, 캐시 후 즉시.
export async function fetchCropSummary(
  itemCode: string,
  kindCode: string,
): Promise<CropSummary> {
  const { data } = await apiClient.get<CropSummary>(
    `/api/v1/crops/${itemCode}/${kindCode}/summary`,
    { timeout: 60_000 },
  );
  return data;
}
