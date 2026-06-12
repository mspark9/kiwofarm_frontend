import { apiClient } from './client';
import type {
  AlertsResponse,
  FarmPlan,
  FarmPlanBatchResult,
  FarmPlanCreate,
  FarmPlanWithPoints,
  TaskStatus,
  WeeklyDigest,
} from '@/lib/types';

// 위기 알림(병해충 발생정보 + 기상 특보). 작물 계획의 지역 기준.
export async function getPlanAlerts(planId: number): Promise<AlertsResponse> {
  const { data } = await apiClient.get<AlertsResponse>(
    `/api/v1/plans/${planId}/alerts`,
    { timeout: 15_000 },
  );
  return data;
}

// 이번 주(기준일이 속한 주) 할 일 3가지 + LLM 코칭 한 줄.
export async function getWeeklyDigest(
  planId: number,
  dateStr: string,
): Promise<WeeklyDigest> {
  const { data } = await apiClient.get<WeeklyDigest>(
    `/api/v1/plans/${planId}/weekly`,
    { params: { date: dateStr }, timeout: 20_000 },
  );
  return data;
}

// 계획 생성: 농사로 PDF 다운 → 임베딩 → RAG → GPT 로 길어 타임아웃을 넉넉히.
export async function createPlan(payload: FarmPlanCreate): Promise<FarmPlan> {
  const { data } = await apiClient.post<FarmPlan>('/api/v1/plans', payload, {
    timeout: 120_000,
  });
  return data;
}

// 여러 작물 계획을 한 번에 생성(서버에서 최대 4개 동시 처리). 개별 실패는 failed 로 보고.
export async function createPlansBatch(
  plans: FarmPlanCreate[],
): Promise<FarmPlanBatchResult> {
  const { data } = await apiClient.post<FarmPlanBatchResult>(
    '/api/v1/plans/batch',
    { plans },
    { timeout: 180_000 },
  );
  return data;
}

export async function getPlan(planId: number): Promise<FarmPlan> {
  const { data } = await apiClient.get<FarmPlan>(`/api/v1/plans/${planId}`);
  return data;
}

// 농사 계획 삭제(작업·메모·사진 cascade).
export async function deletePlan(planId: number): Promise<void> {
  await apiClient.delete(`/api/v1/plans/${planId}`);
}

// 현재 사용자(로그인 계정 또는 게스트)의 계획 요약 목록 — 캘린더 탭 구성용.
export async function listPlans(): Promise<{ id: number; cropName: string }[]> {
  const { data } = await apiClient.get<{ id: number; cropName: string }[]>('/api/v1/plans');
  return data;
}

export async function updateSettings(
  planId: number,
  trackProgress: boolean,
): Promise<FarmPlan> {
  const { data } = await apiClient.patch<FarmPlan>(
    `/api/v1/plans/${planId}/settings`,
    { trackProgress },
  );
  return data;
}

// 경작 포기 — 삭제하지 않고 abandoned=true 로 표시(완료 탭에 '포기' 뱃지로 남음).
export async function abandonPlan(planId: number): Promise<FarmPlan> {
  const { data } = await apiClient.patch<FarmPlan>(
    `/api/v1/plans/${planId}/settings`,
    { abandoned: true },
  );
  return data;
}

// 텃밭 고유 이름 변경. 빈 문자열이면 백엔드가 기본값(null)로 비운다.
export async function renamePlan(planId: number, name: string): Promise<FarmPlan> {
  const { data } = await apiClient.patch<FarmPlan>(
    `/api/v1/plans/${planId}/settings`,
    { name },
  );
  return data;
}

export async function updateTask(
  planId: number,
  taskId: number,
  status: TaskStatus,
  delayDays?: number,
): Promise<FarmPlan> {
  const { data } = await apiClient.patch<FarmPlan>(
    `/api/v1/plans/${planId}/tasks/${taskId}`,
    { status, delayDays },
  );
  return data;
}

// 작업 삭제 — 내 텃밭에 맞지 않는 작업을 계획에서 제거.
export async function deleteTask(planId: number, taskId: number): Promise<FarmPlan> {
  const { data } = await apiClient.delete<FarmPlan>(
    `/api/v1/plans/${planId}/tasks/${taskId}`,
  );
  return data;
}

// 예정 작업을 실제로 한 날짜에 완료로 기록 + 이후 일정 자동 재정비(앞/뒤 이동).
export async function logTask(
  planId: number,
  taskId: number,
  date: string,
): Promise<FarmPlan> {
  const { data } = await apiClient.post<FarmPlan>(
    `/api/v1/plans/${planId}/tasks/${taskId}/log`,
    { date },
  );
  return data;
}

// 직접 입력한 작업을 해당 날짜에 완료로 기록.
export async function addTask(
  planId: number,
  body: { title: string; date: string; category?: string },
): Promise<FarmPlan> {
  const { data } = await apiClient.post<FarmPlan>(`/api/v1/plans/${planId}/tasks`, body);
  return data;
}

// 남은 일정을 오늘 기준으로 다시 맞춤.
export async function reschedulePlan(planId: number): Promise<FarmPlan> {
  const { data } = await apiClient.post<FarmPlan>(
    `/api/v1/plans/${planId}/reschedule`,
  );
  return data;
}

// 같은 날짜의 여러 작업을 한 번에 같은 일수만큼 지연. 대상은 그대로 이동, 이후 일정만 방문요일 스냅.
export async function delayTasksBatch(
  planId: number,
  taskIds: number[],
  delayDays: number,
): Promise<FarmPlan> {
  const { data } = await apiClient.patch<FarmPlan>(
    `/api/v1/plans/${planId}/tasks/delay-batch`,
    { taskIds, delayDays },
  );
  return data;
}

export async function upsertMemo(
  planId: number,
  memoDate: string,
  content: string,
): Promise<FarmPlanWithPoints> {
  const { data } = await apiClient.put<FarmPlanWithPoints>(
    `/api/v1/plans/${planId}/memos`,
    { memoDate, content },
  );
  return data;
}

// 메모 삭제(텍스트 + 사진 일괄). 백엔드가 디스크 파일도 정리한다.
export async function deleteMemo(planId: number, memoDate: string): Promise<FarmPlan> {
  const { data } = await apiClient.delete<FarmPlan>(
    `/api/v1/plans/${planId}/memos/${memoDate}`,
  );
  return data;
}

// 메모에 사진 첨부(여러 장 가능). 메모가 없으면 백엔드가 자동 생성.
export async function uploadMemoImages(
  planId: number,
  memoDate: string,
  files: File[],
): Promise<FarmPlanWithPoints> {
  const form = new FormData();
  for (const f of files) form.append('files', f);
  const { data } = await apiClient.post<FarmPlanWithPoints>(
    `/api/v1/plans/${planId}/memos/${memoDate}/images`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60_000 },
  );
  return data;
}

// 메모 사진 한 장 삭제(파일 + DB).
export async function deleteMemoImage(
  planId: number,
  imageId: number,
): Promise<FarmPlan> {
  const { data } = await apiClient.delete<FarmPlan>(
    `/api/v1/plans/${planId}/memos/images/${imageId}`,
  );
  return data;
}
