// KAMIS 도매가는 작물마다 원단위가 다르다(토마토 5kg, 오이 10kg, 고구마 20kg…).
// 출하 화면은 작물 간 비교가 쉽도록 모두 kg당으로 환산해 표시한다.
// 백엔드 응답은 KAMIS 원본 그대로 두고, 여기 표시 단에서만 변환한다.

import type {
  ForecastResponse,
  PriceTrendResponse,
  RecentPriceResponse,
} from './types';

/** 단위 문자열에서 kg 환산값. '5kg'→5, 'kg'→1, 비중량(개·단 등)→null. */
export function unitToKg(unit?: string | null): number | null {
  if (!unit) return null;
  const m = unit.match(/([\d.]+)\s*kg/i);
  if (m) return parseFloat(m[1]);
  if (unit.trim().toLowerCase() === 'kg') return 1;
  return null;
}

const div = (v: number | null | undefined, kg: number) =>
  v == null ? v : Math.round(v / kg);

export function recentToKg(r: RecentPriceResponse): RecentPriceResponse {
  const kg = unitToKg(r.unit);
  if (!kg || kg === 1) return r;
  return {
    ...r,
    unit: 'kg',
    price: div(r.price, kg),
    prev_price: div(r.prev_price, kg),
  };
}

export function trendToKg(t: PriceTrendResponse): PriceTrendResponse {
  const kg = unitToKg(t.unit);
  if (!kg || kg === 1) return t;
  return {
    ...t,
    unit: 'kg',
    latest: div(t.latest, kg),
    year_ago: div(t.year_ago, kg),
    normal: div(t.normal, kg),
    month_high: div(t.month_high, kg),
    month_low: div(t.month_low, kg),
    points: t.points.map((p) => ({ ...p, price: Math.round(p.price / kg) })),
  };
}

export function forecastToKg(f: ForecastResponse): ForecastResponse {
  const kg = unitToKg(f.unit);
  if (!kg || kg === 1) return f;
  return {
    ...f,
    unit: 'kg',
    series: f.series.map((p) => ({
      ...p,
      price: Math.round(p.price / kg),
      forecast_low: div(p.forecast_low, kg),
      forecast_high: div(p.forecast_high, kg),
    })),
    forecast_last: div(f.forecast_last, kg),
    forecast_last_low: div(f.forecast_last_low, kg),
    forecast_last_high: div(f.forecast_last_high, kg),
  };
}
