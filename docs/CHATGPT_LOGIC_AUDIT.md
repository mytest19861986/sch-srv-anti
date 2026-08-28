# ChatGPT Pre-Pilot Business Logic Audit Report

Executive summary

بر اساس inventory اسکن‌شده، معماری منطق کسب‌وکار ServiceYar برای Pilot از نظر پایه‌های اصلی—M:N والد/دانش‌آموز، transactional outbox، state machine حضور، offline sync، tenant scoping و read-model—مسیر درستی دارد؛ اما چند شکاف P0 می‌تواند در Pilot باعث خطای واقعی شود: مدل فعلی رابطه والد/دانش‌آموز برای guardianهای مشترک بین دو مدرسه ambiguity دارد، fan-out اعلان‌ها preference/primary-recipient و account status را کامل مدل نکرده، state machine حضور فاقد مفهوم صریح service_date + shift/leg است و احتمال برخورد AM/PM یا دو سرویس در یک روز وجود دارد، offline ordering فقط بر client_timestamp تکیه دارد که با clock skew قابل اتکا نیست، و is_stale صرفاً با «آخرین update» ممکن است هم false-positive و هم false-negative بدهد. قبل از Pilot باید identity/tenant membership، attendance scope، offline ordering و notification recipient rules به invariants صریح و تست‌شونده تبدیل شوند.

