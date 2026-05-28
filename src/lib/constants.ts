export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export const CROPS = ['tomato', 'sweetpotato', 'blueberry'] as const;
export type CropId = (typeof CROPS)[number];

export const ONBOARDING_STORAGE_KEY = 'kiwofarm:onboarding';

export const PREFERRED_CROP_OPTIONS = [
  { value: 'tomato', label: '토마토' },
  { value: 'sweetpotato', label: '고구마' },
  { value: 'blueberry', label: '블루베리' },
  { value: 'strawberry', label: '딸기' },
  { value: 'paprika', label: '파프리카' },
  { value: 'lettuce', label: '상추' },
  { value: 'cucumber', label: '오이' },
  { value: 'pepper', label: '고추' },
];
