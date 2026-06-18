import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './page.module.css';
import { HomeCta } from '@/components/home/HomeCta';
import { GuestOnly, HomeHeroSwitch } from '@/components/home/HomeBranch';
import { SiteFooter } from '@/components/home/SiteFooter';
import {
  Badge,
  Box,
  Card,
  Container,
  Grid,
  GridCol,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconArrowUpRight,
  IconAward,
  IconBook2,
  IconCalendarEvent,
  IconDatabase,
  IconLeaf,
  IconMessageCircle,
  IconPencil,
  IconPhoto,
  IconShieldCheck,
  IconSparkles,
  IconUsersGroup,
} from '@tabler/icons-react';

export default function HomePage() {
  return (
    <Box style={{ background: 'white' }}>
      <HomeHeroSwitch>
        <Hero />
      </HomeHeroSwitch>
      <GuestOnly>
        <Features />
        <Stats />
        <FinalCTA />
      </GuestOnly>
      <SiteFooter />
    </Box>
  );
}

function Hero() {
  return (
    <Box style={{ background: 'linear-gradient(180deg, #f6fbf6 0%, #ffffff 72%)' }}>
      <Container size="xl" py={{ base: 56, md: 104 }}>
        <Grid gutter={{ base: 'xl', md: 56 }} align="center">
          <GridCol span={{ base: 12, md: 7 }}>
            <Stack gap="lg" align="flex-start">
              <Badge
                variant="light"
                color="green"
                size="lg"
                radius="xl"
                leftSection={<IconSparkles size={14} />}
                styles={{ root: { paddingLeft: 12, paddingRight: 12, height: 30 } }}
              >
                AI 텃밭 추천·관리 플랫폼
              </Badge>

              <Title
                order={1}
                fz={{ base: 38, md: 58 }}
                fw={800}
                lh={1.12}
                style={{ letterSpacing: -1.6 }}
              >
                처음 텃밭도,
                <br />
                뭘 심을지
                <br />
                <Text
                  span
                  inherit
                  style={{
                    background:
                      'linear-gradient(120deg, var(--mantine-color-green-6), var(--mantine-color-teal-6) 60%, var(--mantine-color-lime-7))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  AI가 골라준다
                </Text>
              </Title>

              <Text size="lg" c="dimmed" maw={520} lh={1.65}>
                지역·장소·일조만 입력하면 AI가 지금 심기 좋은 작목을 골라주고, 파종부터 수확까지
                텃밭 캘린더로 챙겨드립니다.
              </Text>

              <HomeCta variant="hero" groupClassName={styles.ctaGroup} />

              <Group gap="xl" mt="md" wrap="wrap">
                <TrustItem icon={<IconShieldCheck size={14} />} text="심는 법부터 수확까지" />
                <TrustItem icon={<IconDatabase size={14} />} text="농사로 공공데이터 기반" />
                <TrustItem icon={<IconSparkles size={14} />} text="GPT-4o 자연어 코치" />
              </Group>
            </Stack>
          </GridCol>

          <GridCol span={{ base: 12, md: 5 }}>
            <HeroPreview />
          </GridCol>
        </Grid>
      </Container>
    </Box>
  );
}

function TrustItem({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <Group gap={6} wrap="nowrap">
      <ThemeIcon size={20} radius="xl" color="green" variant="light">
        {icon}
      </ThemeIcon>
      <Text size="xs" c="gray.7" fw={500}>
        {text}
      </Text>
    </Group>
  );
}

// 미리보기 카드
function HeroPreview() {
  return (
    <Box pos="relative" mih={{ base: 'auto', md: 360 }} maw={420} mx="auto" w="100%">
      <Card
        radius="xl"
        p="lg"
        withBorder
        shadow="xl"
        pos="relative"
        className={styles.heroCard}
        style={{
          zIndex: 2,
          borderColor: 'rgba(34,139,84,0.15)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.9))',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Group justify="space-between" align="center" mb="sm">
          <Group gap={8}>
            <Box
              w={26}
              h={26}
              style={{
                borderRadius: 8,
                background:
                  'linear-gradient(135deg, var(--mantine-color-green-5), var(--mantine-color-teal-6))',
                display: 'grid',
                placeItems: 'center',
                color: 'white',
              }}
            >
              <IconMessageCircle size={15} stroke={2.4} />
            </Box>
          </Group>
          <Badge color="green" variant="light" radius="sm" size="sm">
            AI 상담
          </Badge>
        </Group>

        <Stack gap={8}>
          <Group gap={6} align="flex-start" wrap="nowrap">
            <ThemeIcon size={22} radius="xl" color="green" variant="light">
              <IconMessageCircle size={12} />
            </ThemeIcon>
            <Box
              style={{
                background: 'var(--mantine-color-gray-1)',
                borderRadius: 12,
                borderTopLeftRadius: 3,
                padding: '8px 11px',
                maxWidth: '82%',
              }}
            >
              <Text fz={12} lh={1.45}>
                이번 달 추천 작물은 상추·시금치예요. 궁금한 점을 물어보세요.
              </Text>
            </Box>
          </Group>

          <Group justify="flex-end">
            <Box
              style={{
                background: 'var(--mantine-color-green-6)',
                borderRadius: 12,
                borderTopRightRadius: 3,
                padding: '8px 11px',
                maxWidth: '82%',
              }}
            >
              <Text fz={12} lh={1.45} c="white">
                씨앗으로 할까 모종으로 할까?
              </Text>
            </Box>
          </Group>

          <Group gap={6} align="flex-start" wrap="nowrap">
            <ThemeIcon size={22} radius="xl" color="green" variant="light">
              <IconMessageCircle size={12} />
            </ThemeIcon>
            <Box
              style={{
                background: 'var(--mantine-color-gray-1)',
                borderRadius: 12,
                borderTopLeftRadius: 3,
                padding: '8px 11px',
                maxWidth: '82%',
              }}
            >
              <Text fz={12} lh={1.45}>
                초보라면 모종이 더 쉬워요. 씨앗은 흙을 얕게 덮어주세요.
              </Text>
            </Box>
          </Group>

          <Group justify="flex-end">
            <Box
              style={{
                background: 'var(--mantine-color-green-6)',
                borderRadius: 12,
                borderTopRightRadius: 3,
                padding: '8px 11px',
                maxWidth: '82%',
              }}
            >
              <Text fz={12} lh={1.45} c="white">
                물은 얼마나 자주 줘야 적당한가요?
              </Text>
            </Box>
          </Group>

          <Group gap={6} align="flex-start" wrap="nowrap">
            <ThemeIcon size={22} radius="xl" color="green" variant="light">
              <IconMessageCircle size={12} />
            </ThemeIcon>
            <Box
              style={{
                background: 'var(--mantine-color-gray-1)',
                borderRadius: 12,
                borderTopLeftRadius: 3,
                padding: '8px 11px',
                maxWidth: '82%',
              }}
            >
              <Text fz={12} lh={1.45}>
                흙이 마르면 아침에 듬뿍 주세요. 보통 2~3일에 한 번이면 충분해요.
              </Text>
            </Box>
          </Group>
        </Stack>

        <Group gap={6} mt="sm" wrap="wrap">
          {['물은 얼마나 자주 주나요?', '다음 달엔 뭘 심지?'].map((q) => (
            <Badge
              key={q}
              variant="default"
              radius="xl"
              size="sm"
              styles={{ root: { fontWeight: 500, textTransform: 'none' } }}
            >
              {q}
            </Badge>
          ))}
        </Group>
      </Card>

      {/* 왼쪽 - AI 작목 추천 예시 */}
      <Card
        radius="lg"
        p="sm"
        withBorder
        shadow="md"
        pos="absolute"
        style={{
          top: 140,
          left: -210,
          zIndex: 3,
          width: 290,
          transform: 'rotate(-3.5deg)',
          background: 'white',
        }}
        visibleFrom="md"
      >
        <Text fz={10} c="green.7" fw={800} tt="uppercase" mb={7} style={{ letterSpacing: 0.6 }}>
          AI 작목 추천
        </Text>
        {CROP_RECS.map((r) => (
          <Box
            key={r.rank}
            mt={r.rank === 1 ? 0 : 6}
            p="7px 8px"
            style={{
              borderRadius: 10,
              border: '1px solid var(--mantine-color-gray-2)',
              background: 'white',
            }}
          >
            <Group justify="space-between" align="center" wrap="nowrap" mb={3}>
              <Group gap={5} wrap="nowrap" style={{ minWidth: 0 }}>
                <Box
                  w={19}
                  h={19}
                  style={{
                    borderRadius: '50%',
                    background: 'var(--mantine-color-green-1)',
                    color: 'var(--mantine-color-green-8)',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 800,
                    fontSize: 11,
                  }}
                >
                  {r.rank}
                </Box>
                <Text fw={800} fz={13}>
                  {r.name}
                </Text>
                <Badge size="xs" color="green" variant="light" radius="sm">
                  {r.category}
                </Badge>
              </Group>
              <Badge size="sm" color="green" radius="xl">
                {r.score}점
              </Badge>
            </Group>
            <Group gap={4} wrap="wrap">
              <Badge
                size="xs"
                color="green"
                variant="light"
                radius="sm"
                leftSection={
                  <Box
                    w={5}
                    h={5}
                    style={{ borderRadius: '50%', background: 'var(--mantine-color-green-6)' }}
                  />
                }
              >
                이번 달 심기 가능
              </Badge>
              {r.actions.map((a) => (
                <Badge key={a.label} size="xs" color={a.color} variant="light" radius="sm">
                  {a.label}
                </Badge>
              ))}
            </Group>
          </Box>
        ))}
      </Card>

      {/* 오른쪽 - 텃밭 캘린더 예시 */}
      <Box
        pos="absolute"
        style={{ bottom: -20, right: -18, zIndex: 3, width: 255, transform: 'rotate(4deg)' }}
        visibleFrom="md"
      >
        <MiniCalendar />
      </Box>
    </Box>
  );
}

// AI 작목 추천 예시 - 실제 추천 결과 카드 양식(순위·카테고리·작업·점수)
const CROP_RECS: {
  rank: number;
  name: string;
  category: string;
  score: number;
  actions: { label: string; color: string }[];
}[] = [
  {
    rank: 1,
    name: '상추',
    category: '잎채소',
    score: 90,
    actions: [
      { label: '정식', color: 'teal' },
      { label: '수확', color: 'orange' },
    ],
  },
  {
    rank: 2,
    name: '시금치',
    category: '잎채소',
    score: 90,
    actions: [
      { label: '파종', color: 'green' },
      { label: '관리', color: 'gray' },
    ],
  },
  {
    rank: 3,
    name: '열무',
    category: '잎채소',
    score: 86,
    actions: [
      { label: '파종', color: 'green' },
      { label: '수확', color: 'orange' },
    ],
  },
];

// 텃밭 캘린더 예시 - 카테고리 색 점으로 단일 작업 표현
const CAL_DOTS: Record<number, string[]> = {
  1: ['red'],
  3: ['lime'],
  5: ['lime'],
  11: ['red'],
  16: ['red'],
  26: ['orange'],
  27: ['teal', 'red'],
  29: ['green'],
};
// 기간형 작업 - 각 날짜에 점으로 표시(막대 대신)
const CAL_PERIODS: { start: number; end: number; color: string }[] = [
  { start: 7, end: 10, color: 'green' }, // 정식 기간
  { start: 13, end: 16, color: 'teal' }, // 생육 관리
];
// 청록색 점 추가 날짜.
const CAL_DOT_DAYS = new Set([1, 2, 4, 6, 12, 18, 20, 23, 25, 26, 27]);
// 메모 작성 / 사진 저장 표시 날짜.
const CAL_MEMO_DAYS = new Set([1, 4, 6, 9, 11]);
const CAL_PHOTO_DAYS = new Set([2, 13]);
const CAL_LEAD = 2; // 26년 7월 (수)
const CAL_SELECTED = 15;
// 방문 요일(연한 초록 배경): 월·수·목·토·일 (월요일 시작, 0=월 ~ 6=일)
const CAL_VISIT_WD = new Set([0, 2, 3, 5, 6]);

function MiniCalendar() {
  const cells: (number | null)[] = [
    ...Array.from({ length: CAL_LEAD }, () => null),
    ...Array.from({ length: 31 }, (_, i) => i + 1),
  ];
  // 날짜별 점 색 모음: 단일 작업 + 기간형 작업 + 청록 점 지정일. 같은 색은 1개로.
  const dotsAt = (d: number): string[] => {
    const colors = [...(CAL_DOTS[d] ?? [])];
    for (const p of CAL_PERIODS) {
      if (d >= p.start && d <= p.end) colors.push(p.color);
    }
    if (CAL_DOT_DAYS.has(d)) colors.push('teal');
    return [...new Set(colors)].slice(0, 4);
  };
  return (
    <Card radius="xl" p="md" withBorder shadow="lg" bg="white">
      <Group justify="space-between" align="center" mb={8}>
        <Text fw={800} fz={13}>
          7월
        </Text>
        <Badge size="xs" color="green" variant="light" radius="sm">
          토마토
        </Badge>
      </Group>
      <SimpleGrid cols={7} spacing={1} verticalSpacing={3}>
        {['월', '화', '수', '목', '금', '토', '일'].map((w) => (
          <Text key={w} ta="center" fz={9} c="dimmed" fw={700}>
            {w}
          </Text>
        ))}
        {cells.map((d, i) => {
          const selected = d === CAL_SELECTED;
          const visit = d != null && CAL_VISIT_WD.has(i % 7);
          // 방문 요일(초록)인 날만 일정 점 표시.
          const dots = d != null && visit ? dotsAt(d) : [];
          return (
            <Box
              key={i}
              style={{
                aspectRatio: '1 / 1',
                borderRadius: 5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingTop: 2,
                background: selected
                  ? 'var(--mantine-color-green-1)'
                  : visit
                    ? 'var(--mantine-color-green-0)'
                    : undefined,
                border: selected ? '1px solid var(--mantine-color-green-4)' : undefined,
              }}
            >
              {d && (
                <Text fz={9} fw={selected ? 700 : 500} lh={1}>
                  {d}
                </Text>
              )}
              {dots.length > 0 && (
                <Group gap={1} mt={1} justify="center">
                  {dots.map((c, j) => (
                    <Box
                      key={j}
                      w={3}
                      h={3}
                      style={{ borderRadius: '50%', background: `var(--mantine-color-${c}-6)` }}
                    />
                  ))}
                </Group>
              )}
              {d != null && (CAL_MEMO_DAYS.has(d) || CAL_PHOTO_DAYS.has(d)) && (
                <Group gap={1} mt={1} justify="center" wrap="nowrap">
                  {CAL_MEMO_DAYS.has(d) && (
                    <IconPencil size={9} stroke={2.4} color="var(--mantine-color-grape-6)" />
                  )}
                  {CAL_PHOTO_DAYS.has(d) && (
                    <IconPhoto size={9} stroke={2.2} color="var(--mantine-color-grape-6)" />
                  )}
                </Group>
              )}
            </Box>
          );
        })}
      </SimpleGrid>
    </Card>
  );
}

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

function Features() {
  return (
    <Box
      id="features"
      py={{ base: 70, md: 110 }}
      style={{
        background: '#fafbfa',
        borderTop: '1px solid var(--mantine-color-gray-2)',
        borderBottom: '1px solid var(--mantine-color-gray-2)',
      }}
    >
      <Container size="xl">
        <Stack align="center" gap="xs" mb={56}>
          <Text size="xs" c="green.7" tt="uppercase" fw={800} style={{ letterSpacing: 1.4 }}>
            CORE FEATURES
          </Text>
          <Title order={2} ta="center" fz={{ base: 28, md: 42 }} fw={800} lh={1.2}>
            농사 전 과정을 받쳐주는
            <br />
            <Text span inherit c="green.7">
              핵심 기능 7가지
            </Text>
          </Title>
          <Text c="dimmed" ta="center" maw={570} mt="xs">
            추천부터 캘린더까지, 1년 사이클 어디에 있든 바로 이어서 작업할 수 있어요.
          </Text>
        </Stack>
        <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 4 }} spacing="lg">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </SimpleGrid>
      </Container>
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

function Stats() {
  return (
    <Container id="stats" size="xl" py={{ base: 70, md: 110 }}>
      <Stack align="center" gap="xs" mb={48}>
        <Text size="xs" c="green.7" tt="uppercase" fw={800} style={{ letterSpacing: 1.4 }}>
          BY THE NUMBERS
        </Text>
        <Title order={2} ta="center" fz={{ base: 28, md: 38 }} fw={800}>
          공공데이터로 만든 신뢰
        </Title>
      </Stack>
      <Grid gutter={{ base: 'xl', md: 40 }}>
        <GridCol span={{ base: 12, sm: 4 }}>
          <Stat
            icon={<IconLeaf size={18} />}
            number="40종"
            label="추천 작목"
            sub="잎·열매·뿌리채소 + 허브"
          />
        </GridCol>
        <GridCol span={{ base: 12, sm: 4 }}>
          <Stat
            icon={<IconCalendarEvent size={18} />}
            number="12개월"
            label="텃밭 캘린더"
            sub="파종~수확 작업 자동 생성"
          />
        </GridCol>
        <GridCol span={{ base: 12, sm: 4 }}>
          <Stat
            icon={<IconMessageCircle size={18} />}
            number="AI 챗봇"
            label="작목 상담"
            sub="재배 궁금증을 바로 답변"
          />
        </GridCol>
      </Grid>
    </Container>
  );
}

function Stat({
  icon,
  number,
  label,
  sub,
}: {
  icon: ReactNode;
  number: string;
  label: string;
  sub: string;
}) {
  return (
    <Card
      radius="lg"
      p="xl"
      withBorder
      h="100%"
      style={{
        borderColor: 'var(--mantine-color-gray-2)',
        background:
          'linear-gradient(180deg, white, var(--mantine-color-gray-0))',
      }}
    >
      <Stack gap={6}>
        <ThemeIcon size={32} radius="md" variant="light" color="green">
          {icon}
        </ThemeIcon>
        <Text
          fz={{ base: 44, md: 56 }}
          fw={800}
          lh={1.05}
          mt="xs"
          style={{
            letterSpacing: -2,
            background:
              'linear-gradient(120deg, var(--mantine-color-green-7), var(--mantine-color-teal-7))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {number}
        </Text>
        <Text size="md" fw={700}>
          {label}
        </Text>
        <Text size="sm" c="dimmed">
          {sub}
        </Text>
      </Stack>
    </Card>
  );
}

function FinalCTA() {
  return (
    <Box
      py={{ base: 70, md: 100 }}
      pos="relative"
      style={{
        overflow: 'hidden',
        background:
          'linear-gradient(135deg, var(--mantine-color-green-7), var(--mantine-color-teal-7))',
      }}
    >
      <Box
        pos="absolute"
        style={{
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.18), transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.12), transparent 50%)',
        }}
      />
      <Container size="md" pos="relative">
        <Stack align="center" gap="lg">
          <Title order={2} ta="center" fz={{ base: 30, md: 44 }} fw={800} c="white" lh={1.2}>
            막막한 첫 텃밭, 수확까지 함께
          </Title>
          <Text ta="center" size="lg" maw={540} lh={1.65} style={{ color: 'rgba(255,255,255,0.88)' }}>
            베란다·주말농장이 처음이어도 막막하지 않게,
            <br />
            농사로 공공데이터와 AI가 작목 추천부터 수확까지 함께합니다.
          </Text>
          <HomeCta variant="final" groupClassName={styles.ctaGroup} />
        </Stack>
      </Container>
    </Box>
  );
}

