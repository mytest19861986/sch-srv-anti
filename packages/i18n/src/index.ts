import faDict from "./fa.json";

export type TranslationKey = keyof typeof faDict;

export const fa = faDict;

export function toPersianDigits(num: number | string): string {
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num
    .toString()
    .replace(/[0-9]/g, (w) => farsiDigits[parseInt(w, 10)]);
}

export function formatTimeAgo(seconds: number): string {
  return `${toPersianDigits(seconds)} ثانیه پیش`;
}
