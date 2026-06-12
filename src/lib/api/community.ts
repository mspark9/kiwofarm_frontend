import { apiClient } from '@/lib/api/client';
import type {
  Auction,
  CommunityComment,
  CommunityPostDetail,
  CommunityPostListItem,
  LikeToggle,
  PostType,
  ShareRequest,
  ShareRequestStatus,
  Wallet,
} from '@/lib/types';

export async function fetchPosts(params?: {
  type?: PostType;
  crop?: string;
}): Promise<CommunityPostListItem[]> {
  const { data } = await apiClient.get<CommunityPostListItem[]>('/api/v1/community/posts', {
    params: { type: params?.type, crop: params?.crop },
  });
  return data;
}

export async function fetchPost(id: number): Promise<CommunityPostDetail> {
  const { data } = await apiClient.get<CommunityPostDetail>(`/api/v1/community/posts/${id}`);
  return data;
}

export interface CreatePostInput {
  content: string;
  authorName: string;
  postType: PostType;
  title?: string;
  style?: string | null; // 글 꾸미기 프리셋 "font|size|align"
  aiAssisted?: boolean; // AI 자동작성 사용 여부(피드 뱃지)
  cropSlug?: string | null;
  cropName?: string | null;
  files: File[];
  fromMemoImageIds?: number[];
  auctionDeadline?: string | null; // 나눔(경매) 마감 ISO
}

export async function createPost(input: CreatePostInput): Promise<CommunityPostDetail> {
  const form = new FormData();
  form.append('content', input.content);
  form.append('authorName', input.authorName);
  form.append('postType', input.postType);
  if (input.title) form.append('title', input.title);
  if (input.style) form.append('style', input.style);
  if (input.aiAssisted) form.append('aiAssisted', 'true');
  if (input.cropSlug) form.append('cropSlug', input.cropSlug);
  if (input.cropName) form.append('cropName', input.cropName);
  if (input.auctionDeadline) form.append('auctionDeadline', input.auctionDeadline);
  for (const f of input.files) form.append('files', f);
  for (const id of input.fromMemoImageIds ?? []) form.append('fromMemoImageIds', String(id));
  const { data } = await apiClient.post<CommunityPostDetail>('/api/v1/community/posts', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60_000,
  });
  return data;
}

// 선택한 작물 일지(메모)를 AI가 블로그형 자랑글 초안으로 정리.
// content 에는 사진 자리표시 [[사진]] 가 들어가고, imageIds 는 그 순서(시간순) 사진 id.
export async function composeDraft(
  cropSlug: string,
): Promise<{ title: string; content: string; imageIds: number[] }> {
  const { data } = await apiClient.post<{
    title: string;
    content: string;
    imageIds: number[];
  }>('/api/v1/community/compose-draft', { cropSlug }, { timeout: 60_000 });
  return data;
}

export async function deletePost(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/community/posts/${id}`);
}

export async function toggleLike(id: number): Promise<LikeToggle> {
  const { data } = await apiClient.post<LikeToggle>(`/api/v1/community/posts/${id}/like`);
  return data;
}

export async function addComment(
  postId: number,
  body: { authorName: string; content: string },
): Promise<CommunityComment> {
  const { data } = await apiClient.post<CommunityComment>(
    `/api/v1/community/posts/${postId}/comments`,
    body,
  );
  return data;
}

export async function deleteComment(commentId: number): Promise<void> {
  await apiClient.delete(`/api/v1/community/comments/${commentId}`);
}

export async function requestShare(
  postId: number,
  body: { requesterName: string; message: string },
): Promise<ShareRequest> {
  const { data } = await apiClient.post<ShareRequest>(
    `/api/v1/community/posts/${postId}/share-requests`,
    body,
  );
  return data;
}

export async function updateShareRequest(
  requestId: number,
  status: ShareRequestStatus,
): Promise<ShareRequest> {
  const { data } = await apiClient.patch<ShareRequest>(
    `/api/v1/community/share-requests/${requestId}`,
    { status },
  );
  return data;
}

// ───────────── 나눔 경매 ─────────────
export async function placeBid(
  postId: number,
  body: { bidderName: string; amount: number },
): Promise<Auction> {
  const { data } = await apiClient.post<Auction>(
    `/api/v1/community/posts/${postId}/bids`,
    body,
  );
  return data;
}

export async function fetchWallet(): Promise<Wallet> {
  const { data } = await apiClient.get<Wallet>('/api/v1/community/wallet');
  return data;
}
