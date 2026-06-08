import { apiClient } from '@/lib/api/client';
import type {
  CompareOut,
  HarvestCard,
  HarvestJournalResponse,
  RewardsSummary,
} from '@/lib/types';

export async function fetchRewardsSummary(): Promise<RewardsSummary> {
  const { data } = await apiClient.get<RewardsSummary>('/api/v1/rewards/summary');
  return data;
}

export async function fetchCompare(cropSlug?: string): Promise<CompareOut> {
  const { data } = await apiClient.get<CompareOut>('/api/v1/rewards/compare', {
    params: cropSlug ? { crop_slug: cropSlug } : undefined,
  });
  return data;
}

export async function fetchHarvestCard(cropSlug: string): Promise<HarvestCard> {
  const { data } = await apiClient.get<HarvestCard>(`/api/v1/harvest/card/${cropSlug}`);
  return data;
}

// '수확했어요' — 캘린더 일지(메모·사진)를 AI 가 분석해 수확 인증 + 도감 등록.
// 사진 여러 장을 멀티모달로 판정하므로 타임아웃을 넉넉히.
export async function verifyHarvestJournal(
  planId: number,
): Promise<HarvestJournalResponse> {
  const { data } = await apiClient.post<HarvestJournalResponse>(
    '/api/v1/harvest/verify-journal',
    { planId },
    { timeout: 120_000 },
  );
  return data;
}
