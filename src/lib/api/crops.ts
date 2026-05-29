import { apiClient } from './client';
import type { CropOption } from '@/lib/types';

export async function searchCrops(q: string, limit = 10): Promise<CropOption[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];
  const { data } = await apiClient.get<CropOption[]>('/api/v1/crops/search', {
    params: { q: trimmed, limit },
  });
  return data;
}
