'use client';

// 캘린더 가이드 투어 — 화면을 어둡게 깔고 한 요소만 스포트라이트로 비추며 설명한다.
// 대상은 data-tour="..." 셀렉터로 찾는다. 오버레이를 클릭하거나 '다음'으로 진행.

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Button, Card, Group, Text } from '@mantine/core';

export interface TourStep {
  selector: string; // 예: '[data-tour="harvest"]'
  title: string;
  body: string;
}

const PAD = 8;
const CARD_W = 340;

export function CalendarTour({
  steps,
  active,
  onClose,
}: {
  steps: TourStep[];
  active: boolean;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (active) setIdx(0);
  }, [active]);

  // 튜토리얼 중 사용자 스크롤 차단(휠·터치·스크롤 키). 투어의 scrollIntoView 는
  // 프로그램 스크롤이라 막히지 않으므로 단계 이동 시 대상으로는 정상 이동한다.
  useEffect(() => {
    if (!active) return;
    const block = (e: Event) => e.preventDefault();
    const SCROLL_KEYS = [
      'ArrowUp',
      'ArrowDown',
      'PageUp',
      'PageDown',
      'Home',
      'End',
      ' ',
    ];
    const blockKey = (e: KeyboardEvent) => {
      if (SCROLL_KEYS.includes(e.key)) e.preventDefault();
    };
    window.addEventListener('wheel', block, { passive: false });
    window.addEventListener('touchmove', block, { passive: false });
    window.addEventListener('keydown', blockKey);
    return () => {
      window.removeEventListener('wheel', block);
      window.removeEventListener('touchmove', block);
      window.removeEventListener('keydown', blockKey);
    };
  }, [active]);

  useEffect(() => {
    if (!active) {
      setRect(null);
      return;
    }
    const step = steps[idx];
    if (!step) return;
    const measure = () => {
      const el = document.querySelector(step.selector) as HTMLElement | null;
      setRect(el ? el.getBoundingClientRect() : null);
    };
    const el = document.querySelector(step.selector) as HTMLElement | null;
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    // 날짜 선택/스크롤로 레이아웃이 바뀔 수 있어 여러 시점에 재측정.
    const timers = [0, 120, 360, 600].map((d) => window.setTimeout(measure, d));
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [active, idx, steps]);

  if (!active || !mounted) return null;

  const last = idx === steps.length - 1;
  const finish = () => {
    setIdx(0);
    onClose();
  };
  const next = () => (last ? finish() : setIdx((i) => i + 1));
  const step = steps[idx];

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardW = Math.min(CARD_W, vw - 24);
  let cardTop = vh / 2 - 90;
  let cardLeft = vw / 2 - cardW / 2;
  if (rect) {
    const below = rect.bottom + 200 < vh;
    cardTop = below
      ? rect.bottom + PAD + 12
      : Math.max(12, rect.top - PAD - 200);
    cardLeft = Math.min(Math.max(12, rect.left), vw - cardW - 12);
  }

  return createPortal(
    <Box style={{ position: 'fixed', inset: 0, zIndex: 2000 }}>
      {/* 클릭하면 다음 단계 */}
      <Box
        onClick={next}
        style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}
      />
      {/* 스포트라이트(구멍) — box-shadow 로 바깥을 어둡게 */}
      {rect ? (
        <Box
          style={{
            position: 'absolute',
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            borderRadius: 14,
            boxShadow: '0 0 0 9999px rgba(15,23,42,0.74)',
            border: '2px solid var(--mantine-color-green-4)',
            pointerEvents: 'none',
            transition: 'top 220ms ease, left 220ms ease, width 220ms ease, height 220ms ease',
          }}
        />
      ) : (
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(15,23,42,0.74)',
            pointerEvents: 'none',
          }}
        />
      )}
      {/* 설명 카드 */}
      <Card
        shadow="xl"
        radius="lg"
        p="md"
        withBorder
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: cardTop,
          left: cardLeft,
          width: cardW,
          maxWidth: 'calc(100vw - 24px)',
        }}
      >
        <Group justify="space-between" mb={4} wrap="nowrap">
          <Text fw={800}>{step.title}</Text>
          <Text size="xs" c="dimmed">
            {idx + 1} / {steps.length}
          </Text>
        </Group>
        <Text size="sm" c="gray.7" style={{ lineHeight: 1.6 }}>
          {step.body}
        </Text>
        <Group justify="space-between" mt="md">
          <Button size="xs" variant="subtle" color="gray" onClick={finish}>
            건너뛰기
          </Button>
          <Button size="xs" color="green" onClick={next}>
            {last ? '완료' : '다음'}
          </Button>
        </Group>
      </Card>
    </Box>,
    document.body,
  );
}
