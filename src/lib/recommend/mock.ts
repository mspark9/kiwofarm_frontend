import type { CropPhase, CropRecommendation, Mode } from '@/lib/types';

const calMonths = (phases: Record<CropPhase, number[]>): { month: number; phase: CropPhase }[] => {
  const out: { month: number; phase: CropPhase }[] = [];
  for (let m = 1; m <= 12; m++) {
    let phase: CropPhase = 'rest';
    (Object.keys(phases) as CropPhase[]).forEach((p) => {
      if (phases[p].includes(m)) phase = p;
    });
    out.push({ month: m, phase });
  }
  return out;
};

export const RECOMMENDATIONS_RETURNING: CropRecommendation[] = [
  {
    cropId: 'tomato',
    name: '방울토마토',
    emoji: '🍅',
    matchScore: 94,
    difficulty: 2,
    expectedRevenueManwon: 4260,
    expectedNetManwon: 2180,
    expectedYieldKg: 9800,
    expectedDirectPriceWon: 0,
    llmReason:
      '옥천 평균기온·일조시간이 시설 토마토 최적범위에 있고, 수도권 도매가 최근 3년 안정세입니다. 비닐하우스 300평 기준 우수농가 사례 매칭률 94%.',
    tags: ['시설재배', '수도권 출하 유리', '연중 출하'],
    calendar: calMonths({
      rest: [12, 1],
      seeding: [2, 3],
      growing: [4, 5, 6, 11],
      harvest: [7, 8, 9, 10],
    }),
    peerFarms: 12,
    peerAgreeRate: 75,
    color: 'red',
  },
  {
    cropId: 'sweetpotato',
    name: '고구마',
    emoji: '🍠',
    matchScore: 88,
    difficulty: 1,
    expectedRevenueManwon: 2980,
    expectedNetManwon: 1620,
    expectedYieldKg: 6500,
    expectedDirectPriceWon: 0,
    llmReason:
      '노지 작목 중 초보자 진입장벽이 가장 낮고, 옥천 토양 적합도가 높습니다. 자본금·노동력 부담이 적어 1년차 추천도 1위.',
    tags: ['노지재배', '초보 친화', '저장 가능'],
    calendar: calMonths({
      rest: [12, 1, 2],
      seeding: [3, 4],
      growing: [5, 6, 7, 8],
      harvest: [9, 10, 11],
    }),
    peerFarms: 18,
    peerAgreeRate: 67,
    color: 'orange',
  },
  {
    cropId: 'blueberry',
    name: '블루베리',
    emoji: '🫐',
    matchScore: 81,
    difficulty: 3,
    expectedRevenueManwon: 5840,
    expectedNetManwon: 2540,
    expectedYieldKg: 1800,
    expectedDirectPriceWon: 0,
    llmReason:
      '초기 묘목 투자와 토양 pH 관리가 필요하지만, 단가가 높고 직거래·체험농장 수요가 큽니다. 3년차부터 매출 안정.',
    tags: ['고소득 작물', '체험농장 가능', '3년 후 안정'],
    calendar: calMonths({
      rest: [11, 12, 1, 2],
      seeding: [3],
      growing: [4, 5, 9, 10],
      harvest: [6, 7, 8],
    }),
    peerFarms: 7,
    peerAgreeRate: 58,
    color: 'indigo',
  },
];

export const RECOMMENDATIONS_WEEKEND: CropRecommendation[] = [
  {
    cropId: 'tomato',
    name: '방울토마토',
    emoji: '🍅',
    matchScore: 92,
    difficulty: 2,
    expectedRevenueManwon: 0,
    expectedNetManwon: 0,
    expectedYieldKg: 24,
    expectedDirectPriceWon: 12000,
    llmReason: '주말 1회 방문으로 충분히 관리 가능한 작목. 8~10주 수확이 길어 가족 소비·이웃나눔 모두 적합.',
    tags: ['주1회 관리', '8주 연속 수확', '직거래 가능'],
    calendar: calMonths({
      rest: [12, 1, 2],
      seeding: [3, 4],
      growing: [5, 6, 11],
      harvest: [7, 8, 9, 10],
    }),
    peerFarms: 22,
    peerAgreeRate: 82,
    color: 'red',
  },
  {
    cropId: 'lettuce',
    name: '상추',
    emoji: '🥬',
    matchScore: 87,
    difficulty: 1,
    expectedRevenueManwon: 0,
    expectedNetManwon: 0,
    expectedYieldKg: 18,
    expectedDirectPriceWon: 6000,
    llmReason: '발아 빠르고 실패율 가장 낮은 작목. 격주 방문에도 관리 무리 없음.',
    tags: ['초보 친화', '연 2회 수확', '직거래 인기'],
    calendar: calMonths({
      rest: [12, 1, 2, 7, 8],
      seeding: [3, 9],
      growing: [4, 10],
      harvest: [5, 6, 11],
    }),
    peerFarms: 31,
    peerAgreeRate: 90,
    color: 'orange',
  },
  {
    cropId: 'pepper',
    name: '청양고추',
    emoji: '🌶️',
    matchScore: 79,
    difficulty: 2,
    expectedRevenueManwon: 0,
    expectedNetManwon: 0,
    expectedYieldKg: 9,
    expectedDirectPriceWon: 18000,
    llmReason: '한 그루당 수확량이 많고 보관·건조도 가능. 이웃나눔·반찬 가공 수요가 꾸준합니다.',
    tags: ['장기 수확', '보관 용이', '이웃나눔'],
    calendar: calMonths({
      rest: [12, 1, 2, 3],
      seeding: [4],
      growing: [5, 6, 7],
      harvest: [8, 9, 10, 11],
    }),
    peerFarms: 14,
    peerAgreeRate: 71,
    color: 'indigo',
  },
];

export const getRecommendations = (mode: Mode): CropRecommendation[] =>
  mode === 'returning' ? RECOMMENDATIONS_RETURNING : RECOMMENDATIONS_WEEKEND;

export const PHASE_LABEL: Record<CropPhase, string> = {
  rest: '휴면',
  seeding: '파종',
  growing: '생육',
  harvest: '수확',
};

export const PHASE_COLOR: Record<CropPhase, string> = {
  rest: 'var(--mantine-color-gray-2)',
  seeding: 'var(--mantine-color-lime-4)',
  growing: 'var(--mantine-color-green-5)',
  harvest: 'var(--mantine-color-orange-5)',
};
