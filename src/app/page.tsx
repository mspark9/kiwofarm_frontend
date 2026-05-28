import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Grid,
  GridCol,
  Group,
  Progress,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconArrowRight,
  IconCalendarEvent,
  IconChartLine,
  IconLeaf,
  IconRobot,
  IconSparkles,
  IconShieldCheck,
  IconDatabase,
  IconClock,
} from '@tabler/icons-react';

export default function HomePage() {
  return (
    <Box style={{ background: 'white' }}>
      <Hero />
      <Features />
      <Stats />
      <FinalCTA />
      <Footer />
    </Box>
  );
}

function Hero() {
  return (
    <Box
      pos="relative"
      style={{
        overflow: 'hidden',
        background:
          'linear-gradient(180deg, #f6fbf6 0%, #ffffff 70%)',
      }}
    >
      {/* mesh blobs */}
      <Box
        pos="absolute"
        style={{
          top: -120,
          right: -160,
          width: 520,
          height: 520,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(64,180,120,0.28), transparent 60%)',
          filter: 'blur(20px)',
          zIndex: 0,
        }}
      />
      <Box
        pos="absolute"
        style={{
          bottom: -140,
          left: -120,
          width: 460,
          height: 460,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(80,190,200,0.22), transparent 60%)',
          filter: 'blur(20px)',
          zIndex: 0,
        }}
      />
      {/* faint grid */}
      <Box
        pos="absolute"
        style={{
          inset: 0,
          backgroundImage:
            'linear-gradient(to right, rgba(34,139,84,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(34,139,84,0.05) 1px, transparent 1px)',
          backgroundSize: '46px 46px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          zIndex: 0,
        }}
      />

      <Container size="xl" py={{ base: 60, md: 110 }} pos="relative" style={{ zIndex: 1 }}>
        <Grid gutter={{ base: 'xl', md: 60 }} align="center">
          <GridCol span={{ base: 12, md: 7 }}>
            <Stack gap="lg">
              <Badge
                variant="light"
                color="green"
                size="lg"
                radius="xl"
                leftSection={<IconSparkles size={14} />}
                styles={{ root: { paddingLeft: 12, paddingRight: 12, height: 30 } }}
              >
                AI 영농 의사결정 플랫폼
              </Badge>

              <Title
                order={1}
                fz={{ base: 40, md: 64 }}
                fw={800}
                lh={1.08}
                style={{ letterSpacing: -1.8 }}
              >
                처음 농사도,
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
                  1년을 미리
                </Text>{' '}
                본다.
              </Title>

              <Text size="lg" c="dimmed" maw={520} lh={1.65}>
                지역·자본·시설만 입력하면 AI가 적합 작목 3개를 추천하고, 1년 매출과 위기 시점까지
                미리 시뮬레이션해 보여줍니다.
              </Text>

              <Group gap="md" mt="xs">
                <Button
                  component={Link}
                  href="/onboarding"
                  size="lg"
                  color="green"
                  radius="md"
                  rightSection={<IconArrowRight size={18} />}
                  styles={{
                    root: {
                      boxShadow: '0 10px 24px -10px rgba(34,139,84,0.55)',
                    },
                  }}
                >
                  지금 추천받기
                </Button>
                <Button
                  component={Link}
                  href="/dashboard"
                  variant="default"
                  size="lg"
                  radius="md"
                >
                  대시보드 데모 보기
                </Button>
              </Group>

              <Group gap="xl" mt="md">
                <TrustItem icon={<IconShieldCheck size={14} />} text="공공데이터 4종 연동" />
                <TrustItem icon={<IconDatabase size={14} />} text="우수농가 112호 학습" />
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

