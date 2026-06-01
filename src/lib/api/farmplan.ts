import { apiClient } from './client';
import type { FarmPlan, FarmPlanCreate, TaskStatus } from '@/lib/types';

// 계획 생성: 농사로 PDF 다운 → 임베딩 → RAG → GPT 로 길어 타임아웃을 넉넉히.
export async function createPlan(payload: FarmPlanCreate): Promise<FarmPlan> {
  const { data } = await apiClient.post<FarmPlan>('/api/v1/plans', payload, {
    timeout: 120_000,
  });
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
