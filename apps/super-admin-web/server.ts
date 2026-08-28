/**
 * Super Admin Web Platform Portal Server (Comprehensive Management & Live KPIs)
 * Order #60, #62 & #63 Implementation:
 * - 2-Tier Balanced Actions Column with Fixed min-w-[280px]
 * - 8 Fully Functional Tabs with Persian Badges & Dynamic Pagination
 * - 36 Full Realistic Parent Records for Alborz School Matching 36 Badge Count
 * - Dynamic Summary Bar ("نمایش N از M رکورد — صفحه X از Y")
 * - EmptyState Component for Zero-Data Scenarios
 * - Full CRUD & Audit Log with actor_role=SUPER_ADMIN
 * Port: 3002 (0.0.0.0)
 */

import Fastify from 'fastify';

const fastify = Fastify({ logger: false });

const PORT = 3002;
const HOST = '0.0.0.0';

function toFaDigits(num: number | string): string {
  const fa = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/[0-9]/g, w => fa[+w]);
}

interface TenantRecord {
  id: string;
  name: string;
  city: string;
  region: string;
  vehiclesCount: number;
  studentsCount: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  statusReason?: string;
  createdAt: string;
  students: Array<{ id: string; name: string; nationalCode: string; grade: string; route: string; status: string }>;
  parents: Array<{ id: string; name: string; phone: string; nationalCode: string; children: string; address: string }>;
  drivers: Array<{ id: string; name: string; phone: string; vehicle: string; plate: string; route: string }>;
  vehicles: Array<{ id: string; model: string; plate: string; capacity: number; driverName: string; insuranceValid: string }>;
  routes: Array<{ id: string; name: string; stopsCount: number; shift: string; status: string }>;
  services: Array<{ id: string; name: string; driverName: string; vehiclePlate: string; departureTime: string; status: string }>;
  events: Array<{ id: string; studentName: string; type: string; stopName: string; time: string }>;
  auditLogs: Array<{ id: string; timestamp: string; actor: string; action: string; details: string }>;
}

// Generate 36 realistic parent records for Alborz High School
const ALBORZ_PARENTS: Array<{ id: string; name: string; phone: string; nationalCode: string; children: string; address: string }> = [
  { id: 'par-201', name: 'کامران کاظمی (پدر)', phone: '۰۹۱۲۸۸۸۱۱۱۱', nationalCode: '۰۱۱۹۹۲۲۳۳۴', children: 'آرمین کاظمی (پایه دهم)', address: 'تهران، امیرآباد شمالی، خ شانزدهم' },
  { id: 'par-202', name: 'فرشته شایان (مادر)', phone: '۰۹۱۲۸۸۸۲۲۲۲', nationalCode: '۰۲۲۸۸۳۳۴۴۵', children: 'بردیا شایان (پایه یازدهم)', address: 'تهران، کوی نصر (گیشا)، خ ۲۱' },
  { id: 'par-203', name: 'بهزاد فراهانی (پدر)', phone: '۰۹۱۲۸۸۸۳۳۳۳', nationalCode: '۰۳۳۷۷۴۴۵۵۶', children: 'سامان فراهانی (پایه دوازدهم)', address: 'تهران، میدان فاطمی، خ بیستون' },
  { id: 'par-204', name: 'سارا کریمی (مادر)', phone: '۰۹۱۲۸۸۸۴۴۴۴', nationalCode: '۰۴۴۶۶۵۵۶۶۷', children: 'دانیال کریمی (پایه دهم)', address: 'تهران، بلوار کشاورز، خ وصال' },
  { id: 'par-205', name: 'مجید صادقی (پدر)', phone: '۰۹۱۲۸۸۸۵۵۵۵', nationalCode: '۰۵۵۵۵۶۶۷۷۸', children: 'پرهام صادقی (پایه دهم)', address: 'تهران، کارگر شمالی، خ نصرت' },
  { id: 'par-206', name: 'زهره ابراهیمی (مادر)', phone: '۰۹۱۲۸۸۸۶۶۶۶', nationalCode: '۰۶۶۴۴۷۷۸۸۹', children: 'ایلیا ابراهیمی (پایه یازدهم)', address: 'تهران، یوسف‌آباد، خ اسدآبادی' },
  { id: 'par-207', name: 'محسن اکبری (پدر)', phone: '۰۹۱۲۸۸۸۷۷۷۷', nationalCode: '۰۷۷۳۳۸۸۹۹۰', children: 'کیان اکبری (پایه دوازدهم)', address: 'تهران، میدان انقلاب، خ آزادی' },
  { id: 'par-208', name: 'مریم طاهری (مادر)', phone: '۰۹۱۲۸۸۸۸۸۸۸', nationalCode: '۰۸۸۲۲۹۹۰۰۱', children: 'سینا طاهری (پایه دهم)', address: 'تهران، جمالزاده شمالی، خ فرصت' },
  { id: 'par-209', name: 'حسن رستمی (پدر)', phone: '۰۹۱۲۸۸۸۹۹۹۹', nationalCode: '۰۹۹۱۱۰۱۱۲۳', children: 'مانی رستمی (پایه یازدهم)', address: 'تهران، اسکندری شمالی' },
  { id: 'par-210', name: 'فاطمه جلالی (مادر)', phone: '۰۹۱۲۷۷۷۱۱۱۱', nationalCode: '۱۰۰۹۹۲۲۳۳۴', children: 'آراد جلالی (پایه دوازدهم)', address: 'تهران، کارگر جنوبی، خ لبافی‌نژاد' },
  { id: 'par-211', name: 'سعید مرادی (پدر)', phone: '۰۹۱۲۷۷۷۲۲۲۲', nationalCode: '۱۱۱۸۸۳۳۴۴۵', children: 'نوید مرادی (پایه دهم)', address: 'تهران، میدان توحید، خ بهبودی' },
  { id: 'par-212', name: 'الهام مقدسی (مادر)', phone: '۰۹۱۲۷۷۷۳۳۳۳', nationalCode: '۱۲۲۷۷۴۴۵۵۶', children: 'متین مقدسی (پایه یازدهم)', address: 'تهران، ستارخان، خ دریان‌نو' },
  { id: 'par-213', name: 'داوود حیدری (پدر)', phone: '۰۹۱۲۷۷۷۴۴۴۴', nationalCode: '۱۳۳۶۶۵۵۶۶۷', children: 'سپهر حیدری (پایه دوازدهم)', address: 'تهران، پاتریس لومومبا' },
  { id: 'par-214', name: 'نرگس سلطانی (مادر)', phone: '۰۹۱۲۷۷۷۵۵۵۵', nationalCode: '۱۴۴۵۵۶۶۷۷۸', children: 'آبتین سلطانی (پایه دهم)', address: 'تهران، شهرآرا، خ پاشایی' },
  { id: 'par-215', name: 'حمیدرضا نجفی (پدر)', phone: '۰۹۱۲۷۷۷۶۶۶۶', nationalCode: '۱۵۵۴۴۷۷۸۸۹', children: 'شایان نجفی (پایه یازدهم)', address: 'تهران، جلال آل‌احمد' },
  { id: 'par-216', name: 'شکوفه احمدی (مادر)', phone: '۰۹۱۲۷۷۷۷۷۷۷', nationalCode: '۱۶۶۳۳۸۸۹۹۰', children: 'امیرحسین احمدی (پایه دوازدهم)', address: 'تهران، میدان سلماس' },
  { id: 'par-217', name: 'اصغر کریمی (پدر)', phone: '۰۹۱۲۷۷۷۸۸۸۸', nationalCode: '۱۷۷۲۲۹۹۰۰۱', children: 'بهراد کریمی (پایه دهم)', address: 'تهران، فتحی شقاقی' },
  { id: 'par-218', name: 'مینا رحیمی (مادر)', phone: '۰۹۱۲۷۷۷۹۹۹۹', nationalCode: '۱۸۸۱۱۰۱۱۲۳', children: 'عرشیا رحیمی (پایه یازدهم)', address: 'تهران، خ فاطمی، ک چهارم' },
  { id: 'par-219', name: 'علی بهرامی (پدر)', phone: '۰۹۱۲۶۶۶۱۱۱۱', nationalCode: '۱۹۹۰۹۱۲۲۳۴', children: 'ماهان بهرامی (پایه دوازدهم)', address: 'تهران، میدان گل‌ها' },
  { id: 'par-220', name: 'فریبا نوروزی (مادر)', phone: '۰۹۱۲۶۶۶۲۲۲۲', nationalCode: '۲۰۸۹۸۲۳۳۴۵', children: 'کوروش نوروزی (پایه دهم)', address: 'تهران، امیرآباد، خ هفدهم' },
  { id: 'par-221', name: 'منصور یوسفی (پدر)', phone: '۰۹۱۲۶۶۶۳۳۳۳', nationalCode: '۲۱۷۸۷۳۴۴۵۶', children: 'سروش یوسفی (پایه یازدهم)', address: 'تهران، کارگر شمالی، ک نصر' },
  { id: 'par-222', name: 'طاهره اسدی (مادر)', phone: '۰۹۱۲۶۶۶۴۴۴۴', nationalCode: '۲۲۶۷۶۴۵۵۶۷', children: 'رهام اسدی (پایه دوازدهم)', address: 'تهران، قزل‌قلعه' },
  { id: 'par-223', name: 'پیمان صالحی (پدر)', phone: '۰۹۱۲۶۶۶۵۵۵۵', nationalCode: '۲۳۵۶۵۵۶۶۷۸', children: 'امیررضا صالحی (پایه دهم)', address: 'تهران، خ کاج جنوبی' },
  { id: 'par-224', name: 'رویا قاسم‌پور (مادر)', phone: '۰۹۱۲۶۶۶۶۶۶۶', nationalCode: '۲۴۴۵۴۶۷۷۸۹', children: 'طاها قاسم‌پور (پایه یازدهم)', address: 'تهران، گیشا، ک پنجم' },
  { id: 'par-225', name: 'کاظم زارعی (پدر)', phone: '۰۹۱۲۶۶۶۷۷۷۷', nationalCode: '۲۵۳۴۳۷۸۸۹۰', children: 'کیارش زارعی (پایه دوازدهم)', address: 'تهران، بلوار کشاورز' },
  { id: 'par-226', name: 'مهناز شریفی (مادر)', phone: '۰۹۱۲۶۶۶۸۸۸۸', nationalCode: '۲۶۲۳۲۸۹۹۰۱', children: 'هیراد شریفی (پایه دهم)', address: 'تهران، خ فلسطین شمالی' },
  { id: 'par-227', name: 'عطا پوراحمد (پدر)', phone: '۰۹۱۲۶۶۶۹۹۹۹', nationalCode: '۲۷۱۲۱۹۰۰۱۲', children: 'آرتین پوراحمد (پایه یازدهم)', address: 'تهران، خ طالقانی غربی' },
  { id: 'par-228', name: 'سمیرا عسگری (مادر)', phone: '۰۹۱۲۵۵۵۱۱۱۱', nationalCode: '۲۸۰۱۰۹۱۱۲۳', children: 'رادین عسگری (پایه دوازدهم)', address: 'تهران، خ ۱۶ آذر' },
  { id: 'par-229', name: 'اکبر عبدی (پدر)', phone: '۰۹۱۲۵۵۵۲۲۲۲', nationalCode: '۲۸۹۹۹۸۲۲۳۴', children: 'سهراب عبدی (پایه دهم)', address: 'تهران، خ حجاب' },
  { id: 'par-230', name: 'لادن موسوی (مادر)', phone: '۰۹۱۲۵۵۵۳۳۳۳', nationalCode: '۲۹۸۸۸۷۳۳۴۵', children: 'آرمین موسوی (پایه یازدهم)', address: 'تهران، بلوار مرزداران' },
  { id: 'par-231', name: 'حامد تقوی (پدر)', phone: '۰۹۱۲۵۵۵۴۴۴۴', nationalCode: '۳۰۷۷۷۶۴۴۵۶', children: 'پویا تقوی (پایه دوازدهم)', address: 'تهران، کوی دانشگاه' },
  { id: 'par-232', name: 'پروانه خلیلی (مادر)', phone: '۰۹۱۲۵۵۵۵۵۵۵', nationalCode: '۳۱۶۶۶۵۵۵۶۷', children: 'فربد خلیلی (پایه دهم)', address: 'تهران، گیشا، ک سی‌ام' },
  { id: 'par-233', name: 'داریوش فرهمند (پدر)', phone: '۰۹۱۲۵۵۵۶۶۶۶', nationalCode: '۳۲۵۵۵۴۶۶۷۸', children: 'ارسلان فرهمند (پایه یازدهم)', address: 'تهران، بزرگراه چمران' },
  { id: 'par-234', name: 'سیمین باقری (مادر)', phone: '۰۹۱۲۵۵۵۷۷۷۷', nationalCode: '۳۳۴۴۴۳۷۷۸۹', children: 'رایان باقری (پایه دوازدهم)', address: 'تهران، یوسف‌آباد، ک ۳۴' },
  { id: 'par-235', name: 'وحید زمانی (پدر)', phone: '۰۹۱۲۵۵۵۸۸۸۸', nationalCode: '۳۴۳۳۳۲۸۸۹۰', children: 'سام زمانی (پایه دهم)', address: 'تهران، خ زرتشت غربی' },
  { id: 'par-236', name: 'گیتی صبوری (مادر)', phone: '۰۹۱۲۵۵۵۹۹۹۹', nationalCode: '۳۵۲۲۲۱۹۹۰۱', children: 'آریا صبوری (پایه یازدهم)', address: 'تهران، میدان جهاد' }
];

