# فهرست کامل و جامع معماری اطلاعات سامانه «سرویس یار» (Full IA Inventory)
> نسخه: `1.0.0-rc.2` | تاریخ اسکن: ۱۴۰۵/۰۶/۰۶ | استخراج مستقیم از کدهای منبع

---

## ۱. پنل وب مدیریت واحد آموزشی (School Admin Web Dashboard — Port 3001)

| ردیف | منو / بخش سایدبار | مسیر صفحه (File Path) | اکشن‌ها و قابلیت‌های فعال | نقش‌های مجاز |
|---|---|---|---|---|
| ۱ | ورود به سامانه | `apps/school-web/app/login/page.tsx` | ورود امن با ایمیل/رمز، خطایابی فارسی، راهنمای دمو | عمومی (Public) |
| ۲ | **نمای کلی داشبورد** | `apps/school-web/app/page.tsx` | ردیف ۵ کارت KPI، پنل وضعیت امروز با نوار سگمنتی، چارت ساعتی SVG (۰۵-۲۱)، جدول سرویس‌ها، بنر StaleData | `SCHOOL_ADMIN`, `SCHOOL_OPERATOR` |
| ۳ | **فهرست دانش‌آموزان** | `apps/school-web/app/students/page.tsx` | جستجوی بلادرنگ، مشاهده کلاس/پایه، فیلتر وضعیت سوار/پیاده، تغییر وضعیت دستی | `SCHOOL_ADMIN`, `SCHOOL_OPERATOR` |
| ۴ | **فهرست اولیا** | `apps/school-web/app/parents/page.tsx` | اطلاعات تماس اولیا، لیست فرزندان تحت تکفل، آدرس منزل | `SCHOOL_ADMIN`, `SCHOOL_OPERATOR` |
| ۵ | **رانندگان مجاز** | `apps/school-web/app/drivers/page.tsx` | مشخصات هویتی، وضعیت گواهینامه، خودروی تخصیص‌یافته، شماره تماس | `SCHOOL_ADMIN`, `SCHOOL_OPERATOR` |
| ۶ | **ناوگان خودرویی** | `apps/school-web/app/vehicles/page.tsx` | مدل خودرو، شماره پلاک، ظرفیت مسافر، وضعیت بیمه و معاینه فنی | `SCHOOL_ADMIN`, `SCHOOL_OPERATOR` |
| ۷ | **مسیرها و ایستگاه‌ها** | `apps/school-web/app/routes/page.tsx` | لیست ایستگاه‌های مبدا و مقصد، شیفت‌های صبح/عصر، زمان تخمینی | `SCHOOL_ADMIN`, `SCHOOL_OPERATOR` |
| ۸ | **سرویس‌های فعال شیفت** | `apps/school-web/app/services/page.tsx` | پایش زنده راننده، درصد مسافران سوارشده، وضعیت تکمیل سرویس | `SCHOOL_ADMIN`, `SCHOOL_OPERATOR` |
| ۹ | **گزارش رویدادهای تردد** | `apps/school-web/app/reports/events/page.tsx` | تاریخچه ثانیه‌ای سوار/پیاده/غیبت با تفکیک زمان، فیلتر تاریخ | `SCHOOL_ADMIN`, `SCHOOL_OPERATOR` |
| ۱۰ | **لاگ‌های حسابرسی مدرسه** | `apps/school-web/app/reports/audit-logs/page.tsx` | ردیابی تغییرات مدیریتی، لاگ ورود و اصلاح رویدادها | `SCHOOL_ADMIN` |
| ۱۱ | **تاریخچه اعلان‌ها و پیامک‌ها** | `apps/school-web/app/reports/notifications/page.tsx` | سابقه پوش نوتیفیکیشن‌ها و پیامک‌های ارسال‌شده به اولیا | `SCHOOL_ADMIN`, `SCHOOL_OPERATOR` |
| ۱۲ | خروج از حساب | `apps/school-web/components/Sidebar.tsx` | ابطال کوکی HttpOnly و هدایت به `/login` | کلیه کاربران لاگین‌شده |

---

## ۲. پنل وب راهبری کلان پلتفرم (Super Admin Web Dashboard — Port 3002)

