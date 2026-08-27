# Specification 12: Data Freshness Indicator & Stale Warning Specification

## 1. Concept & SLA Definition
In real-time school transport operations, stale data caused by delayed worker aggregation or cache staleness can lead to false assumptions. The backend explicitly returns `is_stale: boolean` and `last_updated: ISO-8601 string`.

---

## 2. Visual Warning Banner Specification
- **Trigger**: When `is_stale === true` or elapsed time $(T_{\text{now}} - T_{\text{last\_updated}}) > 30\text{ seconds}$.
- **Appearance**:
  - Background: Amber / Yellow (`bg-amber-500/15 border border-amber-500/40 text-amber-300`)
  - Icon: Warning Triangle
  - Text (Farsi): `«توجه: داده‌ها ممکن است کاملاً به‌روز نباشند. آخرین به‌روزرسانی: {X} ثانیه پیش»`
  - Action: Manual Refresh button with spinning indicator.

---

## 3. Component Contract (`packages/ui/src/StaleDataBanner.tsx`)
```tsx
interface StaleDataBannerProps {
  isStale: boolean;
  lastUpdated?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}
```
