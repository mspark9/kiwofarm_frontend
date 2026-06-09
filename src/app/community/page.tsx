'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  FileButton,
  Group,
  Modal,
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import {
  IconGift,
  IconHeart,
  IconHeartFilled,
  IconMessage2,
  IconPhoto,
  IconPlus,
  IconSeeding,
  IconTrash,
  IconUserCircle,
  IconX,
} from '@tabler/icons-react';
import {
  addComment,
  createPost,
  deletePost,
  fetchPost,
  fetchPosts,
  requestShare,
  toggleLike,
  updateShareRequest,
} from '@/lib/api/community';
import { fetchCropJournal, fetchRewardsSummary } from '@/lib/api/rewards';
import { cropEmoji } from '@/lib/cropEmoji';
import { mediaUrl } from '@/lib/constants';
import { getNickname, setNickname } from '@/lib/nickname';
import type {
  CommunityPostDetail,
  CommunityPostListItem,
  MemoImage,
  PostType,
  ShareRequestStatus,
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

  const posts = useQuery({
    queryKey: ['community', 'posts', filter],
    queryFn: () => fetchPosts(filter === 'all' ? undefined : { type: filter }),
    staleTime: 15_000,
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
          <Button
            color="green"
            radius="md"
            leftSection={<IconPlus size={16} />}
            onClick={() => setComposerOpen(true)}
          >
            글쓰기
          </Button>
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
          { label: '🌟 자랑', value: 'show' },
          { label: '🎁 나눔', value: 'share' },
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
      <DetailModal postId={selectedId} onClose={() => setSelectedId(null)} />
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

        {post.cropName && (
          <Group gap={6}>
            <CropBadge slug={post.cropSlug} name={post.cropName} />
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
              like.mutate();
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
          {post.postType === 'share' && (
            <Group gap={4} wrap="nowrap">
              <IconGift size={18} color="var(--mantine-color-orange-6)" />
              <Text size="sm" c="dimmed" fw={600}>
                신청 {post.shareRequestCount}
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
  const [type, setType] = useState<PostType>('show');
  const [cropSlug, setCropSlug] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [pickedMemoIds, setPickedMemoIds] = useState<number[]>([]);

  // 열릴 때 닉네임 프리필 + 폼 초기화.
  useEffect(() => {
    if (opened) {
      setNick(getNickname());
      setType('show');
      setCropSlug(null);
      setContent('');
      setFiles([]);
      setPickedMemoIds([]);
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

  const create = useMutation({
    mutationFn: () =>
      createPost({
        content,
        authorName: nickname.trim() || '텃밭러',
        postType: type,
        cropSlug,
        cropName,
        files,
        fromMemoImageIds: pickedMemoIds,
      }),
    onSuccess: () => {
      setNickname(nickname);
      qc.invalidateQueries({ queryKey: ['community', 'posts'] });
      notifications.show({ color: 'green', message: '글을 올렸어요.' });
      onClose();
    },
    onError: () => {
      notifications.show({
        color: 'red',
        message: '등록에 실패했어요. 사진 형식(jpg·png·webp)과 용량을 확인해 주세요.',
      });
    },
  });

  const canSubmit = content.trim().length > 0 && nickname.trim().length > 0;

  return (
    <Modal opened={opened} onClose={onClose} title={<Text fw={800}>글쓰기</Text>} size="lg" radius="lg" centered>
      <Stack gap="md">
        <SegmentedControl
          fullWidth
          value={type}
          onChange={(v) => setType(v as PostType)}
          data={[
            { label: '🌟 자랑하기', value: 'show' },
            { label: '🎁 나눔하기', value: 'share' },
          ]}
        />

        <TextInput
          label="닉네임"
          placeholder="피드에 표시될 이름"
          value={nickname}
          maxLength={40}
          onChange={(e) => setNick(e.currentTarget.value)}
          leftSection={<IconUserCircle size={16} />}
        />

        <Select
          label="작물 태그 (선택)"
          placeholder={collected.length ? '내 도감에서 선택' : '수집한 작물이 없어요'}
          data={collected.map((e) => ({ value: e.cropSlug, label: e.cropName }))}
          value={cropSlug}
          onChange={(v) => {
            setCropSlug(v);
            setPickedMemoIds([]);
          }}
          clearable
          searchable
          disabled={!collected.length}
        />

        <Textarea
          label="내용"
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
        />

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
  const [shareMsg, setShareMsg] = useState('');

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
  const share = useMutation({
    mutationFn: () =>
      requestShare(post.id, { requesterName: getNickname() || '텃밭러', message: shareMsg }),
    onSuccess: () => {
      setShareMsg('');
      onChanged();
      notifications.show({ color: 'green', message: '나눔을 신청했어요.' });
    },
    onError: () =>
      notifications.show({ color: 'red', message: '신청에 실패했어요. 잠시 후 다시 시도해 주세요.' }),
  });
  const reqAction = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ShareRequestStatus }) =>
      updateShareRequest(id, status),
    onSuccess: onChanged,
  });
  const remove = useMutation({
    mutationFn: () => deletePost(post.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community', 'posts'] });
      notifications.show({ color: 'gray', message: '글을 삭제했어요.' });
      onDeleted();
    },
  });

  const myPendingRequest = post.shareRequests.find((r) => r.isMine);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group gap={6}>
          {post.cropName && <CropBadge slug={post.cropSlug} name={post.cropName} />}
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

      {post.title && <Title order={4}>{post.title}</Title>}
      <Text size="sm" c="gray.8" style={{ whiteSpace: 'pre-line' }} lh={1.7}>
        {post.content}
      </Text>

      {post.images.length > 0 && (
        <SimpleGrid cols={{ base: 2, sm: 3 }} spacing={8}>
          {post.images.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <a key={img.id} href={mediaUrl(img.url)} target="_blank" rel="noreferrer">
              <img
                src={mediaUrl(img.url)}
                alt={img.originalName ?? '수확 사진'}
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  objectFit: 'cover',
                  borderRadius: 8,
                  border: '1px solid var(--mantine-color-gray-2)',
                }}
              />
            </a>
          ))}
        </SimpleGrid>
      )}

      {/* 좋아요 */}
      <Group gap="lg">
        <Button
          variant={post.likedByMe ? 'light' : 'subtle'}
          color="red"
          radius="xl"
          size="sm"
          leftSection={post.likedByMe ? <IconHeartFilled size={16} /> : <IconHeart size={16} />}
          onClick={() => like.mutate()}
        >
          좋아요 {post.likeCount}
        </Button>
      </Group>

      {/* 나눔 신청 영역 */}
      {post.postType === 'share' && (
        <Card radius="md" p="md" withBorder bg="orange.0" style={{ borderColor: 'var(--mantine-color-orange-2)' }}>
          <Group gap={6} mb={8}>
            <IconGift size={18} color="var(--mantine-color-orange-7)" />
            <Text fw={700} size="sm" c="orange.9">
              나눔 신청
            </Text>
          </Group>
          {post.isMine ? (
            post.shareRequests.length === 0 ? (
              <Text size="sm" c="dimmed">
                아직 신청이 없어요.
              </Text>
            ) : (
              <Stack gap="xs">
                {post.shareRequests.map((r) => (
                  <Group key={r.id} justify="space-between" wrap="nowrap" align="flex-start">
                    <Box style={{ flex: 1 }}>
                      <Group gap={6}>
                        <Text fw={600} size="sm">
                          {r.requesterName}
                        </Text>
                        <ShareStatusBadge status={r.status} />
                      </Group>
                      <Text size="sm" c="gray.7">
                        {r.message}
                      </Text>
                    </Box>
                    {r.status === 'pending' && (
                      <Group gap={4} wrap="nowrap">
                        <Button
                          size="xs"
                          color="green"
                          onClick={() => reqAction.mutate({ id: r.id, status: 'accepted' })}
                        >
                          수락
                        </Button>
                        <Button
                          size="xs"
                          variant="default"
                          onClick={() => reqAction.mutate({ id: r.id, status: 'declined' })}
                        >
                          거절
                        </Button>
                      </Group>
                    )}
                  </Group>
                ))}
              </Stack>
            )
          ) : myPendingRequest ? (
            <Group gap={6}>
              <Text size="sm" c="gray.7">
                신청 완료
              </Text>
              <ShareStatusBadge status={myPendingRequest.status} />
            </Group>
          ) : (
            <Group gap="xs" wrap="nowrap" align="flex-end">
              <TextInput
                style={{ flex: 1 }}
                placeholder="나눔 신청 메시지"
                value={shareMsg}
                onChange={(e) => setShareMsg(e.currentTarget.value)}
              />
              <Button
                color="orange"
                disabled={!shareMsg.trim()}
                loading={share.isPending}
                onClick={() => share.mutate()}
              >
                신청
              </Button>
            </Group>
          )}
        </Card>
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
            if (e.key === 'Enter' && commentText.trim()) comment.mutate();
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

function ShareStatusBadge({ status }: { status: ShareRequestStatus }) {
  const map: Record<ShareRequestStatus, { c: string; label: string }> = {
    pending: { c: 'gray', label: '대기' },
    accepted: { c: 'green', label: '수락됨' },
    declined: { c: 'red', label: '거절됨' },
  };
  const m = map[status];
  return (
    <Badge size="sm" color={m.c} variant="light" radius="sm">
      {m.label}
    </Badge>
  );
}
