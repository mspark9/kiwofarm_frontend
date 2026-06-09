import type { Experience, Place, SunHours } from '@/lib/api/planting';

// 입력 위저드 선택지(spec §3). label=UI 노출, value=백엔드 enum 값.

export const PLACE_OPTIONS: { label: string; value: Place }[] = [
  { label: '베란다', value: '베란다' },
  { label: '옥상', value: '옥상' },
  { label: '노지', value: '노지' },
  { label: '실내', value: '실내' },
];

export const DIRECTION_OPTIONS = ['남향', '동향', '서향', '북향'] as const;

export const SUN_OPTIONS: { label: string; value: SunHours }[] = [
  { label: '3시간 미만', value: '<3h' },
  { label: '3~5시간', value: '3~5h' },
  { label: '5시간 이상', value: '>5h' },
];

export const EXP_OPTIONS: { label: string; value: Experience }[] = [
  { label: '처음', value: '처음' },
  { label: '1~2년', value: '1~2년' },
  { label: '3년+', value: '3년+' },
];

export const FACILITY_OPTIONS = ['화분', '플랜터', '비닐터널', '미니온실'];

export const PREF_OPTIONS = ['잎채소', '열매채소', '뿌리채소', '허브'];

// 챗봇 quick-reply 프리셋(부록 E). 백엔드 chat.py 와 동일 카피.
export const STARTER_CHIPS = [
  '내 환경에 맞는 작물 추천받기',
  '이번 달 심을 수 있는 작물',
  '초보도 실패 없는 작물 3가지',
  '베란다(남향)에서 키우기 쉬운 채소',
  '물 자주 못 줘도 되는 작물',
];

export const AFTER_RECO_CHIPS = [
  '이 작물 화분 크기는?',
  '씨앗으로 할까 모종으로 할까?',
  '다음 달엔 뭘 심지?',
  '물은 얼마나 자주 줘요?',
];