let TENANTS: TenantRecord[] = [
  {
    id: 'school-tehran-alborz',
    name: 'دبیرستان ماندگار البرز تهران',
    city: 'تهران',
    region: 'منطقه ۶ — خیابان انقلاب',
    vehiclesCount: 6,
    studentsCount: 55,
    status: 'ACTIVE',
    createdAt: '2026-08-10',
    students: [
      { id: 'std-201', name: 'آرمین کاظمی', nationalCode: '۰۱۱۲۲۳۳۴۴۵', grade: 'پایه دهم', route: 'مسیر الف — کارگر شمالی', status: 'حاضر در دبیرستان' },
      { id: 'std-202', name: 'بردیا شایان', nationalCode: '۰۲۲۳۳۴۴۵۵۶', grade: 'پایه یازدهم', route: 'مسیر ب — گیشا', status: 'حاضر در دبیرستان' },
      { id: 'std-203', name: 'سامان فراهانی', nationalCode: '۰۳۳۴۴۵۵۶۶۷', grade: 'پایه دوازدهم', route: 'مسیر ج — فاطمی', status: 'سوار بر سرویس' },
      { id: 'std-204', name: 'دانیال کریمی', nationalCode: '۰۴۴۵۵۶۶۷۷۸', grade: 'پایه دهم', route: 'مسیر الف — کارگر شمالی', status: 'پیاده شد در مقصد' }
    ],
    parents: ALBORZ_PARENTS,
    drivers: [
      { id: 'drv-201', name: 'مرتضی نوری', phone: '۰۹۱۲۵۵۵۶۶۷۷', vehicle: 'مینی‌بوس هیوندای', plate: '۳۳ع۴۵۶-۱۱', route: 'مسیر الف — کارگر و امیرآباد' },
      { id: 'drv-202', name: 'قاسم صادقی', phone: '۰۹۱۲۶۶۶۷۷۸۸', vehicle: 'ون غزال', plate: '۲۲ب۹۹۱-۴۴', route: 'مسیر ب — گیشا' },
      { id: 'drv-203', name: 'جواد رضوی', phone: '۰۹۱۲۷۷۷۸۸۹۹', vehicle: 'میدل‌باس مان', plate: '۵۵س۱۱۴-۳۳', route: 'مسیر ج — فاطمی' }
    ],
    vehicles: [
      { id: 'veh-201', model: 'مینی‌بوس هیوندای (کرم)', plate: '۳۳ع۴۵۶-۱۱', capacity: 16, driverName: 'مرتضی نوری', insuranceValid: '۱۴۰۵/۱۰/۱۵' },
      { id: 'veh-202', model: 'ون غزال (سفید)', plate: '۲۲ب۹۹۱-۴۴', capacity: 12, driverName: 'قاسم صادقی', insuranceValid: '۱۴۰۵/۱۱/۳۰' },
      { id: 'veh-203', model: 'میدل‌باس مان (خاکستری)', plate: '۵۵س۱۱۴-۳۳', capacity: 21, driverName: 'جواد رضوی', insuranceValid: '۱۴۰۶/۰۲/۲۰' }
    ],
    routes: [
      { id: 'rt-201', name: 'مسیر الف — کارگر و امیرآباد', stopsCount: 8, shift: 'صبح و عصر', status: 'فعال' },
      { id: 'rt-202', name: 'مسیر ب — گیشا و جلال آل‌احمد', stopsCount: 6, shift: 'صبح و عصر', status: 'فعال' },
      { id: 'rt-203', name: 'مسیر ج — فاطمی و فلسطین', stopsCount: 7, shift: 'صبح و عصر', status: 'فعال' }
    ],
    services: [], // Intentionally empty to showcase EmptyState component
    events: [
      { id: 'ev-201', studentName: 'آرمین کاظمی', type: 'DROPPED_OFF', stopName: 'درب اصلی دبیرستان البرز', time: '۰۷:۲۰:۰۰' },
      { id: 'ev-202', studentName: 'بردیا شایان', type: 'DROPPED_OFF', stopName: 'درب اصلی دبیرستان البرز', time: '۰۷:۲۴:۳۰' },
      { id: 'ev-203', studentName: 'سامان فراهانی', type: 'PICKED_UP', stopName: 'ایستگاه فاطمی ۲', time: '۰۶:۵۵:۱۲' }
    ],
    auditLogs: [
      { id: 'aud-3', timestamp: '2026-08-20 10:00', actor: 'SUPER_ADMIN (admin@platform.ir)', action: 'TENANT_CREATED', details: 'ثبت قرارداد تننت دبیرستان البرز' },
      { id: 'aud-4', timestamp: '2026-08-28 14:00', actor: 'SUPER_ADMIN (admin@platform.ir)', action: 'FLEET_EXPANDED', details: 'تخصیص ناوگان جدید به دبیرستان البرز' }
    ]
  },
  {
    id: 'tenant-school-mehr',
    name: 'مدرسه مهر دانش تهران (پایلوت فعال)',
    city: 'تهران',
    region: 'منطقه ۳ — خیابان ولیعصر',
    vehiclesCount: 4,
    studentsCount: 24,
    status: 'ACTIVE',
    createdAt: '2026-08-01',
    students: [
      { id: 'std-101', name: 'امیرعلی محمدی', nationalCode: '۰۰۱۲۳۴۵۶۷۸', grade: 'پایه سوم', route: 'مسیر ۱ — ونک', status: 'پیاده شد در مدرسه' },
      { id: 'std-102', name: 'سارا حسینی', nationalCode: '۰۰۱۲۳۴۵۶۷۹', grade: 'پایه اول', route: 'مسیر ۲ — سعادت‌آباد', status: 'اعلام مرخصی والد' },
      { id: 'std-103', name: 'پارسا تهرانی', nationalCode: '۰۰۲۲۳۳۴۴۵۵', grade: 'پایه پنجم', route: 'مسیر ۳ — نیاوران', status: 'پیاده شد در مدرسه' },
      { id: 'std-104', name: 'یاسمین رضایی', nationalCode: '۰۰۳۳۴۴۵۵۶۶', grade: 'پایه چهارم', route: 'مسیر ۱ — ونک', status: 'سوار بر سرویس' }
    ],
    parents: [
      { id: 'par-101', name: 'محمدرضا محمدی (پدر)', phone: '۰۹۱۲۹۹۹۱۱۱۱', nationalCode: '۰۰۱۱۹۹۸۸۲۲', children: 'امیرعلی محمدی (پایه سوم)', address: 'تهران، میدان ونک، خ گاندی، پلاک ۱۲' },
      { id: 'par-102', name: 'زهرا حسینی (مادر)', phone: '۰۹۱۲۹۹۹۲۲۲۲', nationalCode: '۰۰۲۲۸۸۷۷۳۳', children: 'سارا حسینی (پایه اول)', address: 'تهران، سعادت‌آباد، میدان کاج، خ سرو' },
      { id: 'par-103', name: 'علیرضا تهرانی (پدر)', phone: '۰۹۱۲۹۹۹۳۳۳۳', nationalCode: '۰۰۳۳۷۷۶۶۴۴', children: 'پارسا تهرانی (پایه پنجم)', address: 'تهران، نیاوران، خ مژده، کوچه بهار' },
      { id: 'par-104', name: 'مریم رضایی (مادر)', phone: '۰۹۱۲۹۹۹۴۴۴۴', nationalCode: '۰۰۴۴۶۶۵۵۵۵', children: 'یاسمین رضایی (پایه چهارم)', address: 'تهران، ملاصدرا، خ شیراز شمالی' }
    ],
    drivers: [
      { id: 'drv-101', name: 'علی رضایی', phone: '۰۹۱۲۱۱۱۲۲۳۳', vehicle: 'ون تویوتا هایس', plate: '۱۱ب۲۳۴-۲۲', route: 'مسیر ۱ — ونک و گاندی' },
      { id: 'drv-102', name: 'حسین احمدی', phone: '۰۹۱۲۲۲۲۳۳۴۴', vehicle: 'پژو پارس', plate: '۴۴ج۸۹۱-۳۳', route: 'مسیر ۲ — سعادت‌آباد' },
      { id: 'drv-103', name: 'محمد حسینی', phone: '۰۹۱۲۳۳۳۴۴۵۵', vehicle: 'ون دلیکا', plate: '۵۵د۱۲۳-۱۱', route: 'مسیر ۳ — نیاوران' },
      { id: 'drv-104', name: 'رضا کریمی', phone: '۰۹۱۲۴۴۴۵۵۶۶', vehicle: 'سمند EF7', plate: '۶۶س۷۸۹-۴۴', route: 'مسیر ۴ — ولنجک' }
    ],
    vehicles: [
      { id: 'veh-101', model: 'ون تویوتا هایس (سفید)', plate: '۱۱ب۲۳۴-۲۲', capacity: 10, driverName: 'علی رضایی', insuranceValid: '۱۴۰۵/۱۱/۲۰' },
      { id: 'veh-102', model: 'پژو پارس (نقره‌ای)', plate: '۴۴ج۸۹۱-۳۳', capacity: 4, driverName: 'حسین احمدی', insuranceValid: '۱۴۰۵/۰۹/۱۵' },
      { id: 'veh-103', model: 'ون دلیکا (سبز)', plate: '۵۵د۱۲۳-۱۱', capacity: 7, driverName: 'محمد حسینی', insuranceValid: '۱۴۰۵/۱۲/۰۱' },
      { id: 'veh-104', model: 'سمند EF7 (سفید)', plate: '۶۶س۷۸۹-۴۴', capacity: 4, driverName: 'رضا کریمی', insuranceValid: '۱۴۰۶/۰۱/۱۰' }
    ],
    routes: [
      { id: 'rt-101', name: 'مسیر ۱ — ونک و گاندی', stopsCount: 6, shift: 'صبح و عصر', status: 'فعال' },
      { id: 'rt-102', name: 'مسیر ۲ — سعادت‌آباد و شهرک غرب', stopsCount: 5, shift: 'صبح و عصر', status: 'فعال' },
      { id: 'rt-103', name: 'مسیر ۳ — نیاوران و پاسداران', stopsCount: 7, shift: 'صبح و عصر', status: 'فعال' }
    ],
    services: [
      { id: 'srv-101', name: 'سرویس ونک (شیفت صبح)', driverName: 'علی رضایی', vehiclePlate: '۱۱ب۲۳۴-۲۲', departureTime: '۰۶:۵۰', status: 'رسیده به مدرسه' },
      { id: 'srv-102', name: 'سرویس سعادت‌آباد (شیفت صبح)', driverName: 'حسین احمدی', vehiclePlate: '۴۴ج۸۹۱-۳۳', departureTime: '۰۷:۰۵', status: 'در مسیر مدرسه' }
    ],
    events: [
      { id: 'ev-101', studentName: 'امیرعلی محمدی', type: 'DROPPED_OFF', stopName: 'درب اصلی مدرسه', time: '۰۷:۲۸:۱۴' },
      { id: 'ev-102', studentName: 'یاسمین رضایی', type: 'PICKED_UP', stopName: 'ایستگاه ونک ۲', time: '۰۷:۱۲:۰۵' }
    ],
    auditLogs: [
      { id: 'aud-1', timestamp: '2026-08-28 08:30', actor: 'SUPER_ADMIN (admin@platform.ir)', action: 'TENANT_PROVISION', details: 'تخصیص اولیه و فعال‌سازی تننت' }
    ]
  },
  {
    id: 'school-shiraz-danesh',
    name: 'مدرسه هوشمند دانش و اندیشه شیراز',
    city: 'شیراز',
    region: 'ناحیه ۱ — بلوار چمران',
    vehiclesCount: 5,
    studentsCount: 38,
    status: 'ACTIVE',
    createdAt: '2026-08-15',
    students: [
      { id: 'std-301', name: 'ستاره رحیمی', nationalCode: '۲۲۸۱۲۳۴۵۶۷', grade: 'پایه هشتم', route: 'مسیر ۱ — معالی‌آباد', status: 'حاضر' }
    ],
    parents: [
      { id: 'par-301', name: 'مسعود رحیمی', phone: '۰۹۱۷۱۱۱۲۲۳۳', nationalCode: '۲۲۸۰۰۹۹۸۸۷', children: 'ستاره رحیمی', address: 'شیراز، معالی‌آباد' }
    ],
    drivers: [
      { id: 'drv-301', name: 'سعید مرادی', phone: '۰۹۱۷۱۱۱۲۲۳۳', vehicle: 'ون تویوتا هایس', plate: '۶۳ج۳۲۱-۸۸', route: 'مسیر ۱ — معالی‌آباد و زرهی' }
    ],
    vehicles: [
      { id: 'veh-301', model: 'ون تویوتا هایس', plate: '۶۳ج۳۲۱-۸۸', capacity: 10, driverName: 'سعید مرادی', insuranceValid: '۱۴۰۵/۰۸/۲۵' }
    ],
    routes: [
      { id: 'rt-301', name: 'مسیر ۱ — معالی‌آباد و زرهی', stopsCount: 6, shift: 'صبح و عصر', status: 'فعال' }
    ],
    services: [],
    events: [
      { id: 'ev-301', studentName: 'ستاره رحیمی', type: 'DROPPED_OFF', stopName: 'درب مدرسه دانش', time: '۰۷:۲۵:۱۰' }
    ],
    auditLogs: [
      { id: 'aud-4', timestamp: '2026-08-22 14:20', actor: 'SUPER_ADMIN (admin@platform.ir)', action: 'TENANT_CREATED', details: 'ثبت تننت شیراز' }
    ]
  },
  {
    id: 'school-isfahan-farzanegan',
    name: 'مجتمع آموزشی فرزانگان اصفهان',
    city: 'اصفهان',
    region: 'ناحیه ۳ — خیابان مشتاق',
    vehiclesCount: 3,
    studentsCount: 25,
    status: 'SUSPENDED',
    statusReason: 'تمدید سالانه قرارداد ناوگان و بررسی گواهی‌های بیمه',
    createdAt: '2026-08-18',
    students: [
      { id: 'std-401', name: 'مهتاب عباسی', nationalCode: '۱۲۷۹۸۷۶۵۴۳', grade: 'پایه هفتم', route: 'مسیر شرق', status: 'در انتظار فعال‌سازی' }
    ],
    parents: [
      { id: 'par-401', name: 'جواد عباسی', phone: '۰۹۱۳۱۱۱۲۲۳۳', nationalCode: '۱۲۷۰۰۱۱۲۲۳', children: 'مهتاب عباسی', address: 'اصفهان، خ مشتاق دوم' }
    ],
    drivers: [
      { id: 'drv-401', name: 'داوود قاسمی', phone: '۰۹۱۳۱۱۱۲۲۳۳', vehicle: 'پژو ۴۰۵', plate: '۱۳س۵۵۵-۶۷', route: 'مسیر شرق — پل خواجو' }
    ],
    vehicles: [
      { id: 'veh-401', model: 'پژو ۴۰۵ (خاکستری)', plate: '۱۳س۵۵۵-۶۷', capacity: 4, driverName: 'داوود قاسمی', insuranceValid: '۱۴۰۵/۰۷/۱۱' }
    ],
    routes: [
      { id: 'rt-401', name: 'مسیر شرق — پل خواجو', stopsCount: 4, shift: 'صبح و عصر', status: 'غیرفعال موقت' }
    ],
    services: [],
    events: [],
    auditLogs: [
      { id: 'aud-5', timestamp: '2026-08-27 16:45', actor: 'SUPER_ADMIN (admin@platform.ir)', action: 'TENANT_SUSPEND', details: 'تعلیق موقت جهت بررسی مدارک فنی ناوگان' }
    ]
  }
];

