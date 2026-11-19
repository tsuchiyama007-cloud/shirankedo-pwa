/** 日付の扱い。端末の現地時間を使う（日付が変わったら「今日の知らんけど」も変わる）。 */

const pad2 = (n: number) => String(n).padStart(2, '0');

/** YYYY-MM-DD（端末の現地時間） */
export function toLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** MM-DD（端末の現地時間） */
export function toMonthDay(date: Date): string {
  return `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** 図鑑などに表示する日時（例：2026/11/19 16:07） */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '----/--/-- --:--';
  return `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
