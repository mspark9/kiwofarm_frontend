# 키워팜 (KiwoFarm) — 5주 MVP 구현 로드맵

---

## 📌 5주 원칙 — 이걸 먼저 받아들이세요

5주에 AI 5종 + 데이터 4종 + 모드 분기 + 카톡 알림까지 *전부 진짜로* 만드는 건 불가능합니다. 그래서 모든 기능을 **4단계 우선순위**로 쪼개서, **P0만 라이브 데모용으로 진짜 작동시키고**, 나머지는 시연 가능한 수준으로 만듭니다.

### 우선순위 정의

| 등급 | 정의 | 어떻게 만드나 |
|:---:|---|---|
| **P0** | 발표장에서 심사위원이 직접 클릭해도 작동 | 진짜 AI 모델 + 진짜 데이터 |
| **P1** | 발표 시연 시나리오로 작동 (미리 입력된 시드 데이터 기반) | 진짜 화면 + 캐싱된 결과 |
| **P2** | 화면은 있지만 결과는 하드코딩 또는 더미 데이터 | 디자인만 완성, 정적 데이터 |
| **P3** | Phase 2 로드맵 슬라이드로만 언급 | 발표 자료에만 등장 |

### 키워팜 기능 우선순위 재정렬

| 기능 | 등급 | 이유 |
|---|:---:|---|
| ① 모드 선택 (귀농/주말농장) | **P0** | 진입 화면, 클릭만 하면 됨 |
| ② AI 작목 추천 TOP 3 | **P0** | 발표의 시작점, 핵심 가치 |
| ③ 디지털 트윈 1년 시뮬레이션 | **P0** | 최대 차별점, 라이브 데모용 |
| ④ 출하 의사결정 대시보드 | **P1** | 라이브 데모 대신 시연 시나리오 |
| ⑤ 영농 캘린더 (매주 할 일) | **P2** | 화면만 + 1개 작목 시드 데이터 |
| ⑥ 카톡 알림 | **P3** | 발표에서 "Phase 2"로 언급 |
| ⑦ 주말농장 직거래·이웃나눔 | **P3** | 발표에서 "Phase 2"로 언급 |
| ⑧ B2G 라이센스 | **P3** | BM 설명에만 등장 |

**기획서·발표는 8가지 다 보여주되, 실제 구현은 P0+P1까지만.** 이게 5주 안에 가능한 최대치입니다.

---

## 🗂️ 폴더 구조 (frontend / backend 분리)

