'use client';

// 인증/사용자 개념이 없어 백엔드에 "내 계획 목록"이 없다.
// 생성·방문한 농사계획 ID를 localStorage 에 모아 여러 작물 탭/모두보기를 구성한다.

import { useCallback, useEffect, useState } from 'react';

const KEY = 'kiwofarm:planIds';

function read(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
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
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* 용량 초과 등은 무시 */
  }
}

export function usePlanIds() {
  const [ids, setIds] = useState<number[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
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
