'use client';

// 핵심 기능 7가지 슬라이더
// 화면폭에 맞춰 보이는 개수 조정

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Badge,
  Box,
  Card,
  Group,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { useInterval, useMediaQuery } from '@mantine/hooks';
import {
  IconArrowUpRight,
  IconAward,
  IconBook2,
  IconCalendarEvent,
  IconLeaf,
  IconMessageCircle,
  IconUsersGroup,
} from '@tabler/icons-react';

const MAX_PER_VIEW = 4; // 가장 넓은 화면에서 한 번에 보이는 카드 수
const AUTOPLAY_MS = 3000;
const GUTTER = 16; // 카드 사이 간격(px)

const FEATURES: {
  icon: ReactNode;
  title: string;
  desc: string;
  tag: string;
  color: string;
  href: string;
  disabled?: boolean;
}[] = [
  {
    icon: <IconLeaf size={22} />,
    title: '작목 추천',
    desc: '지역·장소·일조로 지금 심기 좋은 작목 가려내기',
    tag: '농사로 데이터 · AI 설명',
    color: 'green',
    href: '/planting',
  },
  {
    icon: <IconMessageCircle size={22} />,
    title: '챗봇 상담',
    desc: '작목·재배 궁금증을 AI 챗봇에게 바로 물어보기',
    tag: 'RAG 챗봇 상담',
    color: 'teal',
    href: '/planting/chat',
  },
  {
    icon: <IconBook2 size={22} />,
    title: '재배 정보',
    desc: '작목 검색 → 농사로 길잡이 + GPT 키포인트 + PDF',
    tag: '농사로 · 작목별농업기술정보',
    color: 'grape',
    href: '/cultivation',
  },
  {
    icon: <IconCalendarEvent size={22} />,
    title: '텃밭 캘린더',
    desc: '날짜별 농사 계획 · 작업 일정 자동 생성',
    tag: '농사 계획 빌더',
    color: 'lime',
    href: '/calendar',
  },
  {
    icon: <IconBook2 size={22} />,
    title: '작물 도감',
    desc: '수확 인증으로 도감을 채워 나가기',
    tag: '도감 컬렉션',
    color: 'orange',
    href: '/collection',
  },
  {
    icon: <IconAward size={22} />,
    title: '뱃지 도감',
    desc: '연속 기록·활동으로 뱃지 모으기',
    tag: '뱃지 · Streak',
    color: 'yellow',
    href: '/badges',
  },
  {
    icon: <IconUsersGroup size={22} />,
    title: '커뮤니티',
    desc: '주말 직거래·이웃 나눔으로 작물 주고받기',
    tag: '직거래 · 나눔',
    color: 'cyan',
    href: '/community',
  },
];

const N = FEATURES.length;