| ردیف | منو / بخش سایدبار | مسیر صفحه (File Path) | اکشن‌ها و قابلیت‌های فعال | نقش‌های مجاز |
|---|---|---|---|---|
| ۱ | ورود راهبر ارشد | `apps/super-admin-web/app/login/page.tsx` | احراز هویت اختصاصی Super Admin با گیت Zero-Trust | `SUPER_ADMIN` |
| ۲ | **نمای کلی پلتفرم** | `apps/super-admin-web/app/page.tsx` | آمار کلان کشوری (مدارس، ناوگان، رویدادها)، ماتریس زنده سلامت زیرساخت | `SUPER_ADMIN` |
| ۳ | **مدیریت مدارس و شعب** | `apps/super-admin-web/app/tenants/page.tsx` | لیست مدارس عضو، کدهای شناسایی، تعلیق و فعال‌سازی مجدد تننت‌ها | `SUPER_ADMIN` |
| ۴ | **کاربران سراسری** | `apps/super-admin-web/app/users/page.tsx` | لیست کاربران کل کشور با فیلتر تننت، مشاهده نقش‌ها و وضعیت حساب | `SUPER_ADMIN` |
| ۵ | **نقش‌ها و دسترسی‌ها** | `apps/super-admin-web/app/roles/page.tsx` | ماتریس سطوح دسترسی ۵ گانه RBAC و اسکوپ‌های امنیتی | `SUPER_ADMIN` |
| ۶ | **لاگ حسابرسی مرکزی** | `apps/super-admin-web/app/audit-logs/page.tsx` | رهگیری کلیه رخدادهای سیستمی، تغییرات تننت و لاگ‌های امنیتی کشور | `SUPER_ADMIN` |
| ۷ | **تنظیمات پلتفرم** | `apps/super-admin-web/app/settings/page.tsx` | ویرایشگر JWT Expiry، سقف Rate Limit و سوئیچ حالت تعمیرات | `SUPER_ADMIN` |
| ۸ | **شاخص‌های کلان پلتفرم** | `apps/super-admin-web/app/reports/overview/page.tsx` | نرخ تحویل نوتیفیکیشن، میانگین تاخیر صف، حجم ترافیک تجمیعی | `SUPER_ADMIN` |
| ۹ | **آمار رشد و ناوگان** | `apps/super-admin-web/app/reports/growth/page.tsx` | گزارش تفکیک استانی تعداد ناوگان، مدارس و نرخ رشد ماهانه | `SUPER_ADMIN` |

---

## ۳. اپلیکیشن موبایل رانندگان (Driver Android App — Package: `ir.serviceyar.driver`)

| ردیف | صفحه / جریان کاربری | فایل‌های پیاده‌سازی (Kotlin / Jetpack Compose) | اکشن‌ها و منطق بیزنس |
|---|---|---|---|
| ۱ | **صفحه ورود راننده** | `apps/driver-android/app/src/main/java/.../ui/LoginScreen.kt` | لاگین با توکن JWT، ذخیره امن در EncryptedSharedPreferences |
| ۲ | **مانیفست تردد شیفت** | `apps/driver-android/app/src/main/java/.../ui/ManifestScreen.kt` | دریافت آفلاین لیست دانش‌آموزان، شماره تماس اضطراری اولیا |
| ۳ | **ثبت رخداد سوار شد (PICKED_UP)** | `apps/driver-android/app/src/main/java/.../data/EventRepository.kt` | ثبت تک‌لمسی (One-Tap)، درج در پایگاه داده محلی Room با client_generated_id |
| ۴ | **ثبت رخداد پیاده شد (DROPPED_OFF)** | `apps/driver-android/app/src/main/java/.../data/EventRepository.kt` | اعتبارسنجی ماشین وضعیت محلی و ثبت رویداد مقصد |
| ۵ | **ثبت غیبت مسافر (ABSENT)** | `apps/driver-android/app/src/main/java/.../data/EventRepository.kt` | ثبت عدم حضور با جلوگیری از تضاد وضعیت |
| ۶ | **موتور همگام‌سازی آفلاین** | `apps/driver-android/app/src/main/java/.../sync/SyncWorker.kt` | مانیتورینگ وضعیت اینترنت با WorkManager و همگام‌سازی دسته‌ای خودکار |

---

## ۴. اپلیکیشن موبایل اولیا (Parent Android App — Package: `ir.serviceyar.parent`)

| ردیف | صفحه / جریان کاربری | فایل‌های پیاده‌سازی (Kotlin / Jetpack Compose) | اکشن‌ها و منطق بیزنس |
|---|---|---|---|
| ۱ | **ورود والدین** | `apps/parent-android/app/src/main/java/.../ui/LoginScreen.kt` | لاگین با شماره موبایل / ایمیل ولی و احراز هویت فرزندان |
| ۲ | **داشبورد زنده فرزند** | `apps/parent-android/app/src/main/java/.../ui/HomeScreen.kt` | نمایش کارت وضعیت فعلی (در خانه، در مسیر، در مدرسه)، مشخصات راننده |
| ۳ | **خط زمانی تردد (Timeline)** | `apps/parent-android/app/src/main/java/.../ui/TimelineScreen.kt` | تاریخچه زمان‌بندی‌شده رویدادهای روز جاری با ارقام فارسی |
| ۴ | **دریافت پوش نوتیفیکیشن** | `apps/parent-android/app/src/main/java/.../fcm/PushService.kt` | دریافت آنی نوتیفیکیشن‌های سوار/پیاده شدن فرزند با قابلیت Deep Link |
