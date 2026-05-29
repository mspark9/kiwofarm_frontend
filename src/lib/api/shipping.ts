import { apiClient } from './client';
import type { CropOption, ShippingDashboard } from '@/lib/types';

export async function fetchShippingDashboard(
  crop: CropOption,
  region: string,
): Promise<ShippingDashboard> {
  const { data } = await apiClient.get<ShippingDashboard>('/api/v1/shipping', {
    params: {
      item_code: crop.item_code,
      kind_code: crop.kind_code,
      item_name: crop.item_name,
      kind_name: crop.kind_name,
      region,
    },
  });
  return data;
}
