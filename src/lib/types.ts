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
  // weekend-only — 방문 예정 요일 (0=일 ~ 6=토). 주당 방문 횟수가 관리 가능 빈도.
  visitDays?: number[];
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

// ───────────── 작목 카탈로그 (농사로 (신)작목별농업기술정보 / cropEbook) ─────────────
// 캘린더 작물 검색 소스. cropEbook 카테고리 트리의 소분류(=작목).
export interface CropCatalogItem {
  code: string; // subCategoryCode (작목 코드)
  name: string; // subCategoryNm (작목명)
  category: string; // mainCategoryNm (대분류명)
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

// ───────────── 텃밭 캘린더 (RAG 농사계획 + 메모 + 일정 재조정) ─────────────

export type TaskCategory =
  | 'seeding'
  | 'growing'
  | 'fertilize'
  | 'water'
  | 'pest'
  | 'harvest'
  | 'etc';

export type TaskStatus = 'planned' | 'done' | 'delayed' | 'skipped';

// 추천받기(작목 추천) 위저드에서 입력한 재배 조건. 캘린더 일정 생성 시 GPT가 함께 고려.
export interface GrowConditions {
  place?: string; // 재배 장소 (베란다·옥상·노지·실내)
  sunHours?: string; // 일조 시간 (<3h·3~5h·>5h)
  experience?: string; // 영농 경험 (처음·1~2년·3년+)
  facility?: string[]; // 시설 (화분·플랜터·비닐터널·미니온실)
  direction?: string; // 방향 (남향·동향·서향·북향)
}

export interface FarmPlanCreate {
  startDate: string; // YYYY-MM-DD
  name?: string | null; // 텃밭 고유 이름(선택)
  itemCode: string;
  kindCode: string;
  cropName: string;
  region: string;
  province?: string;
  area?: number | null; // 텃밭은 면적 선택 — 미입력이면 생략(소규모로 처리)
  areaUnit: AreaUnit;
  visitFrequency?: string; // weekly_1 | weekly_2 | weekly_3 | daily
  visitDays?: number[]; // 0=일 ~ 6=토
  growConditions?: GrowConditions; // 추천받기 조건 캐리(선택)
  cultivationMethod?: 'direct' | 'seedling' | 'germinate'; // 직파 | 모종 | 발아 후 옮겨심기
  growPlace?: 'pot' | 'field'; // 화분·베란다 | 텃밭·노지
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
  name?: string | null; // 텃밭 고유 이름. 없으면 "{작물} 텃밭"으로 표시.
  cropItemCode: string;
  cropKindCode: string;
  cropName: string;
  cropSlug?: string | null; // 도감 slug(40종) — 도감 딥링크용.
  region: string;
  province?: string | null;
  area: number;
  areaUnit: AreaUnit;
  visitFrequency?: string | null;
  visitDays?: number[] | null;
  trackProgress: boolean;
  // 검증된 수확 인증이 있으면 true → 캘린더에서 '완료'로 분류.
  harvested: boolean;
  tasks: FarmTask[];
  memos: TaskMemo[];
}

// 메모 저장·사진 업로드 응답 — 이번 저장으로 얻은 점수('+N점' 토스트용).
export interface FarmPlanWithPoints extends FarmPlan {
  pointsEarned: number;
  pointsTotal: number;
}

// ───────────── 수확 인증 · 보상 (도감/뱃지/Streak) ─────────────

export interface HarvestRecipe {
  name: string;
  materials?: string; // 재료
  cooking?: string; // 조리 단계
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
  difficulty?: number | null;
  daysToHarvest?: number[] | null; // [최소, 최대] 일
  source: 'nongsaro:monthFd' | 'ai';
  storage: string;
  eating: string;
  nutrition: string;
  seasonMonths: number[];
  recipes: HarvestRecipe[];
  links: HarvestCardLink[];
}

// ───────────── 커뮤니티 게시판 (자랑·나눔) ─────────────

export type PostType = 'show' | 'share'; // 자랑 | 나눔
export type ShareStatus = 'open' | 'closed';
export type ShareRequestStatus = 'pending' | 'accepted' | 'declined';

export interface CommunityComment {
  id: number;
  authorName: string;
  content: string;
  createdAt: string;
  isMine: boolean;
}

export interface ShareRequest {
  id: number;
  requesterName: string;
  message: string;
  status: ShareRequestStatus;
  createdAt: string;
  isMine: boolean;
}

// 피드 카드 (목록). images 는 메모 사진과 동일 형태라 MemoImage 재사용.
// ───────────── 나눔 경매(포인트 입찰) ─────────────
export interface AuctionSummary {
  deadline: string;
  settled: boolean;
  closed: boolean;
  topBid?: number | null;
  bidCount: number;
}

export interface Auction {
  deadline: string;
  settled: boolean;
  closed: boolean;
  topBid?: number | null;
  topBidderName?: string | null;
  bidCount: number;
  myBid?: number | null;
  iAmSeller: boolean;
  winnerIsMe: boolean;
  myAvailable: number;
}

export interface Bid {
  id: number;
  bidderName: string;
  amount: number;
  createdAt: string;
  isMine: boolean;
}

export interface Wallet {
  balance: number;
  available: number;
}

export interface CommunityPostListItem {
  id: number;
  postType: PostType;
  authorName: string;
  cropSlug?: string | null;
  cropName?: string | null;
  title?: string | null;
  contentPreview: string;
  images: MemoImage[];
  likeCount: number;
  commentCount: number;
  shareRequestCount: number;
  likedByMe: boolean;
  isMine: boolean;
  shareStatus: ShareStatus;
  auction?: AuctionSummary | null;
  createdAt: string;
}

export interface CommunityPostDetail {
  id: number;
  postType: PostType;
  authorName: string;
  cropSlug?: string | null;
  cropName?: string | null;
  title?: string | null;
  content: string;
  images: MemoImage[];
  likeCount: number;
  likedByMe: boolean;
  isMine: boolean;
  shareStatus: ShareStatus;
  comments: CommunityComment[];
  shareRequests: ShareRequest[];
  auction?: Auction | null;
  bids: Bid[];
  createdAt: string;
}

export interface LikeToggle {
  liked: boolean;
  likeCount: number;
}

// 도감 카드 '내 기록' 탭 — 이 작물을 키우며 남긴 메모·사진(최신순).
export interface CropJournalOut {
  cropSlug: string;
  cropName: string;
  totalMemos: number;
  totalPhotos: number;
  memos: TaskMemo[];
}

export interface CollectionEntry {
  cropSlug: string;
  cropName: string;
  category: string;
  difficulty?: number | null;
  collected: boolean;
  harvestCount: number;
  level: number; // 수확 레벨(0~maxLevel)
  maxLevel: number;
  nextLevelAt?: number | null; // 다음 레벨 도달 수확 횟수(최고 레벨이면 null)
  nextReward?: number | null; // 다음 레벨 보상 팜
  levelProgress: number; // 다음 레벨까지 진행도 0~1
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
  difficulty: number; // 1~5
  rewardFarm: number; // 획득 시 지급 팜
  achieved: boolean; // 조건 충족(스티키)
  claimed: boolean; // 팜 획득 완료
  claimable: boolean; // 지금 획득 가능(달성+미획득)
  progress: number; // 0~1
  current: number;
  threshold: number;
}

export interface BadgeClaim {
  id: string;
  name: string;
  rewardFarm: number;
  total: number;
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

export interface PointsOut {
  total: number;
  memoCount: number;
  photoCount: number;
  harvestCount: number;
}

export interface AttendanceOut {
  checkedToday: boolean;
  streak: number; // 현재 연속 출석 일수
  cycleDay: number; // 오늘 해당 1~20 사이클 일차(미출석이면 출석 시 받을 일차)
  todayReward: number;
  cycleDays: number; // 사이클 길이(20)
  rewards: number[]; // 길이 20 일차별 보상표
  total: number;
}

export interface AttendanceClaim {
  cycleDay: number;
  reward: number;
  streak: number;
  total: number;
}
// (도감 페이지에서 RewardsSummary.attendance 로 소비)

export interface RewardsSummary {
  collection: CollectionOut;
  badges: BadgeOut[];
  streak: StreakOut;
  points: PointsOut;
  attendance: AttendanceOut;
  compare?: CompareOut | null;
}

// 일지(메모·사진 누적) 기반 수확 인증
export interface JournalVerdict {
  crop_match: boolean;
  growth_consistent: boolean;
  care_consistent: boolean;
  has_harvest: boolean;
  fake_suspect: boolean;
  quantity: string;
  confidence: number;
  reason: string;
  summary: string;
}

export interface HarvestJournalResponse {
  verified: boolean;
  demoMode: boolean;
  recordId?: number | null;
  verdict?: JournalVerdict | null;
  warnings: string[];
  card?: HarvestCard | null; // 통과 시에만
  newBadges: BadgeOut[];
  pointsTotal: number;
  message: string;
  // 실패 시 부족한 점·다음 행동 안내(통과면 빈 배열).
  missing: string[];
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

// 텃밭가꾸기 (재배 정보) — 농사로 fildMnfct
export interface GardenItem {
  cntntsNo: string;
  title: string;
  seCode: string;
  seName: string;
}

export interface GardenDetail {
  cntntsNo: string;
  title: string;
  body: string;
  downUrl?: string | null;
  fileName?: string | null;
}

// 텃밭가꾸기 본문 → GPT 재배 요약(글검색 대신 핵심만).
export interface GardenSource {
  cntntsNo: string;
  title: string;
}

export interface GardenSummary {
  crop: string;
  headline: string;
  keyPoints: string[];
  sources: GardenSource[];
  mode: string; // 'garden'(텃밭 본문 기반) | 'general'(작물명 일반지식)
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
