'use client';

import { Chip, Group } from '@mantine/core';

interface Props {
  chips: string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
}

// 칩 클릭 = 해당 프롬프트 전송(부록 E).
export function QuickReplyChips({ chips, onSelect, disabled }: Props) {
  if (chips.length === 0) return null;
  return (
    <Group gap={8}>
      {chips.map((c) => (
        <Chip
          key={c}
          variant="outline"
          color="green"
          radius="xl"
          size="sm"
          checked={false}
          disabled={disabled}
          onClick={() => !disabled && onSelect(c)}
        >
          {c}
        </Chip>
      ))}
    </Group>
  );
}