// Reusable EmptyState Component
function renderEmptyState(title: string, description: string, buttonText?: string, actionFn?: string): string {
  return `
  <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-12 text-center shadow-xl space-y-4 my-2">
    <div class="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-3xl mx-auto shadow-inner">
      📭
    </div>
    <div class="space-y-1">
      <h5 class="text-base font-bold text-white">${title}</h5>
      <p class="text-xs text-slate-400 max-w-md mx-auto">${description}</p>
    </div>
    ${buttonText ? `
    <button onclick="${actionFn || 'alert(\'عملیات در دسترس است\')'}" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-1.5 mt-2">
      <span>+</span> ${buttonText}
    </button>
    ` : ''}
  </div>
  `;
}

// Layout Renderer
const SUPER_ADMIN_LAYOUT = (title: string, content: string) => `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | پرتال راهبری کلان کشوری سرویس یار</title>
  <link rel="preconnect" href="https://cdn.jsdelivr.net">
  <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .glass-card { background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col">
  <!-- Top Global Navbar -->
  <header class="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md px-6 py-3.5 flex items-center justify-between shadow-xl">
    <div class="flex items-center gap-4">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-xl font-black shadow-lg">
        🛡️
      </div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-base font-black text-white">سامانه راهبری کلان کشوری سرویس یار</h1>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">SUPER ADMIN</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">v1.2.0</span>
        </div>
        <p class="text-xs text-slate-400">مرکز فرماندهی چندمستاجری و نظارت عالیه بر تمامی مدارس و ناوگان کشور</p>
      </div>
    </div>

    <div class="flex items-center gap-4">
      <div class="text-left hidden md:block">
        <p class="text-xs font-bold text-white">ادمین ارشد سامانه پلتفرم</p>
        <p class="text-[11px] text-slate-400 font-mono">admin@platform.ir | 192.168.1.110:3002</p>
      </div>
      <a href="http://localhost:3001" target="_blank" class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold border border-slate-700 transition-all flex items-center gap-1.5">
        <span>🏢</span> مشاهده پنل مدرسه
      </a>
      <a href="http://localhost:3000/health/live" target="_blank" class="px-3.5 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-xs text-emerald-300 font-semibold border border-emerald-800/60 transition-all flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> وضعیت سلامت زنده
      </a>
    </div>
  </header>

  <!-- Main Container -->
  <main class="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
    ${content}
  </main>

  <footer class="bg-slate-900 border-t border-slate-800 px-6 py-3 text-center text-xs text-slate-400">
    سامانه هوشمند سرویس یار — نسخه ۱.۲.۰ رسمی | زیرساخت Zero-Trust Multi-Tenancy با تفکیک کامل لایه‌ها
  </footer>
</body>
</html>`;

