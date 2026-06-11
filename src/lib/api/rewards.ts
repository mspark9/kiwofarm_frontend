import { apiClient } from '@/lib/api/client';
import type {
  AttendanceClaim,
  BadgeClaim,
  BadgeOut,
  CompareOut,
  CropJournalOut,
  HarvestCard,
  HarvestJournalResponse,
  RewardsSummary,
} from '@/lib/types';

export async function fetchRewardsSummary(): Promise<RewardsSummary> {
  const { data } = await apiClient.get<RewardsSummary>('/api/v1/rewards/summary');
  return data;
}

// 뱃지 도감 — 전체 뱃지(달성·획득·획득가능·난이도·획득팜).
export async function fetchBadges(): Promise<BadgeOut[]> {
  const { data } = await apiClient.get<BadgeOut[]>('/api/v1/rewards/badges');
  return data;
}

// 뱃지 획득 — 달성한 뱃지의 팜을 적립. 미달성=400, 중복=409.
export async function claimBadge(badgeId: string): Promise<BadgeClaim> {
  const { data } = await apiClient.post<BadgeClaim>(
    `/api/v1/rewards/badges/${badgeId}/claim`,
  );
  return data;
}

// 오늘 출석 — 연속 일차 보상 적립. 중복 출석은 409.
export async function checkInAttendance(): Promise<AttendanceClaim> {
  const { data } = await apiClient.post<AttendanceClaim>(
    '/api/v1/rewards/attendance/check-in',
  );
  return data;
}

export async function fetchCompare(cropSlug?: string): Promise<CompareOut> {
  const { data } = await apiClient.get<CompareOut>('/api/v1/rewards/compare', {
    params: cropSlug ? { crop_slug: cropSlug } : undefined,
  });
  return data;
}

export async function fetchHarvestCard(cropSlug: string): Promise<HarvestCard> {
  const { data } = await apiClient.get<HarvestCard>(`/api/v1/harvest/card/${cropSlug}`);
  return data;
}

// 도감 카드 '내 기록' 탭 — 이 작물을 키우며 남긴 메모·사진(최신순).
export async function fetchCropJournal(cropSlug: string): Promise<CropJournalOut> {
  const { data } = await apiClient.get<CropJournalOut>(
    `/api/v1/harvest/crop-journal/${cropSlug}`,
  );
  return data;
}

// '수확했어요' — 캘린더 일지(메모·사진)를 AI 가 분석해 수확 인증 + 도감 등록.
// 사진 여러 장을 멀티모달로 판정하므로 타임아웃을 넉넉히.
export async function verifyHarvestJournal(
  planId: number,
): Promise<HarvestJournalResponse> {
  const { data } = await apiClient.post<HarvestJournalResponse>(
    '/api/v1/harvest/verify-journal',
    { planId },
    { timeout: 120_000 },
  );
  return data;
}
