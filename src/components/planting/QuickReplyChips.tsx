'use client';

import { useState } from 'react';
import { Chip, Collapse, Group, Text, UnstyledButton } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';

interface Props {
  chips: string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
}

// 칩 클릭 = 해당 프롬프트 전송(부록 E).
// 추천 질문이 자리를 많이 차지하므로 아코디언으로 접고 펼 수 있게 한다.
export function QuickReplyChips({ chips, onSelect, disabled }: Props) {
  const [open, setOpen] = useState(false);

  if (chips.length === 0) return null;

  return (
    <div>
      <UnstyledButton
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{ display: 'block', width: '100%' }}
      >
        <Group gap={6} justify="space-between" wrap="nowrap">
          <Text size="xs" c="dimmed" fw={600}>
            추천 질문 ({chips.length})
          </Text>
          <IconChevronDown
            size={16}
            stroke={2.2}
            style={{
              color: 'var(--mantine-color-gray-6)',
              transition: 'transform 200ms ease',
              transform: open ? 'rotate(180deg)' : 'none',
            }}
          />
        </Group>
      </UnstyledButton>

      <Collapse in={open}>
        <Group gap={8} pt={8}>
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
      </Collapse>
    </div>
  );
}
