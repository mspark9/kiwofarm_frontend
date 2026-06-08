import type {
  ChatMessage,
  PlantingInput,
  PlantingRecommendResponse,
} from '@/lib/api/planting';

// 입력 위저드 값은 localStorage 에 보관해 재방문 시 프리필한다(spec §3.3 usePlantingInput).
export const PLANTING_INPUT_KEY = 'kiwofarm:planting:input';
export const PLANTING_RESULT_KEY = 'kiwofarm:planting:result';
export const PLANTING_CHAT_KEY = 'kiwofarm:planting:chat';

export const defaultPlantingInput: PlantingInput = {
  sigungu: '',
  place: '베란다',
  sun_hours: '3~5h',
  experience: '처음',
  direction: null,
  area: null,
  areaUnit: 'pyeong',
  frequency: null,
  start: 'now',
  facility: [],
  prefs: [],
  top_n: 6,
};

export function loadPlantingInput(): PlantingInput | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PLANTING_INPUT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PlantingInput> & { area_m2?: number | null };
    // 구버전(area_m2 ㎡ 단독) → area + areaUnit('sqm') 마이그레이션.
    if (parsed.area == null && typeof parsed.area_m2 === 'number') {
      parsed.area = parsed.area_m2;
      parsed.areaUnit = 'sqm';
    }
    return { ...defaultPlantingInput, ...parsed };
  } catch {
    return null;
  }
}

export function savePlantingInput(input: PlantingInput): void {
  try {
    window.localStorage.setItem(PLANTING_INPUT_KEY, JSON.stringify(input));
  } catch {
    /* 저장 실패는 무시 — 추천 자체는 동작 */
  }
}

// ── 추천 결과 → 캘린더 핸드오프(선택한 작물 1개 이상). 세션 한정. ──
export const PLANTING_CARRY_KEY = 'kiwofarm:planting:carry-crops';

export interface CarryCrop {
  code: string; // 작물 코드(추천 crop_id)
  name: string;
  category: string;
}

export function savePlantingCarryCrops(crops: CarryCrop[]): void {
  try {
    window.sessionStorage.setItem(PLANTING_CARRY_KEY, JSON.stringify(crops));
  } catch {
    /* 무시 */
  }
}

export function loadPlantingCarryCrops(): CarryCrop[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(PLANTING_CARRY_KEY);
    const arr = raw ? (JSON.parse(raw) as CarryCrop[]) : null;
    return Array.isArray(arr) && arr.length > 0 ? arr : null;
  } catch {
    return null;
  }
}

export function clearPlantingCarryCrops(): void {
  try {
    window.sessionStorage.removeItem(PLANTING_CARRY_KEY);
  } catch {
    /* 무시 */
  }
}

// 추천 결과 — 경로 A(챗봇 컨텍스트 캐리)에서 사용.
export function savePlantingResult(result: PlantingRecommendResponse): void {
  try {
    window.localStorage.setItem(PLANTING_RESULT_KEY, JSON.stringify(result));
  } catch {
    /* 무시 */
  }
}

export function loadPlantingResult(): PlantingRecommendResponse | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PLANTING_RESULT_KEY);
    return raw ? (JSON.parse(raw) as PlantingRecommendResponse) : null;
  } catch {
    return null;
  }
}

// 챗 세션(MVP 단일 세션) — 메시지 배열 localStorage 보관.
export function loadChat(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(PLANTING_CHAT_KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

export function saveChat(messages: ChatMessage[]): void {
  try {
    window.localStorage.setItem(PLANTING_CHAT_KEY, JSON.stringify(messages));
  } catch {
    /* 무시 */
  }
}

export function clearChat(): void {
  try {
    window.localStorage.removeItem(PLANTING_CHAT_KEY);
  } catch {
    /* 무시 */
  }
}
