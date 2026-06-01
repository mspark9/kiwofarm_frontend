import { apiClient } from './client';
import type {
  CompareResponse,
  CropOption,
  NearbyResponse,
  RecommendResponse,
} from '@/lib/types';

// 판매 위치(주소 또는 좌표) 기준 가까운 로컬푸드 직매장.
// 주소는 백엔드에서 1회 지오코딩하므로 timeout 을 넉넉히 둔다.
export async function fetchNearbyStores(params: {
  address?: string;
  lat?: number;
  lng?: number;
  limit?: number;
}): Promise<NearbyResponse> {
  const { data } = await apiClient.get<NearbyResponse>('/api/v1/sales/nearby', {
    timeout: 20_000,
    params: {
      address: params.address,
      lat: params.lat,
      lng: params.lng,
      limit: params.limit ?? 5,
    },
  });
  return data;
}

// 직매장 직거래 vs 도매시장 출하 예상 실수령액 비교.
// amount 단위(kg/개)는 도매가 단위로 결정되며 응답 input_mode/amount_unit 로 온다.
export async function fetchChannelCompare(
  crop: CropOption,
  amount: number,
): Promise<CompareResponse> {
  const { data } = await apiClient.get<CompareResponse>('/api/v1/sales/compare', {
    timeout: 20_000,
    params: {
      category_code: crop.group_code,
      item_code: crop.item_code,
      kind_code: crop.kind_code,
      item_name: crop.item_name,
      kind_name: crop.kind_name,
      amount,
    },
  });
  return data;
}

// 위치 기반 채널 추천: 가격 + 운송비 + AI 조언 + 가까운 직매장·도매시장.
// 주소는 백엔드에서 지오코딩하고 GPT-4o 조언까지 생성하므로 timeout 을 넉넉히 둔다.
export async function fetchRecommend(
  crop: CropOption,
  amount: number,
  address: string,
): Promise<RecommendResponse> {
  const { data } = await apiClient.get<RecommendResponse>('/api/v1/sales/recommend', {
    timeout: 40_000,
    params: {
      category_code: crop.group_code,
      item_code: crop.item_code,
      kind_code: crop.kind_code,
      item_name: crop.item_name,
      kind_name: crop.kind_name,
      amount,
      address,
    },
  });
  return data;
}
