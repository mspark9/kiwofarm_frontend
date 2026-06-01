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

export interface TaskMemo {
  id: number;
  memoDate: string; // YYYY-MM-DD
  content: string;
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

// ───────────── Shipping dashboard (existing) ─────────────

export interface PricePoint {
  date: string;
  price: number;
  is_forecast: boolean;
  forecast_low?: number | null;
  forecast_high?: number | null;
}

export interface ShippingDecision {
  score_today: number;
  score_in_3d: number;
  price_today: number;
  price_in_3d: number;
  recommendation: string;
  delta_pct: number;
}

export interface PeerFarmStat {
  region: string;
  total_farms: number;
  farms_aligned: number;
  note: string;
}

export interface ShippingDashboard {
  crop_id: string;
  crop_name: string;
  region: string;
  updated_at: string;
  decision: ShippingDecision;
  price_series: PricePoint[];
  peer: PeerFarmStat;
}

// ───────────── 최근일자 도매가 (KAMIS dailyPriceByCategoryList) ─────────────

export interface RecentPriceResponse {
  found: boolean;
  crop_name: string;
  item_code: string;
  product_cls?: string | null; // "도매" / "소매"
  kind_name?: string | null;
  rank?: string | null;
  unit?: string | null;
  obs_date?: string | null;
  price?: number | null;
  prev_price?: number | null;
  delta_pct?: number | null;
  message?: string | null;
}

// ───────────── 최근 가격추이 (recentlyPriceTrendList) ─────────────

export interface TrendPoint {
  label: string;
  price: number;
}

export interface PriceTrendResponse {
  found: boolean;
  crop_name: string;
  unit?: string | null;
  rank?: string | null;
  points: TrendPoint[];
  latest?: number | null;
  year_ago?: number | null;
  normal?: number | null;
  month_high?: number | null;
  month_low?: number | null;
  message?: string | null;
}

// ───────────── 가격 예측 (Prophet) ─────────────

export interface ForecastResponse {
  found: boolean;
  crop_name: string;
  unit?: string | null;
  method?: string | null; // "prophet" / "linear"
  horizon_days?: number;
  series: PricePoint[]; // 최근 실측 + 예측 (is_forecast 로 구분)
  forecast_last?: number | null;
  forecast_last_low?: number | null;
  forecast_last_high?: number | null;
  message?: string | null;
}

// ───────────── AI 출하 조언 ─────────────

export interface ShippingAdviceResponse {
  found: boolean;
  crop_name: string;
  advice: string;
  source: string; // "ai" / "rule" / "none"
  current_price?: number | null;
  unit?: string | null;
  vs_prev_pct?: number | null;
  vs_year_ago_pct?: number | null;
  vs_normal_pct?: number | null;
  trend_pct?: number | null;
  volatility_pct?: number | null;
  direction?: string | null;
  forecast_price?: number | null;
  forecast_pct?: number | null;
  forecast_days?: number | null;
  message?: string | null;
}

// ───────────── 판매 도우미 (로컬푸드 직매장 + 채널 비교) ─────────────

export interface StoreOut {
  id: number;
  name: string;
  operator: string;
  sido: string;
  sigungu: string;
  address: string;
  phone: string;
  opened: string;
  lat?: number | null;
  lng?: number | null;
  distance_km?: number | null;
}

export interface NearbyResponse {
  found: boolean;
  origin_lat?: number | null;
  origin_lng?: number | null;
  origin_label?: string | null;
  stores: StoreOut[];
  message?: string | null;
}

export interface ChannelOut {
  key: string; // "direct" | "wholesale"
  label: string;
  source_price: number;
  source_unit: string;
  unit_price?: number | null; // 기준단위(kg 또는 개)당 단가
  gross?: number | null;
  commission_pct: number;
  net?: number | null;
  note: string;
  estimated: boolean;
}

export interface CompareResponse {
  found: boolean;
  crop_name: string;
  amount?: number | null;
  amount_unit: string; // 'kg' | '개'
  input_mode: string; // 'weight' | 'count'
  obs_date?: string | null;
  channels: ChannelOut[];
  best_key?: string | null;
  delta_net?: number | null;
  message?: string | null;
}

// ───────────── 위치 기반 채널 추천 (가격 + 운송비 + AI) ─────────────

export interface MarketOut {
  id: number;
  name: string;
  category: string;
  sido: string;
  opened: string;
  corp_count?: number | null;
  merchant_count?: number | null;
  lat?: number | null;
  lng?: number | null;
  distance_km?: number | null;
}

export interface PlaceOut {
  kind: string; // 'direct' | 'wholesale'
  name: string;
  distance_km: number;
  sido: string;
  address: string;
  phone: string;
  lat?: number | null;
  lng?: number | null;
}

export interface RecommendChannelOut {
  key: string;
  label: string;
  net?: number | null;
  unit_price?: number | null;
  source_price: number;
  source_unit: string;
  commission_pct: number;
  note: string;
  estimated: boolean;
  place?: PlaceOut | null;
  transport_cost?: number | null;
  net_after?: number | null;
}

export interface RecommendResponse {
  found: boolean;
  crop_name: string;
  amount?: number | null;
  amount_unit: string;
  input_mode: string;
  obs_date?: string | null;
  origin_lat?: number | null;
  origin_lng?: number | null;
  origin_label?: string | null;
  channels: RecommendChannelOut[];
  best_key?: string | null;
  delta_net_after?: number | null;
  per_km_won: number;
  advice: string;
  advice_source: string; // 'ai' | 'rule' | 'none'
  nearby_direct: StoreOut[];
  nearby_wholesale: MarketOut[];
  message?: string | null;
}

// 출하 → 판매 인계 (sessionStorage: kiwofarm:sales)
export interface SalesHandoff {
  crop: CropOption;
  amount?: number | null;
}

// ───────────── 정부 지원사업 매칭 ─────────────

export interface ApplyInfo {
  where: string;
  link: string;
  phone: string;
}

export interface ProgramOut {
  id: number;
  name: string;
  agency: string;
  category: string;
  summary: string;
  support: string;
  status: string; // 'eligible' | 'check'
  reasons: string[];
  notes: string;
  audience: string[];
  apply: ApplyInfo;
  source_url: string;
}

export interface SupportMatchResponse {
  found: boolean;
  mode: string;
  age?: number | null;
  province?: string | null;
  advice: string;
  advice_source: string; // 'ai' | 'rule' | 'none'
  eligible_count: number;
  check_count: number;
  excluded_count: number;
  programs: ProgramOut[];
  message?: string | null;
}
