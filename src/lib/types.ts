// Single source of truth for shared domain types.
// Backend Pydantic schemas in `backend/app/schemas/` must stay structurally aligned with this file.

import type { CropId } from './constants';

// ───────────── Mode & onboarding ─────────────

export type Mode = 'returning' | 'weekend';

export type AreaUnit = 'pyeong' | 'sqm' | 'hectare';
export type FacilityType = 'open_field' | 'vinyl_house' | 'smart_farm';
export type VisitFrequency = 'weekly_1' | 'weekly_2' | 'biweekly' | 'monthly';

export interface OnboardingInput {
  mode: Mode;
  region: string;
  province?: string;
  area: number;
  areaUnit: AreaUnit;
  laborCount: number;
  preferredCrops: string[];
  // returning-only
  budgetManwon?: number;
  facility?: FacilityType;
  // weekend-only
  visitFrequency?: VisitFrequency;
}

// ───────────── Crop recommendation ─────────────

export type CropPhase = 'rest' | 'seeding' | 'growing' | 'harvest';

export interface CalendarMonth {
  month: number;
  phase: CropPhase;
}

export type Difficulty = 1 | 2 | 3 | 4 | 5;
export type CropColor = 'red' | 'orange' | 'indigo';

export interface CropRecommendation {
  cropId: CropId | string;
  name: string;
  emoji: string;
  matchScore: number;
  difficulty: Difficulty;
  expectedRevenueManwon: number;
  expectedNetManwon: number;
  expectedYieldKg: number;
  expectedDirectPriceWon: number;
  llmReason: string;
  tags: string[];
  calendar: CalendarMonth[];
  peerFarms: number;
  peerAgreeRate: number;
  color: CropColor;
  tier?: 'premium' | 'standard';
  peerEvidence?: string | null;
  revenueBasis?: string | null;
}

// ───────────── Digital twin ─────────────

export type AlertType = 'pest' | 'price' | 'weather' | 'labor';
export type Severity = 'low' | 'medium' | 'high';

export interface MonthlyPoint {
  month: string;
  monthNum: number;
  revenueManwon: number;
  laborHours: number;
  phase: CropPhase;
}

export interface CrisisAlert {
  month: number;
  type: AlertType;
  title: string;
  detail: string;
  severity: Severity;
}

export interface TwinData {
  cropId: CropId | string;
  name: string;
  emoji: string;
  totalRevenueManwon: number;
  totalCostManwon: number;
  totalLaborHours: number;
  peakLaborMonth: number;
  monthly: MonthlyPoint[];
  alerts: CrisisAlert[];
  aiCoach: string;
}

// ───────────── KAMIS crop search ─────────────

export interface CropOption {
  group_code: string;
  group_name: string;
  item_code: string;
  item_name: string;
  kind_code: string;
  kind_name: string;
  label: string;
}

// ───────────── Cultivation guide (농사로 (신)작목별농업기술정보 / cropEbook) ─────────────

export interface EbookIndex {
  name: string;
  page: number;
  base_page?: number;
  level?: number;
  order?: number;
}

export interface EbookEntry {
  ebook_code: string;
  ebook_name: string;
  file_no: string;
  file_url?: string | null;
  orginl_file_nm?: string | null;
  thumbnail_code?: string | null;
  thumbnail_name?: string | null;
  std_item_code?: string | null;
  std_item_name?: string | null;
  ebook_url?: string | null;
  ebook_mobile_url?: string | null;
  indices: EbookIndex[];
}

export interface CultivationGuide {
  item_code: string;
  kind_code: string;
  crop_name: string;
  sub_category_name?: string | null;
  ebooks: EbookEntry[];
  source?: string | null;
  updated_at?: string | null;
}

export interface CropSummary {
  item_code: string;
  kind_code: string;
  crop_name: string;
  headline: string;
  key_points: string[];
  source_ebook_code?: string | null;
  source_ebook_name?: string | null;
  source_file_url?: string | null;
  text_chars?: number;
  mode?: 'pdf' | 'general';
}

// ───────────── 영농 캘린더 (RAG 농사계획 + 메모 + 일정 재조정) ─────────────

export type TaskCategory =
  | 'seeding'
  | 'growing'
  | 'fertilize'
  | 'water'
  | 'pest'
  | 'harvest'
  | 'etc';

export type TaskStatus = 'planned' | 'done' | 'delayed';

export interface FarmPlanCreate {
  startDate: string; // YYYY-MM-DD
  itemCode: string;
  kindCode: string;
  cropName: string;
  region: string;
  province?: string;
  area: number;
  areaUnit: AreaUnit;
  visitFrequency?: string; // weekly_1 | weekly_2 | weekly_3 | daily
  visitDays?: number[]; // 0=일 ~ 6=토
}

export interface FarmTask {
  id: number;
  title: string;
  detail?: string | null;
  category: TaskCategory;
  dayOffset: number;
  durationDays: number;
  order: number;
  status: TaskStatus;
  date: string; // start_date + day_offset (서버 계산, YYYY-MM-DD)
  endDate: string;
  actualDate?: string | null;
  sourceNote?: string | null;
}

export interface MemoImage {
  id: number;
  url: string; // 정적 서빙 경로(/uploads/...). 표시 시 API 호스트 prefix 필요(mediaUrl).
  originalName?: string | null;
  contentType?: string | null;
  size: number;
}

export interface TaskMemo {
  id: number;
  memoDate: string; // YYYY-MM-DD
  content: string;
  images: MemoImage[];
}

export interface FarmPlan {
  id: number;
  startDate: string;
  cropItemCode: string;
  cropKindCode: string;
  cropName: string;
  region: string;
  province?: string | null;
  area: number;
  areaUnit: AreaUnit;
  visitFrequency?: string | null;
  visitDays?: number[] | null;
  trackProgress: boolean;
  tasks: FarmTask[];
  memos: TaskMemo[];
}