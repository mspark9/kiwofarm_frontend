import { apiClient } from '@/lib/api/client';
import type { CompareOut, HarvestCard, RewardsSummary } from '@/lib/types';

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
