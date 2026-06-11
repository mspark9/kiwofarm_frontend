"use client";

// 로그인/회원가입·프로필 모달을 앱 전역에서 한 번만 렌더하고, 어디서든 openLogin()으로
// 열 수 있게 하는 컨텍스트. 헤더·홈 CTA·(추후) 페이지 가드가 공유한다.
// 인증 토큰은 localStorage 보관(lib/auth) — 로그인 성공 시 전체 새로고침으로 상태 반영.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  Alert,
  Box,
  Button,
  Modal,
  PasswordInput,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import { isAxiosError } from "axios";
import { IconUserCircle } from "@tabler/icons-react";
import { RegionPicker } from "@/components/shared/RegionPicker";
import {
  clearAuth,
  getAddress,
  getAuthNickname,
  getUsername,
  login,
  signup,
  updateProfile,
} from "@/lib/auth";

interface AuthModalContextValue {
  // 로그인 사용자명(계정 아이디). 비로그인이면 null. 마운트 시 1회 읽는다(로그인은 새로고침으로 반영).
  username: string | null;
  // 표시용 닉네임(인사말·헤더). 프로필 수정 시 갱신된다. 비로그인이면 null.
  nickname: string | null;
  // localStorage 인증 상태를 읽었는지. false면 아직 판별 전(SSR/하이드레이션 직후) →
  // 게이트가 깜빡이지 않도록 로딩으로 처리한다.
  ready: boolean;
  openLogin: () => void;
  openProfile: () => void;
  logout: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUsername(getUsername());
    setNickname(getAuthNickname());
    setReady(true);
  }, []);

  // 프로필 저장 후 localStorage 최신 신원값을 상태로 반영 → 새로고침 없이 인사말/헤더 갱신.
  const refreshIdentity = () => {
    setUsername(getUsername());
    setNickname(getAuthNickname());
  };

  const logout = () => {
    clearAuth();
    // 게스트 데이터로 전환 — 캐시·화면 상태 초기화를 위해 새로고침
    window.location.href = "/";
  };

  return (
    <AuthModalContext.Provider
      value={{
        username,
        nickname,
        ready,
        openLogin: () => setLoginOpen(true),
        openProfile: () => setProfileOpen(true),
        logout,
      }}
    >
      {children}
      <LoginModal opened={loginOpen} onClose={() => setLoginOpen(false)} />
      <ProfileModal
        opened={profileOpen}
        onClose={() => setProfileOpen(false)}
        onSaved={refreshIdentity}
      />
    </AuthModalContext.Provider>
  );
}

// 아이디+비밀번호 로그인/회원가입 (베타: 제약 최소화).
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
  const [nickname, setNickname] = useState("");
  // 주소(선택) — 시·군·구까지. 미선택이면 city 빈 문자열 → 주소 없이 가입.
  const [province, setProvince] = useState("경기도");
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const address = city ? `${province} ${city}` : null;
        await signup(userId.trim(), password, nickname.trim(), address);
      } else {
        await login(userId.trim(), password);
      }
      // 계정 데이터로 전환 — 로그인 후 홈(/home)으로 전체 새로고침 이동.
      window.location.href = "/home";
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
            로그인하면 작목 추천·캘린더·도감 등 모든 기능을 이용할 수 있습니다.
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
          {mode === "signup" && (
            <>
              <TextInput
                label="닉네임"
                placeholder="커뮤니티에 표시될 이름"
                value={nickname}
                maxLength={40}
                onChange={(e) => setNickname(e.currentTarget.value)}
                leftSection={<IconUserCircle size={16} />}
              />
              <Box>
                <Text size="sm" fw={500} mb={4}>
                  주소{" "}
                  <Text component="span" size="xs" c="dimmed">
                    (선택 · 시·군·구까지)
                  </Text>
                </Text>
                <RegionPicker
                  value={city}
                  province={province}
                  onChange={(nextCity, nextProvince) => {
                    setCity(nextCity);
                    setProvince(nextProvince);
                  }}
                />
                <Text size="xs" c="dimmed" mt={4}>
                  입력하면 작목 추천 시 지역이 자동으로 채워져요.
                </Text>
              </Box>
            </>
          )}
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
          disabled={
            !userId.trim() ||
            !password ||
            (mode === "signup" && !nickname.trim())
          }
          onClick={() => void submit()}
        >
          {mode === "login" ? "로그인" : "가입하기"}
        </Button>

        <Text size="xs" c="dimmed" ta="center">
          가입은 무료이며, 아이디와 비밀번호만 있으면 바로 시작할 수 있습니다.
        </Text>
      </Stack>
    </Modal>
  );
}

// 저장된 주소("경기도 성남시") → province / city 분해.
function splitAddr(addr: string | null): { province: string; city: string } {
  if (!addr) return { province: "경기도", city: "" };
  const i = addr.indexOf(" ");
  if (i < 0) return { province: addr, city: "" };
  return { province: addr.slice(0, i), city: addr.slice(i + 1) };
}

// 로그인 사용자의 닉네임·주소 수정.
function ProfileModal({
  opened,
  onClose,
  onSaved,
}: {
  opened: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nickname, setNickname] = useState("");
  const [province, setProvince] = useState("경기도");
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 열릴 때 현재 값으로 프리필.
  useEffect(() => {
    if (!opened) return;
    setNickname(getAuthNickname() ?? "");
    const r = splitAddr(getAddress());
    setProvince(r.province);
    setCity(r.city);
    setError(null);
  }, [opened]);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await updateProfile(nickname.trim(), city ? `${province} ${city}` : null);
      onSaved();
      onClose();
    } catch (e) {
      setError(
        isAxiosError(e) && typeof e.response?.data?.detail === "string"
          ? e.response.data.detail
          : "수정에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      );
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
      padding="xl"
      title={<Text fw={800}>내 정보 수정</Text>}
      overlayProps={{ backgroundOpacity: 0.45, blur: 3 }}
    >
      <Stack gap="lg">
        <TextInput
          label="닉네임"
          placeholder="커뮤니티에 표시될 이름"
          value={nickname}
          maxLength={40}
          onChange={(e) => setNickname(e.currentTarget.value)}
          leftSection={<IconUserCircle size={16} />}
        />
        <Box>
          <Text size="sm" fw={500} mb={4}>
            주소{" "}
            <Text component="span" size="xs" c="dimmed">
              (선택 · 시·군·구까지)
            </Text>
          </Text>
          <RegionPicker
            value={city}
            province={province}
            onChange={(nextCity, nextProvince) => {
              setCity(nextCity);
              setProvince(nextProvince);
            }}
          />
          <Text size="xs" c="dimmed" mt={4}>
            입력하면 작목 추천 시 지역이 자동으로 채워져요.
          </Text>
        </Box>
        {error && (
          <Alert color="red" radius="md" variant="light">
            {error}
          </Alert>
        )}
        <Button
          color="green"
          size="md"
          loading={loading}
          disabled={!nickname.trim()}
          onClick={() => void submit()}
        >
          저장
        </Button>
      </Stack>
    </Modal>
  );
}
