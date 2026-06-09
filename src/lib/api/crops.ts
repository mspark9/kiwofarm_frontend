import { apiClient } from './client';
import type {
  CropCatalogItem,
  CropOption,
  CropSummary,
  CultivationGuide,
} from '@/lib/types';

export async function searchCrops(q: string, limit = 10): Promise<CropOption[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];
  const { data } = await apiClient.get<CropOption[]>('/api/v1/crops/search', {
    params: { q: trimmed, limit },
  });
  return data;
}

// 40종 마스터(crops_master) 작물 검색 — 캘린더 작물 선택용.
// code 가 슬러그라 계획 생성·수확 인증이 도감 40종과 그대로 일치한다. 로컬 조회라 즉시 응답.
export async function searchCropMaster(q: string): Promise<CropCatalogItem[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];
  const { data } = await apiClient.get<CropCatalogItem[]>('/api/v1/crops/master', {
    params: { q: trimmed },
  });
  return data;
}

// 작목별농업기술정보(cropEbook) 작목 카탈로그 검색 — 농사로 전체(참고용).
// 백엔드 첫 호출은 카테고리 트리 순회로 ~6초, 이후 1시간 캐시되어 즉시 응답.
export async function searchCropCatalog(q: string): Promise<CropCatalogItem[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];
  const { data } = await apiClient.get<CropCatalogItem[]>('/api/v1/crops/catalog', {
    params: { q: trimmed },
    timeout: 30_000,
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

// 작목 코드(subCategoryCode) → 농업기술길잡이 e-book 목록. 재배정보에서 텃밭가꾸기와 함께 표시.
export async function fetchCatalogEbooks(
  subCategoryCode: string,
  cropName?: string,
): Promise<CultivationGuide> {
  const { data } = await apiClient.get<CultivationGuide>(
    `/api/v1/crops/catalog/${encodeURIComponent(subCategoryCode)}/ebooks`,
    { params: cropName ? { cropName } : undefined, timeout: 30_000 },
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