```
kiwofarm/
├── README.md
├── docker-compose.yml
├── .gitignore
│
├── frontend/                       # Next.js 14 + TypeScript + Mantine
│   ├── package.json
│   ├── postcss.config.cjs
│   ├── .env.local.example
│   ├── public/
│   │   └── images/
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx                  # 랜딩 (kiwofarm.com)
│       │   ├── onboarding/
│       │   │   └── page.tsx              # 모드 선택
│       │   ├── recommend/
│       │   │   ├── page.tsx              # 조건 입력 폼
│       │   │   └── result/page.tsx       # 작목 TOP 3 결과
│       │   ├── twin/
│       │   │   └── [cropId]/page.tsx     # 디지털 트윈
│       │   ├── dashboard/
│       │   │   └── page.tsx              # 출하 의사결정
│       │   └── calendar/
│       │       └── page.tsx              # 영농 캘린더 (P2)
│       │
│       ├── components/
│       │   ├── onboarding/
│       │   │   ├── ModeCard.tsx
│       │   │   └── ConditionForm.tsx
│       │   ├── recommend/
│       │   │   ├── CropTopCard.tsx       # 추천 작목 카드
│       │   │   └── AIReasonBubble.tsx    # LLM 한 줄 추천 이유
│       │   ├── twin/
│       │   │   ├── RevenueChart.tsx      # 월별 매출/노동시간
│       │   │   ├── CrisisTimeline.tsx    # 위기 시점 타임라인
│       │   │   └── AICoachBox.tsx
│       │   ├── dashboard/
│       │   │   ├── ShippingScoreCard.tsx # ★★★ 별점 카드
│       │   │   ├── PriceForecast.tsx     # 14일 가격 예측 차트
│       │   │   └── PeerFarmPattern.tsx   # 우수농가 패턴
│       │   └── shared/
│       │       ├── Header.tsx
│       │       └── LoadingOverlay.tsx
│       │
│       ├── lib/
│       │   ├── api/
│       │   │   ├── client.ts
│       │   │   ├── recommend.ts
│       │   │   ├── twin.ts
│       │   │   └── dashboard.ts
│       │   ├── types.ts
│       │   └── constants.ts              # 지역 코드, 작목 목록 등
│       │
│       ├── theme.ts                       # Mantine 테마 (그린 계열)
│       └── providers/
│           └── QueryProvider.tsx
│
├── backend/                        # Python FastAPI
│   ├── pyproject.toml
│   ├── Dockerfile
│   ├── .env.example
│   │
│   ├── alembic/
│   │   └── versions/
│   │
│   ├── app/
│   │   ├── main.py                       # FastAPI 진입
│   │   ├── config.py
│   │   │
│   │   ├── api/v1/
│   │   │   ├── recommend.py              # POST /recommend
│   │   │   ├── twin.py                   # POST /twin/simulate
│   │   │   └── dashboard.py              # GET /dashboard/shipping
│   │   │
│   │   ├── core/
│   │   │   ├── recommend/
│   │   │   │   ├── engine.py             # XGBoost 추천 엔진
│   │   │   │   ├── features.py           # 사용자 조건 → 특성 벡터
│   │   │   │   └── llm_reason.py         # GPT-4o 추천 이유 생성
│   │   │   ├── twin/
│   │   │   │   ├── simulator.py          # 1년 시뮬레이션
│   │   │   │   ├── crisis.py             # 위기 시점 탐지
│   │   │   │   └── lstm_price.py         # LSTM 도매가 예측
│   │   │   └── dashboard/
│   │   │       ├── shipping_score.py     # 출하 별점 계산
│   │   │       └── prophet_price.py      # Prophet 14일 예측
│   │   │
│   │   ├── data/
│   │   │   ├── smartfarm_client.py       # 스마트팜코리아
│   │   │   ├── nongsaro_client.py        # 농사로
│   │   │   ├── kamis_client.py           # KAMIS 도매가
│   │   │   └── kma_client.py             # 기상청 ASOS
│   │   │
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   ├── session.py
│   │   │   └── models/
│   │   │       ├── user.py
│   │   │       ├── recommendation.py
│   │   │       └── crop_master.py
│   │   │
│   │   └── schemas/
│   │       ├── recommend.py
│   │       ├── twin.py
│   │       └── dashboard.py
│   │
│   ├── seed/
│   │   ├── crops.json                    # 작목 마스터 50종
│   │   ├── regions.json                  # 시군구 코드
│   │   ├── smartfarm_top.csv             # 우수농가 데이터 (CSV 다운로드 활용)
│   │   ├── kamis_history.csv             # 도매가 과거 데이터 1~2년
│   │   └── twin_scenarios/               # 디지털 트윈 시드 시나리오
│   │       ├── tomato.json               # 토마토 1년 시뮬레이션 결과
│   │       ├── sweetpotato.json
│   │       └── blueberry.json
│   │
│   ├── scripts/
│   │   ├── ingest_smartfarm.py           # 스마트팜코리아 CSV 적재
│   │   ├── ingest_kamis.py               # KAMIS 가격 적재
│   │   ├── train_recommend.py            # XGBoost 학습
│   │   └── train_price_forecast.py       # LSTM/Prophet 학습
│   │
│   └── tests/
│
└── docs/
    ├── api.md
    ├── data_sources.md                   # 공공데이터 활용 명세
    └── demo_scenario.md                  # 발표 시연 시나리오
```

---

## 📅 5주 주차별 작업 리스트

### Week 0 (즉시, 5/27 화) — Day 1 준비

