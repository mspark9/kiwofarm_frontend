'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  FileButton,
  Group,
  Loader,
  Modal,
  NumberInput,
  SegmentedControl,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { isAxiosError } from 'axios';
import {
  IconClock,
  IconGavel,
  IconGift,
  IconHeart,
  IconHeartFilled,
  IconMessage2,
  IconPhoto,
  IconPlus,
  IconSeeding,
  IconSparkles,
  IconTrash,
  IconUserCircle,
  IconX,
} from '@tabler/icons-react';
import {
  addComment,
  composeDraft,
  createPost,
  deletePost,
  fetchPost,
  fetchPosts,
  fetchWallet,
  placeBid,
  toggleLike,
} from '@/lib/api/community';
import { fetchCropJournal, fetchRewardsSummary } from '@/lib/api/rewards';
import { cropEmoji } from '@/lib/cropEmoji';
import { mediaUrl } from '@/lib/constants';
import { getAuthNickname } from '@/lib/auth';
import { getNickname, setNickname } from '@/lib/nickname';
import type {
  CommunityPostDetail,
  CommunityPostListItem,
  MemoImage,
  PostType,
} from '@/lib/types';

type FilterMode = 'all' | 'show' | 'share';

function fmtWhen(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function CommunityPage() {
  return (
    <Box bg="gray.0" mih="100vh" py={{ base: 24, md: 48 }}>
      <Container size="md">
        <CommunityRoot />
      </Container>
    </Box>
  );
}

function CommunityRoot() {
  const [filter, setFilter] = useState<FilterMode>('all');
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // 대시보드 등에서 ?post=<id> 로 진입하면 해당 글 상세를 바로 연다(클라이언트 전용 읽기).
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get('post');
    const id = raw ? Number(raw) : NaN;
    if (Number.isFinite(id)) setSelectedId(id);
  }, []);

  // 상세 모달 닫기 — 열 때 들어온 ?post= 파라미터를 URL 에서 정리(히스토리 추가 없이 교체).
  const closeDetail = () => {
    setSelectedId(null);
    const url = new URL(window.location.href);
    if (url.searchParams.has('post')) {
      url.searchParams.delete('post');
      window.history.replaceState(null, '', url.pathname + url.search);
    }
  };

  const loggedIn = !!getAuthNickname();
  const posts = useQuery({
    queryKey: ['community', 'posts', filter],
    queryFn: () => fetchPosts(filter === 'all' ? undefined : { type: filter }),
    staleTime: 15_000,
  });
  const wallet = useQuery({
    queryKey: ['community', 'wallet'],
    queryFn: fetchWallet,
    enabled: loggedIn,
    staleTime: 15_000,
  });
  // 작물 태그 옵션(도감)을 피드 보는 동안 미리 받아둔다 — 글쓰기 모달이 열릴 때
  // ComposerModal 이 같은 쿼리키로 캐시를 즉시 읽어 작물 태그가 바로 뜨도록.
  useQuery({
    queryKey: ['rewards', 'summary'],
    queryFn: fetchRewardsSummary,
    staleTime: 60_000,
  });

  return (
    <Stack gap="lg">
      {/* 헤더 */}
      <Box>
        <Text size="xs" c="green.7" fw={800} tt="uppercase" style={{ letterSpacing: 1.2 }}>
          텃밭 커뮤니티
        </Text>
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm" mt={4}>
          <Title order={2} fz={{ base: 26, md: 34 }} fw={800} lh={1.2}>
            수확물{' '}
            <Text span inherit c="green.7">
              자랑·나눔
            </Text>
          </Title>
          <Group gap="sm">
            {loggedIn && wallet.data && (
              <Group
                gap={8}
                align="baseline"
                wrap="nowrap"
                px={14}
                py={7}
                style={{
                  borderRadius: 999,
                  border: '1px solid var(--mantine-color-gray-3)',
                  background: 'white',
                }}
              >
                <Text fz={11} c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: 0.6 }}>
                  {wallet.data.available !== wallet.data.balance ? '사용가능' : '팜'}
                </Text>
                <Text fw={800} fz={15} lh={1} style={{ letterSpacing: -0.3 }}>
                  {wallet.data.available.toLocaleString()}
                </Text>
                {wallet.data.available !== wallet.data.balance && (
                  <Text fz={11} c="dimmed">
                    입찰중 {(wallet.data.balance - wallet.data.available).toLocaleString()}
                  </Text>
                )}
              </Group>
            )}
            <Button
              color="green"
              radius="md"
              leftSection={<IconPlus size={16} />}
              onClick={() => setComposerOpen(true)}
            >
              글쓰기
            </Button>
          </Group>
        </Group>
        <Text c="dimmed" size="sm" mt={6}>
          내가 키운 수확물을 자랑하고, 남는 작물은 이웃과 나눠요.
        </Text>
      </Box>

      {/* 필터 */}
      <SegmentedControl
        radius="md"
        value={filter}
        onChange={(v) => setFilter(v as FilterMode)}
        data={[
          { label: '전체', value: 'all' },
          { label: '자랑', value: 'show' },
          { label: '나눔', value: 'share' },
        ]}
      />

      {/* 피드 */}
      {posts.isLoading ? (
        <Stack gap="md">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={160} radius="lg" />
          ))}
        </Stack>
      ) : !posts.data || posts.data.length === 0 ? (
        <Card radius="lg" p="xl" withBorder bg="white">
          <Stack align="center" gap={8} py="lg">
            <ThemeIcon size={52} radius="xl" variant="light" color="green">
              <IconSeeding size={28} />
            </ThemeIcon>
            <Text fw={700}>아직 글이 없어요</Text>
            <Text c="dimmed" size="sm" ta="center">
              첫 수확물을 자랑하거나 나눔으로 커뮤니티를 시작해 보세요.
            </Text>
            <Button mt={4} color="green" variant="light" onClick={() => setComposerOpen(true)}>
              첫 글 쓰기
            </Button>
          </Stack>
        </Card>
      ) : (
        <Stack gap="md">
          {posts.data.map((p) => (
            <PostCard key={p.id} post={p} onOpen={() => setSelectedId(p.id)} />
          ))}
        </Stack>
      )}

      <ComposerModal opened={composerOpen} onClose={() => setComposerOpen(false)} />
      <DetailModal postId={selectedId} onClose={closeDetail} />
    </Stack>
  );
}

