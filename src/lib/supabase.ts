// Supabase Auth 클라이언트 — 로그인 시 세션(JWT)이 localStorage에 보관되고,
// api/client.ts 인터셉터가 Authorization 헤더로 백엔드에 전달한다.
// 환경변수(NEXT_PUBLIC_SUPABASE_URL/ANON_KEY)가 없으면 null — 게스트 모드만 동작.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;
