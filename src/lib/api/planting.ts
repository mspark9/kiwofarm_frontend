import { apiClient } from './client';

// 백엔드 app/schemas/planting.py 와 1:1 대응.

export type Place = '베란다' | '옥상' | '노지' | '실내';
export type SunHours = '<3h' | '3~5h' | '>5h';
export type Experience = '처음' | '1~2년' | '3년+';
export type Direction = '남향' | '동향' | '서향' | '북향';
export type StartWhen = 'now' | 'next_month';

export interface PlantingInput {
  sigungu: string;
  place: Place;
  sun_hours: SunHours;
  experience: Experience;
  direction?: Direction | null;
  area_m2?: number | null;
  frequency?: string | null;
  start: StartWhen;
  facility: string[];
  prefs: string[];
  top_n: number;
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

/** 입력 위저드 결과로 추천 TOP N + AI 설명을 받아온다. */
export async function fetchPlantingRecommend(
  input: PlantingInput,
): Promise<PlantingRecommendResponse> {
  const { data } = await apiClient.post<PlantingRecommendResponse>(
    '/api/v1/planting/recommend',
    input,
  );
  return data;
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
