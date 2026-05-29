import { apiClient } from './client';
import type { CropRecommendation, Mode, OnboardingInput } from '@/lib/types';

interface RecommendationResponse {
  mode: Mode;
  items: CropRecommendation[];
}

/** 온보딩 입력으로 백엔드 추천 엔진을 호출해 TOP-3 작목을 받아온다. */
export async function fetchRecommendations(
  input: OnboardingInput,
): Promise<CropRecommendation[]> {
  const { data } = await apiClient.post<RecommendationResponse>('/api/v1/recommend', input);
  return data.items;
}

/** sessionStorage 에 저장된 온보딩 입력이 없을 때 mode 만으로 만드는 기본 입력. */
export function defaultOnboardingInput(mode: Mode): OnboardingInput {
  return {
    mode,
    region: '옥천군',
    province: '충청북도',
    area: 300,
    areaUnit: 'pyeong',
    laborCount: 2,
    preferredCrops: [],
    ...(mode === 'returning'
      ? { budgetManwon: 3000, facility: 'vinyl_house' }
      : { visitFrequency: 'weekly_1' }),
  };
}