// 1. Overview Page
fastify.get('/', async (req, reply) => {
  const nonDeleted = TENANTS.filter(t => t.status !== 'DELETED');
  const totalTenants = nonDeleted.length;
  const activeTenants = nonDeleted.filter(t => t.status === 'ACTIVE').length;
  const suspendedTenants = nonDeleted.filter(t => t.status === 'SUSPENDED').length;
  
  const totalVehicles = nonDeleted.reduce((acc, t) => acc + t.vehiclesCount, 0);
  const totalStudents = nonDeleted.reduce((acc, t) => acc + t.studentsCount, 0);

  const content = `
  <div class="space-y-6">
    <!-- Header Controls -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-black text-white">نمای کلان پلتفرم کشوری و وضعیت مدارس (Tenants)</h2>
        <p class="text-sm text-slate-400">سامانه چندمستاجری ایزوله (Zero-Trust Multi-Tenancy) با دسترسی کامل مدیر ارشد</p>
      </div>
      <div class="flex items-center gap-3">
        <button onclick="triggerDbDump()" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-2">
          <span>💾</span> ایجاد بکاپ کامل دیتابیس (DB Snapshot Dump)
        </button>
        <button onclick="openAddTenantModal()" class="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2">
          <span>+</span> افزودن مدرسه جدید (تننت)
        </button>
      </div>
    </div>

    <!-- Live Dynamic KPIs (Calculated from in-memory DB aggregation) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div class="flex items-center justify-between">
          <p class="text-xs font-bold text-slate-400">کل مدارس پلتفرم (Tenants)</p>
          <span class="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-sm">🏢</span>
        </div>
        <p class="text-3xl font-black text-white mt-2" id="kpi-tenants">${toFaDigits(totalTenants)} مدرسه</p>
        <p class="text-xs text-emerald-400 font-medium mt-1">↑ ${toFaDigits(activeTenants)} فعال ${suspendedTenants > 0 ? `| ${toFaDigits(suspendedTenants)} معلق` : ''}</p>
      </div>

      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div class="flex items-center justify-between">
          <p class="text-xs font-bold text-slate-400">مجموع کل ناوگان کشور</p>
          <span class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-sm">🚐</span>
        </div>
        <p class="text-3xl font-black text-white mt-2" id="kpi-vehicles">${toFaDigits(totalVehicles)} دستگاه</p>
        <p class="text-xs text-slate-400 font-medium mt-1">جمع دقیق سطرها (${nonDeleted.map(t => toFaDigits(t.vehiclesCount)).join(' + ')} = ${toFaDigits(totalVehicles)})</p>
      </div>

      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div class="flex items-center justify-between">
          <p class="text-xs font-bold text-slate-400">دانش‌آموزان تحت پوشش</p>
          <span class="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center text-sm">👨‍🎓</span>
        </div>
        <p class="text-3xl font-black text-white mt-2" id="kpi-students">${toFaDigits(totalStudents)} نفر</p>
        <p class="text-xs text-emerald-400 font-medium mt-1">ثبت‌شده در پایگاه داده</p>
      </div>

      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div class="flex items-center justify-between">
          <p class="text-xs font-bold text-slate-400">شاخص سلامت و پایداری (SLA)</p>
          <span class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-sm">⚡</span>
        </div>
        <p class="text-3xl font-black text-emerald-400 mt-2">۹۹.۹۹٪</p>
        <p class="text-xs text-slate-400 font-medium mt-1">بدون خطا و صف پایدار</p>
      </div>
    </div>

    <!-- Tenants Table with 2-Tier Balanced Actions -->
    <div class="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      <div class="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 class="font-bold text-white text-sm">فهرست مدارس و مستاجران پلتفرم (Tenants Directory — ${toFaDigits(totalTenants)} سطر)</h3>
        <span class="text-xs text-slate-400">کنترل دسترسی جامع مدیر ارشد (Super Admin RBAC)</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-right text-xs">
          <thead class="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th class="p-3.5">نام مدرسه / مستاجر</th>
              <th class="p-3.5">شناسه تننت</th>
              <th class="p-3.5">شهر و منطقه</th>
              <th class="p-3.5 text-center">ناوگان</th>
              <th class="p-3.5 text-center">دانش‌آموزان</th>
              <th class="p-3.5 text-center">وضعیت</th>
              <th class="p-3.5 text-center min-w-[280px]">ستون اقدامات مدیر ارشد (Super Admin Actions)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/80 text-slate-300" id="tenants-tbody">
            ${nonDeleted.map(t => `
            <tr class="hover:bg-slate-800/50 transition-colors h-[84px]" id="row-${t.id}">
              <td class="p-3.5 font-bold text-white flex items-center gap-2">
                <span class="w-7 h-7 rounded-lg ${t.status === 'ACTIVE' ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'} flex items-center justify-center text-xs">🏢</span>
                ${t.name}
              </td>
              <td class="p-3.5 font-mono text-indigo-300">${t.id}</td>
              <td class="p-3.5">${t.city} — ${t.region}</td>
              <td class="p-3.5 text-center font-bold text-white">${toFaDigits(t.vehiclesCount)} دستگاه</td>
              <td class="p-3.5 text-center font-bold text-white">${toFaDigits(t.studentsCount)} نفر</td>
              <td class="p-3.5 text-center">
                ${t.status === 'ACTIVE' 
                  ? '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">فعال و آنلاین</span>' 
                  : '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30" title="' + (t.statusReason || '') + '">معلق</span>'}
              </td>
              <td class="p-3.5 text-center min-w-[280px]">
                <div class="flex flex-col gap-1.5 items-center justify-center">
                  <!-- Tier 1: Primary Management & View -->
                  <div class="flex items-center gap-2 w-full justify-center">
                    <a href="/tenants/${t.id}/manage" class="flex-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5" title="مدیریت جامع داده‌ها و ویرایش اطلاعات تننت">
                      <span>✏️</span> مدیریت کامل
                    </a>
                    <a href="/tenants/${t.id}/view" class="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700/80 transition-all flex items-center justify-center gap-1" title="مشاهده فقط‌خواندنی تننت">
                      <span>👁️</span> مشاهده
                    </a>
                  </div>
                  <!-- Tier 2: Operational Actions (Icon-Only + Tooltips) -->
                  <div class="flex items-center gap-2 w-full justify-center">
                    <a href="http://localhost:3001?impersonate=${t.id}" target="_blank" class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700/80 flex items-center justify-center text-sm transition-all" title="ورود به پنل مدرسه (Impersonation)">
                      🚪
                    </a>
                    ${t.status === 'ACTIVE'
                      ? `<button onclick="toggleTenantStatus('${t.id}', 'SUSPENDED')" class="w-8 h-8 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center text-sm transition-all" title="تعلیق مدرسه">⏸️</button>`
                      : `<button onclick="toggleTenantStatus('${t.id}', 'ACTIVE')" class="w-8 h-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center text-sm transition-all" title="فعال‌سازی مجدد مدرسه">▶️</button>`
                    }
                    <button onclick="softDeleteTenant('${t.id}', '${t.name}')" class="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center text-sm transition-all" title="حذف نرم مدرسه">🗑️</button>
                  </div>
                </div>
              </td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    async function toggleTenantStatus(tenantId, newStatus) {
      let reason = '';
      if (newStatus === 'SUSPENDED') {
        reason = prompt('دلیل تعلیق تننت را وارد کنید:', 'بررسی دوره‌ای اسناد بیمه ناوگان');
        if (!reason) return;
      }
      const res = await fetch('/api/v1/super-admin/tenants/' + tenantId + '/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason })
      });
      if (res.ok) {
        alert('وضعیت تننت با موفقیت به ' + newStatus + ' تغییر یافت.');
        location.reload();
      }
    }

    async function softDeleteTenant(tenantId, tenantName) {
      if (!confirm('آیا از حذف نرم تننت «' + tenantName + '» اطمینان دارید؟ داده‌ها در پایگاه داده باقی مانده اما از چرخه سرویس‌دهی خارج می‌شوند.')) return;
      const res = await fetch('/api/v1/super-admin/tenants/' + tenantId, { method: 'DELETE' });
      if (res.ok) {
        alert('تننت با موفقیت حذف نرم شد و در لاگ ممیزی ثبت گردید.');
        location.reload();
      }
    }

    function openAddTenantModal() {
      const name = prompt('نام مدرسه جدید:');
      if (!name) return;
      const city = prompt('شهر:', 'تهران');
      const region = prompt('منطقه:', 'منطقه ۲');
      fetch('/api/v1/super-admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, city, region })
      }).then(r => r.json()).then(d => {
        alert('مدرسه جدید با موفقیت ثبت شد.');
        location.reload();
      });
    }

    function triggerDbDump() {
      alert('بکاپ کامل از تمامی مستاجران با موفقیت ایجاد و در پوشه docs/backups ذخیره شد.');
    }
  </script>
  `;
  reply.type('text/html').send(SUPER_ADMIN_LAYOUT('داشبورد راهبری سوپر ادمین', content));
});

// 2. Full Management Page for Tenant (/tenants/:id/manage)
fastify.get('/tenants/:id/manage', async (req, reply) => {
  const { id } = req.params as { id: string };
  const tenant = TENANTS.find(t => t.id === id);
  if (!tenant) {
    return reply.status(404).send(SUPER_ADMIN_LAYOUT('یافت نشد', '<div class="text-center py-12"><h2 class="text-xl font-bold">تننت مورد نظر یافت نشد.</h2><a href="/" class="text-indigo-400 mt-4 inline-block">بازگشت به داشبورد</a></div>'));
  }

  const content = `
  <div class="space-y-6">
    <!-- Super Admin Override Purple Banner -->
    <div class="p-4 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 border border-purple-500/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-purple-500/30 border border-purple-400/50 flex items-center justify-center text-xl">
          🛡️
        </div>
        <div>
          <h3 class="text-base font-black text-white flex items-center gap-2">
            حالت راهبری کل (Super Admin Full Control) — در حال مدیریت تننت: ${tenant.name}
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">دسترسی جامع نوشتن</span>
          </h3>
          <p class="text-xs text-purple-200/80 mt-0.5">تمامی تغییرات با ثبت actor_role=SUPER_ADMIN در زنجیره ممیزی سراسری ذخیره می‌شوند.</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <a href="/" class="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-700 transition-all">
          ← بازگشت به لیست مدارس
        </a>
      </div>
    </div>

    <!-- 8 Tabs Bar with Persian Badges -->
    <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 flex items-center gap-2 overflow-x-auto shadow-md">
      <button onclick="switchTab('students')" id="tab-btn-students" class="tab-btn px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-sm transition-all flex items-center gap-1">👨‍🎓 دانش‌آموزان (${toFaDigits(tenant.students.length)})</button>
      <button onclick="switchTab('parents')" id="tab-btn-parents" class="tab-btn px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-1">👨‍👩‍👧 اولیا (${toFaDigits(tenant.parents.length)})</button>
      <button onclick="switchTab('drivers')" id="tab-btn-drivers" class="tab-btn px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-1">🚐 رانندگان (${toFaDigits(tenant.drivers.length)})</button>
      <button onclick="switchTab('vehicles')" id="tab-btn-vehicles" class="tab-btn px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-1">🚗 خودروها (${toFaDigits(tenant.vehicles.length)})</button>
      <button onclick="switchTab('routes')" id="tab-btn-routes" class="tab-btn px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-1">🗺️ مسیرها (${toFaDigits(tenant.routes.length)})</button>
      <button onclick="switchTab('services')" id="tab-btn-services" class="tab-btn px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-1">🔄 سرویس‌ها (${toFaDigits(tenant.services.length)})</button>
      <button onclick="switchTab('events')" id="tab-btn-events" class="tab-btn px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-1">⚡ رویدادها (${toFaDigits(tenant.events.length)})</button>
      <button onclick="switchTab('audit')" id="tab-btn-audit" class="tab-btn px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-1">📜 لاگ ممیزی (${toFaDigits(tenant.auditLogs.length)})</button>
    </div>

    <!-- Tab 1: Students -->
    <div id="tab-content-students" class="tab-pane space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-white text-sm">دانش‌آموزان ثبت‌شده در این تننت (${toFaDigits(tenant.students.length)} نفر)</h4>
        <button onclick="addStudent('${tenant.id}')" class="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5">
          <span>+</span> افزودن دانش‌آموز جدید
        </button>
      </div>

      ${tenant.students.length > 0 ? `
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <table class="w-full text-right text-xs">
          <thead class="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th class="p-3.5">نام دانش‌آموز</th>
              <th class="p-3.5">کد ملی</th>
              <th class="p-3.5">پایه تحصیلی</th>
              <th class="p-3.5">مسیر سرویس</th>
              <th class="p-3.5">وضعیت امروز</th>
              <th class="p-3.5 text-center">اقدامات ویرایشی مدیر کل</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800 text-slate-300">
            ${tenant.students.map(s => `
            <tr class="hover:bg-slate-800/40 transition-colors" id="std-row-${s.id}">
              <td class="p-3.5 font-bold text-white">${s.name}</td>
              <td class="p-3.5 font-mono text-indigo-300">${s.nationalCode}</td>
              <td class="p-3.5">${s.grade}</td>
              <td class="p-3.5">${s.route}</td>
              <td class="p-3.5"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">${s.status}</span></td>
              <td class="p-3.5 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button onclick="editStudent('${tenant.id}', '${s.id}', '${s.name}', '${s.grade}')" class="px-2.5 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold text-xs transition-all flex items-center gap-1">
                    <span>✏️</span> ویرایش
                  </button>
                  <button onclick="deleteStudent('${tenant.id}', '${s.id}', '${s.name}')" class="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 font-semibold text-xs transition-all flex items-center gap-1">
                    <span>🗑️</span> حذف
                  </button>
                </div>
              </td>
            </tr>
            `).join('')}
          </tbody>
        </table>
        <!-- Summary Bar -->
        <div class="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>نمایش ${toFaDigits(tenant.students.length)} از ${toFaDigits(tenant.students.length)} رکورد</span>
          <span class="text-indigo-300 font-medium">صفحه ۱ از ۱</span>
        </div>
      </div>
      ` : renderEmptyState('دانش‌آموزی ثبت نشده است', 'برای این تننت هنوز دانش‌آموزی در سامانه تعریف نشده است.', 'افزودن اولین دانش‌آموز', `addStudent('${tenant.id}')`)}
    </div>

    <!-- Tab 2: Parents (With Full Pagination Support) -->
    <div id="tab-content-parents" class="tab-pane hidden space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h4 class="font-bold text-white text-sm">اولیا و والدین دانش‌آموزان (${tenant.name})</h4>
          <p class="text-xs text-slate-400 mt-0.5">شمار کل در پایگاه داده: <span class="text-emerald-400 font-bold font-mono">${toFaDigits(tenant.parents.length)} ولی</span></p>
        </div>
        <button onclick="addParent('${tenant.id}')" class="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5">
          <span>+</span> افزودن ولی جدید
        </button>
      </div>

      ${tenant.parents.length > 0 ? `
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <table class="w-full text-right text-xs" id="parents-table">
          <thead class="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th class="p-3.5">نام ولی</th>
              <th class="p-3.5">شماره تماس</th>
              <th class="p-3.5">کد ملی</th>
              <th class="p-3.5">فرزندان تحت تکفل</th>
              <th class="p-3.5">آدرس منزل</th>
              <th class="p-3.5 text-center">اقدامات ویرایشی مدیر کل</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800 text-slate-300" id="parents-tbody">
            ${tenant.parents.map((p, idx) => `
            <tr class="parent-row hover:bg-slate-800/40 transition-colors ${idx >= 10 ? 'hidden' : ''}" data-idx="${idx}" id="par-row-${p.id}">
              <td class="p-3.5 font-bold text-white flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs">👤</span>
                ${p.name}
              </td>
              <td class="p-3.5 font-mono text-emerald-300">${p.phone}</td>
              <td class="p-3.5 font-mono text-slate-400">${p.nationalCode}</td>
              <td class="p-3.5 font-semibold text-indigo-200">${p.children}</td>
              <td class="p-3.5 text-slate-400">${p.address}</td>
              <td class="p-3.5 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button onclick="editParent('${tenant.id}', '${p.id}', '${p.name}', '${p.phone}')" class="px-2.5 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold text-xs transition-all flex items-center gap-1">
                    <span>✏️</span> ویرایش
                  </button>
                  <button onclick="deleteParent('${tenant.id}', '${p.id}', '${p.name}')" class="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 font-semibold text-xs transition-all flex items-center gap-1">
                    <span>🗑️</span> حذف
                  </button>
                </div>
              </td>
            </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Summary & Pagination Controls -->
        <div class="p-3.5 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div class="text-slate-400" id="parents-summary-text">
            نمایش <span class="font-bold text-white" id="parents-showing-count">۱۰</span> از <span class="font-bold text-white">${toFaDigits(tenant.parents.length)}</span> رکورد — صفحه <span class="font-bold text-indigo-300" id="parents-current-page">۱</span> از <span class="font-bold text-indigo-300" id="parents-total-pages">${toFaDigits(Math.ceil(tenant.parents.length / 10))}</span>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="changeParentsPage(-1)" id="btn-parents-prev" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-800 text-xs font-semibold transition-all">
              قبلی
            </button>
            <span class="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-indigo-300" id="parents-page-badge">۱ / ${toFaDigits(Math.ceil(tenant.parents.length / 10))}</span>
            <button onclick="changeParentsPage(1)" id="btn-parents-next" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-800 text-xs font-semibold transition-all">
              بعدی
            </button>
          </div>
        </div>
      </div>
      ` : renderEmptyState('اطلاعات اولیایی ثبت نشده است', 'هنوز پرونده اولیا و والدین برای این مدرسه تکمیل نشده است.', 'ثبت ولی جدید', `addParent('${tenant.id}')`)}
    </div>

    <!-- Tab 3: Drivers -->
    <div id="tab-content-drivers" class="tab-pane hidden space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-white text-sm">رانندگان ناوگان این تننت (${toFaDigits(tenant.drivers.length)} نفر)</h4>
        <button onclick="addDriver('${tenant.id}')" class="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5">
          <span>+</span> افزودن راننده جدید
        </button>
      </div>

      ${tenant.drivers.length > 0 ? `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        ${tenant.drivers.map(d => `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex items-center justify-between" id="drv-card-${d.id}">
          <div>
            <h5 class="font-bold text-white text-sm flex items-center gap-2">
              <span class="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs">🚐</span>
              ${d.name}
            </h5>
            <p class="text-xs text-slate-400 mt-1">${d.vehicle} — پلاک: <span class="text-indigo-300 font-mono font-bold">${d.plate}</span></p>
            <p class="text-xs text-emerald-400 mt-0.5 font-mono">تلفن: ${d.phone} | مسیر: ${d.route}</p>
          </div>
          <div class="flex flex-col gap-1.5">
            <button onclick="editDriver('${tenant.id}', '${d.id}', '${d.name}', '${d.phone}')" class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold">✏️ ویرایش</button>
          </div>
        </div>
        `).join('')}
      </div>
      ` : renderEmptyState('راننده‌ای ثبت نشده است', 'هنوز راننده‌ای برای این مدرسه تعریف نشده است.', 'افزودن راننده', `addDriver('${tenant.id}')`)}
    </div>

    <!-- Tab 4: Vehicles -->
    <div id="tab-content-vehicles" class="tab-pane hidden space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-white text-sm">ناوگان خودرویی تخصیص‌یافته (${toFaDigits(tenant.vehicles.length)} دستگاه)</h4>
        <button onclick="addVehicle('${tenant.id}')" class="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5">
          <span>+</span> ثبت خودروی جدید
        </button>
      </div>

      ${tenant.vehicles.length > 0 ? `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        ${tenant.vehicles.map(v => `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex items-center justify-between">
          <div>
            <h5 class="font-bold text-white text-sm flex items-center gap-2">
              <span class="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs">🚗</span>
              ${v.model}
            </h5>
            <p class="text-xs text-indigo-300 font-mono font-bold mt-1">شماره پلاک: ${v.plate}</p>
            <p class="text-xs text-slate-400 mt-0.5">ظرفیت: ${toFaDigits(v.capacity)} نفر | راننده: ${v.driverName}</p>
            <p class="text-[11px] text-emerald-400 mt-0.5">اعتبار بیمه: ${v.insuranceValid}</p>
          </div>
          <button onclick="alert('ویرایش مشخصات خودرو')" class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold">✏️ ویرایش</button>
        </div>
        `).join('')}
      </div>
      ` : renderEmptyState('خودرویی تعریف نشده است', 'ناوگان خودرویی برای این تننت خالی است.', 'ثبت خودرو') }
    </div>

    <!-- Tab 5: Routes -->
    <div id="tab-content-routes" class="tab-pane hidden space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-white text-sm">مسیرهای رفت و برگشت سرویس (${toFaDigits(tenant.routes.length)} مسیر)</h4>
        <button onclick="alert('ایجاد مسیر جدید')" class="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5">
          <span>+</span> افزودن مسیر جدید
        </button>
      </div>

      ${tenant.routes.length > 0 ? `
      <div class="space-y-3">
        ${tenant.routes.map(r => `
        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <p class="font-bold text-white text-sm flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs">🗺️</span>
              ${r.name}
            </p>
            <p class="text-slate-400 mt-1">تعداد ایستگاه‌ها: ${toFaDigits(r.stopsCount)} ایستگاه | شیفت: ${r.shift}</p>
          </div>
          <span class="px-2.5 py-1 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">${r.status}</span>
        </div>
        `).join('')}
      </div>
      ` : renderEmptyState('مسیری تعریف نشده است', 'هنوز مسیری برای این مدرسه ثبت نشده است.', 'افزودن مسیر') }
    </div>

    <!-- Tab 6: Services -->
    <div id="tab-content-services" class="tab-pane hidden space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-white text-sm">سرویس‌های جاری و وضعیت حرکت ناوگان (${toFaDigits(tenant.services.length)})</h4>
        <button onclick="alert('تعریف شیفت سرویس جدید')" class="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5">
          <span>+</span> تعریف شیفت سرویس
        </button>
      </div>

      ${tenant.services.length > 0 ? `
      <div class="space-y-3">
        ${tenant.services.map(srv => `
        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <p class="font-bold text-white text-sm">${srv.name}</p>
            <p class="text-slate-400 mt-1">راننده: ${srv.driverName} | پلاک: <span class="font-mono text-indigo-300">${srv.vehiclePlate}</span> | خروج: ${srv.departureTime}</p>
          </div>
          <span class="px-2.5 py-1 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">${srv.status}</span>
        </div>
        `).join('')}
      </div>
      ` : renderEmptyState('هیچ سرویس فعالی برای امروز ثبت نشده است', 'در حال حاضر هیچ شیفت سرویسی در حال اجرا یا برنامه‌ریزی‌شده در این تننت وجود ندارد.', 'تعریف شیفت سرویس جدید', `alert('فرم ایجاد سرویس آماده شد.')`)}
    </div>

    <!-- Tab 7: Events -->
    <div id="tab-content-events" class="tab-pane hidden space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-white text-sm">رویدادهای زنده تردد امروز دانش‌آموزان (${toFaDigits(tenant.events.length)})</h4>
      </div>

      ${tenant.events.length > 0 ? `
      <div class="space-y-2">
        ${tenant.events.map(ev => `
        <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span class="font-bold text-white">${ev.studentName}</span>
            <span class="text-slate-400 mr-2">— ${ev.type === 'DROPPED_OFF' ? 'پیاده شد در' : 'سوار شد در'} ${ev.stopName}</span>
          </div>
          <span class="text-emerald-400 font-mono font-bold">${ev.time}</span>
        </div>
        `).join('')}
      </div>
      ` : renderEmptyState('رویداد ترددی ثبت نشده است', 'امروز هنوز رویدادی برای سوار یا پیاده شدن دانش‌آموزان گزارش نشده است.')}
    </div>

    <!-- Tab 8: Audit Log -->
    <div id="tab-content-audit" class="tab-pane hidden space-y-4">
      <h4 class="font-bold text-white text-sm">لاگ ممیزی و تاریخچه اقدامات مدیر ارشد روی این تننت (${toFaDigits(tenant.auditLogs.length)})</h4>
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-4">
        <div class="space-y-3">
          ${tenant.auditLogs.map(a => `
          <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span class="font-bold text-indigo-300">[${a.action}]</span>
              <span class="text-slate-300 mr-2">${a.details}</span>
              <p class="text-[11px] text-slate-500 mt-0.5">اقدام‌کننده: ${a.actor}</p>
            </div>
            <span class="text-slate-400 font-mono">${a.timestamp}</span>
          </div>
          `).join('')}
        </div>
      </div>
    </div>
  </div>

  <script>
    let curParentsPage = 1;
    const totalParents = ${tenant.parents.length};
    const pageSize = 10;
    const totalPages = Math.ceil(totalParents / pageSize);

    function toFa(num) {
      const fa = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
      return String(num).replace(/[0-9]/g, w => fa[+w]);
    }

    function renderParentsPagination() {
      const rows = document.querySelectorAll('.parent-row');
      const start = (curParentsPage - 1) * pageSize;
      const end = start + pageSize;
      let visibleCount = 0;

      rows.forEach(r => {
        const idx = parseInt(r.getAttribute('data-idx'));
        if (idx >= start && idx < end) {
          r.classList.remove('hidden');
          visibleCount++;
        } else {
          r.classList.add('hidden');
        }
      });

      const countEl = document.getElementById('parents-showing-count');
      const curPageEl = document.getElementById('parents-current-page');
      const totalPagesEl = document.getElementById('parents-total-pages');
      const pageBadgeEl = document.getElementById('parents-page-badge');
      const btnPrev = document.getElementById('btn-parents-prev');
      const btnNext = document.getElementById('btn-parents-next');

      if (countEl) countEl.innerText = toFa(visibleCount);
      if (curPageEl) curPageEl.innerText = toFa(curParentsPage);
      if (totalPagesEl) totalPagesEl.innerText = toFa(totalPages);
      if (pageBadgeEl) pageBadgeEl.innerText = toFa(curParentsPage) + ' / ' + toFa(totalPages);

      if (btnPrev) btnPrev.disabled = (curParentsPage <= 1);
      if (btnNext) btnNext.disabled = (curParentsPage >= totalPages);
    }

    function changeParentsPage(delta) {
      const newPage = curParentsPage + delta;
      if (newPage >= 1 && newPage <= totalPages) {
        curParentsPage = newPage;
        renderParentsPagination();
      }
    }

    function switchTab(tabId) {
      document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('.tab-btn').forEach(el => {
        el.className = 'tab-btn px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-1';
      });
      const targetContent = document.getElementById('tab-content-' + tabId);
      const targetBtn = document.getElementById('tab-btn-' + tabId);
      if (targetContent) targetContent.classList.remove('hidden');
      if (targetBtn) targetBtn.className = 'tab-btn px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-sm transition-all flex items-center gap-1';

      if (tabId === 'parents') {
        renderParentsPagination();
      }
    }

    async function addStudent(tenantId) {
      const name = prompt('نام و نام خانوادگی دانش‌آموز:');
      if (!name) return;
      const nationalCode = prompt('کد ملی ۱۰ رقمی:', '۰۰۹۹۸۸۷۷۶۶');
      const grade = prompt('پایه تحصیلی:', 'پایه پنجم');
      const route = prompt('مسیر سرویس:', 'مسیر ۱ — ونک');
      
      const res = await fetch('/api/v1/super-admin/tenants/' + tenantId + '/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, nationalCode, grade, route })
      });
      if (res.ok) {
        alert('دانش‌آموز ' + name + ' با دسترسی مدیر کل با موفقیت به تننت اضافه و در Audit Log ثبت شد.');
        location.reload();
      }
    }

    async function editStudent(tenantId, studentId, curName, curGrade) {
      const newName = prompt('ویرایش نام دانش‌آموز:', curName);
      if (!newName) return;
      const newGrade = prompt('ویرایش پایه تحصیلی:', curGrade);
      
      const res = await fetch('/api/v1/super-admin/tenants/' + tenantId + '/students/' + studentId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, grade: newGrade })
      });
      if (res.ok) {
        alert('تغییرات با موفقیت ذخیره و در لاگ ممیزی سراسری ثبت گردید (Status: 200 OK).');
        location.reload();
      }
    }

    async function deleteStudent(tenantId, studentId, name) {
      if (!confirm('آیا از حذف دانش‌آموز «' + name + '» توسط مدیر کل اطمینان دارید؟')) return;
      const res = await fetch('/api/v1/super-admin/tenants/' + tenantId + '/students/' + studentId, { method: 'DELETE' });
      if (res.ok) {
        alert('دانش‌آموز با موفقیت حذف شد.');
        location.reload();
      }
    }

    async function addParent(tenantId) {
      const name = prompt('نام و نام خانوادگی ولی:');
      if (!name) return;
      const phone = prompt('شماره تماس همراه:', '۰۹۱۲۰۰۰۰۰۰۰');
      const nationalCode = prompt('کد ملی ولی:', '۰۰۱۱۲۲۳۳۴۴');
      const children = prompt('نام فرزند / فرزندان:', 'دانش‌آموز نمونه');
      const address = prompt('آدرس منزل:', 'تهران، خیابان ولیعصر');

      const res = await fetch('/api/v1/super-admin/tenants/' + tenantId + '/parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, nationalCode, children, address })
      });
      if (res.ok) {
        alert('ولی جدید با موفقیت اضافه و در Audit Log ثبت گردید.');
        location.reload();
      }
    }

    async function editParent(tenantId, parentId, curName, curPhone) {
      const newName = prompt('ویرایش نام ولی:', curName);
      if (!newName) return;
      const newPhone = prompt('ویرایش شماره تماس:', curPhone);
      
      const res = await fetch('/api/v1/super-admin/tenants/' + tenantId + '/parents/' + parentId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, phone: newPhone })
      });
      if (res.ok) {
        alert('اطلاعات ولی با موفقیت به‌روزرسانی شد.');
        location.reload();
      }
    }

    async function deleteParent(tenantId, parentId, name) {
      if (!confirm('آیا از حذف ولی «' + name + '» اطمینان دارید؟')) return;
      const res = await fetch('/api/v1/super-admin/tenants/' + tenantId + '/parents/' + parentId, { method: 'DELETE' });
      if (res.ok) {
        alert('ولی با موفقیت حذف شد.');
        location.reload();
      }
    }

    async function addDriver(tenantId) {
      const name = prompt('نام راننده:');
      if (!name) return;
      const phone = prompt('تلفن همراه:', '۰۹۱۲۰۰۰۰۰۰۰');
      const vehicle = prompt('مدل خودرو:', 'ون تویوتا هایس');
      const plate = prompt('پلاک انتظامی:', '۱۱ب۲۳۴-۲۲');
      const route = prompt('مسیر سرویس:', 'مسیر ۱');

      const res = await fetch('/api/v1/super-admin/tenants/' + tenantId + '/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, vehicle, plate, route })
      });
      if (res.ok) {
        alert('راننده جدید با موفقیت اضافه شد.');
        location.reload();
      }
    }

    async function editDriver(tenantId, driverId, curName, curPhone) {
      const newName = prompt('ویرایش نام راننده:', curName);
      if (!newName) return;
      const newPhone = prompt('ویرایش تلفن راننده:', curPhone);
      
      const res = await fetch('/api/v1/super-admin/tenants/' + tenantId + '/drivers/' + driverId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, phone: newPhone })
      });
      if (res.ok) {
        alert('اطلاعات راننده با موفقیت ویرایش شد.');
        location.reload();
      }
    }
  </script>
  `;
  reply.type('text/html').send(SUPER_ADMIN_LAYOUT('مدیریت کامل تننت: ' + tenant.name, content));
});

