# راهنمای جامع برندینگ و هویت بصری «سرویس یار» (ServiceYar Branding Guide)

## ۱. هویت رسمی برند (Brand Identity)
- **نام تجاری فارسی**: سرویس یار
- **نام تجاری لاتین**: ServiceYar
- **دامنه رسمی سازمانی**: `serviceyar.ir` / `api.serviceyar.ir`
- **شعار محوری**: «سامانه یکپارچه، امن و هوشمند مدیریت ناوگان و رصد تردد دانش‌آموزی کشور»

---

## ۲. سامانه‌ها و زیرعنوان‌ها (Product Ecosystem)

| سامانه / ماژول | عنوان فارسی رسمی | شناسه بسته / آدرس دامنه |
|---|---|---|
| 🏫 **پنل وب مدرسه** | سرویس یار — پنل مدیریت مدرسه | `school.serviceyar.ir` (پورت ۳۰۰۱) |
| 🛡️ **پنل راهبری کلان** | سرویس یار — پنل راهبری مرکزی | `admin.serviceyar.ir` (پورت ۳۰۰۲) |
| 📱 **اپلیکیشن راننده** | سرویس یار — نسخه رانندگان | `ir.serviceyar.driver` (Android APK) |
| 👨‍👩‍👧 **اپلیکیشن والدین** | سرویس یار — نسخه اولیا | `ir.serviceyar.parent` (Android APK) |
| ⚡ **هسته API و پردازش** | سرویس یار — Gateway & API Core | `api.serviceyar.ir` (پورت ۳۰۰۰) |

---

## ۳. پالت رنگ و تایپوگرافی (Color Palette & Typography)
- **رنگ اصلی (Primary Brand)**: آبی آسمانی مطمئن `#0EA5E9` (Sky-500)
- **رنگ پس‌زمینه پنل‌ها (Background Dark)**: نیلی تیره `#020617` (Slate-950)
- **رنگ کارت‌ها و المان‌ها (Surface Dark)**: زغالی `#0F172A` (Slate-900)
- **رنگ موفقیت و تایید (Success Accent)**: زمردی `#10B981` (Emerald-500)
- **رنگ اعلان و هشدار (Alert Accent)**: کهربایی `#F59E0B` (Amber-500)
- **تایپوگرافی استاندارد**: قلم فارسی وزیرمتن (`Vazirmatn`) با وزن‌های Regular (۴۰۰)، Semi-Bold (۶۰۰) و Black (۹۰۰).

---

## ۴. معماری داینامیک پیکربندی و تغییر دامنه (Dynamic Branding Config)
کلیه مشخصات برندینگ و دامنه به صورت ماژولار از فایل `config/branding.ts` و متغیر محیطی `DOMAIN` در `.env` خوانده می‌شوند:
```typescript
export const BRANDING = {
  productName: 'سرویس یار',
  domain: process.env.DOMAIN || 'serviceyar.ir',
  driverAppName: 'سرویس یار - راننده',
  parentAppName: 'سرویس یار - والدین',
  schoolPanelName: 'پنل مدرسه سرویس یار',
  adminPanelName: 'پنل راهبری سرویس یار',
  primaryColor: '#0EA5E9',
  font: 'Vazirmatn'
};
```
> [!NOTE]
> دامنه `serviceyar.ir` موقتی بوده و در فاز نهایی اتصال و استقرار (Wire-up Phase) تنها با تغییر مقدار `DOMAIN` در فایل `.env` بدون نیاز به تغییر کدها، به دامنه نهایی و اختصاصی مشتری به‌روزرسانی خواهد شد.
