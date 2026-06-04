'use client';

import { useMemo, useState } from 'react';
import { Autocomplete, type ComboboxItem } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { IconSearch } from '@tabler/icons-react';
import { searchCrops } from '@/lib/api/crops';
import type { CropOption } from '@/lib/types';

interface Props {
  value: CropOption | null;
  onSelect: (crop: CropOption) => void;
  placeholder?: string;
  width?: number | string;
}

// item_code|kind_code 조합을 옵션 value 로 사용해 동일 품목의 품종을 구별한다.
const optionKey = (c: CropOption) => `${c.item_code}|${c.kind_code}`;

export function CropSearchAutocomplete({
  value,
  onSelect,
  placeholder = '작목 검색 (예: 토마토)',
  width = 260,
}: Props) {
  const [input, setInput] = useState(value?.label ?? '');
  const [debounced] = useDebouncedValue(input, 200);

  const { data: results = [] } = useQuery({
    queryKey: ['crops', 'search', debounced],
    queryFn: () => searchCrops(debounced, 10),
    enabled: debounced.trim().length > 0,
    staleTime: 60_000,
  });

  const data = useMemo<ComboboxItem[]>(
    () => results.map((c) => ({ value: optionKey(c), label: c.label })),
    [results],
  );

  return (
    <Autocomplete
      data={data}
      value={input}
      onChange={setInput}
      onOptionSubmit={(key) => {
        const picked = results.find((c) => optionKey(c) === key);
        if (picked) {
          setInput(picked.label);
          onSelect(picked);
        }
      }}
      placeholder={placeholder}
      leftSection={<IconSearch size={16} stroke={1.5} />}
      w={width}
      radius="md"
      comboboxProps={{ withinPortal: true }}
      limit={10}
    />
  );
}