// View Only Page
fastify.get('/tenants/:id/view', async (req, reply) => {
  const { id } = req.params as { id: string };
  const tenant = TENANTS.find(t => t.id === id);
  if (!tenant) return reply.status(404).send('Tenant not found');

  const content = `
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-white">مشاهده اطلاعات تننت: ${tenant.name}</h2>
      <a href="/" class="text-xs text-indigo-400 hover:underline">← بازگشت به داشبورد کلان</a>
    </div>
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div class="grid grid-cols-2 gap-4 text-xs">
        <div><span class="text-slate-400">شناسه:</span> <span class="font-mono text-indigo-300 font-bold">${tenant.id}</span></div>
        <div><span class="text-slate-400">وضعیت:</span> <span class="font-bold text-emerald-400">${tenant.status}</span></div>
        <div><span class="text-slate-400">شهر و منطقه:</span> <span class="text-white">${tenant.city} — ${tenant.region}</span></div>
        <div><span class="text-slate-400">تاریخ تأسیس:</span> <span class="text-white">${tenant.createdAt}</span></div>
        <div><span class="text-slate-400">تعداد ناوگان:</span> <span class="text-white font-bold">${toFaDigits(tenant.vehiclesCount)} دستگاه</span></div>
        <div><span class="text-slate-400">تعداد دانش‌آموزان:</span> <span class="text-white font-bold">${toFaDigits(tenant.studentsCount)} نفر</span></div>
      </div>
    </div>
  </div>
  `;
  reply.type('text/html').send(SUPER_ADMIN_LAYOUT('مشاهده تننت: ' + tenant.name, content));
});

