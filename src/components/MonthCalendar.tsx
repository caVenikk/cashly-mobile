import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon } from '@/src/components/Icon';
import { CashlyTheme } from '@/src/lib/theme';
import { useTokens } from '@/src/lib/themeMode';
import { fmtDateObj } from '@/src/lib/format';
import { useLang } from '@/src/i18n';

export type CalendarEvent = {
  id: string;
  date: string; // yyyy-MM-dd
  color: string;
};

type Props = {
  month: Date;
  events: CalendarEvent[];
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onSelectDay?: (iso: string) => void;
  selectedDay?: string | null;
};

export function MonthCalendar({ month, events, onPrev, onNext, onToday, onSelectDay, selectedDay }: Props) {
  const { tokens, dark } = useTokens();
  const [lang] = useLang();

  const { weeks, isCurrentMonth } = useMemo(() => computeMonth(month), [month]);
  const todayIso = isoFrom(new Date());

  const byDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const arr = m.get(e.date) ?? [];
      arr.push(e);
      m.set(e.date, arr);
    }
    return m;
  }, [events]);

  const weekdayLabels =
    lang === 'ru' ? ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text
          style={{
            fontSize: 17,
            fontWeight: '700',
            color: tokens.text,
            letterSpacing: -0.3,
            textTransform: 'capitalize',
          }}
        >
          {fmtDateObj(month, 'LLLL yyyy', lang)}
        </Text>
        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
          {!isCurrentMonth ? (
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                onToday();
              }}
              hitSlop={6}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 10,
                backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                marginRight: 4,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: tokens.text }}>
                {lang === 'ru' ? 'Сегодня' : 'Today'}
              </Text>
            </Pressable>
          ) : null}
          <ArrowBtn onPress={onPrev} direction="left" />
          <ArrowBtn onPress={onNext} direction="right" />
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginBottom: 6 }}>
        {weekdayLabels.map((l, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, fontWeight: '600', color: tokens.textTertiary, letterSpacing: 0.3 }}>{l}</Text>
          </View>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={{ flexDirection: 'row' }}>
          {week.map((day, di) => {
            if (!day) {
              return <View key={di} style={{ flex: 1, height: 44 }} />;
            }
            const dayEvents = byDay.get(day.iso) ?? [];
            const isToday = day.iso === todayIso;
            const isSelected = selectedDay === day.iso;
            return (
              <Pressable
                key={di}
                onPress={() => {
                  if (!onSelectDay) return;
                  Haptics.selectionAsync();
                  onSelectDay(day.iso);
                }}
                style={{
                  flex: 1,
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                }}
              >
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected
                      ? CashlyTheme.accent.income
                      : isToday
                        ? dark
                          ? 'rgba(255,255,255,0.15)'
                          : 'rgba(0,0,0,0.08)'
                        : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: isToday || isSelected ? '700' : '500',
                      color: isSelected ? '#fff' : day.inMonth ? tokens.text : tokens.textTertiary,
                    }}
                  >
                    {day.day}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 2, height: 4 }}>
                  {dayEvents.slice(0, 3).map((e, i) => (
                    <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: e.color }} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function ArrowBtn({ onPress, direction }: { onPress: () => void; direction: 'left' | 'right' }) {
  const { tokens, dark } = useTokens();
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Icon name={direction === 'left' ? 'chevLeft' : 'chevRight'} color={tokens.text} size={14} />
    </Pressable>
  );
}

type DayCell = { day: number; iso: string; inMonth: boolean };

function computeMonth(month: Date): { weeks: (DayCell | null)[][]; isCurrentMonth: boolean } {
  const y = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(y, m, 1);
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const firstWeekday = (first.getDay() + 6) % 7; // Mon=0

  const weeks: (DayCell | null)[][] = [];
  let current: (DayCell | null)[] = new Array(firstWeekday).fill(null);

  // Fill previous-month tail
  const prevMonthLast = new Date(y, m, 0).getDate();
  for (let i = 0; i < firstWeekday; i++) {
    const day = prevMonthLast - firstWeekday + 1 + i;
    const iso = isoFrom(new Date(y, m - 1, day));
    current[i] = { day, iso, inMonth: false };
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const iso = isoFrom(new Date(y, m, d));
    current.push({ day: d, iso, inMonth: true });
    if (current.length === 7) {
      weeks.push(current);
      current = [];
    }
  }

  // Fill next-month head
  if (current.length > 0) {
    let nd = 1;
    while (current.length < 7) {
      const iso = isoFrom(new Date(y, m + 1, nd));
      current.push({ day: nd, iso, inMonth: false });
      nd++;
    }
    weeks.push(current);
  }

  const now = new Date();
  const isCurrentMonth = y === now.getFullYear() && m === now.getMonth();
  return { weeks, isCurrentMonth };
}

function isoFrom(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