Logic Gap Table
Priority	Domain	Issue	Repro / Edge Case	Minimal Fix
P0	Parent↔Student	رابطه M:N به‌صورت parentIds/studentIds دوطرفه، source of truth مبهم دارد	PATCH همزمان student و parent می‌تواند دو لیست ناسازگار بسازد	یک join table واحد مثل parent_student_relations را source of truth کنید
P0	Parent↔Student	uniqueness تلفن در سطح tenant با والد چندمدرسه‌ای ناسازگار است	یک پدر دو فرزند در دو مدرسه دارد؛ آیا دو parent record ایجاد می‌شود؟	identity والد را global یا account-level کنید؛ membership/relationship را tenant-scoped نگه دارید
P0	Parent↔Student	soft-delete فقط سمت student توضیح داده شده	parent soft-delete شود ولی student.parentIds باقی بماند	unlink منطقی دوطرفه در transaction، بدون delete هویت طرف مقابل
P0	Parent↔Student	re-linking رفتار مشخص ندارد	parent از student A unlink و بعد دوباره link شود؛ relationship metadata چه می‌شود؟	relation row با active, linked_at, unlinked_at, relationship_type
P0	Parent↔Student	guardian status / legal access لحاظ نشده	والد inactive/suspended هنوز child را می‌بیند یا notification می‌گیرد	فقط relation فعال + account فعال در authorization/fan-out معتبر باشد
P1	Parent↔Student	student با 0 parent مجاز است ولی operational warning تعریف نشده	دانش‌آموز بدون guardian وارد سرویس می‌شود	اجازه DB، ولی readiness warning در dashboard
P1	Parent↔Student	duplicate normalized phone edge case	0912... و +98912... به‌عنوان دو شماره ثبت می‌شوند	normalize به E.164 قبل از unique constraint
P1	Parent↔Student	relationship type محدودیت ندارد	parent/guardian/custodian اشتباه یا free-text ناسازگار	enum کنترل‌شده + optional label
P0	Notifications	«all active linked parents» دقیق نیست	parent account فعال است ولی notification disabled کرده	recipient eligibility = active relation + active account + channel preference
P0	Notifications	primary parent / legal restriction تعریف نشده	یکی از guardianها نباید SMS دریافت کند ولی relation فعال است	per-relation notification permission یا recipient policy
P0	Notifications	duplicate suppression فقط در event creation تضمین شده، نه delivery	worker crash بعد از FCM send و قبل از marking delivered	delivery idempotency key per (event,parent,channel) + unique constraint
P0	Notifications	multi-device parent مشخص نیست	یک parent دو دستگاه FCM دارد؛ همه tokenها یا یکی؟	fan-out به همه active device tokens با dedupe و invalid-token cleanup
P0	Notifications	absence acknowledgement ambiguity	parent absence می‌زند، driver offline است؛ «immediately update manifest» عملاً ممکن نیست	server manifest فوری update؛ driver receives on next sync/push; UI نشان دهد pending sync
P1	Notifications	SMS fallback policy مبهم است	FCM fail می‌شود؛ آیا SMS همیشه ارسال می‌شود یا فقط eventهای خاص؟	channel policy explicit per event type/severity
P1	Notifications	parent unlink بعد از event، قبل از outbox dispatch	event رخ داده، parent سریع unlink می‌شود؛ آیا notification باید برود؟	recipient policy را مشخص کنید: snapshot-at-event یا resolve-at-delivery
P1	Notifications	correction notification rule مشخص نیست	event PICKED_UP اشتباه بوده و corrected می‌شود	correction event باید policy مستقل برای parent notification داشته باشد
P0	Attendance	state machine فقط daily است، shift/leg-scoped نیست	کودک AM pickup/dropoff دارد و PM دوباره pickup؛ state روزانه در DROPPED_OFF مانده	state key = (student_id, service_date, shift_id/leg_id)
P0	Attendance	ABSENT تعریف روزانه ممکن است AM و PM را قاطی کند	والد AM absence می‌زند ولی PM سرویس دارد	absence باید scoped به shift/service occurrence باشد
P0	Attendance	idempotency فقط client_generated_id بدون scope تعریف شده	دو device تصادفاً یک ID تولید کنند	unique key شامل tenant/device یا globally generated UUID contract
P0	Attendance	same idempotency key با payload متفاوت	retry با همان ID ولی status/student متفاوت	HTTP 409 IDEMPOTENCY_KEY_REUSE_WITH_DIFFERENT_PAYLOAD
P0	Attendance	offline timestamp می‌تواند آینده/گذشته غیرواقعی باشد	ساعت موبایل 20 دقیقه جلو است؛ ترتیب state خراب می‌شود	bounds + server_received_at + device sequence
P0	Attendance	concurrent PICKED_UP race	دو request همزمان هر دو state NONE می‌بینند	row-level lock / atomic conditional transition
P1	Attendance	correction semantics ناکافی	CORRECTED آیا original row تغییر می‌کند یا event جدید است؟	append-only correction event با corrects_event_id
P1	Attendance	correction reason length امنیت/کیفیت را تضمین نمی‌کند	"aaaaaaaaaa" معتبر است	reason code enum + optional note
P1	Attendance	late event after correction	offline PICKED_UP قدیمی بعد از admin correction sync می‌شود	deterministic conflict policy بر اساس logical sequence/version
P0	Offline Sync	inventory endpoint mismatch دارد	inventory می‌گوید /api/v1/sync/batch ولی task به /api/v1/sync/events اشاره دارد	یک canonical endpoint؛ alias فقط موقت با deprecation
P0	Offline Sync	ordering فقط با client_timestamp	device clock skew یا دو event timestamp برابر	per-device monotonic sequence_no؛ timestamp فقط metadata
P0	Offline Sync	partial commit + client retry می‌تواند رفتار پیچیده ایجاد کند	batch شامل CREATED/CONFLICT و network timeout قبل از response	هر event idempotent؛ client همه unresolved را retry کند، نه batch outcome را blindly حذف
P0	Offline Sync	status حذف از Room DB محدود به CREATED/DUPLICATE است؛ CONFLICT lifecycle مبهم	conflict تا ابد در queue باقی می‌ماند	terminal CONFLICT_REQUIRES_REVIEW state جدا از retryable
P0	Offline Sync	retry classification مشخص نیست	400 validation و 503 هر دو retry شوند	permanent vs transient error taxonomy
P1	Offline Sync	max batch 200 بدون pagination/continuation contract	device چند روز offline و 3000 event دارد	chunking deterministic با cursor/sequence
P1	Offline Sync	device identity/revocation ذکر نشده	driver قدیمی با device token revoked هنوز sync می‌کند	device binding + revoked_at + driver/tenant scope validation
P1	Offline Sync	concurrent sync from same device	دو WorkManager job همزمان batch می‌فرستند	single-flight on client + server idempotency
P0	RBAC/Tenancy	tenantId داخل JWT تک‌مقداری برای parent دو مدرسه‌ای مشکل‌ساز است	یک parent بچه در School A و B دارد	identity + memberships؛ tenant context per request/resource
P0	RBAC/Tenancy	driver serving 2 schools با single tenant claim مبهم است	راننده قراردادی بین دو مدرسه کار می‌کند	driver memberships + assignment-based effective tenant
P0	RBAC/Tenancy	super-admin ?tenantId override خطرناک است اگر query string source of authority شود	typo tenantId یا malicious URL mutation	explicit privileged tenant-context resolver + mandatory audit reason
P0	RBAC/Tenancy	super-admin audit فقط mutations را می‌گوید	خواندن PII tenant دیگر بدون mutation audit نمی‌شود	privileged cross-tenant reads نیز audit شوند
P0	RBAC/Tenancy	relation existence ممکن است بدون tenant scope check شود	parent_id واقعی tenant دیگر به student link شود	FK/join lookup باید هر دو طرف را در effective tenant validate کند
P0	RBAC/Tenancy	driver manifest check فقط shift assignment؛ event submission هم باید همان guard را داشته باشد	driver foreign student ID را مستقیم POST می‌کند	attendance mutation requires active assignment + student belongs to manifest
P0	RBAC/Tenancy	parent child check ممکن است soft-deleted relation را بپذیرد	parent unlink شده ولی cached relation هنوز اجازه می‌دهد	authorization only against active relation, no stale cache without invalidation
P1	RBAC/Tenancy	suspended tenant behavior تعریف نشده	tenant suspended ولی tokenهای قبلی هنوز معتبرند	tenant status check per request یا short-lived token + revocation
P1	RBAC/Tenancy	403 vs 404 consistency	endpointهای مختلف foreign resource را متفاوت expose می‌کنند	standardize tenant-bound object lookup to non-disclosing 404
P0	Service/Shift	lifecycle state machine تعریف نشده	ACTIVE shift دوباره START شود یا COMPLETED دوباره ACTIVE شود	explicit transitions: PLANNED→READY→ACTIVE→COMPLETED/CANCELLED
P0	Service/Shift	is_stale فقط آخرین update read-model را می‌سنجد	هیچ eventی نبوده اما سیستم سالم است؛ بعد 30s stale می‌شود	stale بر اساس expected activity + worker/read-model heartbeat
P0	Service/Shift	false-negative stale	worker heartbeat می‌زند ولی tenant-specific read model stuck است	freshness per tenant/shift/read-model partition
P0	Service/Shift	timezone hard-coded Asia/Tehran multi-tenant scalability را محدود می‌کند	tenant آینده timezone دیگر دارد	timezone per tenant, Tehran default فقط اگر scope ایران قطعی است
P0	Service/Shift	DST / timezone library correctness	محاسبه day boundary با UTC offset ثابت	IANA timezone، نه +03:30 hard-code
P0	Service/Shift	overnight shift/day boundary	shift قبل نیمه‌شب شروع و بعد نیمه‌شب تمام می‌شود	immutable service_date assigned at shift creation/start
P1	Service/Shift	cancelled shift attendance rule مبهم	offline event برای shift cancelled بعداً sync می‌شود	reject/conflict with explicit reason
P1	Service/Shift	dashboard count semantics مبهم	corrected event ممکن است double-count شود	projection based on latest effective state, not raw event count
P1	Service/Shift	read model rebuild behavior مشخص نیست	projection corrupt/stale می‌شود	replay/rebuild procedure + checkpoint/version
P2	Service/Shift	stale threshold ثابت 30s برای همه ساعات	خارج از active shift هم stale flag بی‌معنی است	threshold policy based on active service windows
Invariants که MUST hold باشند