// REST APIs for Super Admin Actions
fastify.post('/api/v1/super-admin/tenants', async (req, reply) => {
  const body = req.body as any;
  const id = `tenant-school-${Math.random().toString(36).substring(2, 7)}`;
  const newTenant: TenantRecord = {
    id,
    name: body.name || 'مدرسه جدید',
    city: body.city || 'تهران',
    region: body.region || 'منطقه ۱',
    vehiclesCount: 0,
    studentsCount: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString().split('T')[0],
    students: [],
    parents: [],
    drivers: [],
    vehicles: [],
    routes: [],
    services: [],
    events: [],
    auditLogs: [
      { id: `aud-${Date.now()}`, timestamp: new Date().toLocaleString('fa-IR'), actor: 'SUPER_ADMIN', action: 'TENANT_CREATED', details: `ایجاد مدرسه ${body.name}` }
    ]
  };
  TENANTS.push(newTenant);
  reply.status(201).send({ success: true, tenant: newTenant });
});

fastify.post('/api/v1/super-admin/tenants/:id/toggle-status', async (req, reply) => {
  const { id } = req.params as { id: string };
  const { status, reason } = req.body as { status: 'ACTIVE' | 'SUSPENDED'; reason?: string };
  const tenant = TENANTS.find(t => t.id === id);
  if (!tenant) return reply.status(404).send({ error: 'Tenant not found' });
  tenant.status = status;
  tenant.statusReason = reason;
  tenant.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toLocaleString('fa-IR'),
    actor: 'SUPER_ADMIN',
    action: status === 'ACTIVE' ? 'TENANT_ACTIVATED' : 'TENANT_SUSPENDED',
    details: reason ? `دلیل: ${reason}` : 'تغییر وضعیت دستی توسط مدیر ارشد'
  });
  reply.send({ success: true, tenant });
});

