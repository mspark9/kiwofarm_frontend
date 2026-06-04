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

// ───────────── 수확 인증 · 보상 (도감/뱃지/Streak) ─────────────

export interface HarvestRecipe {
  name: string;
  nutrients: Record<string, string>;
}

export interface HarvestCardLink {
  label: string;
  url: string;
}

export interface HarvestCard {
  cropSlug: string;
  cropName: string;
  category: string;
  source: 'nongsaro:monthFd' | 'ai';
  storage: string;
  eating: string;
  nutrition: string;
  seasonMonths: number[];
  recipes: HarvestRecipe[];
  links: HarvestCardLink[];
}

export interface CollectionEntry {
  cropSlug: string;
  cropName: string;
  category: string;
  difficulty?: number | null;
  collected: boolean;
  harvestCount: number;
  firstHarvestedAt?: string | null;
  lastHarvestedAt?: string | null;
}

export interface CollectionOut {
  totalCrops: number;
  collectedCrops: number;
  totalHarvests: number;
  entries: CollectionEntry[];
}

export interface BadgeOut {
  id: string;
  emoji: string;
  name: string;
  description: string;
  achieved: boolean;
  progress: number; // 0~1
  current: number;
  threshold: number;
}

export interface StreakOut {
  current: number;
  best: number;
  todayLogged: boolean;
  totalActiveDays: number;
}

export interface CropCompareOut {
  cropSlug: string;
  cropName: string;
  growers: number;
  completionRate: number;
  harvested: boolean;
  message: string;
}

export interface CompareOut {
  weeklyActiveDays: number;
  topPercent: number; // 상위 X%
  aboveMedian: boolean;
  message: string; // 긍정형 문구 (중앙값 미만이면 격려)
  communitySize: number;
  crop?: CropCompareOut | null;
}

export interface RewardsSummary {
  collection: CollectionOut;
  badges: BadgeOut[];
  streak: StreakOut;
  compare?: CompareOut | null;
}

// ───────────── 주간 다이제스트 · 위기 알림 (캘린더) ─────────────

// 주간 다이제스트 (이번 주 할 일 3가지 + 코칭 한 줄)
export interface WeeklyTask {
  id: number;
  title: string;
  category: TaskCategory;
  date: string; // YYYY-MM-DD
  status: TaskStatus;
  message: string; // 그 작업 맞춤 코칭 멘트(알림 본문)
}

export interface WeeklyDigest {
  weekStart: string; // 월요일
  weekEnd: string; // 일요일
  tasks: WeeklyTask[];
}

// 위기 알림 (병해충 발생정보 + 기상 특보) — 트윈의 CrisisAlert 와 구분해 PlanAlert.
export interface PlanAlert {
  type: string; // pest | weather
  severity: string; // info | warn | danger
  title: string;
  detail: string;
  source: string;
  link?: string | null;
  date?: string | null;
}

export interface AlertsResponse {
  alerts: PlanAlert[];
}

// 여러 작물 계획 일괄 생성 (POST /api/v1/plans/batch)
export interface BatchFailure {
  index: number; // 입력 배열에서의 위치
  cropName: string;
  error: string;
}

export interface FarmPlanBatchResult {
  created: FarmPlan[];
  failed: BatchFailure[];
}