function PostTypeBadge({ type }: { type: PostType }) {
  return type === 'share' ? (
    <Badge color="orange" variant="light" radius="sm" leftSection={<IconGift size={12} />}>
      나눔
    </Badge>
  ) : (
    <Badge color="green" variant="light" radius="sm">
      🌟 자랑
    </Badge>
  );
}

function CropBadge({ slug, name }: { slug?: string | null; name?: string | null }) {
  if (!name) return null;
  return (
    <Badge variant="outline" color="green" radius="sm">
      {slug ? `${cropEmoji(slug)} ` : ''}
      {name}
    </Badge>
  );
}

// AI 자동작성 표시 — 피드에서 돋보이게 그라데이션 + 반짝이 아이콘.
function AiBadge() {
  return (
    <Badge
      variant="gradient"
      gradient={{ from: 'grape', to: 'violet', deg: 120 }}
      radius="sm"
      leftSection={<IconSparkles size={11} />}
    >
      AI 자동작성
    </Badge>
  );
}

// 자랑글 본문 사진 자리표시 — 백엔드 compose 마커와 동일.
const PHOTO_MARKER = '[[사진]]';

// 자랑글 AI 자동작성 1회 비용(백엔드 wallet.BRAG_COMPOSE_COST 와 일치).
const BRAG_COMPOSE_COST = 100;

// ───────────── 글 꾸미기 프리셋 (font|size|align) ─────────────
type PostFont = 'gowun' | 'pretendard' | 'nanum';
type PostSize = 'sm' | 'md' | 'lg';
type PostAlign = 'left' | 'center';
type PostStyle = { font: PostFont; size: PostSize; align: PostAlign };

const DEFAULT_STYLE: PostStyle = { font: 'gowun', size: 'md', align: 'left' };

const FONT_STACK: Record<PostFont, string> = {
  gowun: "'Gowun Batang', 'Pretendard', serif",
  pretendard: "'Pretendard', sans-serif",
  nanum: "'Gaegu', 'Pretendard', cursive",
};
const FONT_LABEL: Record<PostFont, string> = {
  gowun: '고운바탕',
  pretendard: '프리텐다드',
  nanum: '손글씨',
};
const FONT_PX: Record<PostSize, number> = { sm: 14, md: 15.5, lg: 18 };

function parsePostStyle(raw?: string | null): PostStyle {
  if (!raw) return DEFAULT_STYLE;
  const [f, s, a] = raw.split('|');
  return {
    font: (['gowun', 'pretendard', 'nanum'] as const).includes(f as PostFont)
      ? (f as PostFont)
      : DEFAULT_STYLE.font,
    size: (['sm', 'md', 'lg'] as const).includes(s as PostSize)
      ? (s as PostSize)
      : DEFAULT_STYLE.size,
    align: (['left', 'center'] as const).includes(a as PostAlign)
      ? (a as PostAlign)
      : DEFAULT_STYLE.align,
  };
}

function styleVars(s: PostStyle): React.CSSProperties {
  return {
    ['--kw-font' as string]: FONT_STACK[s.font],
    ['--kw-size' as string]: `${FONT_PX[s.size]}px`,
    ['--kw-align' as string]: s.align,
  };
}

// 본문 문단(빈 줄 구분)을 매거진 본문 스타일로.
function ArticleParagraphs({ text }: { text: string }) {
  const paras = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <>
      {paras.map((p, i) => (
        <p key={i} className="kw-article-body" style={{ whiteSpace: 'pre-line' }}>
          {p}
        </p>
      ))}
    </>
  );
}