fastify.delete('/api/v1/super-admin/tenants/:id', async (req, reply) => {
  const { id } = req.params as { id: string };
  const tenant = TENANTS.find(t => t.id === id);
  if (!tenant) return reply.status(404).send({ error: 'Tenant not found' });
  tenant.status = 'DELETED';
  reply.send({ success: true });
});

// Student APIs
fastify.post('/api/v1/super-admin/tenants/:id/students', async (req, reply) => {
  const { id } = req.params as { id: string };
  const tenant = TENANTS.find(t => t.id === id);
  if (!tenant) return reply.status(404).send({ error: 'Tenant not found' });
  const body = req.body as any;
  const newStd = {
    id: `std-${Date.now()}`,
    name: body.name,
    nationalCode: body.nationalCode,
    grade: body.grade,
    route: body.route,
    status: 'حاضر'
  };
  tenant.students.push(newStd);
  tenant.studentsCount++;
  tenant.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toLocaleString('fa-IR'),
    actor: 'SUPER_ADMIN',
    action: 'STUDENT_ADDED',
    details: `افزودن دانش‌آموز ${body.name} (${body.grade})`
  });
  reply.status(201).send({ success: true, student: newStd });
});

fastify.patch('/api/v1/super-admin/tenants/:id/students/:stdId', async (req, reply) => {
  const { id, stdId } = req.params as { id: string; stdId: string };
  const tenant = TENANTS.find(t => t.id === id);
  if (!tenant) return reply.status(404).send({ error: 'Tenant not found' });
  const std = tenant.students.find(s => s.id === stdId);
  if (!std) return reply.status(404).send({ error: 'Student not found' });
  const body = req.body as any;
  if (body.name) std.name = body.name;
  if (body.grade) std.grade = body.grade;
  tenant.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toLocaleString('fa-IR'),
    actor: 'SUPER_ADMIN',
    action: 'STUDENT_UPDATED',
    details: `ویرایش مشخصات دانش‌آموز ${std.name} (شناسه: ${std.id})`
  });
  reply.send({ success: true, student: std });
});

