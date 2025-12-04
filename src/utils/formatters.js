import { format } from "date-fns";

export function formatTime(date) {
  if (!date) return "-";
  return format(new Date(date), "HH:mm");
}

export function formatDay(date) {
  if (!date) return "-";
  return format(new Date(date), "EEE dd MMM");
}

export function formatRange(start, end) {
  return `${formatTime(start)} - ${formatTime(end)}`;
}