function HeroPreview() {
  return (
    <Box pos="relative" mih={420}>
      {/* main card */}
      <Card
        radius="xl"
        p="xl"
        withBorder
        shadow="xl"
        pos="relative"
        style={{
          zIndex: 2,
          transform: 'rotate(-1.5deg)',
          borderColor: 'rgba(34,139,84,0.15)',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.88))',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Text
                size="xs"
                c="green.7"
                tt="uppercase"
                fw={800}
                style={{ letterSpacing: 0.8 }}
              >
                토마토 · 옥천
              </Text>
              <Title order={4} mt={4} fz={20}>
                3일 후 출하 권장
              </Title>
            </Box>
            <Badge
              color="teal"
              variant="filled"
              radius="sm"
              size="md"
              styles={{ root: { boxShadow: '0 6px 14px -6px rgba(20,160,150,0.6)' } }}
            >
              +6.4%
            </Badge>
          </Group>

          <Group gap="md" wrap="nowrap" mt={4}>
            <Box
              flex={1}
              p="sm"
              style={{
                borderRadius: 12,
                border: '1px solid var(--mantine-color-gray-2)',
                background: 'white',
              }}
            >
              <Text size="xs" c="dimmed" mb={4}>
                오늘
              </Text>
              <MiniStars value={3} />
              <Text fw={800} mt={6} fz={18}>
                ₩4,200
              </Text>
            </Box>
            <Box
              flex={1}
              p="sm"
              style={{
                borderRadius: 12,
                border: '1px solid var(--mantine-color-teal-3)',
                background:
                  'linear-gradient(180deg, var(--mantine-color-teal-0), white)',
              }}
            >
              <Text size="xs" c="teal.7" fw={700} mb={4}>
                3일 후 예측
              </Text>
              <MiniStars value={5} />
              <Text fw={800} c="teal.7" mt={6} fz={18}>
                ₩4,470
              </Text>
            </Box>
          </Group>

          <Box mt={4}>
            <Group justify="space-between" mb={6}>
              <Text size="xs" c="dimmed">
                옥천 우수농가 12곳 중 9곳 동일 선택
              </Text>
              <Text size="xs" fw={700} c="green.7">
                75%
              </Text>
            </Group>
            <Progress value={75} color="green" size="sm" radius="xl" />
          </Box>
        </Stack>
      </Card>

      {/* floating sub-card 1 */}
      <Card
        radius="lg"
        p="md"
        withBorder
        shadow="md"
        pos="absolute"
        style={{
          top: -22,
          left: -28,
          zIndex: 3,
          transform: 'rotate(-6deg)',
          background: 'white',
          minWidth: 160,
        }}
        visibleFrom="sm"
      >
        <Group gap={10} wrap="nowrap">
          <ThemeIcon size={36} radius="md" color="green" variant="light">
            <IconLeaf size={18} />
          </ThemeIcon>
          <Box>
            <Text size="xs" c="dimmed">
              추천 작목 TOP 1
            </Text>
            <Text fw={800} fz={14}>
              방울토마토
            </Text>
          </Box>
        </Group>
      </Card>

      {/* floating sub-card 2 */}
      <Card
        radius="lg"
        p="md"
        withBorder
        shadow="md"
        pos="absolute"
        style={{
          bottom: -18,
          right: -20,
          zIndex: 3,
          transform: 'rotate(4deg)',
          background: 'white',
          minWidth: 180,
        }}
        visibleFrom="sm"
      >
        <Group gap={10} wrap="nowrap">
          <ThemeIcon size={36} radius="md" color="teal" variant="light">
            <IconChartLine size={18} />
          </ThemeIcon>
          <Box>
            <Text size="xs" c="dimmed">
              예상 연 매출
            </Text>
            <Text fw={800} fz={14} c="teal.7">
              ₩42.6M
            </Text>
          </Box>
        </Group>
      </Card>
    </Box>
  );
}