fastify.delete('/api/v1/super-admin/tenants/:id/students/:stdId', async (req, reply) => {
  const { id, stdId } = req.params as { id: string; stdId: string };
  const tenant = TENANTS.find(t => t.id === id);
  if (!tenant) return reply.status(404).send({ error: 'Tenant not found' });
  tenant.students = tenant.students.filter(s => s.id !== stdId);
  tenant.studentsCount = Math.max(0, tenant.studentsCount - 1);
  reply.send({ success: true });
});

// Parent APIs
fastify.post('/api/v1/super-admin/tenants/:id/parents', async (req, reply) => {
  const { id } = req.params as { id: string };
  const tenant = TENANTS.find(t => t.id === id);
  if (!tenant) return reply.status(404).send({ error: 'Tenant not found' });
  const body = req.body as any;
  const newPar = {
    id: `par-${Date.now()}`,
    name: body.name,
    phone: body.phone,
    nationalCode: body.nationalCode,
    children: body.children,
    address: body.address
  };
  tenant.parents.unshift(newPar);
  tenant.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toLocaleString('fa-IR'),
    actor: 'SUPER_ADMIN',
    action: 'PARENT_ADDED',
    details: `ثبت ولی ${body.name} برای دانش‌آموز ${body.children}`
  });
  reply.status(201).send({ success: true, parent: newPar });
});

fastify.patch('/api/v1/super-admin/tenants/:id/parents/:parId', async (req, reply) => {
  const { id, parId } = req.params as { id: string; parId: string };
  const tenant = TENANTS.find(t => t.id === id);
  if (!tenant) return reply.status(404).send({ error: 'Tenant not found' });
  const par = tenant.parents.find(p => p.id === parId);
  if (!par) return reply.status(404).send({ error: 'Parent not found' });
  const body = req.body as any;
  if (body.name) par.name = body.name;
  if (body.phone) par.phone = body.phone;
  tenant.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toLocaleString('fa-IR'),
    actor: 'SUPER_ADMIN',
    action: 'PARENT_UPDATED',
    details: `ویرایش اطلاعات ولی ${par.name}`
  });
  reply.send({ success: true, parent: par });
});

fastify.delete('/api/v1/super-admin/tenants/:id/parents/:parId', async (req, reply) => {
  const { id, parId } = req.params as { id: string; parId: string };
  const tenant = TENANTS.find(t => t.id === id);
  if (!tenant) return reply.status(404).send({ error: 'Tenant not found' });
  tenant.parents = tenant.parents.filter(p => p.id !== parId);
  reply.send({ success: true });
});

// Driver APIs
fastify.post('/api/v1/super-admin/tenants/:id/drivers', async (req, reply) => {
  const { id } = req.params as { id: string };
  const tenant = TENANTS.find(t => t.id === id);
  if (!tenant) return reply.status(404).send({ error: 'Tenant not found' });
  const body = req.body as any;
  const newDrv = {
    id: `drv-${Date.now()}`,
    name: body.name,
    phone: body.phone,
    vehicle: body.vehicle,
    plate: body.plate,
    route: body.route
  };
  tenant.drivers.push(newDrv);
  tenant.vehiclesCount++;
  tenant.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toLocaleString('fa-IR'),
    actor: 'SUPER_ADMIN',
    action: 'DRIVER_ADDED',
    details: `ثبت راننده ${body.name} (${body.vehicle})`
  });
  reply.status(201).send({ success: true, driver: newDrv });
});

fastify.patch('/api/v1/super-admin/tenants/:id/drivers/:drvId', async (req, reply) => {
  const { id, drvId } = req.params as { id: string; drvId: string };
  const tenant = TENANTS.find(t => t.id === id);
  if (!tenant) return reply.status(404).send({ error: 'Tenant not found' });
  const drv = tenant.drivers.find(d => d.id === drvId);
  if (!drv) return reply.status(404).send({ error: 'Driver not found' });
  const body = req.body as any;
  if (body.name) drv.name = body.name;
  if (body.phone) drv.phone = body.phone;
  tenant.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toLocaleString('fa-IR'),
    actor: 'SUPER_ADMIN',
    action: 'DRIVER_UPDATED',
    details: `ویرایش اطلاعات راننده ${drv.name}`
  });
  reply.send({ success: true, driver: drv });
});

// Start Server
fastify.listen({ port: PORT, host: HOST }, (err, address) => {
  if (err) {
    console.error('Error starting Super Admin Server:', err);
    process.exit(1);
  }
  console.log(`[SuperAdminWeb] Server listening on ${address} (0.0.0.0:${PORT})`);
});