export function FeatureCarousel() {
  // 화면폭에 맞춘 보이는 카드 수. 좁아질수록 1개까지 줄인다
  const xs = useMediaQuery('(min-width: 36em)');
  const sm = useMediaQuery('(min-width: 48em)');
  const md = useMediaQuery('(min-width: 62em)');
  const perView = Math.min(MAX_PER_VIEW, md ? 4 : sm ? 3 : xs ? 2 : 1);
  // 모바일(한 장만 보이는 폭)에서는 슬라이드 없이 세로로 일렬 나열
  const isMobile = perView === 1;

  // useMediaQuery 는 마운트 후 effect 에서 실제 값을 읽으므로, 첫 렌더(SSR 포함)
  // 에서는 항상 perView 1 로 잡힌다. 그대로 본문을 그리면 캐러셀이 잠깐 세로
  // 일렬로 보였다가 바뀐다 → 마운트 전까지 스켈레톤으로 가린다
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // 무한 순환. start 는 0..N 으로만 움직인다(Math.min 으로 상한 고정). start === N
  // 은 맨 앞으로 되돌아온 복제 프레임([1234])이라, 슬라이드가 끝나면 애니메이션을
  // 끄고 0 으로 순간 스냅한다. rAF/transitionend 대신 타이머로 처리한다 -
  // 백그라운드 탭에선 rAF·transition 이벤트가 멈춰 start 가 범위를 벗어나기 때문.
  const [start, setStart] = useState(0);
  const [animate, setAnimate] = useState(true);

  const autoplay = useInterval(
    () => setStart((s) => Math.min(s + 1, N)),
    AUTOPLAY_MS,
  );

  useEffect(() => {
    if (isMobile) return;
    autoplay.start();
    return autoplay.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  // 복제 프레임([1234])까지 슬라이드한 뒤, 전환이 끝날 즈음 애니메이션 없이 0 으로.
  useEffect(() => {
    if (start < N) return;
    const id = setTimeout(() => {
      setAnimate(false);
      setStart(0);
    }, 550);
    return () => clearTimeout(id);
  }, [start]);

  // 스냅 직후 다시 애니메이션을 켠다(위치 변화가 없어 시각적 점프 없음).
  useEffect(() => {
    if (animate) return;
    const id = setTimeout(() => setAnimate(true), 30);
    return () => clearTimeout(id);
  }, [animate]);

  // 마운트 전: breakpoint별 개수는 CSS(SimpleGrid)로 맞춘 스켈레톤만 보여준다
  if (!mounted) {
    return (
      <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 4 }} spacing="lg">
        {Array.from({ length: MAX_PER_VIEW }, (_, i) => (
          <FeatureSkeleton key={i} />
        ))}
      </SimpleGrid>
    );
  }

  if (isMobile) {
    return (
      <Stack gap="lg">
        {FEATURES.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </Stack>
    );
  }

  const slotPct = 100 / perView;
  // 끝에서 앞 perView 장을 복제해 마지막 윈도우([7123])가 매끄럽게 채워지도록
  const items = [...FEATURES, ...FEATURES.slice(0, perView)];

  return (
    <Box onMouseEnter={autoplay.stop} onMouseLeave={autoplay.start}>
      <Box style={{ overflow: 'hidden' }}>
        <Box
          style={{
            display: 'flex',
            transform: `translateX(-${start * slotPct}%)`,
            transition: animate ? 'transform 500ms ease' : 'none',
          }}
        >
          {items.map((f, i) => (
            <Box
              key={`${f.title}-${i}`}
              style={{
                flex: `0 0 ${slotPct}%`,
                maxWidth: `${slotPct}%`,
                paddingInline: GUTTER / 2,
                boxSizing: 'border-box',
              }}
            >
              <FeatureCard {...f} />
            </Box>
          ))}
        </Box>
      </Box>

      <Group justify="center" gap={8} mt="xl">
        {FEATURES.map((_, i) => {
          const active = start % N === i;
          return (
            <UnstyledButton
              key={i}
              onClick={() => setStart(i)}
              aria-label={`${i + 1}번째 위치로 이동`}
              aria-current={active}
              style={{
                width: active ? 24 : 8,
                height: 8,
                borderRadius: 999,
                background: active
                  ? 'var(--mantine-color-green-6)'
                  : 'var(--mantine-color-gray-3)',
                transition: 'width 220ms ease, background 220ms ease',
              }}
            />
          );
        })}
      </Group>
    </Box>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  tag,
  color,
  href,
  disabled,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  tag: string;
  color: string;
  href: string;
  disabled?: boolean;
}) {
  const baseStyle = {
    borderColor: 'var(--mantine-color-gray-2)',
    background: 'white',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease',
  };

  const inner = (
    <Stack gap="md" h="100%">
      <Group justify="space-between" align="flex-start">
        <ThemeIcon size={48} radius="md" variant="light" color={color}>
          {icon}
        </ThemeIcon>
        {disabled ? (
          <Badge size="xs" color="gray" variant="light" radius="sm">
            준비 중
          </Badge>
        ) : (
          <IconArrowUpRight size={16} color="var(--mantine-color-gray-5)" />
        )}
      </Group>
      <Box>
        <Title order={5} mb={6} fz={17}>
          {title}
        </Title>
        <Text size="sm" c="dimmed" lh={1.6}>
          {desc}
        </Text>
      </Box>
      <Badge
        variant="light"
        color={color}
        radius="sm"
        size="sm"
        mt="auto"
        style={{ alignSelf: 'flex-start' }}
      >
        {tag}
      </Badge>
    </Stack>
  );

  if (disabled) {
    return (
      <Card
        radius="lg"
        p="lg"
        withBorder
        h="100%"
        style={{ ...baseStyle, opacity: 0.5, cursor: 'default' }}
      >
        {inner}
      </Card>
    );
  }

  return (
    <Card
      component={Link}
      href={href}
      radius="lg"
      p="lg"
      withBorder
      h="100%"
      className="kw-feature-card"
      style={baseStyle}
    >
      {inner}
    </Card>
  );
}

// FeatureCard 와 같은 골격의 로딩 자리표시자
function FeatureSkeleton() {
  return (
    <Card
      radius="lg"
      p="lg"
      withBorder
      h="100%"
      style={{ borderColor: 'var(--mantine-color-gray-2)', background: 'white' }}
    >
      <Stack gap="md" h="100%">
        <Skeleton h={48} w={48} radius="md" />
        <Box>
          <Skeleton h={18} w="55%" mb={10} radius="sm" />
          <Skeleton h={10} mb={6} radius="sm" />
          <Skeleton h={10} w="80%" radius="sm" />
        </Box>
        <Skeleton h={20} w={130} radius="sm" mt="auto" />
      </Stack>
    </Card>
  );
}
