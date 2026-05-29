import { apiClient } from './client';
import type {
  CropOption,
  ForecastResponse,
  PriceTrendResponse,
  RecentPriceResponse,
  ShippingAdviceResponse,
  ShippingDashboard,
} from '@/lib/types';

export async function fetchShippingDashboard(
  crop: CropOption,
  region: string,
): Promise<ShippingDashboard> {
  const { data } = await apiClient.get<ShippingDashboard>('/api/v1/shipping', {
    params: {
      category_code: crop.group_code,
      item_code: crop.item_code,
      kind_code: crop.kind_code,
      item_name: crop.item_name,
      kind_name: crop.kind_name,
      region,
    },
  });
  return data;
}

// 검색한 작물의 최근일자 도매가 (KAMIS dailyPriceByCategoryList)
export async function fetchRecentPrice(crop: CropOption): Promise<RecentPriceResponse> {
  const { data } = await apiClient.get<RecentPriceResponse>('/api/v1/shipping/recent', {
    params: {
      category_code: crop.group_code,
      item_code: crop.item_code,
      kind_code: crop.kind_code,
      item_name: crop.item_name,
      kind_name: crop.kind_name,
    },
  });
  return data;
}

// 검색한 작물의 최근 가격추이 (KAMIS recentlyPriceTrendList)
export async function fetchPriceTrend(crop: CropOption): Promise<PriceTrendResponse> {
  const { data } = await apiClient.get<PriceTrendResponse>('/api/v1/shipping/trend', {
    params: {
      category_code: crop.group_code,
      item_code: crop.item_code,
      kind_code: crop.kind_code,
      item_name: crop.item_name,
      kind_name: crop.kind_name,
    },
  });
  return data;
}

// 도매가 예측 (Prophet). 첫 호출은 모델 콜드스타트로 느릴 수 있어 timeout 확대.
export async function fetchPriceForecast(crop: CropOption): Promise<ForecastResponse> {
  const { data } = await apiClient.get<ForecastResponse>('/api/v1/shipping/forecast', {
    timeout: 60_000,
    params: {
      category_code: crop.group_code,
      item_code: crop.item_code,
      kind_code: crop.kind_code,
      item_name: crop.item_name,
      kind_name: crop.kind_name,
    },
  });
  return data;
}

// AI 출하 조언 (KAMIS 3종 지표 → GPT-4o). LLM 호출이라 응답이 느릴 수 있어 timeout 확대.
export async function fetchShippingAdvice(crop: CropOption): Promise<ShippingAdviceResponse> {
  const { data } = await apiClient.get<ShippingAdviceResponse>('/api/v1/shipping/advice', {
    timeout: 30_000,
    params: {
      category_code: crop.group_code,
      item_code: crop.item_code,
      kind_code: crop.kind_code,
      item_name: crop.item_name,
      kind_name: crop.kind_name,
    },
  });
  return data;
}