این‌ها باید مستقیماً به integration/security/property tests تبدیل شوند.

1. Parent↔Student
PS-01
A parent-student relation has exactly one authoritative database representation.

PS-02
No active relation may connect entities from different tenant scopes
unless the domain explicitly models a cross-tenant global identity plus
separate tenant memberships.

PS-03
Soft-deleting a student never deletes the parent identity.

PS-04
Soft-deleting/deactivating a relation immediately removes authorization
and notification eligibility.

PS-05
Re-linking the same parent/student pair must not create duplicate active relations.

PS-06
Normalized phone uniqueness is enforced according to the intended identity scope,
not raw string formatting.

PS-07
A student with zero active guardians is valid data but must be operationally visible.
2. Notifications
NT-01
Every attendance event produces at most one logical delivery per
(parent, channel, event).

NT-02
Retries must never produce duplicate user-visible notifications.

NT-03
Only active, authorized, notification-eligible guardians receive notifications.

NT-04
Inactive/revoked device tokens are excluded and cleaned up.

NT-05
Notification fan-out must not cross tenant boundaries.

NT-06
Outbox persistence occurs in the same DB transaction as the attendance event.

NT-07
If the worker crashes after provider acceptance, replay remains idempotent.

NT-08
Absence reflection in the driver's manifest is eventually consistent and its
pending/synced state is observable.
3. Attendance
AT-01
Attendance state is scoped by student + service occurrence
(service_date + shift/leg), not student/day alone.

