# 키워팜 (KiwoFarm)

귀농인·주말농장인 대상 **AI 작목 추천 + 디지털 트윈 1년 시뮬레이션 + 출하 의사결정** 플랫폼.

- 상세 일정: [`키워팜_5주_MVP_구현_로드맵.md`](./키워팜_5주_MVP_구현_로드맵.md)
- 개발 가이드: [`CLAUDE.md`](./CLAUDE.md)
- API/데이터 명세: [`docs/`](./docs/)

## 빠른 시작

### Database (PostgreSQL 16)

```bash
docker compose up -d db
```

### Backend (FastAPI · uv)

```bash
cd backend
uv sync                                # 의존성 설치
uv run uvicorn app.main:app --reload   # http://localhost:8000
```

### Frontend (Next.js 14 · Mantine v7)

```bash
cd frontend
npm install
npm run dev                            # http://localhost:3000
```

## 구조

```
kiwofarm/
├── frontend/   Next.js 14 + TypeScript + Mantine v7
├── backend/    Python 3.11 + FastAPI + SQLAlchemy + Alembic (uv)
├── docs/       API · 데이터 소스 · 데모 시나리오
└── docker-compose.yml
```