function MiniStars({ value }: { value: number }) {
  return (
    <Group gap={1}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} c={i <= value ? 'yellow.6' : 'gray.3'} fw={700} fz={14} lh={1}>
          ★
        </Text>
      ))}
    </Group>
  );
}

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
              4가지 AI
            </Text>
          </Title>
          <Text c="dimmed" ta="center" maw={520} mt="xs">
            추천부터 출하까지, 1년 사이클 어디에 있든 데이터로 다음 선택을 잡아드립니다.
          </Text>
        </Stack>
        <Grid gutter="lg">
          <GridCol span={{ base: 12, sm: 6, md: 3 }}>
            <FeatureCard
              icon={<IconLeaf size={22} />}
              title="AI 작목 추천"
              desc="지역·자본·시설을 분석해 적합 작목 TOP 3를 가려냅니다."
              tag="XGBoost"
              color="green"
            />
          </GridCol>
          <GridCol span={{ base: 12, sm: 6, md: 3 }}>
            <FeatureCard
              icon={<IconChartLine size={22} />}
              title="디지털 트윈"
              desc="1년 매출·노동시간·위기 시점을 미리 시뮬레이션합니다."
              tag="시뮬레이션"
              color="teal"
            />
          </GridCol>
          <GridCol span={{ base: 12, sm: 6, md: 3 }}>
            <FeatureCard
              icon={<IconCalendarEvent size={22} />}
              title="출하 대시보드"
              desc="14일 가격 예측과 별점으로 출하 타이밍을 잡습니다."
              tag="Prophet"
              color="lime"
            />
          </GridCol>
          <GridCol span={{ base: 12, sm: 6, md: 3 }}>
            <FeatureCard
              icon={<IconRobot size={22} />}
              title="AI 코치"
              desc="추천 이유부터 위기 대응까지 자연어로 풀어줍니다."
              tag="GPT-4o"
              color="grape"
            />
          </GridCol>
        </Grid>
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
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  tag: string;
  color: string;
}) {
  return (
    <Card
      radius="lg"
      p="lg"
      withBorder
      h="100%"
      className="kw-feature-card"
      style={{
        borderColor: 'var(--mantine-color-gray-2)',
        background: 'white',
        transition: 'transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease',
      }}
    >
      <Stack gap="md" h="100%">
        <ThemeIcon size={48} radius="md" variant="light" color={color}>
          {icon}
        </ThemeIcon>
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
            icon={<IconDatabase size={18} />}
            number="112호"
            label="학습 데이터"
            sub="우수농가 5호 + 혁신밸리 107호"
          />
        </GridCol>
        <GridCol span={{ base: 12, sm: 4 }}>
          <Stat
            icon={<IconLeaf size={18} />}
            number="50종"
            label="추천 가능 작목"
            sub="시설·노지·특용작물 망라"
          />
        </GridCol>
        <GridCol span={{ base: 12, sm: 4 }}>
          <Stat
            icon={<IconClock size={18} />}
            number="14일"
            label="가격 예측 범위"
            sub="KAMIS 도매가 기반 Prophet"
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
            5분이면 충분합니다.
          </Title>
          <Text ta="center" size="lg" maw={520} lh={1.65} style={{ color: 'rgba(255,255,255,0.88)' }}>
            조건 몇 가지만 알려주시면 AI가 작목 TOP 3와
            <br />
            1년 영농 계획을 만들어 드립니다.
          </Text>
          <Group gap="sm" mt="sm">
            <Button
              component={Link}
              href="/onboarding"
              size="xl"
              radius="md"
              color="white"
              c="green.8"
              variant="white"
              rightSection={<IconArrowRight size={20} />}
            >
              지금 시작하기
            </Button>
            <Button
              component={Link}
              href="/dashboard"
              size="xl"
              radius="md"
              variant="outline"
              styles={{
                root: {
                  borderColor: 'rgba(255,255,255,0.55)',
                  color: 'white',
                  background: 'transparent',
                },
              }}
            >
              대시보드 보기
            </Button>
          </Group>
        </Stack>
      </Container>
    </Box>
  );
}

function Footer() {
  return (
    <Box py="xl" bg="white" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
      <Container size="xl">
        <Group justify="space-between" wrap="wrap" gap="md" align="flex-start">
          <Stack gap={6}>
            <Group gap={8}>
              <Box
                w={26}
                h={26}
                style={{
                  borderRadius: 7,
                  background:
                    'linear-gradient(135deg, var(--mantine-color-green-5), var(--mantine-color-teal-6))',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'white',
                }}
              >
                <IconLeaf size={15} stroke={2.4} />
              </Box>
              <Text fw={800}>키워팜</Text>
            </Group>
            <Text size="xs" c="dimmed">
              © 2026 KiwoFarm · 공공데이터 활용 AI 영농 플랫폼
            </Text>
          </Stack>
          <Group gap="lg">
            <Anchor component={Link} href="/#features" size="sm" c="dimmed">
              기능
            </Anchor>
            <Anchor component={Link} href="/onboarding" size="sm" c="dimmed">
              추천받기
            </Anchor>
            <Anchor component={Link} href="/dashboard" size="sm" c="dimmed">
              대시보드
            </Anchor>
            <Anchor size="sm" c="dimmed" href="https://kiwofarm.com">
              kiwofarm.com
            </Anchor>
          </Group>
        </Group>
      </Container>
    </Box>
  );
}