AT-02
NONE -> DROPPED_OFF is impossible.

AT-03
PICKED_UP -> PICKED_UP is rejected unless it is an exact idempotent replay.

AT-04
DROPPED_OFF -> DROPPED_OFF is rejected unless exact idempotent replay.

AT-05
The same idempotency key with a different payload returns conflict.

AT-06
Concurrent requests cannot create two valid transitions from the same prior state.

AT-07
ABSENT cannot coexist with attendance activity for the same service occurrence,
unless resolved by an explicit correction.

AT-08
Drivers cannot set ABSENT unless policy explicitly changes.

AT-09
Corrections never mutate/delete the original event.

AT-10
Every correction identifies actor, reason, original event and timestamp.

AT-11
An offline event cannot be accepted purely because its client timestamp sorts earlier.
4. Offline Sync
OS-01
Client events have stable globally unique IDs.

OS-02
Ordering uses a monotonic device sequence or equivalent causal order.

OS-03
CREATED and DUPLICATE are terminal successful outcomes.

OS-04
CONFLICT is terminal-but-reviewable, not infinitely retryable.

OS-05
5xx/network timeout is retryable.

OS-06
Schema/authorization failures are non-retryable without user/config change.

OS-07
A retry of the same offline event can never create a second attendance event.

OS-08
Batch partial success cannot cause loss of unresolved events on handset.

OS-09
Revoked devices cannot sync.

OS-10
A device can sync only events belonging to its authenticated driver/tenant/assignment scope.
5. RBAC / Tenancy
RB-01
Client-supplied tenantId is never sufficient authorization.

RB-02
SCHOOL_ADMIN access is restricted to an active tenant membership.

RB-03
PARENT access requires an active parent-child relation.

RB-04
DRIVER attendance mutations require an active assignment containing that student.

RB-05
Cross-tenant object IDs never disclose foreign data.

RB-06
SUPER_ADMIN cross-tenant mutation is always audited.

RB-07
SUPER_ADMIN cross-tenant sensitive read is auditable.

RB-08
A suspended tenant cannot continue operating with previously issued tokens.

