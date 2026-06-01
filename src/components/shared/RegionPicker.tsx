'use client';

import { Group, Select } from '@mantine/core';
import { PROVINCE_OPTIONS, getCitiesByProvince } from '@/lib/regions';

interface Props {
  value: string;
  province: string;
  onChange: (city: string, province: string) => void;
  error?: string;
}

// 시·도 → 시·군·구 2단 셀렉트. 온보딩(작목 추천)·판매 위치 입력에서 공용.
export function RegionPicker({ value, province, onChange, error }: Props) {
  const cities = getCitiesByProvince(province);

  return (
    <Group gap="xs" wrap="nowrap" align="flex-start">
      <Select
        data={PROVINCE_OPTIONS}
        value={province}
        onChange={(v) => {
          if (!v) return;
          const nextCities = getCitiesByProvince(v);
          const nextCity = nextCities.includes(value) ? value : nextCities[0] ?? '';
          onChange(nextCity, v);
        }}
        allowDeselect={false}
        searchable
        placeholder="시·도"
        w={170}
        nothingFoundMessage="검색 결과 없음"
      />
      <Select
        data={cities}
        value={value}
        onChange={(v) => onChange(v ?? '', province)}
        allowDeselect={false}
        searchable
        placeholder="시·군·구"
        flex={1}
        nothingFoundMessage="검색 결과 없음"
        error={error}
        disabled={cities.length === 0}
      />
    </Group>
  );
}
