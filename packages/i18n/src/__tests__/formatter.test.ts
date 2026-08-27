import { describe, expect, it } from "bun:test";
import { toPersianDigits, formatTimeAgo } from "../index";

describe("i18n Formatter Tests", () => {
  it("should convert English digits to Persian digits", () => {
    expect(toPersianDigits(12345)).toBe("۱۲۳۴۵");
    expect(toPersianDigits("09121112233")).toBe("۰۹۱۲۱۱۱۲۲۳۳");
  });

  it("should format time ago in Persian", () => {
    expect(formatTimeAgo(45)).toBe("۴۵ ثانیه پیش");
  });
});
