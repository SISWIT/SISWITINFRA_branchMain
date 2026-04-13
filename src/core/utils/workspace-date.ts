const DATE_PARAM_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface WorkspaceDateBounds {
  anchorDate: Date;
  dayStart: Date;
  dayEnd: Date;
  monthStart: Date;
  rolling7Start: Date;
  rolling14Start: Date;
  previous7Start: Date;
  previous7End: Date;
}

export function parseWorkspaceDateParam(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const match = DATE_PARAM_PATTERN.exec(value.trim());
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return undefined;
  }

  return parsed;
}

export function formatWorkspaceDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isSameLocalDate(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function getStartOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getWorkspaceDateBounds(anchorDate: Date): WorkspaceDateBounds {
  const dayStart = getStartOfLocalDay(anchorDate);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);

  const monthStart = new Date(dayStart.getFullYear(), dayStart.getMonth(), 1);

  const rolling7Start = new Date(dayStart);
  rolling7Start.setDate(rolling7Start.getDate() - 6);

  const rolling14Start = new Date(dayStart);
  rolling14Start.setDate(rolling14Start.getDate() - 13);

  const previous7Start = new Date(dayStart);
  previous7Start.setDate(previous7Start.getDate() - 13);

  const previous7End = new Date(dayStart);
  previous7End.setDate(previous7End.getDate() - 7);
  previous7End.setHours(23, 59, 59, 999);

  return {
    anchorDate: dayStart,
    dayStart,
    dayEnd,
    monthStart,
    rolling7Start,
    rolling14Start,
    previous7Start,
    previous7End,
  };
}
