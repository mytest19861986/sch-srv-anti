import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../auth/auth.service.js';
import { InMemoryDomainRepository, Student, Parent, Driver, Route } from '../domain/domain.service.js';
import { IAttendanceRepository } from '../attendance/attendance.service.js';
import { AuditService } from '../super-admin/audit.service.js';

export function adminController(
  authService: AuthService,
  domainRepository: InMemoryDomainRepository,
  attendanceRepository: IAttendanceRepository,
  auditService: AuditService
) {
  // Local state for vehicles and routes details per tenant
  const vehiclesMap = new Map<string, any>();
  const routesMap = new Map<string, any>();
  const activeStudentsMap = new Map<string, any>();
  const activeParentsMap = new Map<string, any>();
  const activeDriversMap = new Map<string, any>();

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
        if (payload.role !== 'SCHOOL_ADMIN' && payload.role !== 'SCHOOL_OPERATOR' && payload.role !== 'SUPER_ADMIN') {
          return reply.status(403).send({ error: 'FORBIDDEN', message: 'School admin or operator role required' });
        }
        (request as any).user = payload;
      } catch {
        return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Invalid token' });
      }
    });

    // ==========================================
    // 1. STUDENTS CRUD
    // ==========================================
    fastify.get('/students', async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string; q?: string } }>, reply) => {
      const tenantId = (request as any).user.tenantId;
      const q = request.query.q?.toLowerCase() || '';
      
      const studentsInTenant = Array.from(activeStudentsMap.values()).filter(s => s.tenantId === tenantId && !s.isDeleted);
      const filtered = studentsInTenant.filter(s => !q || s.fullName?.includes(q) || s.firstName?.includes(q) || s.lastName?.includes(q) || s.nationalCode?.includes(q));
      
      return reply.send({ items: filtered, total: filtered.length, page: 1, limit: 20 });
    });

    fastify.post('/students', async (request: FastifyRequest<{ Body: { first_name: string; last_name: string; grade: string; national_code?: string; parent_ids?: string[] } }>, reply) => {
      const tenantId = (request as any).user.tenantId;
      const { first_name, last_name, grade, national_code, parent_ids = [] } = request.body || {};

      if (!first_name || !last_name) {
        return reply.status(400).send({ error: 'BAD_REQUEST', message: 'first_name and last_name are required' });
      }

      const studentId = `std-${Date.now()}-${Math.floor(Math.random()*1000)}`;
      const studentRecord = {
        id: studentId,
        tenantId,
        firstName: first_name,
        lastName: last_name,
        fullName: `${first_name} ${last_name}`,
        grade: grade || 'پایه اول',
        nationalCode: national_code || `00${Date.now().toString().slice(-8)}`,
        parentIds: parent_ids,
        status: 'ACTIVE',
        isDeleted: false,
        createdAt: new Date()
      };

      activeStudentsMap.set(studentId, studentRecord);

      // Link to domain repo
      await domainRepository.createStudent({
        id: studentId,
        tenantId,
        firstName: first_name,
        lastName: last_name,
        grade: grade || 'پایه اول'
      });

      for (const pId of parent_ids) {
        await domainRepository.linkStudentParent(tenantId, studentId, pId);
      }

      await auditService.log({
        tenantId,
        userId: (request as any).user.userId,
        action: 'CREATE',
        resourceType: 'STUDENT',
        resourceId: studentId,
        changes: studentRecord
      });

      return reply.status(201).send(studentRecord);
    });

    fastify.patch('/students/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply) => {
      const tenantId = (request as any).user.tenantId;
      const { id } = request.params;
      const existing = activeStudentsMap.get(id);

      if (!existing || existing.tenantId !== tenantId) {
        return reply.status(404).send({ error: 'NOT_FOUND', message: 'Student not found in this tenant' });
      }

      const updated = { ...existing, ...request.body };
      if (request.body.first_name || request.body.last_name) {
        updated.firstName = request.body.first_name || existing.firstName;
        updated.lastName = request.body.last_name || existing.lastName;
        updated.fullName = `${updated.firstName} ${updated.lastName}`;
      }
      activeStudentsMap.set(id, updated);

      await auditService.log({
        tenantId,
        userId: (request as any).user.userId,
        action: 'UPDATE',
        resourceType: 'STUDENT',
        resourceId: id,
        changes: { previous: existing, updated }
      });

      return reply.send(updated);
    });

    fastify.delete('/students/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const tenantId = (request as any).user.tenantId;
      const { id } = request.params;
      const existing = activeStudentsMap.get(id);

      if (!existing || existing.tenantId !== tenantId) {
        return reply.status(404).send({ error: 'NOT_FOUND', message: 'Student not found in this tenant' });
      }

      existing.isDeleted = true;
      existing.status = 'INACTIVE';
      activeStudentsMap.set(id, existing);

      await auditService.log({
        tenantId,
        userId: (request as any).user.userId,
        action: 'DELETE',
        resourceType: 'STUDENT',
        resourceId: id,
        changes: { softDeleted: true }
      });

      return reply.send({ success: true, message: 'Student soft-deleted successfully' });
    });

    // ==========================================
    // 2. PARENTS CRUD & USER ENROLLMENT
    // ==========================================
    fastify.get('/parents', async (request: FastifyRequest<{ Querystring: { q?: string } }>, reply) => {
      const tenantId = (request as any).user.tenantId;
      const q = request.query.q?.toLowerCase() || '';

      const parentsInTenant = Array.from(activeParentsMap.values()).filter(p => p.tenantId === tenantId && !p.isDeleted);
      const filtered = parentsInTenant.filter(p => !q || p.fullName?.includes(q) || p.phone?.includes(q) || p.email?.includes(q));

      return reply.send({ items: filtered, total: filtered.length, page: 1, limit: 20 });
    });

    fastify.post('/parents', async (request: FastifyRequest<{ Body: { full_name: string; phone: string; email?: string; temp_password?: string; student_ids?: string[] } }>, reply) => {
      const tenantId = (request as any).user.tenantId;
      const { full_name, phone, email, temp_password, student_ids = [] } = request.body || {};

      if (!full_name || !phone) {
        return reply.status(400).send({ error: 'BAD_REQUEST', message: 'full_name and phone are required' });
      }

      // Check unique phone/email in tenant
      const existingParents = Array.from(activeParentsMap.values()).filter(p => p.tenantId === tenantId && !p.isDeleted);
      if (existingParents.some(p => p.phone === phone)) {
        return reply.status(409).send({ error: 'CONFLICT', message: 'Phone number already exists in this tenant' });
      }

      const parentId = `par-${Date.now()}-${Math.floor(Math.random()*1000)}`;
      const generatedPassword = temp_password || `Pass@${Math.floor(100000 + Math.random() * 900000)}`;
      const userEmail = email || `parent.${phone.slice(-4)}@${tenantId}.serviceyar.ir`;

      // Create PARENT user account in auth
      const userId = `usr-parent-${Date.now()}`;
      try {
        await authService.register({
          id: userId,
          email: userEmail,
          password: generatedPassword,
          role: 'PARENT',
          tenantId
        });
      } catch (err: any) {
        // If already exists in auth repo, proceed
      }

      const parentRecord = {
        id: parentId,
        tenantId,
        userId,
        fullName: full_name,
        phone,
        email: userEmail,
        temp_password: generatedPassword,
        studentIds: student_ids,
        childrenCount: student_ids.length,
        status: 'ACTIVE',
        isDeleted: false,
        createdAt: new Date()
      };

      activeParentsMap.set(parentId, parentRecord);

      await domainRepository.createParent({
        id: parentId,
        tenantId,
        userId,
        phoneNumber: phone
      });

      for (const sId of student_ids) {
        await domainRepository.linkStudentParent(tenantId, sId, parentId);
      }

      await auditService.log({
        tenantId,
        userId: (request as any).user.userId,
        action: 'CREATE',
        resourceType: 'PARENT',
        resourceId: parentId,
        changes: { ...parentRecord, temp_password: '[REDACTED]' }
      });

      return reply.status(201).send(parentRecord);
    });

    fastify.patch('/parents/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply) => {
      const tenantId = (request as any).user.tenantId;
      const { id } = request.params;
      const existing = activeParentsMap.get(id);

      if (!existing || existing.tenantId !== tenantId) {
        return reply.status(404).send({ error: 'NOT_FOUND', message: 'Parent not found in this tenant' });
      }

      const updated = { ...existing, ...request.body };
      activeParentsMap.set(id, updated);

      await auditService.log({
        tenantId,
        userId: (request as any).user.userId,
        action: 'UPDATE',
        resourceType: 'PARENT',
        resourceId: id,
        changes: { previous: existing, updated }
      });

      return reply.send(updated);
    });

    fastify.delete('/parents/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const tenantId = (request as any).user.tenantId;
      const { id } = request.params;
      const existing = activeParentsMap.get(id);

      if (!existing || existing.tenantId !== tenantId) {
        return reply.status(404).send({ error: 'NOT_FOUND', message: 'Parent not found in this tenant' });
      }

      existing.isDeleted = true;
      existing.status = 'INACTIVE';
      activeParentsMap.set(id, existing);

      await auditService.log({
        tenantId,
        userId: (request as any).user.userId,
        action: 'DELETE',
        resourceType: 'PARENT',
        resourceId: id,
        changes: { softDeleted: true }
      });

      return reply.send({ success: true, message: 'Parent soft-deleted successfully' });
    });

    // ==========================================
    // 3. DRIVERS CRUD
    // ==========================================
    fastify.get('/drivers', async (request: FastifyRequest<{ Querystring: { q?: string } }>, reply) => {
      const tenantId = (request as any).user.tenantId;
      const q = request.query.q?.toLowerCase() || '';

      const driversInTenant = Array.from(activeDriversMap.values()).filter(d => d.tenantId === tenantId && !d.isDeleted);
      const filtered = driversInTenant.filter(d => !q || d.fullName?.includes(q) || d.phone?.includes(q) || d.licenseNo?.includes(q));

      return reply.send({ items: filtered, total: filtered.length, page: 1, limit: 20 });
    });

    fastify.post('/drivers', async (request: FastifyRequest<{ Body: { full_name: string; phone: string; license_no: string; vehicle_id?: string } }>, reply) => {
      const tenantId = (request as any).user.tenantId;
      const { full_name, phone, license_no, vehicle_id } = request.body || {};

      if (!full_name || !phone || !license_no) {
        return reply.status(400).send({ error: 'BAD_REQUEST', message: 'full_name, phone, and license_no are required' });
      }

      const driverId = `drv-${Date.now()}-${Math.floor(Math.random()*1000)}`;
      const userId = `usr-driver-${Date.now()}`;

      const driverRecord = {
        id: driverId,
        tenantId,
        userId,
        fullName: full_name,
        phone,
        licenseNo: license_no,
        vehicleId: vehicle_id || null,
        status: 'ACTIVE',
        isDeleted: false,
        createdAt: new Date()
      };

      activeDriversMap.set(driverId, driverRecord);

      await domainRepository.createDriver({
        id: driverId,
        tenantId,
        userId,
        licenseNumber: license_no,
        vehicleId: vehicle_id
      });

      await auditService.log({
        tenantId,
        userId: (request as any).user.userId,
        action: 'CREATE',
        resourceType: 'DRIVER',
        resourceId: driverId,
        changes: driverRecord
      });

      return reply.status(201).send(driverRecord);
    });

    fastify.patch('/drivers/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply) => {
      const tenantId = (request as any).user.tenantId;
      const { id } = request.params;
      const existing = activeDriversMap.get(id);

      if (!existing || existing.tenantId !== tenantId) {
        return reply.status(404).send({ error: 'NOT_FOUND', message: 'Driver not found in this tenant' });
      }

      const updated = { ...existing, ...request.body };
      activeDriversMap.set(id, updated);

      await auditService.log({
        tenantId,
        userId: (request as any).user.userId,
        action: 'UPDATE',
        resourceType: 'DRIVER',
        resourceId: id,
        changes: { previous: existing, updated }
      });

      return reply.send(updated);
    });

    fastify.delete('/drivers/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const tenantId = (request as any).user.tenantId;
      const { id } = request.params;
      const existing = activeDriversMap.get(id);

      if (!existing || existing.tenantId !== tenantId) {
        return reply.status(404).send({ error: 'NOT_FOUND', message: 'Driver not found in this tenant' });
      }

      existing.isDeleted = true;
      existing.status = 'INACTIVE';
      activeDriversMap.set(id, existing);

      await auditService.log({
        tenantId,
        userId: (request as any).user.userId,
        action: 'DELETE',
        resourceType: 'DRIVER',
        resourceId: id,
        changes: { softDeleted: true }
      });

      return reply.send({ success: true, message: 'Driver soft-deleted successfully' });
    });

    // ==========================================
    // 4. VEHICLES CRUD
    // ==========================================
    fastify.get('/vehicles', async (request: FastifyRequest, reply) => {
      const tenantId = (request as any).user.tenantId;
      const list = Array.from(vehiclesMap.values()).filter(v => v.tenantId === tenantId && !v.isDeleted);
      return reply.send({ items: list, total: list.length, page: 1, limit: 20 });
    });

    fastify.post('/vehicles', async (request: FastifyRequest<{ Body: { plate: string; model: string; capacity: number } }>, reply) => {
      const tenantId = (request as any).user.tenantId;
      const { plate, model, capacity } = request.body || {};

      if (!plate || !model) {
        return reply.status(400).send({ error: 'BAD_REQUEST', message: 'plate and model are required' });
      }

      const vehicleId = `veh-${Date.now()}-${Math.floor(Math.random()*1000)}`;
      const vehicleRecord = {
        id: vehicleId,
        tenantId,
        plate,
        model,
        capacity: Number(capacity) || 14,
        status: 'ACTIVE',
        isDeleted: false,
        createdAt: new Date()
      };

      vehiclesMap.set(vehicleId, vehicleRecord);

      await auditService.log({
        tenantId,
        userId: (request as any).user.userId,
        action: 'CREATE',
        resourceType: 'VEHICLE',
        resourceId: vehicleId,
        changes: vehicleRecord
      });

      return reply.status(201).send(vehicleRecord);
    });

    fastify.patch('/vehicles/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply) => {
      const tenantId = (request as any).user.tenantId;
      const { id } = request.params;
      const existing = vehiclesMap.get(id);

      if (!existing || existing.tenantId !== tenantId) {
        return reply.status(404).send({ error: 'NOT_FOUND', message: 'Vehicle not found in this tenant' });
      }

      const updated = { ...existing, ...request.body };
      vehiclesMap.set(id, updated);

      await auditService.log({
        tenantId,
        userId: (request as any).user.userId,
        action: 'UPDATE',
        resourceType: 'VEHICLE',
        resourceId: id,
        changes: { previous: existing, updated }
      });

      return reply.send(updated);
    });

    fastify.delete('/vehicles/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const tenantId = (request as any).user.tenantId;
      const { id } = request.params;
      const existing = vehiclesMap.get(id);

      if (!existing || existing.tenantId !== tenantId) {
        return reply.status(404).send({ error: 'NOT_FOUND', message: 'Vehicle not found in this tenant' });
      }

      existing.isDeleted = true;
      existing.status = 'INACTIVE';
      vehiclesMap.set(id, existing);

      await auditService.log({
        tenantId,
        userId: (request as any).user.userId,
        action: 'DELETE',
        resourceType: 'VEHICLE',
        resourceId: id,
        changes: { softDeleted: true }
      });

      return reply.send({ success: true, message: 'Vehicle soft-deleted successfully' });
    });

    // ==========================================
    // 5. ROUTES CRUD
    // ==========================================
    fastify.get('/routes', async (request: FastifyRequest, reply) => {
      const tenantId = (request as any).user.tenantId;
      const list = Array.from(routesMap.values()).filter(r => r.tenantId === tenantId && !r.isDeleted);
      return reply.send({ items: list, total: list.length, page: 1, limit: 20 });
    });

    fastify.post('/routes', async (request: FastifyRequest<{ Body: { name: string; origin?: string; destination?: string; stops?: string[]; driver_id?: string; vehicle_id?: string } }>, reply) => {
      const tenantId = (request as any).user.tenantId;
      const { name, origin, destination, stops = [], driver_id, vehicle_id } = request.body || {};

      if (!name) {
        return reply.status(400).send({ error: 'BAD_REQUEST', message: 'name is required' });
      }

      const routeId = `route-${Date.now()}-${Math.floor(Math.random()*1000)}`;
      const routeRecord = {
        id: routeId,
        tenantId,
        name,
        origin: origin || 'مبداء مسیر',
        destination: destination || 'مجتمع آموزشی',
        stops,
        stopsCount: stops.length,
        driverId: driver_id || null,
        vehicleId: vehicle_id || null,
        status: 'ACTIVE',
        isDeleted: false,
        createdAt: new Date()
      };

      routesMap.set(routeId, routeRecord);

      await domainRepository.createRoute({
        id: routeId,
        tenantId,
        name,
        direction: 'TO_SCHOOL'
      });

      await auditService.log({
        tenantId,
        userId: (request as any).user.userId,
        action: 'CREATE',
        resourceType: 'ROUTE',
        resourceId: routeId,
        changes: routeRecord
      });

      return reply.status(201).send(routeRecord);
    });

    fastify.patch('/routes/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply) => {
      const tenantId = (request as any).user.tenantId;
      const { id } = request.params;
      const existing = routesMap.get(id);

      if (!existing || existing.tenantId !== tenantId) {
        return reply.status(404).send({ error: 'NOT_FOUND', message: 'Route not found in this tenant' });
      }

      const updated = { ...existing, ...request.body };
      routesMap.set(id, updated);

      await auditService.log({
        tenantId,
        userId: (request as any).user.userId,
        action: 'UPDATE',
        resourceType: 'ROUTE',
        resourceId: id,
        changes: { previous: existing, updated }
      });

      return reply.send(updated);
    });

    fastify.delete('/routes/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const tenantId = (request as any).user.tenantId;
      const { id } = request.params;
      const existing = routesMap.get(id);

      if (!existing || existing.tenantId !== tenantId) {
        return reply.status(404).send({ error: 'NOT_FOUND', message: 'Route not found in this tenant' });
      }

      existing.isDeleted = true;
      existing.status = 'INACTIVE';
      routesMap.set(id, existing);

      await auditService.log({
        tenantId,
        userId: (request as any).user.userId,
        action: 'DELETE',
        resourceType: 'ROUTE',
        resourceId: id,
        changes: { softDeleted: true }
      });

      return reply.send({ success: true, message: 'Route soft-deleted successfully' });
    });

    // 6. Services & Events list (existing)
    fastify.get('/services', async (request: FastifyRequest, reply) => {
      const tenantId = (request as any).user.tenantId;
      const services = [
        { id: 'srv-101', tenantId, routeName: 'مسیر ۱ - ونک به سعادت‌آباد', driverName: 'علی رضایی', driverPhone: '09121112233', totalStudents: 18, pickedUp: 18, droppedOff: 16, status: 'IN_PROGRESS' },
        { id: 'srv-102', tenantId, routeName: 'مسیر ۲ - پاسداران به نیاوران', driverName: 'حسین حسینی', driverPhone: '09123334455', totalStudents: 15, pickedUp: 15, droppedOff: 15, status: 'COMPLETED' },
      ];
      return reply.send({ items: services, total: 8, page: 1, limit: 10 });
    });

    fastify.get('/events', async (request: FastifyRequest<{ Querystring: { date?: string } }>, reply) => {
      const tenantId = (request as any).user.tenantId;
      const date = request.query.date || '2026-08-27';

      const items = [
        { id: 'evt-1', tenantId, studentName: 'امیرعلی رضایی', eventType: 'BOARDED', time: '07:15', route: 'مسیر ۱', driver: 'علی رضایی' },
        { id: 'evt-2', tenantId, studentName: 'سارا محمدی', eventType: 'DROPPED_OFF', time: '07:45', route: 'مسیر ۱', driver: 'علی رضایی' },
        { id: 'evt-3', tenantId, studentName: 'کیان تهرانی', eventType: 'BOARDED', time: '07:20', route: 'مسیر ۱', driver: 'علی رضایی' },
      ];

      const hourlyDistribution: Record<string, number> = {
        '06:00': 5,
        '07:00': 42,
        '08:00': 18,
        '12:00': 2,
        '13:00': 35,
        '14:00': 28,
        '15:00': 10
      };

      return reply.send({ items, hourlyDistribution, totalEvents: 140 });
    });
  };
}