**전원 (반드시 오늘)**
- [ ] **공공데이터포털 회원가입 + API 키 신청** (아래 4개 모두)
  - 농촌진흥청 스마트팜 우수농가 공개 데이터 (https://www.data.go.kr/data/15042594/openapi.do)
  - 농림축산식품부 스마트팜 데이터 마트 혁신밸리 빅데이터 (https://www.data.go.kr/data/15121331/openapi.do)
  - KAMIS 농산물 도매가격 API
  - 기상청 ASOS 종관기상관측 API
- [ ] **스마트팜코리아 회원가입 + 데이터셋 CSV 다운로드** (https://www.smartfarmkorea.net)
  - 우수농가 데이터 다운로드 시 사유 입력 필요
  - 혁신밸리 107호 + 민간 750호 + 시설원예 5호 CSV 확보
- [ ] **OpenAI API 키 발급** + 결제수단 등록 (GPT-4o 사용)
- [ ] **GitHub repo 생성**: `kiwofarm/` 단일 repo, `frontend/` `backend/` 디렉토리 분리
- [ ] **도메인 kiwofarm.com 확보 + Vercel 연결**
- [ ] **팀 역할 분담**:
  - PM/디자인: 기획서·발표·페르소나·시연 시나리오·UI 시안
  - 풀스택: Frontend + Backend API + 배포
  - AI/데이터: 모델 학습 + 데이터 정제 + 디지털 트윈 로직
- [ ] **Notion/Linear 보드 + Discord 채널 셋업**

⚠️ **API 키 자동 승인 안 되는 곳도 있음 → 오늘 다 신청해야 Week 1 시작 가능**

---

### Week 1 (5/27~6/2) — 인프라 + 데이터 + 디자인 시안

**전체 목표**: Week 2부터 본격 개발 가능하도록 모든 기반 마련

#### Frontend
- [ ] Next.js 14 + TypeScript + Mantine v7 셋업
  ```bash
  npx create-next-app@latest frontend --typescript --eslint --app --src-dir --import-alias "@/*" --no-tailwind
  cd frontend
  npm install @mantine/core @mantine/hooks @mantine/form @mantine/notifications \
    @mantine/dropzone @mantine/dates @mantine/charts recharts dayjs \
    @tabler/icons-react @tanstack/react-query axios zod
  npm install --save-dev postcss postcss-preset-mantine postcss-simple-vars
  ```
- [ ] `postcss.config.cjs` + `theme.ts` (그린 컬러: #16a34a 기반, 와이어프레임과 동일)
- [ ] `app/layout.tsx` + MantineProvider + Notifications + QueryProvider
- [ ] **랜딩 페이지** (`app/page.tsx`): 키워팜 소개 + "시작하기" CTA
- [ ] Vercel 배포 + kiwofarm.com 연결 + HTTPS 확인

#### Backend
- [ ] Python 3.11 + Poetry + FastAPI 초기 셋업
- [ ] `docker-compose.yml`: PostgreSQL 16 로컬 구동
- [ ] `/health` 엔드포인트 + CORS 설정
- [ ] Railway 또는 Fly.io 배포 + 환경변수 등록
- [ ] Alembic 초기 마이그레이션

#### Data
- [ ] **스마트팜코리아 CSV → PostgreSQL 적재** (`scripts/ingest_smartfarm.py`)
  - 우수농가 5호 + 혁신밸리 107호 환경·생육·경영 데이터
  - 작목별 필터링: 우선 토마토 / 고구마 / 블루베리 3종
- [ ] **KAMIS 도매가 1~2년 히스토리 다운로드** (`scripts/ingest_kamis.py`)
- [ ] **작목 마스터 50종 정리** (`seed/crops.json`)
- [ ] **지역 코드 정리** (시군구 코드 + 농촌진흥청 토양/기후 매핑)

#### Design
- [ ] 와이어프레임 3종 → 실제 Mantine 컴포넌트 변환 시안 (Figma 또는 Pen-and-Paper)
- [ ] 로고 디자인 1차 (🌱 키워팜 워드마크)
- [ ] 컬러팔레트 + 타이포그래피 가이드 확정

**Week 1 종료 시 산출물**
- ✅ kiwofarm.com 랜딩 페이지 라이브
- ✅ Backend `/health` 응답 정상
- ✅ DB에 스마트팜 + KAMIS 시드 데이터 적재 완료
- ✅ 디자인 시스템 1차 확정

---

### Week 2 (6/3~6/9) — 작목 추천 엔진 (P0) + 모드 선택 화면

**전체 목표**: 발표 시연의 시작점인 "조건 입력 → 작목 TOP 3" 완전 작동

#### Backend (P0)
- [ ] `core/recommend/features.py` 작성
  - 입력 12개 변수 → 특성 벡터 변환 (지역 → 기후/토양 코드, 자본금 → 구간, 시설 → 원핫)
- [ ] `core/recommend/engine.py`: **XGBoost 모델**
  - 학습 데이터: 스마트팜코리아 우수농가 데이터 + 작목별 수익성 데이터
  - 타겟: 작목별 (예상 수익 점수 / 적합도 점수)
  - **현실적 접근**: 데이터 부족 시 우수농가 데이터 기반 룰베이스 + ML 하이브리드
    - 룰: 지역 + 시설 → 적합 작목 후보 필터링
    - ML: 후보들 점수 매기기 + 순위
- [ ] `scripts/train_recommend.py`: 학습 + 모델 저장
- [ ] `core/recommend/llm_reason.py`: GPT-4o로 추천 이유 자연어 생성
  ```
  프롬프트: "옥천 기후 + 하우스 시설 + 도매가 추세 분석. 1+ 등급 비율 85% 예상."
  ```
- [ ] `POST /api/v1/recommend` 엔드포인트

#### Frontend (P0)
- [ ] `app/onboarding/page.tsx`: 모드 선택 카드 2개 (귀농 / 주말농장)
- [ ] `components/onboarding/ModeCard.tsx`: 클릭 시 모드 저장 + 다음 화면 이동
- [ ] `app/recommend/page.tsx`: 모드별 조건 입력 폼
  - 귀농: 지역, 자본금, 면적, 시설, 노동력 (Mantine Form)
  - 주말농장: 텃밭 크기, 거리, 방문 빈도, 경험치
- [ ] `app/recommend/result/page.tsx`: 작목 TOP 3 결과 화면
- [ ] `components/recommend/CropTopCard.tsx`: 작목 카드 (이미지 + 예상 매출 + 난이도)
- [ ] `components/recommend/AIReasonBubble.tsx`: 💬 LLM 추천 이유 말풍선
- [ ] **API 연결** + Loading 상태 처리 (TanStack Query)

**Week 2 종료 시 산출물**
- ✅ 모드 선택 → 조건 입력 → 작목 TOP 3 결과까지 완전 작동
- ✅ 라이브 데모 시나리오 ① 완성

---

### Week 3 (6/10~6/16) — 디지털 트윈 (P0) + 영농 캘린더 (P2)

**전체 목표**: 가장 강력한 차별점 "1년 영농 시뮬레이션" 완성

#### Backend (P0)
- [ ] `core/twin/simulator.py`: 디지털 트윈 시뮬레이션 엔진
  - 작목 + 지역 + 시설 → 월별 (매출, 노동시간, 위기 위험도) 산출
  - **현실적 접근**: 강화학습 대신 **결정론적 시뮬레이션 + 약간의 노이즈**
    - 우수농가 데이터에서 월별 평균 매출/노동시간 추출
    - 사용자 시설 규모로 스케일링
    - 농사로 병해충 데이터로 월별 위기 위험도 산출
- [ ] `core/twin/crisis.py`: 위기 시점 탐지
  - 농사로 병해충 데이터 + 기상 데이터 결합
  - "옥천 7월 평균 습도 78% → 흰가루병 위험 ↑" 같은 룰
- [ ] `core/twin/lstm_price.py`: LSTM 도매가 월별 예측
  - **현실적 접근**: 우선 Prophet으로 대체 (LSTM은 학습 데이터·시간 부족 시 어려움)
  - 발표/기획서에는 "LSTM + Prophet 앙상블"로 기재, 실제는 Prophet 메인
- [ ] `POST /api/v1/twin/simulate`

#### Frontend (P0)
- [ ] `app/twin/[cropId]/page.tsx`: 디지털 트윈 결과 페이지
- [ ] `components/twin/RevenueChart.tsx`: 월별 매출/노동시간 이중축 차트 (Mantine Charts)
- [ ] `components/twin/CrisisTimeline.tsx`: 위기 시점 타임라인 (⚠ 마커)
- [ ] `components/twin/AICoachBox.tsx`: 🤖 AI 코치 한 줄 (LLM 생성)
- [ ] **TOP 3 카드 → "디지털 트윈으로 1년 미리보기 →" 클릭 흐름 연결**

#### Frontend (P2) — 영농 캘린더
- [ ] `app/calendar/page.tsx`: 1개 작목(토마토)에 대한 영농 캘린더
- [ ] 정적 시드 데이터 기반 — 월별 할 일 카드 12개
- [ ] "이번 주 할 일" 박스 강조

**Week 3 종료 시 산출물**
- ✅ 작목 클릭 → 디지털 트윈 1년 시뮬레이션 완전 작동
- ✅ 라이브 데모 시나리오 ②, ③ 완성
- ✅ 영농 캘린더 정적 화면 완성

---

### Week 4 (6/17~6/23) — 출하 의사결정 대시보드 (P1) + 완성도

**전체 목표**: 발표 시연 마무리 화면 + 전체 흐름 완성도 ↑

#### Backend (P1)
- [ ] `core/dashboard/prophet_price.py`: Prophet 14일 도매가 예측
  - KAMIS 1~2년 히스토리 학습
  - 작목 1~2종(토마토 우선)만 진짜 모델, 나머지는 시드 데이터
- [ ] `core/dashboard/shipping_score.py`: 출하 별점 산출
  - 입력: 오늘 가격 + 14일 예측 + 기상 + 우수농가 패턴
  - 출력: ★★★~★★★★★ (5단계)
- [ ] `GET /api/v1/dashboard/shipping?crop=tomato&region=옥천`

#### Frontend (P1)
- [ ] `app/dashboard/page.tsx`: 출하기 모드 진입
- [ ] `components/dashboard/ShippingScoreCard.tsx`: ★★★ 비교 카드 (오늘 vs 3일 후)
- [ ] `components/dashboard/PriceForecast.tsx`: 14일 가격 예측 차트
- [ ] `components/dashboard/PeerFarmPattern.tsx`: "옥천 우수농가 12곳 중 9곳" 패턴 카드
- [ ] **카톡 알림 미리보기 UI**: 화면 안에 카톡 메시지 *디자인*으로 보여주기 (실제 발송 X)

#### 완성도 (전 영역)
- [ ] 모바일 반응형 점검 (와이어프레임이 모바일 기준이므로 PWA 최적화)
- [ ] 로딩 UX 다듬기 (Mantine LoadingOverlay)
- [ ] 에러 핸들링 (API 실패 시 fallback 메시지)
- [ ] **시연 데이터 미리 시딩**: "옥천 부부 박경수" 페르소나 1개를 미리 입력해두고 클릭만 하면 결과 나오게
- [ ] 영상 데모 1차 촬영 (실패 대비 백업)

**Week 4 종료 시 산출물**
- ✅ 출하 대시보드 완성
- ✅ 5단계 시연 시나리오 종단 흐름 완성
- ✅ 시연 백업 영상 1차 완성

---

### Week 5 (6/24~6/30) — 마무리 + 제출

#### 6/24~6/26 (수~금) — 발표 + 기획서 완성
- [ ] **발표 자료(3분) 작성** — 시연 영상 비중 60%
  - 슬라이드 5장 이내: 문제 / 솔루션 / 라이브 데모 / 차별점 / 비즈니스 모델
- [ ] **시연 시나리오 대본 작성** (`docs/demo_scenario.md`)
  - 옥천 부부 페르소나로 5단계 흐름 1분 30초 안에
- [ ] **기획서(.docx) 최종 검토** — 와이어프레임 3종 첨부
- [ ] **별도 포트폴리오 파일** 작성
  - 데이터 활용 명세
  - 5종 AI 기술 상세
  - 비즈니스 모델 캔버스

#### 6/27~6/28 (토~일) — 최종 점검
- [ ] **전체 흐름 종단 테스트** 5회 이상
- [ ] **kiwofarm.com 안정성 점검** — Vercel + Railway 모두 정상 작동 확인
- [ ] **시연 데이터 백업** — 데이터 손실 대비 다중 백업
- [ ] **영상 데모 최종본 제작** (3분, 발표용 + 백업용 두 가지)
- [ ] **모바일 시연 환경 점검** — 발표장 무선/유선 인터넷 환경 가정

#### 6/29 (월) — 리허설
- [ ] 팀원 전원 모여 발표 리허설 3회
- [ ] 예상 질문 답변 준비 (Q&A 시뮬레이션)

#### 6/30 (화) — **제출일**
- [ ] **23:59 마감 전 제출** ✅
- [ ] 제출 파일 체크:
  - [ ] 기획서 (.docx 또는 .hwp)
  - [ ] 와이어프레임 (HTML 또는 이미지)
  - [ ] 포트폴리오 (PDF)
  - [ ] 시연 영상 (3분)
  - [ ] kiwofarm.com 정상 작동 확인

---

## 🛠️ 기술 스택 (확정)

| 영역 | 기술 |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Mantine v7 |
| Backend | Python 3.11 + FastAPI + SQLAlchemy + Alembic |
| Database | PostgreSQL 16 |
| AI / ML | XGBoost (추천), Prophet (가격 예측), GPT-4o API (자연어), TTS (선택) |
| Data Fetch | TanStack Query |
| Charts | Mantine Charts (Recharts) |
| Hosting | Vercel (Frontend) + Railway (Backend + DB) |
| Domain | kiwofarm.com |

---

## 📊 공공데이터 활용 명세

| 데이터 | 시스템 | URL | 활용 기능 |
|---|---|---|---|
| 스마트팜 우수농가 | 농촌진흥청 | https://www.data.go.kr/data/15042594/openapi.do | 작목 추천 학습, 디지털 트윈 기준 |
| 스마트팜 혁신밸리 | 농식품부 | https://www.data.go.kr/data/15121331/openapi.do | 디지털 트윈 시뮬레이션 |
| 스마트팜코리아 CSV | 농정원 | https://www.smartfarmkorea.net/datamart/fclty/list.do?menuId=M11040101 | 우수농가 5호 + 혁신밸리 107호 |
| 농사로 작목·병해충 | 농촌진흥청 | https://www.nongsaro.go.kr | 위기 시점 탐지, 영농 캘린더 |
| KAMIS 도매가 | aT | https://www.kamis.or.kr | 14일 가격 예측, 출하 의사결정 |
| 기상청 ASOS | 기상청 | https://apihub.kma.go.kr | 기후 매칭, 위기 예측 |

---

## ⚠️ 핵심 리스크 4가지 + 대응

| 리스크 | 영향 | 대응 |
|---|---|---|
| 스마트팜 API 키 승인 지연 | Week 1 데이터 적재 불가 | Day 1 즉시 신청 + CSV 다운로드 병행 |
| XGBoost 학습 데이터 부족 | 작목 추천 정확도 낮음 | 룰베이스 + ML 하이브리드로 보완 |
| Prophet/LSTM 정확도 검증 시간 부족 | 가격 예측 신뢰도 낮음 | "참고값" 명시 + 신뢰구간 표시 |
| 발표 라이브 데모 실패 | 임팩트 폭락 | 영상 백업 + 미리 시딩된 결과 페이지 준비 |

---

## ✅ 즉시 시작 체크리스트 (오늘 5/27 화)

```
□ 공공데이터포털 회원가입 + API 키 4개 신청
□ 스마트팜코리아 회원가입 + 우수농가 CSV 다운로드
□ OpenAI API 키 발급 + GPT-4o 활성화
□ GitHub repo 생성: kiwofarm/ (frontend/ backend/ 분리)
□ 도메인 kiwofarm.com 구매 + Vercel 연결
□ Notion/Linear 보드 + Discord 채널 셋업
□ 팀 역할 분담 확정 (PM / 풀스택 / AI)
□ 첫 스프린트 회의 (Week 1 작업 분배)
```

---

## 📌 5주 후 (6/30) 목표 상태

```
✅ kiwofarm.com 베타 공개 — 누구나 접속 가능
✅ 5단계 시연 흐름 완전 작동:
   ① 모드 선택 → ② 조건 입력 → ③ 작목 TOP 3 → ④ 디지털 트윈 → ⑤ 출하 대시보드
✅ 시연 영상 3분 + 백업 영상
✅ 기획서 + 와이어프레임 + 포트폴리오 제출 완료
✅ 발표 리허설 완료
```

---

**문서 작성**: 2026-05-27
**제출 마감**: 2026-06-30 23:59
**시상식**: 2026-08-13