RB-09
Parent/driver users with memberships in multiple schools must explicitly operate
within the resource's effective tenant context.

RB-10
Cache keys and read models containing tenant data are tenant-scoped.
6. Service / Shift / Freshness
SH-01
Shift transitions are explicit and finite.

SH-02
A COMPLETED or CANCELLED shift cannot silently return to ACTIVE.

SH-03
Each shift has an immutable service_date.

SH-04
Attendance events must reference an active/allowed service occurrence.

SH-05
Daily aggregates use tenant timezone and service_date semantics.

SH-06
Timezone calculations use an IANA timezone database identifier.

SH-07
is_stale reflects read-model freshness, not merely absence of domain events.

SH-08
Freshness is measured per tenant/shift or equivalent isolated projection.

SH-09
Corrections update dashboard effective state without double-counting.

SH-10
Read-model rebuild reproduces the same effective aggregate from the event history.
چند bug محتمل که ارزش تست فوری دارند
1. AM/PM collision

مهم‌ترین bug منطقی بالقوه همین است.

اگر state فعلی فقط بر اساس:

student + today

محاسبه شود:

07:30 PICKED_UP
08:00 DROPPED_OFF

15:00 PICKED_UP

ممکن است درخواست سوم به خاطر current state=DROPPED_OFF رد شود.

باید state به شکل زیر باشد:

student
+ service_date
+ shift_id / trip_id / service_occurrence_id
2. Clock-skew در Offline

این سیاست:

sort(client_timestamp)

به تنهایی امن نیست.

مثلاً:

Device clock:
PICKED_UP = 08:14
DROPPED_OFF = 08:03

سرور آنها را برعکس اجرا می‌کند.

بهتر:

device_id
+ monotonic_sequence
+ client_timestamp
+ server_received_at

و sequence معیار causal ordering باشد.

3. Outbox duplicate after provider send

این حالت کلاسیک است:

worker
  ↓
FCM accepts message
  ↓
worker crashes
  ↓
DB status هنوز pending
  ↓
retry
  ↓
second notification

پس dedupe فقط روی:

client_generated_id

کافی نیست.

باید delivery identity هم داشته باشید:

UNIQUE(
  source_event_id,
  recipient_parent_id,
  channel
)

و در صورت امکان provider-side idempotency نیز.

4. Parent across two tenants

JWT مدل فعلی ظاهراً:

user
tenantId
role

دارد.

ولی parent واقعی ممکن است:

Parent P
  ├── Child A / School A
  └── Child B / School B

داشته باشد.

مدل بهتر:

User Identity
   ↓
Memberships
   ├── tenant A / PARENT
   └── tenant B / PARENT

و authorization بر اساس resource + active membership محاسبه شود.

همین موضوع برای driver چندمدرسه‌ای نیز صادق است.

Top-3 risks before Pilot
1. Attendance scope اشتباه

بزرگ‌ترین ریسک عملیاتی این است که state machine بر «دانش‌آموز در روز» بنا شده باشد، نه «دانش‌آموز در یک service occurrence». این می‌تواند سرویس رفت و برگشت، شیفت دوم، route replacement و offline replay را خراب کند. قبل از Pilot باید service_date + shift/trip بخشی از کلید منطقی state شود.

2. Offline sync بر timestamp به‌جای causal sequence

مرتب‌کردن صرفاً بر client_timestamp برای سیستم حمل‌ونقل قابل اتکا نیست. clock skew، تغییر ساعت دستگاه، eventهای هم‌زمان و batchهای overlapping می‌توانند state machine را به conflict کاذب یا حتی state اشتباه ببرند. device sequence number + idempotency + explicit conflict taxonomy باید قبل از Pilot تثبیت شود.

3. Multi-tenant identity برای parent/driver چندمدرسه‌ای

مدل «یک user = یک tenantId» برای School Admin مناسب است، ولی برای parent یا driver چندمدرسه‌ای شکننده است. اگر این ed