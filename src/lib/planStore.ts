'use client';

// 생성·방문한 농사계획 ID를 localStorage 에 모아 여러 작물 탭/모두보기를 구성한다.
// 식별자(계정)별로 분리한다 — 게스트(demo)와 로그인 계정의 계획 id 가 섞이면
// 계정 전환 후 남의 계획을 불러와 404 가 난다. 로그인/로그아웃은 전체 새로고침을
// 동반하므로 마운트 시점의 키만 정확하면 된다.

import { useCallback, useEffect, useState } from 'react';
import { getUsername } from '@/lib/auth';

const BASE = 'kiwofarm:planIds';
const LEGACY_KEY = BASE; // 계정 분리 이전의 단일 키(스키마 v1).

// 현재 식별자별 저장 키. 로그인=username, 게스트='guest'.
function storageKey(): string {
  if (typeof window === 'undefined') return BASE;
  const user = getUsername();
  return `${BASE}:${user ?? 'guest'}`;
}

function read(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey());
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
      : [];
  } catch {
    return [];
  }
}

function write(ids: number[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(), JSON.stringify(ids));
  } catch {
    /* 용량 초과 등은 무시 */
  }
}

// 구버전 단일 키 정리. 계정 구분 없이 섞여 있어 그대로 이관하면 stale id 가
// 재유입되므로 병합 없이 제거한다(서버 목록 GET /plans 가 올바른 id 를 다시 채움).
function dropLegacyKey(): void {
  if (typeof window === 'undefined') return;
  try {
    // 분리 키와 우연히 같지 않을 때만 제거(현재 키를 지우지 않도록).
    if (storageKey() !== LEGACY_KEY) window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* 무시 */
  }
}

export function usePlanIds() {
  const [ids, setIds] = useState<number[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    dropLegacyKey();
    setIds(read());
    setReady(true);
  }, []);

  const add = useCallback((id: number) => {
    setIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      write(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: number) => {
    setIds((prev) => {
      if (!prev.includes(id)) return prev;
      const next = prev.filter((x) => x !== id);
      write(next);
      return next;
    });
  }, []);

  return { ids, ready, add, remove };
}
