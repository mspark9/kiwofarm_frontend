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
  message?: string | null;
}
