import { apiClient } from './client';
import type { ShippingDashboard } from '@/lib/types';

export async function fetchShippingDashboard(
  crop: string,
  region: string,
): Promise<ShippingDashboard> {
  const { data } = await apiClient.get<ShippingDashboard>('/api/v1/shipping', {
    params: { crop, region },
  });
  return data;
}
