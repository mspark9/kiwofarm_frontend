'use client';

// 시작일 선택용 날짜 피커 입력.
// 연/월 선택 화면을 메인 캘린더(calendar/page.tsx)의 커스텀 그리드와 동일하게 맞춘다:
// - 연도: 해당 10년 + 앞뒤 한 해를 3×4 균형 그리드로(경계 연도는 흐리게)
// - 월: 1~12월 3×4 그리드
// - 글자는 두껍게 하지 않음(일반 굵기), 토=파랑·일=빨강
// Mantine 내장 DatePickerInput 의 연도 그리드는 10칸(좌측 정렬·들쭉날쭉)이라 이 배치를 못 만든다.

import { useState } from 'react';
import {
  ActionIcon,
  Box,
  Button,
  CloseButton,
  Group,
  Popover,
  SimpleGrid,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { Calendar } from '@mantine/dates';
import dayjs from 'dayjs';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

const KOR_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MIN_YEAR = 1970; // 달력 연도 하한 (calendar/page.tsx 와 일치)

type PickerMode = null | 'months' | 'years';

export function KwDatePicker({
  value,
  onChange,
  label,
  placeholder,
  withAsterisk,
  clearable = true,
}: {
  value: Date | null;
  onChange: (d: Date | null) => void;
  label?: string;
  placeholder?: string;
  withAsterisk?: boolean;
  clearable?: boolean;
}) {
  const [opened, setOpened] = useState(false);
  const [mode, setMode] = useState<PickerMode>(null);
  // 표시 중인 달(미선택 시 오늘 기준).
  const [month, setMonth] = useState<Date>(value ?? new Date());

  const open = () => {
    setMonth(value ?? new Date());
    setMode(null);
    setOpened(true);
  };
  const close = () => {
    setOpened(false);
    setMode(null);
  };

  const year = dayjs(month).year();
  const monthIdx = dayjs(month).month();

  return (
    <Popover
      opened={opened}
      onChange={(o) => (o ? setOpened(true) : close())}
      position="bottom-start"
      withinPortal
      trapFocus={false}
      shadow="md"
      radius="md"
      width={300}
    >
      <Popover.Target>
        <TextInput
          label={label}
          withAsterisk={withAsterisk}
          placeholder={placeholder}
          readOnly
          value={value ? dayjs(value).format('YYYY년 M월 D일') : ''}
          onClick={() => (opened ? close() : open())}
          styles={{ input: { cursor: 'pointer' } }}
          rightSection={
            clearable && value ? (
              <CloseButton
                size="sm"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
                aria-label="날짜 지우기"
              />
            ) : null
          }
        />
      </Popover.Target>
      <Popover.Dropdown p="sm">
        {/* 토=파랑, 일=빨강 (월~일 순서) — 요일 헤더 */}
        <style jsx global>{`
          /* day 캘린더 테이블을 드롭다운 폭에 꽉 채워 월·연도 그리드와 폭을 묶는다. */
          .kw-dp .mantine-Calendar-calendarHeader,
          .kw-dp .mantine-Calendar-month {
            width: 100%;
            max-width: 100%;
          }
          .kw-dp .mantine-Calendar-weekday:nth-of-type(6) {
            color: var(--mantine-color-blue-6);
          }
          .kw-dp .mantine-Calendar-weekday:last-of-type {
            color: var(--mantine-color-red-6);
          }
        `}</style>

        {mode === null && (
          <Calendar
            className="kw-dp"
            // day 캘린더를 드롭다운 폭에 꽉 채워 월·연도 그리드와 같은 폭으로 묶는다.
            style={{ width: '100%' }}
            date={month}
            onDateChange={setMonth}
            level="month"
            onLevelChange={(lv) => {
              if (lv === 'year') setMode('months');
              else if (lv === 'decade') setMode('years');
            }}
            minDate={new Date(MIN_YEAR, 0, 1)}
            firstDayOfWeek={1}
            weekdayFormat={(d) => KOR_WEEKDAYS[d.getDay()]}
            monthLabelFormat="YYYY년 M월"
            yearLabelFormat="YYYY년"
            monthsListFormat="M월"
            getDayProps={(date) => {
              const wd = dayjs(date).day(); // 0=일 ~ 6=토
              return {
                selected: value ? dayjs(date).isSame(value, 'date') : false,
                style:
                  wd === 6
                    ? { color: 'var(--mantine-color-blue-6)' }
                    : wd === 0
                      ? { color: 'var(--mantine-color-red-6)' }
                      : undefined,
                onClick: () => {
                  setMonth(date);
                  onChange(date);
                  close();
                },
              };
            }}
          />
        )}

        {mode !== null && (
          <Box>
            <Group justify="space-between" mb="xs">
              <Button
                size="compact-sm"
                variant="light"
                color="green"
                onClick={() => {
                  const today = new Date();
                  setMonth(today);
                  onChange(today);
                  close();
                }}
              >
                오늘
              </Button>
              <Button size="compact-xs" variant="subtle" color="gray" onClick={() => setMode(null)}>
                닫기
              </Button>
            </Group>

            {mode === 'months' ? (
              <MonthGrid
                year={year}
                onChangeYear={(y) => setMonth(new Date(y, monthIdx, 1))}
                onOpenYears={() => setMode('years')}
                onPickMonth={(m) => {
                  setMonth(new Date(year, m, 1));
                  setMode(null);
                }}
              />
            ) : (
              <DecadeYearGrid
                year={year}
                onMoveDecade={(y) => setMonth(new Date(y, monthIdx, 1))}
                onPickYear={(y) => {
                  setMonth(new Date(y, monthIdx, 1));
                  setMode('months');
                }}
              />
            )}
          </Box>
        )}
      </Popover.Dropdown>
    </Popover>
  );
}

// 월 선택 그리드 — 1~12월 3×4.
function MonthGrid({
  year,
  onChangeYear,
  onOpenYears,
  onPickMonth,
}: {
  year: number;
  onChangeYear: (year: number) => void;
  onOpenYears: () => void;
  onPickMonth: (monthIndex: number) => void;
}) {
  return (
    <Box>
      <Group justify="space-between" align="center" mb="xs" px="xs">
        <ActionIcon
          variant="subtle"
          color="gray"
          disabled={year <= MIN_YEAR}
          onClick={() => onChangeYear(year - 1)}
          aria-label="이전 해"
        >
          <IconChevronLeft size={18} />
        </ActionIcon>
        <UnstyledButton onClick={onOpenYears}>
          <Text fw={700}>{year}년</Text>
        </UnstyledButton>
        <ActionIcon variant="subtle" color="gray" onClick={() => onChangeYear(year + 1)} aria-label="다음 해">
          <IconChevronRight size={18} />
        </ActionIcon>
      </Group>
      <SimpleGrid cols={3} spacing="xs" verticalSpacing="xs">
        {Array.from({ length: 12 }, (_, m) => (
          <Button
            key={m}
            size="sm"
            variant="subtle"
            color="dark"
            fullWidth
            h={40}
            fz="sm"
            fw={400}
            onClick={() => onPickMonth(m)}
          >
            {m + 1}월
          </Button>
        ))}
      </SimpleGrid>
    </Box>
  );
}

// 연도 선택 그리드 — 해당 10년 + 앞뒤 한 해(3×4). 경계 연도 클릭 시 이웃 10년대로 이동.
function DecadeYearGrid({
  year,
  onMoveDecade,
  onPickYear,
}: {
  year: number;
  onMoveDecade: (year: number) => void;
  onPickYear: (year: number) => void;
}) {
  const start = Math.floor(year / 10) * 10;
  const years = Array.from({ length: 12 }, (_, i) => start - 1 + i); // (start-1) ~ (start+10)
  return (
    <Box>
      <Group justify="space-between" align="center" mb="xs" px="xs">
        <ActionIcon
          variant="subtle"
          color="gray"
          disabled={start <= MIN_YEAR}
          onClick={() => onMoveDecade(start - 10)}
          aria-label="이전 10년"
        >
          <IconChevronLeft size={18} />
        </ActionIcon>
        <Text fw={700}>
          {start} - {start + 9}
        </Text>
        <ActionIcon variant="subtle" color="gray" onClick={() => onMoveDecade(start + 10)} aria-label="다음 10년">
          <IconChevronRight size={18} />
        </ActionIcon>
      </Group>
      <SimpleGrid cols={3} spacing="xs" verticalSpacing="xs">
        {years.map((y) => {
          const outside = y < start || y > start + 9;
          if (y < MIN_YEAR) {
            return (
              <Box
                key={y}
                c="gray.4"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                -
              </Box>
            );
          }
          return (
            <Button
              key={y}
              size="sm"
              variant="subtle"
              color={outside ? 'gray' : 'dark'}
              c={outside ? 'dimmed' : undefined}
              fullWidth
              h={40}
              fz="sm"
              fw={400}
              onClick={() => (outside ? onMoveDecade(y) : onPickYear(y))}
            >
              {y}
            </Button>
          );
        })}
      </SimpleGrid>
    </Box>
  );
}
