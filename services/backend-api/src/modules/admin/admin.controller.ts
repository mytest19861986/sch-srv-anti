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

  function seedDefaultData() {
    const tenants = ['tenant-school-mehr', 'school-tehran-1', 'school_a', 'school-statemachine-tenant'];
    for (const tId of tenants) {
      if (!Array.from(activeParentsMap.values()).some(p => p.tenantId === tId)) {
        // Parent 1
        const p1 = {
          id: `par-${tId}-1`,
          tenantId: tId,
          userId: `usr-p1-${tId}`,
          fullName: 'فاطمه محمدی',
          phone: '09123456789',
          email: `fatemeh.mohammadi@${tId}.serviceyar.ir`,
          relationship: 'مادر',
          studentIds: [`std-${tId}-1`, `std-${tId}-2`],
          childrenCount: 2,
          status: 'ACTIVE',
          isDeleted: false,
          createdAt: new Date()
        };
        // Parent 2
        const p2 = {
          id: `par-${tId}-2`,
          tenantId: tId,
          userId: `usr-p2-${tId}`,
          fullName: 'رضا حسینی',
          phone: '09129876543',
          email: `reza.hosseini@${tId}.serviceyar.ir`,
          relationship: 'پدر',
          studentIds: [`std-${tId}-3`],
          childrenCount: 1,
          status: 'ACTIVE',
          isDeleted: false,
          createdAt: new Date()
        };
        // Parent 3
        const p3 = {
          id: `par-${tId}-3`,
          tenantId: tId,
          userId: `usr-p3-${tId}`,
          fullName: 'زهرا کاظمی',
          phone: '09351112233',
          email: `zahra.kazemi@${tId}.serviceyar.ir`,
          relationship: 'مادر',
          studentIds: [`std-${tId}-3`, `std-${tId}-4`],
          childrenCount: 2,
          status: 'ACTIVE',
          isDeleted: false,
          createdAt: new Date()
        };
        activeParentsMap.set(p1.id, p1);
        activeParentsMap.set(p2.id, p2);
        activeParentsMap.set(p3.id, p3);

        // Student 1
        const s1 = {
          id: `std-${tId}-1`,
          tenantId: tId,
          firstName: 'امیرعلی',
          lastName: 'محمدی',
          fullName: 'امیرعلی محمدی',
          grade: 'پایه سوم',
          nationalCode: '0012345678',
          parentIds: [`par-${tId}-1`],
          status: 'ACTIVE',
          isDeleted: false,
          createdAt: new Date()
        };
        // Student 2 (Sister of Student 1)
        const s2 = {
          id: `std-${tId}-2`,
          tenantId: tId,
          firstName: 'سارا',
          lastName: 'محمدی',
          fullName: 'سارا محمدی',
          grade: 'پایه اول',
          nationalCode: '0012345679',
          parentIds: [`par-${tId}-1`],
          status: 'ACTIVE',
          isDeleted: false,
          createdAt: new Date()
        };
        // Student 3 (Has 2 parents: Reza & Zahra)
        const s3 = {
          id: `std-${tId}-3`,
          tenantId: tId,
          firstName: 'پارسـا',
          lastName: 'حسینی',
          fullName: 'پارسا حسینی',
          grade: 'پایه پنجم',
          nationalCode: '0023456789',
          parentIds: [`par-${tId}-2`, `par-${tId}-3`],
          status: 'ACTIVE',
          isDeleted: false,
          createdAt: new Date()
        };
        // Student 4
        const s4 = {
          id: `std-${tId}-4`,
          tenantId: tId,
          firstName: 'نیما',
          lastName: 'کاظمی',
          fullName: 'نیما کاظمی',
          grade: 'پایه ششم',
          nationalCode: '0034567890',
          parentIds: [`par-${tId}-3`],
          status: 'ACTIVE',
          isDeleted: false,
          createdAt: new Date()
        };

        activeStudentsMap.set(s1.id, s1);
        activeStudentsMap.set(s2.id, s2);
        activeStudentsMap.set(s3.id, s3);
        activeStudentsMap.set(s4.id, s4);
      }
    }
  }

  seedDefaultData();

  function getEffectiveTenantId(request: FastifyRequest, reply?: FastifyReply): string {
    const user = (request as any).user;
    const requestedTenant = (request.query as any)?.tenantId || (request.headers as any)['x-tenant-id'] || (request.body as any)?.tenantId;
    if (user.role === 'SUPER_ADMIN') {
      return requestedTenant || user.tenantId;
    }
    if (requestedTenant && requestedTenant !== user.tenantId) {
      if (reply) {
        reply.status(403).send({ error: 'FORBIDDEN', message: 'Cross-tenant access forbidden' });
      }
      throw new Error('FORBIDDEN_CROSS_TENANT');
    }
    return user.tenantId;
  }

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
          return reply.status(403).send({ error: 'FORBIDDEN', message: 'School admin, operator, or Super admin role required' });
        }
        (request as any).user = payload;
      } catch {
        return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Invalid token' });
      }
    });

    // ==========================================
    // 1. STUDENTS CRUD
    // ==========================================
    fastify.get('/students', async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string; q?: string; tenantId?: string } }>, reply) => {
      let tenantId: string;
      try {
        tenantId = getEffectiveTenantId(request, reply);
      } catch {
        return;
      }
      const q = request.query.q?.toLowerCase() || '';
      
      const studentsInTenant = Array.from(activeStudentsMap.values()).filter(s => s.tenantId === tenantId && !s.isDeleted);
      const filtered = studentsInTenant.filter(s => !q || s.fullName?.includes(q) || s.firstName?.includes(q) || s.lastName?.includes(q) || s.nationalCode?.includes(q));

      // Enrich with linked parents
      const enrichedStudents = filtered.map(s => {
        const linkedParents: any[] = [];
        for (const p of activeParentsMap.values()) {
          if (p.tenantId === tenantId && !p.isDeleted) {
            if (s.parentIds?.includes(p.id) || p.studentIds?.includes(s.id)) {
              linkedParents.push({
                id: p.id,
                full_name: p.fullName,
                phone: p.phone,
                relationship: p.relationship || 'سرپرست'
              });
            }
          }
        }
        return {
          ...s,
          parents: linkedParents
        };
      });
      
      return reply.send({ items: enrichedStudents, total: enrichedStudents.length, page: 1, limit: 20 });
    });

    fastify.post('/students', async (request: FastifyRequest<{ Body: { first_name: string; last_name: string; grade: string; national_code?: string; parent_ids?: string[]; tenantId?: string } }>, reply) => {
      let tenantId: string;
      try {
        tenantId = getEffectiveTenantId(request, reply);
      } catch {
        return;
      }
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

      // Bidirectional link: update parents studentIds
      for (const pId of parent_ids) {
        const parent = activeParentsMap.get(pId);
        if (parent) {
          if (!parent.studentIds) parent.studentIds = [];
          if (!parent.studentIds.includes(studentId)) {
            parent.studentIds.push(studentId);
            parent.childrenCount = parent.studentIds.length;
          }
        }
      }

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
        changes: { actor_role: (request as any).user.role, record: studentRecord }
      });

      return reply.status(201).send(studentRecord);
    });

    fastify.patch('/students/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: any; Querystring: { tenantId?: string } }>, reply) => {
      let tenantId: string;
      try {
        tenantId = getEffectiveTenantId(request, reply);
      } catch {
        return;
      }
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
      if (request.body.parent_ids) {
        updated.parentIds = request.body.parent_ids;
        // Sync parent linkages
        for (const pId of request.body.parent_ids) {
          const parent = activeParentsMap.get(pId);
          if (parent) {
            if (!parent.studentIds) parent.studentIds = [];
            if (!parent.studentIds.includes(id)) {
              parent.studentIds.push(id);
              parent.childrenCount = parent.studentIds.length;
            }
          }
        }
      }
      activeStudentsMap.set(id, updated);

      await auditService.log({
        tenantId,
        userId: (request as any).user.userId,
        action: 'UPDATE',
        resourceType: 'STUDENT',
        resourceId: id,
        changes: { actor_role: (request as any).user.role, previous: existing, updated }
      });

      return reply.send(updated);
    });

    fastify.delete('/students/:id', async (request: FastifyRequest<{ Params: { id: string }; Querystring: { tenantId?: string } }>, reply) => {
      let tenantId: string;
      try {
        tenantId = getEffectiveTenantId(request, reply);
      } catch {
        return;
      }
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
        changes: { actor_role: (request as any).user.role, softDeleted: true }
      });

      return reply.send({ success: true, message: 'Student soft-deleted successfully' });
    });

    // ==========================================
    // 2. PARENTS CRUD
    // ==========================================
    fastify.get('/parents', async (request: FastifyRequest<{ Querystring: { q?: string; tenantId?: string } }>, reply) => {
      let tenantId: string;
      try {
        tenantId = getEffectiveTenantId(request, reply);
      } catch {
        return;
      }
      const q = request.query.q?.toLowerCase() || '';

      const parentsInTenant = Array.from(activeParentsMap.values()).filter(p => p.tenantId === tenantId && !p.isDeleted);
      const filtered = parentsInTenant.filter(p => !q || p.fullName?.includes(q) || p.phone?.includes(q) || p.email?.includes(q));

      // Enrich with linked students
      const enrichedParents = filtered.map(p => {
        const linkedStudents: any[] = [];
        for (const s of activeStudentsMap.values()) {
          if (s.tenantId === tenantId && !s.isDeleted) {
            if (p.studentIds?.includes(s.id) || s.parentIds?.includes(p.id)) {
              linkedStudents.push({
                id: s.id,
                first_name: s.firstName,
                last_name: s.lastName,
                fullName: s.fullName,
                grade: s.grade,
                status: s.status
              });
            }
          }
        }
        return {
          ...p,
          students: linkedStudents,
          childrenCount: linkedStudents.length
        };
      });

      return reply.send({ items: enrichedParents, total: enrichedParents.length, page: 1, limit: 20 });
    });

    fastify.post('/parents', async (request: FastifyRequest<{ Body: { full_name: string; phone: string; email?: string; relationship?: string; temp_password?: string; student_ids?: string[]; tenantId?: string } }>, reply) => {
      let tenantId: string;
      try {
        tenantId = getEffectiveTenantId(request, reply);
      } catch {
        return;
      }
      const { full_name, phone, email, relationship, temp_password, student_ids = [] } = request.body || {};

      if (!full_name || !phone) {
        return reply.status(400).send({ error: 'BAD_REQUEST', message: 'full_name and phone are required' });
      }

      const existingParents = Array.from(activeParentsMap.values()).filter(p => p.tenantId === tenantId && !p.isDeleted);
      if (existingParents.some(p => p.phone === phone)) {
        return reply.status(409).send({ error: 'CONFLICT', message: 'Phone number already exists in this tenant' });
      }

      const parentId = `par-${Date.now()}-${Math.floor(Math.random()*1000)}`;
      const generatedPassword = temp_password || `Pass@${Math.floor(100000 + Math.random() * 900000)}`;
      const userEmail = email || `parent.${phone.slice(-4)}@${tenantId}.serviceyar.ir`;

      const userId = `usr-parent-${Date.now()}`;
      try {
        await authService.register({
          id: userId,
          email: userEmail,
          password: generatedPassword,
          role: 'PARENT',
          tenantId
        });
      } catch (err: any) {}

      const parentRecord = {
        id: parentId,
        tenantId,
        userId,
        fullName: full_name,
        phone,
        email: userEmail,
        relationship: relationship || 'سرپرست',
        temp_password: generatedPassword,
        studentIds: student_ids,
        childrenCount: student_ids.length,
        status: 'ACTIVE',
        isDeleted: false,
        createdAt: new Date()
      };

      activeParentsMap.set(parentId, parentRecord);

      // Bidirectional link: update students parentIds
      for (const sId of student_ids) {
        const student = activeStudentsMap.get(sId);
        if (student) {
          if (!student.parentIds) student.parentIds = [];
          if (!student.parentIds.includes(parentId)) {
            student.parentIds.push(parentId);
          }
        }
      }

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
        changes: { actor_role: (request as any).user.role, ...parentRecord, temp_password: '[REDACTED]' }
      });

      return reply.status(201).send(parentRecord);
    });

    fastify.patch('/parents/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: any; Querystring: { tenantId?: string } }>, reply) => {
      let tenantId: string;
      try {
        tenantId = getEffectiveTenantId(request, reply);
      } catch {
        return;
      }
      const { id } = request.params;
      const existing = activeParentsMap.get(id);

      if (!existing || existing.tenantId !== tenantId) {
        return reply.status(404).send({ error: 'NOT_FOUND', message: 'Parent not found in this tenant' });
      }

      const updated = { ...existing, ...request.body };
      if (request.body.student_ids) {
        updated.studentIds = request.body.student_ids;
        updated.childrenCount = request.body.student_ids.length;
        for (const sId of request.body.student_ids) {
          const student = activeStudentsMap.get(sId);
          if (student) {
            if (!student.parentIds) student.parentIds = [];
            if (!student.parentIds.includes(id)) {
              student.parentIds.push(id);
            }
          }
        }
      }
      activeParentsMap.set(id, updated);

      await auditService.log({
        tenantId,
        userId: (request as any).user.userId,
        action: 'UPDATE',
        resourceType: 'PARENT',
        resourceId: id,
        changes: { actor_role: (request as any).user.role, previous: existing, updated }
      });

      return reply.send(updated);
    });

    fastify.delete('/parents/:id', async (request: FastifyRequest<{ Params: { id: string }; Querystring: { tenantId?: string } }>, reply) => {
      let tenantId: string;
      try {
        tenantId = getEffectiveTenantId(request, reply);
      } catch {
        return;
      }
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
        changes: { actor_role: (request as any).user.role, softDeleted: true }
      });

      return reply.send({ success: true, message: 'Parent soft-deleted successfully' });
    });

    // ==========================================
    // 3. DRIVERS CRUD
    // ==========================================
    fastify.get('/drivers', async (request: FastifyRequest<{ Querystring: { q?: string; tenantId?: string } }>, reply) => {
      let tenantId: string;
      try {
        tenantId = getEffectiveTenantId(request, reply);
      } catch {
        return;
      }
      const q = request.query.q?.toLowerCase() || '';

      const driversInTenant = Array.from(activeDriversMap.values()).filter(d => d.tenantId === tenantId && !d.isDeleted);
      const filtered = driversInTenant.filter(d => !q || d.fullName?.includes(q) || d.phone?.includes(q) || d.licenseNo?.includes(q));

      return reply.send({ items: filtered, total: filtered.length, page: 1, limit: 20 });
    });

    fastify.post('/drivers', async (request: FastifyRequest<{ Body: { full_name: string; phone: string; license_no: string; vehicle_id?: string; tenantId?: string } }>, reply) => {
      let tenantId: string;
      try {
        tenantId = getEffectiveTenantId(request, reply);
      } catch {
        return;
      }
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
        changes: { actor_role: (request as any).user.role, record: driverRecord }
      });

      return reply.status(201).send(driverRecord);
    });

    fastify.patch('/drivers/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: any; Querystring: { tenantId?: string } }>, reply) => {
      let tenantId: string;
      try {
        tenantId = getEffectiveTenantId(request, reply);
      } catch {
        return;
      }
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
        changes: { actor_role: (request as any).user.role, previous: existing, updated }
      });

      return reply.send(updated);
    });

    fastify.delete('/drivers/:id', async (request: FastifyRequest<{ Params: { id: string }; Querystring: { tenantId?: string } }>, reply) => {
      let tenantId: string;
      try {
        tenantId = getEffectiveTenantId(request, reply);
      } catch {
        return;
      }
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
        changes: { actor_role: (request as any).user.role, softDeleted: true }
      });

      return reply.send({ success: true, message: 'Driver soft-deleted successfully' });
    });

    // ==========================================
    // 4. VEHICLES CRUD
    // ==========================================
    fastify.get('/vehicles', async (request: FastifyRequest<{ Querystring: { tenantId?: string } }>, reply) => {
      let tenantId: string;
      try {
        tenantId = getEffectiveTenantId(request, reply);
      } catch {
        return;
      }
      const list = Array.from(vehiclesMap.values()).filter(v => v.tenantId === tenantId && !v.isDeleted);
      return reply.send({ items: list, total: list.length, page: 1, limit: 20 });
    });

    fastify.post('/vehicles', async (request: FastifyRequest<{ Body: { plate: string; model: string; capacity: number; tenantId?: string } }>, reply) => {
      let tenantId: string;
      try {
        tenantId = getEffectiveTenantId(request, reply);
      } catch {
        return;
      }
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
        changes: { actor_role: (request as any).user.role, record: vehicleRecord }
      });

      return reply.status(201).send(vehicleRecord);
    });

    fastify.patch('/vehicles/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: any; Querystring: { tenantId?: string } }>, reply) => {
      let tenantId: string;
      try {
        tenantId = getEffectiveTenantId(request, reply);
      } catch {
        return;
      }
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
        changes: { actor_role: (request as any).user.role, previous: existing, updated }
      });

      return reply.send(updated);
    });

    fastify.delete('/vehicles/:id', async (request: FastifyRequest<{ Params: { id: string }; Querystring: { tenantId?: string } }>, reply) => {
      let tenantId: string;
      try {
        tenantId = getEffectiveTenantId(request, reply);
      } catch {
        return;
      }
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
        changes: { actor_role: (request as any).user.role, softDeleted: true }
      });

      return reply.send({ success: true, message: 'Vehicle soft-deleted successfully' });
    });

    // ==========================================
    // 5. ROUTES CRUD
    // ==========================================
    fastify.get('/routes', async (request: FastifyRequest<{ Querystring: { tenantId?: string } }>, reply) => {
      let tenantId: string;
      try {
        tenantId = getEffectiveTenantId(request, reply);
      } catch {
        return;
      }
      const list = Array.from(routesMap.values()).filter(r => r.tenantId === tenantId && !r.isDeleted);
      return reply.send({ items: list, total: list.length, page: 1, limit: 20 });
    });

    fastify.post('/routes', async (request: FastifyRequest<{ Body: { name: string; origin?: string; destination?: string; stops?: string[]; driver_id?: string; vehicle_id?: string; tenantId?: string } }>, reply) => {
      let tenantId: string;
      try {
        tenantId = getEffectiveTenantId(request, reply);
      } catch {
        return;
      }
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
        changes: { actor_role: (request as any).user.role, record: routeRecord }
      });

      return reply.status(201).send(routeRecord);
    });

    fastify.patch('/routes/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: any; Querystring: { tenantId?: string } }>, reply) => {
      let tenantId: string;
      try {
        tenantId = getEffectiveTenantId(request, reply);
      } catch {
        return;
      }
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
        changes: { actor_role: (request as any).user.role, previous: existing, updated }
      });

      return reply.send(updated);
    });

    fastify.delete('/routes/:id', async (request: FastifyRequest<{ Params: { id: string }; Querystring: { tenantId?: string } }>, reply) => {
      let tenantId: string;
      try {
        tenantId = getEffectiveTenantId(request, reply);
      } catch {
        return;
      }
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
        changes: { actor_role: (request as any).user.role, softDeleted: true }
      });

      return reply.send({ success: true, message: 'Route soft-deleted successfully' });
    });

    // 6. Services & Events
    fastify.get('/services', async (request: FastifyRequest<{ Querystring: { tenantId?: string } }>, reply) => {
      let tenantId: string;
      try {
        tenantId = getEffectiveTenantId(request, reply);
      } catch {
        return;
      }
      const services = [
        { id: 'srv-101', tenantId, routeName: 'مسیر ۱ - ونک به سعادت‌آباد', driverName: 'علی رضایی', driverPhone: '09121112233', totalStudents: 18, pickedUp: 18, droppedOff: 16, status: 'IN_PROGRESS' },
        { id: 'srv-102', tenantId, routeName: 'مسیر ۲ - پاسداران به نیاوران', driverName: 'حسین حسینی', driverPhone: '09123334455', totalStudents: 15, pickedUp: 15, droppedOff: 15, status: 'COMPLETED' },
      ];
      return reply.send({ items: services, total: 8, page: 1, limit: 10 });
    });

    fastify.get('/events', async (request: FastifyRequest<{ Querystring: { date?: string; tenantId?: string } }>, reply) => {
      let tenantId: string;
      try {
        tenantId = getEffectiveTenantId(request, reply);
      } catch {
        return;
      }
      const date = request.query.date || '2026-08-27';

      const items = [
        { id: 'evt-1', tenantId, studentName: 'امیرعلی رضایی', eventType: 'BOARDED', time: '07:15', route: 'مسیر ۱', driver: 'علی رضایی' },
        { id: 'evt-2', tenantId, studentName: 'سارا محمدی', eventType: 'DROPPED_OFF', time: '07:45', route: 'مسیر ۱', driver: 'علی رضایی' }
      ];
      return reply.send({ items, hourlyDistribution: { '07:00': 42, '13:00': 35 }, totalEvents: 140 });
    });

    fastify.get('/audit-logs', async (request: FastifyRequest<{ Querystring: { tenantId?: string } }>, reply) => {
      let tenantId: string;
      try {
        tenantId = getEffectiveTenantId(request, reply);
      } catch {
        return;
      }
      const logs = await auditService.getLogs({ tenantId, page: 1, limit: 50 });
      return reply.send(logs);
    });

    fastify.get('/notification-logs', async (request: FastifyRequest<{ Querystring: { tenantId?: string } }>, reply) => {
      let tenantId: string;
      try {
        tenantId = getEffectiveTenantId(request, reply);
      } catch {
        return;
      }
      const items = [
        { id: 'notif-1', tenantId, title: 'وضعیت سرویس', message: 'دانش‌آموز سوار سرویس شد', recipientPhone: '09123456789', status: 'DELIVERED', sentAt: new Date() }
      ];
      return reply.send({ items, total: items.length });
    });

    // 7. Bulk Export CSV Endpoint (Bot #45)
    fastify.get('/export/:entity', async (request: FastifyRequest<{ Params: { entity: string }; Querystring: { tenantId?: string } }>, reply) => {
      let tenantId: string;
      try {
        tenantId = getEffectiveTenantId(request, reply);
      } catch {
        return;
      }
      const { entity } = request.params;

      let csv = '\uFEFF'; // UTF-8 BOM for Excel Persian compatibility

      if (entity === 'students') {
        const list = Array.from(activeStudentsMap.values()).filter(s => s.tenantId === tenantId && !s.isDeleted);
        csv += 'شناسه,نام,نام خانوادگی,کد ملی,پایه,وضعیت\n';
        for (const s of list) {
          csv += `"${s.id}","${s.firstName}","${s.lastName}","${s.nationalCode}","${s.grade}","${s.status}"\n`;
        }
      } else if (entity === 'parents') {
        const list = Array.from(activeParentsMap.values()).filter(p => p.tenantId === tenantId && !p.isDeleted);
        csv += 'شناسه,نام ولی,شماره همراه,ایمیل,تعداد فرزندان,وضعیت\n';
        for (const p of list) {
          csv += `"${p.id}","${p.fullName}","${p.phone}","${p.email}","${p.childrenCount || 1}","${p.status}"\n`;
        }
      } else if (entity === 'drivers') {
        const list = Array.from(activeDriversMap.values()).filter(d => d.tenantId === tenantId && !d.isDeleted);
        csv += 'شناسه,نام راننده,شماره همراه,شماره گواهینامه,وضعیت\n';
        for (const d of list) {
          csv += `"${d.id}","${d.fullName}","${d.phone}","${d.licenseNo}","${d.status}"\n`;
        }
      } else if (entity === 'vehicles') {
        const list = Array.from(vehiclesMap.values()).filter(v => v.tenantId === tenantId && !v.isDeleted);
        csv += 'شناسه,پلاک انتظامی,مدل خودرو,ظرفیت,وضعیت\n';
        for (const v of list) {
          csv += `"${v.id}","${v.plate}","${v.model}","${v.capacity}","${v.status}"\n`;
        }
      } else if (entity === 'routes') {
        const list = Array.from(routesMap.values()).filter(r => r.tenantId === tenantId && !r.isDeleted);
        csv += 'شناسه,نام مسیر,مبداء,مقصد,تعداد ایستگاه‌ها,وضعیت\n';
        for (const r of list) {
          csv += `"${r.id}","${r.name}","${r.origin}","${r.destination}","${r.stopsCount || 0}","${r.status}"\n`;
        }
      } else {
        return reply.status(400).send({ error: 'BAD_REQUEST', message: 'Invalid export entity' });
      }

      await auditService.log({
        tenantId,
        userId: (request as any).user.userId,
        action: 'EXPORT',
        resourceType: entity.toUpperCase(),
        resourceId: 'ALL',
        changes: { actor_role: (request as any).user.role, export_format: 'CSV' }
      });

      reply.header('Content-Type', 'text/csv; charset=utf-8');
      reply.header('Content-Disposition', `attachment; filename="${entity}-${tenantId}-${Date.now()}.csv"`);
      return reply.send(Buffer.from(csv, 'utf-8'));
    });
  };
}
