// 작물 슬러그(crops_master 40종) → public/svg 아이콘 경로.
// 대부분 slug == 파일명. 파일명이 다른 6종만 예외 매핑한다.
const ICON_FILE_OVERRIDE: Record<string, string> = {
  garlic_chives: 'chive',
  baby_napa: 'napa_baby',
  chili_pepper: 'chili',
  korean_zucchini: 'zucchini',
  spring_onion: 'scallion',
  peppermint: 'mint',
};

// public/svg 에 실제 존재하는 파일명(확장자 제외). slug 오타·신규 작물로 깨진
// 아이콘이 뜨지 않도록, 이 집합에 없으면 src 를 주지 않고 호출부가 이모지로 폴백한다.
const ICON_SLUGS = new Set([
  'altari_radish', 'arugula', 'basil', 'beet', 'bitter_melon', 'bokchoy',
  'carrot', 'chard', 'cherry_tomato', 'chicory', 'chili', 'chive', 'corn',
  'crown_daisy', 'cucumber', 'curled_mallow', 'eggplant', 'garlic',
  'green_onion', 'kale', 'kidney_bean', 'kohlrabi', 'lettuce', 'mint',
  'mustard_greens', 'napa_baby', 'onion', 'paprika', 'pea', 'perilla',
  'potato', 'pumpkin', 'radish', 'rosemary', 'scallion', 'spinach',
  'strawberry', 'sweet_potato', 'tomato', 'zucchini',
]);

/** 작물 슬러그의 SVG 아이콘 경로. 대응 파일이 없으면 null(호출부가 이모지로 폴백). */
export function cropIconSrc(slug: string): string | null {
  const file = ICON_FILE_OVERRIDE[slug] ?? slug;
  return ICON_SLUGS.has(file) ? `/svg/${file}.svg` : null;
}
