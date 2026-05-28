# KiwoFarm — Rulebook

5-week MVP hackathon. AI crop recommendation + 1-year digital twin + shipping-decision dashboard for 귀농인 / 주말농장인. Roadmap: `키워팜_5주_MVP_구현_로드맵.md`.

## 1. Tech Stack

**Monorepo**: `frontend/` (Next.js) + `backend/` (FastAPI).

**Frontend** — Next.js 14 App Router, TypeScript strict, Mantine v7 (+ `@mantine/charts`, `@mantine/form`, `@tabler/icons-react`), TanStack Query, Pretendard via CDN. Deploy: Vercel.
Routes: `/onboarding`, `/recommend/result`, `/twin/[cropId]`, `/dashboard`, `/calendar`.

**Backend** — Python 3.11, FastAPI, SQLAlchemy, Alembic, PostgreSQL 16. **Env: uv only** (`uv add` / `uv sync` / `uv run` — no pip, poetry, or requirements.txt). Entry `app/main.py`, domain `app/core/{recommend,twin,dashboard}/`, public-data clients `app/data/`. Local DB via docker-compose; prod Railway.

**AI/ML** — Recommend: **XGBoost + rule-based hybrid**. Forecast: **Prophet** (LSTM is presentation-only). NL reasoning: **GPT-4o** (`core/recommend/llm_reason.py`). Twin: **deterministic sim + noise** (no RL).

**Public data** — SmartFarmKorea CSV (112 farms), Nongsaro (crops/pests), KAMIS (wholesale), KMA ASOS (weather).

## 2. Core Rules

- **All 8 features ship as P0** — real AI + real data, judges click anything live. Override the roadmap's P0–P3 split.
- **The 8**: mode select, TOP-3 recommendation, 1-year twin, shipping dashboard, farming calendar, KakaoTalk alerts, weekend direct-trade / neighbor-share, B2G license.
- **No dummy bypasses.** Static mocks live only in `frontend/src/lib/**/mock.ts` during wireframe phase; production reads the API.
- **Mobile-first, responsive mandatory.**
- **Simulation screens must show** *"우수농가 사례 평균값 기반의 참고 수치"*.
- **Secrets via env vars only.** Cache public-data responses locally — treat upstream as flaky.
- **Cross-page state**: `sessionStorage` namespaced (e.g. `kiwofarm:onboarding`); `mode=returning|weekend` lives in the query string. No global store, no CSS-in-JS beyond Mantine, no placeholder routes.

## 3. Communication Style

- **Korean** for user-facing UI, commits, and conversation with the user. Code identifiers stay English.
- **Terse.** Short declarative sentences. Lead with the result.
- **No filler comments** — only the non-obvious *why*. **No emojis** in code/commits (UI emojis fine when meaningful).
- **Korean UI copy**: declarative, no exclamation marks, `toLocaleString()`, `₩…만원` for large agricultural figures.
- **Confirm before risky moves** (destructive git, schema changes, force push, deploy). Local edits and tests are free.
- **Exploratory questions** → 2–3 sentence recommendation with the main tradeoff, not a finished plan.
