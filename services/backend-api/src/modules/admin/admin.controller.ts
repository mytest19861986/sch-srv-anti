import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../auth/auth.service.js';
import { InMemoryDomainRepository } from '../domain/domain.service.js';
import { IAttendanceRepository } from '../attendance/attendance.service.js';
import { AuditService } from '../super-admin/audit.service.js';

export function adminController(
  authService: AuthService,
  domainRepository: InMemoryDomainRepository,
  attendanceRepository: IAttendanceRepository,
  auditService: AuditService
) {
  return async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
    // Auth hook for all /api/v1/admin/* routes
    fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Missing token' });
      }
      const token = authHeader.split(' ')[1];
      try {
        const payload = authService.verifyToken(token);
        if (payload.role !== 'SCHOOL_ADMIN' && payload.role !== 'SUPER_ADMIN') {
          return reply.status(403).send({ error: 'FORBIDDEN', message: 'Admin role required' });
        }
        (request as any).user = payload;
      } catch {
        return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Invalid token' });
      }
    });

    // 1. Students List
    fastify.get('/students', async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string; q?: string } }>, reply) => {
      const tenantId = (request as any).user.tenantId;
      const q = request.query.q?.toLowerCase() || '';
      
      const mockStudents = [
        { id: 'std-1', tenantId, fullName: 'امیرعلی رضایی', nationalCode: '0012345678', grade: 'پایه ششم', routeName: 'مسیر ۱ - ونک', status: 'PICKED_UP', parentName: 'علی رضایی', parentPhone: '09121112233' },
        { id: 'std-2', tenantId, fullName: 'سارا محمدی', nationalCode: '0023456789', grade: 'پایه چهارم', routeName: 'مسیر ۱ - ونک', status: 'DROPPED_OFF', parentName: 'حسن محمدی', parentPhone: '09122223344' },
        { id: 'std-3', tenantId, fullName: 'محمدحسین حسینی', nationalCode: '0034567890', grade: 'پایه پنجم', routeName: 'مسیر ۲ - پاسداران', status: 'PENDING', parentName: 'حسین حسینی', parentPhone: '09123334455' },
        { id: 'std-4', tenantId, fullName: 'زهرا کاظمی', nationalCode: '0045678901', grade: 'پایه اول', routeName: 'مسیر ۲ - پاسداران', status: 'ABSENT', parentName: 'مهدی کاظمی', parentPhone: '09124445566' },
        { id: 'std-5', tenantId, fullName: 'کیان تهرانی', nationalCode: '0056789012', grade: 'پایه سوم', routeName: 'مسیر ۱ - ونک', status: 'PICKED_UP', parentName: 'محمد تهرانی', parentPhone: '09125556677' },
      ];

      const filtered = mockStudents.filter(s => !q || s.fullName.includes(q) || s.nationalCode.includes(q));
      return reply.send({ items: filtered, total: 145, page: 1, limit: 10 });
    });

    // 2. Parents List
    fastify.get('/parents', async (request: FastifyRequest<{ Querystring: { q?: string } }>, reply) => {
      const tenantId = (request as any).user.tenantId;
      const q = request.query.q?.toLowerCase() || '';

      const mockParents = [
        { id: 'par-1', tenantId, fullName: 'محمد تهرانی', phone: '09125556677', email: 'parent@demo.ir', childrenCount: 1, status: 'ACTIVE' },
        { id: 'par-2', tenantId, fullName: 'علی رضایی', phone: '09121112233', email: 'parent.rezaei@demo.ir', childrenCount: 1, status: 'ACTIVE' },
        { id: 'par-3', tenantId, fullName: 'حسن محمدی', phone: '09122223344', email: 'parent.mohammadi@demo.ir', childrenCount: 2, status: 'ACTIVE' },
        { id: 'par-4', tenantId, fullName: 'مهدی کاظمی', phone: '09124445566', email: 'parent.kazemi@demo.ir', childrenCount: 1, status: 'ACTIVE' },
      ];

      const filtered = mockParents.filter(p => !q || p.fullName.includes(q) || p.phone.includes(q));
      return reply.send({ items: filtered, total: 130, page: 1, limit: 10 });
    });

    // 3. Drivers List
    fastify.get('/drivers', async (request: FastifyRequest<{ Querystring: { q?: string } }>, reply) => {
      const tenantId = (request as any).user.tenantId;
      const q = request.query.q?.toLowerCase() || '';

      const mockDrivers = [
        { id: 'drv-1', tenantId, fullName: 'علی رضایی', phone: '09121112233', email: 'driver@demo.ir', licenseNo: 'ب-۹۸۷۶۵۴۳۲', vehicleModel: 'ون هایس', vehiclePlate: '۷۷ ب ۹۴۱ ایران ۴۴', activeRoute: 'مسیر ۱ - ونک', status: 'ACTIVE' },
        { id: 'drv-2', tenantId, fullName: 'حسین حسینی', phone: '09123334455', email: 'driver2@demo.ir', licenseNo: 'ب-۱۲۳۴۵۶۷۸', vehicleModel: 'مینی‌بوس هیوندای', vehiclePlate: '۲۲ ج ۳۳۳ ایران ۳۳', activeRoute: 'مسیر ۲ - پاسداران', status: 'ACTIVE' },
      ];

      const filtered = mockDrivers.filter(d => !q || d.fullName.includes(q) || d.phone.includes(q));
      return reply.send({ items: filtered, total: 8, page: 1, limit: 10 });
    });

    // 4. Vehicles View
    fastify.get('/vehicles', async (request: FastifyRequest, reply) => {
      const tenantId = (request as any).user.tenantId;
      const vehicles = [
        { id: 'veh-1', tenantId, model: 'تویوتا ون هایس ۱۴ نفره', plate: '۷۷ ب ۹۴۱ ایران ۴۴', capacity: 14, driverName: 'علی رضایی', status: 'ACTIVE' },
        { id: 'veh-2', tenantId, model: 'مینی‌بوس هیوندای کروس', plate: '۲۲ ج ۳۳۳ ایران ۳۳', capacity: 18, driverName: 'حسین حسینی', status: 'ACTIVE' },
      ];
      return reply.send({ items: vehicles, total: 8, page: 1, limit: 10 });
    });

    // 5. Routes List
    fastify.get('/routes', async (request: FastifyRequest, reply) => {
      const tenantId = (request as any).user.tenantId;
      const routes = [
        { id: 'route-1', tenantId, name: 'مسیر ۱ - ونک به سعادت‌آباد', code: 'RT-VNK-1', stopsCount: 6, studentsCount: 18, driverName: 'علی رضایی', status: 'ACTIVE' },
        { id: 'route-2', tenantId, name: 'مسیر ۲ - پاسداران به نیاوران', code: 'RT-PSD-2', stopsCount: 5, studentsCount: 15, driverName: 'حسین حسینی', status: 'ACTIVE' },
      ];
      return reply.send({ items: routes, total: 8, page: 1, limit: 10 });
    });

    // 6. Services List
    fastify.get('/services', async (request: FastifyRequest, reply) => {
      const tenantId = (request as any).user.tenantId;
      const services = [
        { id: 'srv-101', tenantId, routeName: 'مسیر ۱ - ونک به سعادت‌آباد', driverName: 'علی رضایی', driverPhone: '09121112233', totalStudents: 18, pickedUp: 18, droppedOff: 16, status: 'IN_PROGRESS' },
        { id: 'srv-102', tenantId, routeName: 'مسیر ۲ - پاسداران به نیاوران', driverName: 'حسین حسینی', driverPhone: '09123334455', totalStudents: 15, pickedUp: 15, droppedOff: 15, status: 'COMPLETED' },
      ];
      return reply.send({ items: services, total: 8, page: 1, limit: 10 });
    });

    // 7. Events Report with Hourly Distribution
    fastify.get('/events', async (request: FastifyRequest<{ Querystring: { date?: string } }>, reply) => {
      const tenantId = (request as any).user.tenantId;
      const date = request.query.date || '2026-08-27';

      const items = [
        { id: 'evt-1', tenantId, studentName: 'امیرعلی رضایی', eventType: 'BOARDED', time: '07:15', route: 'مسیر ۱', driver: 'علی رضایی' },
        { id: 'evt-2', tenantId, studentName: 'سارا محمدی', eventType: 'DROPPED_OFF', time: '07:45', route: 'مسیر ۱', driver: 'علی رضایی' },
        { id: 'evt-3', tenantId, studentName: 'کیان تهرانی', eventType: 'BOARDED', time: '07:20', route: 'مسیر ۱', driver: 'علی رضایی' },
      ];

      const hourlyDistribution: Record<string, number> = {
        '06:00': 15,
        '07:00': 120,
        '08:00': 45,
        '12:00': 20,
        '13:00': 95,
        '14:00': 110,
        '15:00': 30,
        '16:00': 5,
      };

      return reply.send({ items, total: 440, date, hourlyDistribution });
    });

    // 8. Audit Logs
    fastify.get('/audit-logs', async (request: FastifyRequest, reply) => {
      const tenantId = (request as any).user.tenantId;
      const logs = [
        { id: 'aud-1', tenantId, action: 'CORRECT_STUDENT_STATUS', actor: 'school-admin@demo.ir', details: 'تغییر وضعیت دانش‌آموز سارا محمدی به پیاده شده', timestamp: '2026-08-27T08:15:00Z' },
        { id: 'aud-2', tenantId, action: 'REASSIGN_DRIVER_SHIFT', actor: 'school-admin@demo.ir', details: 'تخصیص ون شماره ۱ به مسیر ونک', timestamp: '2026-08-27T06:30:00Z' },
      ];
      return reply.send({ items: logs, total: logs.length });
    });

    // 9. Notification Logs
    fastify.get('/notification-logs', async (request: FastifyRequest, reply) => {
      const tenantId = (request as any).user.tenantId;
      const notifications = [
        { id: 'notif-1', tenantId, recipient: 'محمد تهرانی (ولی)', channel: 'SMS + PUSH', title: 'سوار شدن دانش‌آموز', message: 'فرزند شما کیان تهرانی در ساعت ۰۷:۲۰ سوار سرویس شد.', sentAt: '2026-08-27T07:20:00Z', status: 'DELIVERED' },
        { id: 'notif-2', tenantId, recipient: 'حسن محمدی (ولی)', channel: 'PUSH', title: 'رسیدن به مقصد', message: 'فرزند شما سارا محمدی در ساعت ۰۷:۴۵ به مدرسه رسید.', sentAt: '2026-08-27T07:45:00Z', status: 'DELIVERED' },
      ];
      return reply.send({ items: notifications, total: notifications.length });
    });
  };
}
