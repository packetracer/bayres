import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  parse,
  startOfMonth,
  startOfWeek
} from "date-fns";

export function calendarMonth(month?: string | null) {
  const current = month ? parse(month, "yyyy-MM", new Date()) : new Date();
  const start = startOfWeek(startOfMonth(current), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(current), { weekStartsOn: 0 });
  return {
    current,
    monthValue: format(current, "yyyy-MM"),
    label: format(current, "MMMM yyyy"),
    days: eachDayOfInterval({ start, end }),
    rangeStart: start,
    rangeEnd: addDays(end, 1),
    prev: format(new Date(current.getFullYear(), current.getMonth() - 1, 1), "yyyy-MM"),
    next: format(new Date(current.getFullYear(), current.getMonth() + 1, 1), "yyyy-MM")
  };
}

export function dateInputToReservationRange(value: string) {
  const start = new Date(`${value}T12:00:00`);
  const end = addDays(start, 1);
  return { start, end };
}

export function reservationDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function isSameCalendarDay(a: Date, b: Date) {
  return isSameDay(a, b);
}
