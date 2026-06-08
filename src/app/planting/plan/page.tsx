'use client';

// 작목 추천 흐름의 마지막 단계 — 추천 결과에서 고른 작물로 영농 캘린더(농사 계획)를 만든다.
// 설정 폼 본체는 캘린더 모듈의 SetupForm 을 재사용한다.

import { Suspense } from 'react';
import { Box, Container, Text } from '@mantine/core';
import { SetupForm } from '@/app/calendar/SetupForm';

export default function PlantingPlanPage() {
  return (
    <Suspense
      fallback={
        <Box bg="gray.0" mih="100vh" py={48}>
          <Container size="sm">
            <Text c="dimmed">불러오는 중…</Text>
          </Container>
        </Box>
      }
    >
      <SetupForm />
    </Suspense>
  );
}
