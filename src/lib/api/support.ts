import { apiClient } from './client';
import type { SupportMatchResponse } from '@/lib/types';

// 온보딩 조건(귀농/주말·연령·영농경력)으로 정부 지원사업 매칭 + AI 요약.
// GPT-4o 요약 때문에 응답이 느릴 수 있어 timeout 을 넉넉히 둔다.
export async function fetchSupportMatch(params: {
  mode: string;
  age?: number | null;
  farmingYears?: number | null;
  province?: string | null;
}): Promise<SupportMatchResponse> {
  const { data } = await apiClient.get<SupportMatchResponse>('/api/v1/support/match', {
    timeout: 30_000,
    params: {
      mode: params.mode,
      age: params.age ?? undefined,
      farming_years: params.farmingYears ?? undefined,
      province: params.province ?? undefined,
    },
  });
  return data;
}
