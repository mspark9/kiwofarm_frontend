"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Group,
  Menu,
  Modal,
  PasswordInput,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { isAxiosError } from "axios";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { clearAuth, getUsername, login, signup } from "@/lib/auth";
import {
  IconBook2,
  IconCalendarEvent,
  IconChevronDown,
  IconLeaf,
  IconLogin2,
  IconMenu2,
  IconMessageCircle,
  IconUserCircle,
  IconUsersGroup,
} from "@tabler/icons-react";

type MenuLink = { label: string; href: string; icon: React.ReactNode };

const MENU_LINKS: MenuLink[] = [
  { label: "작목 추천", href: "/planting", icon: <IconLeaf size={16} /> },
  {
    label: "챗봇 상담",
    href: "/planting/chat",
    icon: <IconMessageCircle size={16} />,
  },
  { label: "재배 정보", href: "/cultivation", icon: <IconBook2 size={16} /> },
  {
    label: "텃밭 캘린더",
    href: "/calendar",
    icon: <IconCalendarEvent size={16} />,
  },
  { label: "작물 도감", href: "/collection", icon: <IconBook2 size={16} /> },
  {
    label: "커뮤니티",
    href: "/community",
    icon: <IconUsersGroup size={16} />,
  },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setUsername(getUsername()), []);

  const logout = () => {
    clearAuth();
    // 게스트(공용 데모) 데이터로 전환 — 캐시·화면 상태 초기화를 위해 새로고침
    window.location.href = "/";
  };

  return (
    <>
      <Box
        component="header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "saturate(180%) blur(12px)",
          WebkitBackdropFilter: "saturate(180%) blur(12px)",
          background: scrolled
            ? "rgba(255,255,255,0.78)"
            : "rgba(255,255,255,0.55)",
          borderBottom: scrolled
            ? "1px solid var(--mantine-color-gray-2)"
            : "1px solid transparent",
          transition: "background 180ms ease, border-color 180ms ease",
        }}
      >
        <Container
          size="xl"
          py={scrolled ? 10 : 14}
          style={{ transition: "padding 180ms ease" }}
        >
          <Group justify="space-between" align="center" wrap="nowrap">
            <UnstyledButton component={Link} href="/">
              <Group gap={8} wrap="nowrap">
                {/* 자체 그라데이션·라운드를 가진 앱 아이콘 SVG(투명 배경) — 정적이라 일반 img.
                    별도 box-shadow/border-radius 를 주면 투명 여백이 흰 타일처럼 보여 제거. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/app-icon.svg"
                  alt="키워팜"
                  width={40}
                  height={40}
                  style={{ display: "block" }}
                />
                <Text fw={800} fz={18} style={{ letterSpacing: -0.5 }}>
                  키워팜
                </Text>
              </Group>
            </UnstyledButton>

            <Group gap="sm" wrap="nowrap">
              <Tooltip
                label="챗봇 상담"
                position="bottom"
                withArrow
                openDelay={300}
              >
                <UnstyledButton
                  className="kw-chat-fab"
                  onClick={() => setChatOpen(true)}
                  aria-label="챗봇 상담 열기"
                >
                  <IconMessageCircle size={18} stroke={2.4} />
                </UnstyledButton>
              </Tooltip>

              <Menu
                opened={menuOpen}
                onChange={setMenuOpen}
                shadow="xl"
                width={232}
                position="bottom-end"
                offset={10}
                radius="md"
                transitionProps={{ transition: "pop-top-right", duration: 180 }}
              >
                <Menu.Target>
                  <UnstyledButton
                    className="kw-menu-trigger"
                    data-open={menuOpen}
                    aria-label="메뉴"
                  >
                    <Box className="kw-menu-icon" aria-hidden>
                      <IconMenu2 size={14} stroke={2.4} />
                    </Box>
                    <Text component="span" className="kw-menu-label">
                      메뉴
                    </Text>
                    <IconChevronDown
                      size={14}
                      className="kw-menu-chev"
                      stroke={2.2}
                    />
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>탐색</Menu.Label>
                  {MENU_LINKS.map((item) => (
                    <Menu.Item
                      key={item.label}
                      component={Link}
                      href={item.href}
                      leftSection={
                        <ThemeIcon
                          size={22}
                          radius="md"
                          variant="light"
                          color="green"
                        >
                          {item.icon}
                        </ThemeIcon>
                      }
                    >
                      {item.label}
                    </Menu.Item>
                  ))}
                  <Menu.Divider />
                  {username ? (
                    <>
                      <Menu.Label>{username} 님</Menu.Label>
                      <Menu.Item
                        onClick={logout}
                        leftSection={
                          <ThemeIcon
                            size={22}
                            radius="md"
                            variant="light"
                            color="gray"
                          >
                            <IconLogin2 size={16} />
                          </ThemeIcon>
                        }
                      >
                        로그아웃
                      </Menu.Item>
                    </>
                  ) : (
                    <Menu.Item
                      onClick={() => setLoginOpen(true)}
                      leftSection={
                        <ThemeIcon
                          size={22}
                          radius="md"
                          variant="light"
                          color="gray"
                        >
                          <IconLogin2 size={16} />
                        </ThemeIcon>
                      }
                    >
                      로그인
                    </Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
        </Container>
      </Box>

      <ChatModal opened={chatOpen} onClose={() => setChatOpen(false)} />
      <LoginModal opened={loginOpen} onClose={() => setLoginOpen(false)} />

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        .kw-feature-card {
          will-change: transform;
        }
        .kw-feature-card:hover {
          transform: translateY(-4px);
          box-shadow:
            0 18px 40px -20px rgba(34, 139, 84, 0.28),
            0 2px 6px -2px rgba(0, 0, 0, 0.06) !important;
          border-color: var(--mantine-color-green-3) !important;
        }

        .kw-menu-trigger {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 6px 14px 6px 6px;
          border-radius: 999px;
          border: 1px solid var(--mantine-color-gray-2);
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: var(--mantine-color-gray-8);
          transition:
            border-color 200ms ease,
            background 200ms ease,
            box-shadow 220ms ease,
            transform 160ms ease;
        }
        .kw-menu-trigger:hover {
          border-color: var(--mantine-color-green-3);
          background: rgba(255, 255, 255, 0.95);
          box-shadow:
            0 10px 24px -14px rgba(34, 139, 84, 0.38),
            0 2px 6px -3px rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
        }
        .kw-menu-trigger:active {
          transform: translateY(0);
        }
        .kw-menu-trigger[data-open="true"] {
          border-color: var(--mantine-color-green-5);
          background: white;
          box-shadow:
            0 12px 28px -14px rgba(34, 139, 84, 0.5),
            0 2px 6px -3px rgba(0, 0, 0, 0.08);
        }

        .kw-menu-icon {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: linear-gradient(
            135deg,
            var(--mantine-color-green-5),
            var(--mantine-color-teal-6)
          );
          display: grid;
          place-items: center;
          color: white;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.35),
            0 4px 10px -4px rgba(20, 160, 150, 0.55);
          transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .kw-menu-trigger:hover .kw-menu-icon {
          transform: rotate(-8deg) scale(1.04);
        }
        .kw-menu-trigger[data-open="true"] .kw-menu-icon {
          transform: rotate(90deg);
        }

        .kw-menu-label {
          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: -0.2px;
          line-height: 1;
        }

        .kw-menu-chev {
          color: var(--mantine-color-gray-6);
          transition:
            transform 220ms ease,
            color 200ms ease;
        }
        .kw-menu-trigger:hover .kw-menu-chev {
          color: var(--mantine-color-green-7);
        }
        .kw-menu-trigger[data-open="true"] .kw-menu-chev {
          transform: rotate(180deg);
          color: var(--mantine-color-green-7);
        }

        .kw-chat-fab {
          width: 33px;
          height: 33px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          color: white;
          background: linear-gradient(
            135deg,
            var(--mantine-color-green-5),
            var(--mantine-color-teal-6)
          );
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.35),
            0 6px 16px -6px rgba(20, 160, 150, 0.55);
          transition:
            transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 220ms ease;
        }
        .kw-chat-fab:hover {
          transform: translateY(-1px) scale(1.05);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.35),
            0 12px 26px -10px rgba(20, 160, 150, 0.6);
        }
        .kw-chat-fab:active {
          transform: translateY(0) scale(1);
        }
      `}</style>
    </>
  );
}

// 어디서나 챗봇 상담을 모달로 열기. 본체는 /planting/chat 페이지와 동일한 ChatPanel,
// 같은 localStorage 세션을 공유하므로 모달↔페이지 대화가 끊기지 않고 이어진다.
function ChatModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size="lg"
      radius="lg"
      padding="lg"
      title={
        <Group gap={8}>
          <ThemeIcon size={28} radius="md" variant="light" color="green">
            <IconMessageCircle size={16} />
          </ThemeIcon>
          <Text fw={800}>챗봇 상담</Text>
        </Group>
      }
      overlayProps={{ backgroundOpacity: 0.45, blur: 3 }}
      // 모달이 닫힐 때 ChatPanel을 언마운트 → 다음 열림 때 저장 세션을 다시 로드.
      styles={{ body: { display: "flex", flexDirection: "column" } }}
    >
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          height: "min(68vh, 600px)",
        }}
      >
        <ChatPanel />
      </Box>
    </Modal>
  );
}

// 아이디+비밀번호 로그인/회원가입 (베타: 제약 최소화). 비로그인은 게스트(공용 체험 데이터).
function LoginModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") await signup(userId.trim(), password);
      else await login(userId.trim(), password);
      // 계정 데이터로 전환 — 게스트(공용 데모) 화면 상태를 비우기 위해 새로고침
      window.location.href = "/calendar";
    } catch (e) {
      const detail =
        isAxiosError(e) && typeof e.response?.data?.detail === "string"
          ? e.response.data.detail
          : "요청에 실패했습니다. 잠시 후 다시 시도해 주세요.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size="sm"
      radius="lg"
      withCloseButton={false}
      padding="xl"
      overlayProps={{ backgroundOpacity: 0.45, blur: 3 }}
    >
      <Stack gap="lg">
        <Stack gap={6} align="center">
          <ThemeIcon size={48} radius="md" color="green" variant="light">
            <IconUserCircle size={26} />
          </ThemeIcon>
          <Text fw={800} fz={22}>
            {mode === "login" ? "로그인" : "회원가입"}
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            내 농사 계획·일지·도감을 계정에 보관하고 어디서든 이어보세요.
          </Text>
        </Stack>

        <SegmentedControl
          fullWidth
          value={mode}
          onChange={(v) => {
            setMode(v as "login" | "signup");
            setError(null);
          }}
          data={[
            { value: "login", label: "로그인" },
            { value: "signup", label: "회원가입" },
          ]}
        />
        <Stack gap="sm">
          <TextInput
            label="아이디"
            placeholder="아이디"
            autoFocus
            value={userId}
            onChange={(e) => setUserId(e.currentTarget.value)}
          />
          <PasswordInput
            label="비밀번호"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
          />
        </Stack>
        {error && (
          <Alert color="red" radius="md" variant="light">
            {error}
          </Alert>
        )}
        <Button
          color="green"
          size="md"
          loading={loading}
          disabled={!userId.trim() || !password}
          onClick={() => void submit()}
        >
          {mode === "login" ? "로그인" : "가입하기"}
        </Button>

        <Text size="xs" c="dimmed" ta="center">
          로그인하지 않아도 게스트 모드로 모든 기능을 체험할 수 있습니다.
        </Text>
      </Stack>
    </Modal>
  );
}