// 폴라로이드풍 프레임 사진.
function FramedPhoto({ img }: { img: MemoImage }) {
  return (
    <Box my="md" style={{ display: 'flex', justifyContent: 'center' }}>
      <a
        href={mediaUrl(img.url)}
        target="_blank"
        rel="noreferrer"
        style={{ maxWidth: '100%' }}
      >
        <Box
          style={{
            background: 'white',
            padding: 8,
            borderRadius: 16,
            border: '1px solid var(--mantine-color-gray-2)',
            boxShadow: '0 8px 24px rgba(34,84,52,0.12)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrl(img.url)}
            alt={img.originalName ?? '사진'}
            style={{
              display: 'block',
              maxWidth: '100%',
              maxHeight: 440,
              borderRadius: 10,
              objectFit: 'cover',
            }}
          />
        </Box>
      </a>
    </Box>
  );
}

// 자랑글 매거진 렌더 — 본문 [[사진]] 자리에 프레임 사진을 끼우고, 남는 사진은 그리드로.
// 마커가 없으면(직접 쓴 글) 본문 + 사진 그리드(기존과 동일).
function ArticleBody({
  title,
  content,
  images,
  style,
}: {
  title?: string | null;
  content: string;
  images: MemoImage[];
  style?: string | null;
}) {
  const segments = content.split(PHOTO_MARKER);
  const markerCount = segments.length - 1;
  const inline = images.slice(0, markerCount);
  const rest = images.slice(markerCount);
  return (
    <Box className="kw-article" style={styleVars(parsePostStyle(style))}>
      <style jsx global>{`
        .kw-article-title {
          font-family: var(--kw-font, 'Gowun Batang', 'Pretendard', serif);
          text-align: var(--kw-align, left);
          font-size: 23px;
          font-weight: 700;
          line-height: 1.35;
          margin: 2px 0 14px;
          background: linear-gradient(
            120deg,
            var(--mantine-color-green-7),
            var(--mantine-color-teal-6) 70%
          );
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .kw-article-body {
          font-family: var(--kw-font, 'Gowun Batang', 'Pretendard', serif);
          font-size: var(--kw-size, 15.5px);
          text-align: var(--kw-align, left);
          line-height: 1.95;
          color: var(--mantine-color-gray-8);
          margin: 0 0 14px;
        }
      `}</style>
      {title && (
        <h3 className="kw-article-title">{title}</h3>
      )}
      {segments.map((seg, i) => (
        <Box key={i}>
          {seg.trim() && <ArticleParagraphs text={seg} />}
          {i < markerCount && inline[i] && <FramedPhoto img={inline[i]} />}
        </Box>
      ))}
      {rest.length > 0 && (
        <SimpleGrid cols={{ base: 2, sm: 3 }} spacing={8} mt="sm">
          {rest.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <a key={img.id} href={mediaUrl(img.url)} target="_blank" rel="noreferrer">
              <img
                src={mediaUrl(img.url)}
                alt={img.originalName ?? '사진'}
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  objectFit: 'cover',
                  borderRadius: 10,
                  border: '1px solid var(--mantine-color-gray-2)',
                }}
              />
            </a>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}

function ImageStrip({ images, max = 4 }: { images: MemoImage[]; max?: number }) {
  if (!images.length) return null;

  // 1장은 가로로 길게(높이 제한), 여러 장은 정사각 그리드.
  if (images.length === 1) {
    const img = images[0];
    return (
      <Box style={{ maxHeight: 340, overflow: 'hidden', borderRadius: 10 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaUrl(img.url)}
          alt={img.originalName ?? '수확 사진'}
          style={{
            width: '100%',
            maxHeight: 340,
            objectFit: 'cover',
            display: 'block',
            border: '1px solid var(--mantine-color-gray-2)',
            borderRadius: 10,
          }}
        />
      </Box>
    );
  }

  const shown = images.slice(0, max);
  const extra = images.length - shown.length;
  return (
    <SimpleGrid cols={{ base: 2, sm: Math.min(shown.length, max) }} spacing={6}>
      {shown.map((img, i) => (
        <Box key={img.id} pos="relative" style={{ aspectRatio: '1 / 1' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrl(img.url)}
            alt={img.originalName ?? '수확 사진'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 8,
              border: '1px solid var(--mantine-color-gray-2)',
            }}
          />
          {i === max - 1 && extra > 0 && (
            <Box
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 8,
                background: 'rgba(0,0,0,0.45)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Text c="white" fw={800} fz="lg">
                +{extra}
              </Text>
            </Box>
          )}
        </Box>
      ))}
    </SimpleGrid>
  );
}

function PostCard({ post, onOpen }: { post: CommunityPostListItem; onOpen: () => void }) {
  const qc = useQueryClient();
  const like = useMutation({
    mutationFn: () => toggleLike(post.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community', 'posts'] });
      qc.invalidateQueries({ queryKey: ['community', 'post', post.id] });
    },
  });

  return (
    <Card
      radius="lg"
      p="lg"
      withBorder
      bg="white"
      className="kw-feature-card"
      style={{ cursor: 'pointer', transition: 'transform 160ms ease, box-shadow 160ms ease' }}
      onClick={onOpen}
    >
      <Stack gap="sm">
        <Group justify="space-between" wrap="nowrap">
          <Group gap={8} wrap="nowrap">
            <ThemeIcon size={36} radius="xl" variant="light" color="green">
              <IconUserCircle size={22} />
            </ThemeIcon>
            <Box>
              <Text fw={700} size="sm" lh={1.2}>
                {post.authorName}
              </Text>
              <Text c="dimmed" size="xs">
                {fmtWhen(post.createdAt)}
              </Text>
            </Box>
          </Group>
          <Group gap={6}>
            <PostTypeBadge type={post.postType} />
            {post.postType === 'share' && post.shareStatus === 'closed' && (
              <Badge color="gray" variant="light" radius="sm">
                마감
              </Badge>
            )}
          </Group>
        </Group>

        {(post.cropName || post.aiAssisted) && (
          <Group gap={6}>
            <CropBadge slug={post.cropSlug} name={post.cropName} />
            {post.aiAssisted && <AiBadge />}
          </Group>
        )}

        {post.title && (
          <Text fw={700}>{post.title}</Text>
        )}
        <Text size="sm" c="gray.8" style={{ whiteSpace: 'pre-line' }} lineClamp={3}>
          {post.contentPreview}
        </Text>

        <ImageStrip images={post.images} />

        <Group gap="lg" mt={2}>
          <Group
            gap={4}
            wrap="nowrap"
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              if (!like.isPending) like.mutate();
            }}
          >
            {post.likedByMe ? (
              <IconHeartFilled size={18} color="var(--mantine-color-red-6)" />
            ) : (
              <IconHeart size={18} color="var(--mantine-color-gray-6)" />
            )}
            <Text size="sm" c={post.likedByMe ? 'red.6' : 'dimmed'} fw={600}>
              {post.likeCount}
            </Text>
          </Group>
          <Group gap={4} wrap="nowrap">
            <IconMessage2 size={18} color="var(--mantine-color-gray-6)" />
            <Text size="sm" c="dimmed" fw={600}>
              {post.commentCount}
            </Text>
          </Group>
          {post.postType === 'share' && post.auction && (
            <Group gap={4} wrap="nowrap">
              <IconGavel size={18} color="var(--mantine-color-orange-6)" />
              <Text size="sm" c="orange.7" fw={700}>
                {post.auction.closed
                  ? '마감'
                  : post.auction.topBid != null
                    ? `${post.auction.topBid}팜`
                    : '입찰 대기'}
              </Text>
            </Group>
          )}
        </Group>
      </Stack>
    </Card>
  );
}

function ComposerModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [nickname, setNick] = useState('');
  // 로그인 사용자는 회원가입 닉네임 고정(입력칸 숨김), 게스트만 직접 입력.
  const [isGuest, setIsGuest] = useState(true);
  const [type, setType] = useState<PostType>('show');
  const [cropSlug, setCropSlug] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [pickedMemoIds, setPickedMemoIds] = useState<number[]>([]);
  const [deadline, setDeadline] = useState<Date | null>(null);
  // 글 꾸미기 프리셋(글꼴·크기·정렬) — 본문 미리보기와 저장·렌더에 함께 적용.
  const [font, setFont] = useState<PostFont>(DEFAULT_STYLE.font);
  const [size, setSize] = useState<PostSize>(DEFAULT_STYLE.size);
  const [align, setAlign] = useState<PostAlign>(DEFAULT_STYLE.align);
  const [aiUsed, setAiUsed] = useState(false); // AI 자동작성을 한 번이라도 썼는지.

  // 열릴 때 닉네임 프리필 + 폼 초기화.
  useEffect(() => {
    if (opened) {
      const authNick = getAuthNickname();
      setIsGuest(!authNick);
      setNick(authNick ?? getNickname());
      setType('show');
      setDeadline(null);
      setCropSlug(null);
      setTitle('');
      setContent('');
      setFiles([]);
      setPickedMemoIds([]);
      setFont(DEFAULT_STYLE.font);
      setSize(DEFAULT_STYLE.size);
      setAlign(DEFAULT_STYLE.align);
      setAiUsed(false);
    }
  }, [opened]);

  const summary = useQuery({
    queryKey: ['rewards', 'summary'],
    queryFn: fetchRewardsSummary,
    enabled: opened,
    staleTime: 60_000,
  });
  const collected = useMemo(
    () => (summary.data?.collection.entries ?? []).filter((e) => e.collected),
    [summary.data],
  );
  const cropName = collected.find((e) => e.cropSlug === cropSlug)?.cropName ?? null;

  // 선택한 작물의 내 기록 사진(불러오기용).
  const journal = useQuery({
    queryKey: ['harvest', 'crop-journal', cropSlug],
    queryFn: () => fetchCropJournal(cropSlug!),
    enabled: opened && !!cropSlug,
    staleTime: 60_000,
  });
  const journalImages = useMemo(
    () => (journal.data?.memos ?? []).flatMap((m) => m.images),
    [journal.data],
  );

  // 선택한 작물 일지(메모)를 AI가 블로그형 초안으로 정리 + 일지 사진 자동 첨부.
  const compose = useMutation({
    mutationFn: () => composeDraft(cropSlug!),
    onSuccess: (res) => {
      setContent(res.content);
      setTitle(res.title);
      // 본문 [[사진]] 순서와 맞춘 시간순 사진 id 로 첨부.
      setPickedMemoIds(res.imageIds);
      setAiUsed(true); // 게시 시 'AI 자동작성' 뱃지로 표시.
      // 팜 차감됐으니 지갑·보상 요약 갱신.
      qc.invalidateQueries({ queryKey: ['community', 'wallet'] });
      qc.invalidateQueries({ queryKey: ['rewards', 'summary'] });
      notifications.show({
        color: 'green',
        message: `AI가 일지로 초안을 작성했어요(${BRAG_COMPOSE_COST}팜 사용). 확인하고 다듬어 올려보세요.`,
      });
    },
    onError: (e) => {
      notifications.show({
        color: 'red',
        message:
          isAxiosError(e) && typeof e.response?.data?.detail === 'string'
            ? e.response.data.detail
            : 'AI 자동 작성에 실패했어요.',
      });
    },
  });

  const create = useMutation({
    mutationFn: () =>
      createPost({
        content,
        title: title.trim() || undefined,
        authorName: nickname.trim() || '텃밭러',
        postType: type,
        style: `${font}|${size}|${align}`,
        aiAssisted: aiUsed,
        cropSlug,
        cropName,
        files,
        fromMemoImageIds: pickedMemoIds,
        auctionDeadline:
          type === 'share' && deadline ? deadline.toISOString() : null,
      }),
    onSuccess: () => {
      // 게스트가 직접 입력한 이름만 기억(로그인 사용자는 회원가입 닉네임 고정).
      if (isGuest) setNickname(nickname);
      qc.invalidateQueries({ queryKey: ['community', 'posts'] });
      notifications.show({ color: 'green', message: '글을 올렸어요.' });
      onClose();
    },
    onError: (e) => {
      notifications.show({
        color: 'red',
        message:
          isAxiosError(e) && typeof e.response?.data?.detail === 'string'
            ? e.response.data.detail
            : '등록에 실패했어요. 사진 형식(jpg·png·webp)과 용량을 확인해 주세요.',
      });
    },
  });

  const shareReady = type === 'show' || (!isGuest && !!deadline);
  const canSubmit =
    content.trim().length > 0 && nickname.trim().length > 0 && shareReady;

  return (
    <Modal opened={opened} onClose={onClose} title={<Text fw={800}>글쓰기</Text>} size="lg" radius="lg" centered>
      <Stack gap="md">
        <SegmentedControl
          fullWidth
          value={type}
          onChange={(v) => setType(v as PostType)}
          data={[
            { label: '자랑하기', value: 'show' },
            { label: '나눔하기', value: 'share' },
          ]}
        />

        {isGuest ? (
          <TextInput
            label="닉네임"
            placeholder="피드에 표시될 이름"
            value={nickname}
            maxLength={40}
            onChange={(e) => setNick(e.currentTarget.value)}
            leftSection={<IconUserCircle size={16} />}
          />
        ) : (
          <Text size="sm" c="dimmed">
            <Text component="span" fw={600} c="green.7">
              {nickname}
            </Text>{' '}
            님으로 작성돼요.
          </Text>
        )}

        <Select
          label="작물 태그 (선택)"
          placeholder={
            summary.isLoading
              ? '작물 불러오는 중…'
              : collected.length
                ? '내 도감에서 선택'
                : '수집한 작물이 없어요'
          }
          data={collected.map((e) => ({ value: e.cropSlug, label: e.cropName }))}
          value={cropSlug}
          onChange={(v) => {
            setCropSlug(v);
            setPickedMemoIds([]);
          }}
          clearable
          searchable
          rightSection={summary.isLoading ? <Loader size="xs" /> : undefined}
          disabled={summary.isLoading || !collected.length}
        />

        {type === 'show' && (
          <TextInput
            label="제목 (선택)"
            placeholder="자랑글 제목 (AI 자동 작성 시 채워져요)"
            maxLength={255}
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
          />
        )}

        {type === 'show' && cropSlug && (journal.data?.totalMemos ?? 0) > 0 && (
          <Button
            variant="light"
            color="grape"
            size="xs"
            leftSection={<IconSparkles size={14} />}
            loading={compose.isPending}
            onClick={() => compose.mutate()}
            style={{ alignSelf: 'flex-start' }}
          >
            AI로 일지 정리해서 자동 작성 · {BRAG_COMPOSE_COST}팜
          </Button>
        )}

        {/* 글 꾸미기 — 글꼴·크기·정렬. 본문 미리보기와 게시 후 렌더에 그대로 적용. */}
        <Box>
          <Text fw={600} size="sm" mb={6}>
            글 꾸미기
          </Text>
          <Group gap="xs" wrap="wrap">
            <Select
              size="xs"
              w={130}
              aria-label="글꼴"
              data={(['gowun', 'pretendard', 'nanum'] as PostFont[]).map((f) => ({
                value: f,
                label: FONT_LABEL[f],
              }))}
              value={font}
              onChange={(v) => v && setFont(v as PostFont)}
              allowDeselect={false}
              comboboxProps={{ withinPortal: true }}
            />
            <SegmentedControl
              size="xs"
              value={size}
              onChange={(v) => setSize(v as PostSize)}
              data={[
                { label: '작게', value: 'sm' },
                { label: '보통', value: 'md' },
                { label: '크게', value: 'lg' },
              ]}
            />
            <SegmentedControl
              size="xs"
              value={align}
              onChange={(v) => setAlign(v as PostAlign)}
              data={[
                { label: '왼쪽', value: 'left' },
                { label: '가운데', value: 'center' },
              ]}
            />
          </Group>
        </Box>

        <Textarea
          label="내용"
          description={
            content.includes('[[사진]]')
              ? '본문의 [[사진]] 자리에 첨부 사진이 순서대로 들어가요. 위치를 옮겨도 돼요.'
              : undefined
          }
          placeholder={
            type === 'share'
              ? '나눔할 작물과 수량, 나눔 방법을 적어주세요.'
              : '수확 자랑 한마디를 남겨주세요.'
          }
          autosize
          minRows={3}
          maxRows={8}
          value={content}
          onChange={(e) => setContent(e.currentTarget.value)}
          styles={{
            input: {
              fontFamily: FONT_STACK[font],
              fontSize: FONT_PX[size],
              textAlign: align,
              lineHeight: 1.9,
            },
          }}
        />

        {type === 'share' &&
          (isGuest ? (
            <Alert color="orange" variant="light" radius="md" icon={<IconGift size={16} />}>
              나눔(팜 경매)은 로그인 후 이용할 수 있어요.
            </Alert>
          ) : (
            <Box>
              <DateTimePicker
                label="나눔 마감 시간"
                description="이 시간까지 이웃들이 팜으로 경매해요. 최고가 낙찰!"
                placeholder="마감 일시 선택"
                value={deadline}
                onChange={(v) => setDeadline(v ? new Date(v) : null)}
                minDate={new Date()}
                valueFormat="M월 D일 HH:mm"
                clearable
                leftSection={<IconClock size={16} />}
              />
            </Box>
          ))}

        {/* 사진 업로드 */}
        <Box>
          <Group justify="space-between" mb={6}>
            <Text fw={600} size="sm">
              사진
            </Text>
            <FileButton
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={(picked) => setFiles((prev) => [...prev, ...picked])}
            >
              {(props) => (
                <Button {...props} size="xs" variant="light" color="green" leftSection={<IconPhoto size={14} />}>
                  사진 추가
                </Button>
              )}
            </FileButton>
          </Group>
          {files.length > 0 && (
            <SimpleGrid cols={{ base: 3, sm: 4 }} spacing={6}>
              {files.map((f, i) => (
                <Box key={`${f.name}-${i}`} pos="relative" style={{ aspectRatio: '1 / 1' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(f)}
                    alt={f.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
                  />
                  <ActionIcon
                    size="sm"
                    color="dark"
                    variant="filled"
                    style={{ position: 'absolute', top: 4, right: 4, opacity: 0.85 }}
                    onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  >
                    <IconX size={12} />
                  </ActionIcon>
                </Box>
              ))}
            </SimpleGrid>
          )}

          {/* 내 기록 사진 불러오기 */}
          {cropSlug && journalImages.length > 0 && (
            <Box mt="sm">
              <Text size="xs" c="dimmed" mb={4}>
                내 기록 사진에서 가져오기 (탭하여 선택)
              </Text>
              <SimpleGrid cols={{ base: 4, sm: 6 }} spacing={6}>
                {journalImages.map((img) => {
                  const picked = pickedMemoIds.includes(img.id);
                  return (
                    <Box
                      key={img.id}
                      pos="relative"
                      style={{ aspectRatio: '1 / 1', cursor: 'pointer' }}
                      onClick={() =>
                        setPickedMemoIds((prev) =>
                          picked ? prev.filter((x) => x !== img.id) : [...prev, img.id],
                        )
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={mediaUrl(img.url)}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: 6,
                          border: picked
                            ? '2px solid var(--mantine-color-green-6)'
                            : '1px solid var(--mantine-color-gray-2)',
                          opacity: picked ? 1 : 0.7,
                        }}
                      />
                      {picked && (
                        <ThemeIcon
                          size={18}
                          radius="xl"
                          color="green"
                          style={{ position: 'absolute', top: 2, right: 2 }}
                        >
                          <IconPlus size={12} />
                        </ThemeIcon>
                      )}
                    </Box>
                  );
                })}
              </SimpleGrid>
            </Box>
          )}
        </Box>

        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={onClose}>
            취소
          </Button>
          <Button color="green" loading={create.isPending} disabled={!canSubmit} onClick={() => create.mutate()}>
            올리기
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

function DetailModal({ postId, onClose }: { postId: number | null; onClose: () => void }) {
  const qc = useQueryClient();
  const detail = useQuery({
    queryKey: ['community', 'post', postId],
    queryFn: () => fetchPost(postId!),
    enabled: postId != null,
  });
  const post = detail.data;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['community', 'post', postId] });
    qc.invalidateQueries({ queryKey: ['community', 'posts'] });
  };

  return (
    <Modal
      opened={postId != null}
      onClose={onClose}
      size="lg"
      radius="lg"
      centered
      title={post ? <Group gap={8}><PostTypeBadge type={post.postType} /><Text fw={700}>{post.authorName}</Text></Group> : null}
    >
      {detail.isLoading && <Skeleton height={300} />}
      {post && <DetailBody post={post} onChanged={invalidate} onDeleted={onClose} />}
    </Modal>
  );
}

function DetailBody({
  post,
  onChanged,
  onDeleted,
}: {
  post: CommunityPostDetail;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const qc = useQueryClient();
  const [commentText, setCommentText] = useState('');

  const like = useMutation({
    mutationFn: () => toggleLike(post.id),
    onSuccess: onChanged,
  });
  const comment = useMutation({
    mutationFn: () =>
      addComment(post.id, { authorName: getNickname() || '텃밭러', content: commentText }),
    onSuccess: () => {
      setCommentText('');
      onChanged();
    },
  });
  const remove = useMutation({
    mutationFn: () => deletePost(post.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community', 'posts'] });
      notifications.show({ color: 'gray', message: '글을 삭제했어요.' });
      onDeleted();
    },
  });

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group gap={6}>
          {post.cropName && <CropBadge slug={post.cropSlug} name={post.cropName} />}
          {post.aiAssisted && <AiBadge />}
          <Text c="dimmed" size="xs">
            {fmtWhen(post.createdAt)}
          </Text>
        </Group>
        {post.isMine && (
          <Tooltip label="삭제">
            <ActionIcon variant="subtle" color="gray" onClick={() => remove.mutate()} loading={remove.isPending}>
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      <ArticleBody
        title={post.title}
        content={post.content}
        images={post.images}
        style={post.style}
      />

      {/* 좋아요 */}
      <Group gap="lg">
        <Button
          variant={post.likedByMe ? 'light' : 'subtle'}
          color="red"
          radius="xl"
          size="sm"
          leftSection={post.likedByMe ? <IconHeartFilled size={16} /> : <IconHeart size={16} />}
          disabled={like.isPending}
          onClick={() => like.mutate()}
        >
          좋아요 {post.likeCount}
        </Button>
      </Group>

      {/* 나눔 팜 경매 */}
      {post.postType === 'share' && post.auction && (
        <AuctionPanel post={post} onChanged={onChanged} />
      )}

      <Divider label={`댓글 ${post.comments.length}`} labelPosition="left" />

      {/* 댓글 */}
      <Stack gap="sm">
        {post.comments.map((c) => (
          <Group key={c.id} gap={8} align="flex-start" wrap="nowrap">
            <ThemeIcon size={28} radius="xl" variant="light" color="gray">
              <IconUserCircle size={18} />
            </ThemeIcon>
            <Box style={{ flex: 1 }}>
              <Group gap={6}>
                <Text fw={600} size="sm">
                  {c.authorName}
                </Text>
                <Text c="dimmed" size="xs">
                  {fmtWhen(c.createdAt)}
                </Text>
              </Group>
              <Text size="sm" c="gray.8" style={{ whiteSpace: 'pre-line' }}>
                {c.content}
              </Text>
            </Box>
          </Group>
        ))}
        {post.comments.length === 0 && (
          <Text c="dimmed" size="sm">
            첫 댓글을 남겨보세요.
          </Text>
        )}
      </Stack>

      <Group gap="xs" wrap="nowrap" align="flex-end">
        <TextInput
          style={{ flex: 1 }}
          placeholder="댓글 달기"
          value={commentText}
          onChange={(e) => setCommentText(e.currentTarget.value)}
          onKeyDown={(e) => {
            // IME(한글) 조합 중 Enter 는 무시 — 반쪽 메시지 전송 방지.
            if (e.nativeEvent.isComposing) return;
            if (e.key === 'Enter' && commentText.trim() && !comment.isPending) {
              comment.mutate();
            }
          }}
        />
        <Button
          color="green"
          disabled={!commentText.trim()}
          loading={comment.isPending}
          onClick={() => comment.mutate()}
        >
          등록
        </Button>
      </Group>
    </Stack>
  );
}

// 나눔 팜 경매 패널 — 현재 최고가·마감·입찰·낙찰 결과.
function AuctionPanel({
  post,
  onChanged,
}: {
  post: CommunityPostDetail;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const a = post.auction!;
  const loggedIn = !!getAuthNickname();
  const minBid = (a.topBid ?? 0) + 1;
  const [amount, setAmount] = useState<number | ''>(minBid);
  useEffect(() => {
    setAmount((a.topBid ?? 0) + 1);
  }, [a.topBid]);

  const bid = useMutation({
    mutationFn: () =>
      placeBid(post.id, {
        bidderName: getNickname() || '텃밭러',
        amount: Number(amount),
      }),
    onSuccess: () => {
      onChanged();
      qc.invalidateQueries({ queryKey: ['community', 'posts'] });
      qc.invalidateQueries({ queryKey: ['community', 'wallet'] });
      notifications.show({ color: 'green', message: '입찰했어요!' });
    },
    onError: (e) =>
      notifications.show({
        color: 'red',
        message:
          isAxiosError(e) && typeof e.response?.data?.detail === 'string'
            ? e.response.data.detail
            : '입찰에 실패했어요.',
      }),
  });

  return (
    <Card
      radius="md"
      p="md"
      withBorder
      bg="orange.0"
      style={{ borderColor: 'var(--mantine-color-orange-2)' }}
    >
      <Group gap={6} mb={8}>
        <IconGavel size={18} color="var(--mantine-color-orange-7)" />
        <Text fw={700} size="sm" c="orange.9">
          팜 경매
        </Text>
        {a.closed && (
          <Badge size="sm" color="gray" variant="light" radius="sm">
            마감
          </Badge>
        )}
      </Group>

      <Group justify="space-between" mb={8} wrap="nowrap">
        <Text size="xs" c="gray.7">
          {a.closed ? '마감됨' : '마감'} · {fmtWhen(a.deadline)}
        </Text>
        <Text size="sm" fw={700} c="orange.8">
          현재 최고 {a.topBid != null ? `${a.topBid}팜` : '입찰 없음'}
          {a.topBidderName ? ` · ${a.topBidderName}` : ''}
        </Text>
      </Group>

      {a.closed ? (
        <Alert
          color={a.settled && a.topBid ? 'green' : 'gray'}
          variant="light"
          radius="md"
        >
          {!a.topBid
            ? '입찰이 없어 유찰됐어요.'
            : a.winnerIsMe
              ? `내가 ${a.topBid}팜으로 낙찰받았어요`
              : a.iAmSeller
                ? `${a.topBid}팜에 낙찰됐어요. (+${a.topBid}팜 획득)`
                : `${a.topBidderName ?? '누군가'} 님이 ${a.topBid}팜으로 낙찰받았어요.`}
        </Alert>
      ) : a.iAmSeller ? (
        <Text size="sm" c="dimmed">
          내 나눔글이에요. 마감 시 최고가가 자동으로 낙찰됩니다.
        </Text>
      ) : !loggedIn ? (
        <Alert color="orange" variant="light" radius="md">
          로그인 후 팜으로 입찰할 수 있어요.
        </Alert>
      ) : (
        <Stack gap={6}>
          <Text size="xs" c="dimmed">
            내 사용가능 팜 <b>{a.myAvailable}팜</b> · 최소 입찰 {minBid}팜
          </Text>
          <Group gap="xs" wrap="nowrap" align="flex-end">
            <NumberInput
              style={{ flex: 1 }}
              min={minBid}
              max={a.myAvailable}
              value={amount}
              onChange={(v) => setAmount(typeof v === 'number' ? v : '')}
              suffix="팜"
              hideControls
            />
            <Button
              color="orange"
              leftSection={<IconGavel size={16} />}
              loading={bid.isPending}
              disabled={
                typeof amount !== 'number' ||
                amount < minBid ||
                amount > a.myAvailable
              }
              onClick={() => bid.mutate()}
            >
              입찰
            </Button>
          </Group>
          {a.myBid != null && (
            <Text size="xs" c="orange.7">
              내 현재 입찰 {a.myBid}팜
            </Text>
          )}
        </Stack>
      )}

      {post.bids.length > 0 && (
        <>
          <Divider my={8} />
          <Text size="xs" c="dimmed" mb={4}>
            입찰 내역 {post.bids.length}건
          </Text>
          <Stack gap={2}>
            {post.bids.slice(0, 8).map((b) => (
              <Group key={b.id} justify="space-between">
                <Text
                  size="xs"
                  c={b.isMine ? 'orange.8' : 'gray.7'}
                  fw={b.isMine ? 700 : 400}
                >
                  {b.bidderName}
                  {b.isMine ? ' (나)' : ''}
                </Text>
                <Text size="xs" fw={600}>
                  {b.amount}팜
                </Text>
              </Group>
            ))}
          </Stack>
        </>
      )}
    </Card>
  );
}
