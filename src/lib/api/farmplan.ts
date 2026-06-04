import { apiClient } from './client';
import type {
  AlertsResponse,
  FarmPlan,
  FarmPlanBatchResult,
  FarmPlanCreate,
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
): Promise<FarmPlan> {
  const { data } = await apiClient.put<FarmPlan>(`/api/v1/plans/${planId}/memos`, {
    memoDate,
    content,
  });
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
): Promise<FarmPlan> {
  const form = new FormData();
  for (const f of files) form.append('files', f);
  const { data } = await apiClient.post<FarmPlan>(
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
