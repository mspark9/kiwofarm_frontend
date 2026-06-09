import type { AreaUnit } from '@/lib/types';
import { apiClient } from './client';

// 백엔드 app/schemas/planting.py 와 1:1 대응.

export type Place = '베란다' | '옥상' | '노지' | '실내';
export type SunHours = '<3h' | '3~5h' | '>5h';
export type Experience = '처음' | '1~2년' | '3년+';
export type Direction = '남향' | '동향' | '서향' | '북향';

export interface PlantingInput {
  sigungu: string;
  place: Place;
  sun_hours: SunHours;
  experience: Experience;
  direction?: Direction | null;
  // 면적은 캘린더와 동일하게 값(area) + 단위(areaUnit)로 입력. 백엔드에는 ㎡(area_m2)로 환산해 전송.
  area?: number | null;
  areaUnit?: AreaUnit;
  // 방문 예정 요일 (0=일 ~ 6=토). 주당 방문 횟수가 관리 가능 빈도.
  visitDays?: number[] | null;
  // 재배 시작 날짜(YYYY-MM-DD). 비우면 오늘 기준 추천. 캘린더에서 직접 선택.
  startDate?: string | null;
  facility: string[];
  prefs: string[];
  top_n: number;
}

// 면적 단위 → ㎡ 환산(1평=3.305785㎡, 1ha=10000㎡).
export function areaToM2(
  area: number | null | undefined,
  unit: AreaUnit | undefined,
): number | null {
  if (typeof area !== 'number' || area <= 0) return null;
  switch (unit) {
    case 'sqm':
      return area;
    case 'hectare':
      return area * 10000;
    default: // pyeong
      return Math.round(area * 3.305785 * 10) / 10;
  }
}

export interface CalendarAction {
  action: '파종' | '정식' | '관리' | '수확';
  method?: string | null;
  label?: string | null;
  plain?: string | null;
}

export interface AiExplain {
  reason: string;
  tips: string[];
  first_month_todo: string[];
}

export interface RecommendationItem {
  crop_id: string;
  name: string;
  category: string;
  difficulty: number;
  score: number;
  reasons: string[];
  plantable_now: boolean;
  plantable_next: boolean;
  calendar_this_month: CalendarAction[];
  days_to_harvest: number[];
  source: string;
  needs_review: boolean;
  ai_explain?: AiExplain | null;
}

export interface PlantingRecommendResponse {
  month: number;
  zone: string;
  recommendations: RecommendationItem[];
  next_month_candidates: string[];
}

export interface CropSummary {
  id: string;
  name: string;
  category: string;
  difficulty: number;
  environments: string[];
  sunlight: string;
  min_sun_hours: number;
  days_to_harvest: number[];
  water_need: string;
  container_ok: boolean;
  source: string;
  needs_review: boolean;
}

/** 입력 위저드 결과로 추천 TOP N 을 즉시 받아온다(AI 설명 제외, 빠름). */
export async function fetchPlantingRecommend(
  input: PlantingInput,
): Promise<PlantingRecommendResponse> {
  // 백엔드는 area_m2(㎡)로 점수를 매긴다 → 값+단위를 ㎡로 환산해 함께 전송.
  const { data } = await apiClient.post<PlantingRecommendResponse>(
    '/api/v1/planting/recommend',
    { ...input, area_m2: areaToM2(input.area, input.areaUnit) },
  );
  return data;
}

/** crop_id → AI 설명. */
export type PlantingExplains = Record<string, AiExplain>;

interface PlantingExplainResponse {
  explains: PlantingExplains;
}

/** 추천 렌더 후 호출하는 비동기 AI 설명. 동일 입력이면 같은 작물 집합에 매핑된다. */
export async function fetchPlantingExplains(
  input: PlantingInput,
): Promise<PlantingExplains> {
  const { data } = await apiClient.post<PlantingExplainResponse>(
    '/api/v1/planting/recommend/explain',
    { ...input, area_m2: areaToM2(input.area, input.areaUnit) },
  );
  return data.explains ?? {};
}

/** 40종 작물 메타 목록. */
export async function fetchPlantingCrops(): Promise<CropSummary[]> {
  const { data } = await apiClient.get<CropSummary[]>('/api/v1/planting/crops');
  return data;
}

// ─────────────────── 챗봇 ───────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatSource {
  crop_id: string;
  name: string;
}

export interface ChatResponse {
  answer: string;
  chips: string[];
  sources: ChatSource[];
}

/** 경로 A: 추천 결과 컨텍스트({user_input, recommendations})를 캐리해 상담 연속. */
export interface ChatContext {
  user_input?: PlantingInput;
  recommendations?: Pick<RecommendationItem, 'crop_id' | 'name'>[];
}

/** 작목 상담 챗봇 호출. context 가 있으면 추천 작물을 우선 컨텍스트로 사용한다. */
export async function fetchPlantingChat(
  messages: ChatMessage[],
  context?: ChatContext | null,
): Promise<ChatResponse> {
  const { data } = await apiClient.post<ChatResponse>('/api/v1/planting/chat', {
    messages,
    context: context ?? null,
  });
  return data;
}
