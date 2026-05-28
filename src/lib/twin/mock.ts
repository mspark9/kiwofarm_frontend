import type { AlertType, Severity, TwinData } from '@/lib/types';

const M = (n: number) => `${n}월`;

const tomato: TwinData = {
  cropId: 'tomato',
  name: '방울토마토',
  emoji: '🍅',
  totalRevenueManwon: 4260,
  totalCostManwon: 2080,
  totalLaborHours: 1840,
  peakLaborMonth: 7,
  monthly: [
    { month: M(1), monthNum: 1, revenueManwon: 0, laborHours: 20, phase: 'rest' },
    { month: M(2), monthNum: 2, revenueManwon: 0, laborHours: 80, phase: 'seeding' },
    { month: M(3), monthNum: 3, revenueManwon: 0, laborHours: 140, phase: 'seeding' },
    { month: M(4), monthNum: 4, revenueManwon: 0, laborHours: 180, phase: 'growing' },
    { month: M(5), monthNum: 5, revenueManwon: 60, laborHours: 220, phase: 'growing' },
    { month: M(6), monthNum: 6, revenueManwon: 240, laborHours: 240, phase: 'growing' },
    { month: M(7), monthNum: 7, revenueManwon: 720, laborHours: 280, phase: 'harvest' },
    { month: M(8), monthNum: 8, revenueManwon: 980, laborHours: 260, phase: 'harvest' },
    { month: M(9), monthNum: 9, revenueManwon: 880, laborHours: 220, phase: 'harvest' },
    { month: M(10), monthNum: 10, revenueManwon: 760, laborHours: 180, phase: 'harvest' },
    { month: M(11), monthNum: 11, revenueManwon: 480, laborHours: 90, phase: 'growing' },
    { month: M(12), monthNum: 12, revenueManwon: 140, laborHours: 30, phase: 'rest' },
  ],
  alerts: [
    {
      month: 5,
      type: 'pest',
      title: '잎곰팡이병 발생 위험 ↑',
      detail: '옥천 5월 평균 습도 78% — 우수농가 평균 대비 12%p 높음. 환기·약제 살포 시점 임박.',
      severity: 'high',
    },
    {
      month: 7,
      type: 'labor',
      title: '수확 노동 피크 (월 280h)',
      detail: '단독 작업 시 일 9시간 이상 소요. 단기 인력 1명 확보 권장.',
      severity: 'medium',
    },
    {
      month: 9,
      type: 'price',
      title: '도매가 일시 하락 구간',
      detail: '추석 후 2주 가격 약세. 직거래·로컬푸드 전환 시 매출 방어 가능.',
      severity: 'medium',
    },
    {
      month: 11,
      type: 'weather',
      title: '첫 서리 주의',
      detail: '옥천 평년 첫서리 11월 8일. 보온 준비 1주 전 완료 필요.',
      severity: 'low',
    },
  ],
  aiCoach:
    '7~9월이 매출 70%를 만드는 핵심 구간입니다. 5월 잎곰팡이병 방제와 7월 단기 인력 확보 두 가지만 잡으면 우수농가 평균 매출에 근접합니다.',
};

const sweetpotato: TwinData = {
  cropId: 'sweetpotato',
  name: '고구마',
  emoji: '🍠',
  totalRevenueManwon: 2980,
  totalCostManwon: 1360,
  totalLaborHours: 980,
  peakLaborMonth: 10,
  monthly: [
    { month: M(1), monthNum: 1, revenueManwon: 0, laborHours: 0, phase: 'rest' },
    { month: M(2), monthNum: 2, revenueManwon: 0, laborHours: 10, phase: 'rest' },
    { month: M(3), monthNum: 3, revenueManwon: 0, laborHours: 60, phase: 'seeding' },
    { month: M(4), monthNum: 4, revenueManwon: 0, laborHours: 120, phase: 'seeding' },
    { month: M(5), monthNum: 5, revenueManwon: 0, laborHours: 110, phase: 'growing' },
    { month: M(6), monthNum: 6, revenueManwon: 0, laborHours: 90, phase: 'growing' },
    { month: M(7), monthNum: 7, revenueManwon: 0, laborHours: 80, phase: 'growing' },
    { month: M(8), monthNum: 8, revenueManwon: 0, laborHours: 80, phase: 'growing' },
    { month: M(9), monthNum: 9, revenueManwon: 380, laborHours: 160, phase: 'harvest' },
    { month: M(10), monthNum: 10, revenueManwon: 1480, laborHours: 220, phase: 'harvest' },
    { month: M(11), monthNum: 11, revenueManwon: 920, laborHours: 130, phase: 'harvest' },
    { month: M(12), monthNum: 12, revenueManwon: 200, laborHours: 20, phase: 'rest' },
  ],
  alerts: [
    {
      month: 6,
      type: 'weather',
      title: '장마기 침수 위험',
      detail: '옥천 6월 강수량 평년 280mm. 노지재배 배수로 정비 필수.',
      severity: 'high',
    },
    {
      month: 10,
      type: 'labor',
      title: '수확 집중 (월 220h)',
      detail: '10월 한 달에 연 노동의 22% 투입. 가족·지인 협업 권장.',
      severity: 'medium',
    },
    {
      month: 11,
      type: 'price',
      title: '저장출하 가격 상승',
      detail: '11~12월 저장출하 시 가격 18% 상승 평균. 저장창고 확보 시 유리.',
      severity: 'low',
    },
  ],
  aiCoach:
    '저자본·저난도 작목이지만 6월 장마와 10월 수확 두 시점이 성패를 가릅니다. 저장창고만 확보하면 11월 출하로 매출 +15% 가능.',
};

