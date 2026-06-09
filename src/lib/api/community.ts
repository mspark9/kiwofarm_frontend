import { apiClient } from '@/lib/api/client';
import type {
  CommunityComment,
  CommunityPostDetail,
  CommunityPostListItem,
  LikeToggle,
  PostType,
  ShareRequest,
  ShareRequestStatus,
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
  cropSlug?: string | null;
  cropName?: string | null;
  files: File[];
  fromMemoImageIds?: number[];
}

export async function createPost(input: CreatePostInput): Promise<CommunityPostDetail> {
  const form = new FormData();
  form.append('content', input.content);
  form.append('authorName', input.authorName);
  form.append('postType', input.postType);
  if (input.title) form.append('title', input.title);
  if (input.cropSlug) form.append('cropSlug', input.cropSlug);
  if (input.cropName) form.append('cropName', input.cropName);
  for (const f of input.files) form.append('files', f);
  for (const id of input.fromMemoImageIds ?? []) form.append('fromMemoImageIds', String(id));
  const { data } = await apiClient.post<CommunityPostDetail>('/api/v1/community/posts', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60_000,
  });
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
