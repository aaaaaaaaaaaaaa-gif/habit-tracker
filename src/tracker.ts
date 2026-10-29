export const STORAGE_KEY = 'habit-timeline:v1';
export type Status = 'complete' | 'incomplete';
export type Goal = { id: string; category: string; title: string; time: string; detail: string };
export type Entry = { status: Status; goal: Goal; updatedAt: string };
export type Tracker = {
  version: 1;
  startDate: string;
  milestone: 7 | 30 | 90;
  goals: Goal[];
  records: Record<string, Record<string, Entry>>;
  schedule: Record<string, Goal[]>;
};

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function parseDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}
export function addDays(key: string, days: number): string {
  const date = parseDate(key);
  date.setDate(date.getDate() + days);
  return localDate(date);
}
export function daysBetween(from: string, to: string): number {
  const serial = (key: string) => {
    const date = parseDate(key);
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  };
  return Math.round((serial(to) - serial(from)) / 86400000);
}
export function monday(key: string): string {
  return addDays(key, -((parseDate(key).getDay() + 6) % 7));
}
export function displayDate(key: string, withYear = true): string {
  return `${withYear ? `${key.slice(0, 4)}.` : ''}${key.slice(5, 7)}.${key.slice(8, 10)}`;
}
export function weekday(key: string): string {
  return ['일', '월', '화', '수', '목', '금', '토'][parseDate(key).getDay()];
}
export function createTracker(today = localDate()): Tracker {
  return {
    version: 1, startDate: today, milestone: 30,
    goals: [
      { id: 'study', category: '공부', title: '과제 3문제', time: '09:00', detail: '60분' },
      { id: 'exercise', category: '운동', title: '달리기 3 km', time: '12:30', detail: '' },
      { id: 'hobby', category: '취미', title: '커피 시음 기록', time: '19:30', detail: '' },
    ],
    records: {}, schedule: {},
  };
}
export function goalsOn(data: Tracker, day: string): Goal[] {
  return [...(data.schedule[day] || data.goals)].sort((a, b) => a.time.localeCompare(b.time));
}
export function doneOn(data: Tracker, day: string): number {
  return goalsOn(data, day).filter(goal => data.records[day]?.[goal.id]?.status === 'complete').length;
}
export function canRecord(data: Tracker, day: string, today = localDate()): boolean {
  return day >= data.startDate && day <= today;
}
export function progress(data: Tracker, today: string) {
  const day = Math.max(0, daysBetween(data.startDate, today) + 1);
  const cycle = Math.floor(Math.max(0, day - 1) / data.milestone);
  const from = addDays(data.startDate, cycle * data.milestone);
  const to = addDays(from, data.milestone - 1);
  let completed = 0;
  let total = 0;
  for (let i = 0; i < data.milestone; i++) {
    const date = addDays(from, i);
    total += goalsOn(data, date).length;
    if (date <= today) completed += doneOn(data, date);
  }
  return { day, cycle, from, to, completed, total, percent: total ? completed / total * 100 : 0 };
}
export function streak(data: Tracker, today: string): number {
  let date = doneOn(data, today) === goalsOn(data, today).length ? today : addDays(today, -1);
  let count = 0;
  while (date >= data.startDate) {
    if (!goalsOn(data, date).length || doneOn(data, date) !== goalsOn(data, date).length) break;
    count++;
    date = addDays(date, -1);
  }
  return count;
}