const blueberry: TwinData = {
  cropId: 'blueberry',
  name: '블루베리',
  emoji: '🫐',
  totalRevenueManwon: 5840,
  totalCostManwon: 3300,
  totalLaborHours: 1420,
  peakLaborMonth: 7,
  monthly: [
    { month: M(1), monthNum: 1, revenueManwon: 0, laborHours: 30, phase: 'rest' },
    { month: M(2), monthNum: 2, revenueManwon: 0, laborHours: 80, phase: 'rest' },
    { month: M(3), monthNum: 3, revenueManwon: 0, laborHours: 140, phase: 'seeding' },
    { month: M(4), monthNum: 4, revenueManwon: 0, laborHours: 160, phase: 'growing' },
    { month: M(5), monthNum: 5, revenueManwon: 0, laborHours: 180, phase: 'growing' },
    { month: M(6), monthNum: 6, revenueManwon: 1820, laborHours: 220, phase: 'harvest' },
    { month: M(7), monthNum: 7, revenueManwon: 2480, laborHours: 240, phase: 'harvest' },
    { month: M(8), monthNum: 8, revenueManwon: 1240, laborHours: 180, phase: 'harvest' },
    { month: M(9), monthNum: 9, revenueManwon: 200, laborHours: 100, phase: 'growing' },
    { month: M(10), monthNum: 10, revenueManwon: 100, laborHours: 60, phase: 'growing' },
    { month: M(11), monthNum: 11, revenueManwon: 0, laborHours: 20, phase: 'rest' },
    { month: M(12), monthNum: 12, revenueManwon: 0, laborHours: 10, phase: 'rest' },
  ],
  alerts: [
    {
      month: 3,
      type: 'weather',
      title: '봄철 동해 주의',
      detail: '3월 늦서리로 꽃눈 피해 위험. 부직포 보온 또는 미세살수 준비.',
      severity: 'high',
    },
    {
      month: 6,
      type: 'pest',
      title: '점박이응애 출현기',
      detail: '6월 평균기온 22℃ 도달 시 발생률 급증. 천적 곤충 도입 권장.',
      severity: 'medium',
    },
    {
      month: 7,
      type: 'price',
      title: '체험농장 단가 프리미엄',
      detail: '7월 체험·픽유어셀프 운영 시 도매가 대비 2.4배 단가 가능.',
      severity: 'low',
    },
  ],
  aiCoach:
    '6~8월 3개월에 매출 95%가 집중됩니다. 7월에 체험농장만 같이 열어도 단가 2배. 다만 3년차까지는 적자 구간이라 자본 여유 필수.',
};

const lettuce: TwinData = {
  ...sweetpotato,
  cropId: 'lettuce',
  name: '상추',
  emoji: '🥬',
};

const pepper: TwinData = {
  ...tomato,
  cropId: 'pepper',
  name: '청양고추',
  emoji: '🌶️',
};

const TWIN_DB: Record<string, TwinData> = {
  tomato,
  sweetpotato,
  blueberry,
  lettuce,
  pepper,
};

export const getTwin = (cropId: string): TwinData => TWIN_DB[cropId] ?? tomato;

export const ALERT_META: Record<AlertType, { label: string; color: string; emoji: string }> = {
  pest: { label: '병해충', color: 'red', emoji: '🐛' },
  price: { label: '가격', color: 'orange', emoji: '💱' },
  weather: { label: '기상', color: 'blue', emoji: '🌧️' },
  labor: { label: '노동', color: 'grape', emoji: '👷' },
};

export const SEVERITY_META: Record<Severity, { label: string; color: string }> = {
  high: { label: '높음', color: 'red' },
  medium: { label: '중간', color: 'orange' },
  low: { label: '낮음', color: 'gray' },
};
