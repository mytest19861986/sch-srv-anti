export interface Student {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  grade: string;
  schoolId?: string;
}

export interface Parent {
  id: string;
  tenantId: string;
  userId: string;
  phoneNumber: string;
  fcmToken?: string;
}

export interface Driver {
  id: string;
  tenantId: string;
  userId: string;
  vehicleId?: string;
  licenseNumber: string;
}

export interface Route {
  id: string;
  tenantId: string;
  name: string;
  direction: 'TO_SCHOOL' | 'FROM_SCHOOL';
}

export interface Shift {
  id: string;
  tenantId: string;
  serviceId: string;
  startTime: Date;
  endTime?: Date;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED';
}

export interface DriverManifestItem {
  student_id: string;
  first_name: string;
  last_name: string;
  grade: string;
  attendance_status: string;
  parent_phones: string[];
  contact_phone?: string;
  reported_absent?: boolean;
  absence_reason?: string;
}

export interface AbsenceReport {
  id: string;
  tenantId: string;
  childId: string;
  parentId: string;
  date: string;
  reason?: string;
  createdAt: Date;
  readByDriver?: boolean;
}

export class InMemoryDomainRepository {
  students = new Map<string, Student>();
  parents = new Map<string, Parent>();
  studentParents = new Set<string>(); // "tenantId:studentId:parentId"
  drivers = new Map<string, Driver>();
  routes = new Map<string, Route>();
  services = new Map<string, any>();
  shifts = new Map<string, Shift>();
  driverShiftAssignments = new Map<string, any>(); // "tenantId:driverId:shiftId"
  routeStudentAssignments = new Map<string, any>(); // "tenantId:routeId:studentId"
  absenceReports = new Map<string, AbsenceReport>();

  // Students
  async createStudent(student: Student): Promise<Student> {
    this.students.set(student.id, student);
    return student;
  }

  async getStudent(tenantId: string, studentId: string): Promise<Student | null> {
    const s = this.students.get(studentId);
    if (s && s.tenantId === tenantId) return s;
    return null;
  }

  async getStudentsByTenant(tenantId: string): Promise<Student[]> {
    return Array.from(this.students.values()).filter(s => s.tenantId === tenantId);
  }

  // Parents
  async createParent(parent: Parent): Promise<Parent> {
    this.parents.set(parent.id, parent);
    return parent;
  }

  async findParentByUserId(tenantId: string, userId: string): Promise<Parent | null> {
    for (const p of this.parents.values()) {
      if (p.tenantId === tenantId && p.userId === userId) {
        return p;
      }
    }
    return null;
  }

  async linkStudentParent(tenantId: string, studentId: string, parentId: string): Promise<void> {
    this.studentParents.add(`${tenantId}:${studentId}:${parentId}`);
  }

  async getParentsForStudent(tenantId: string, studentId: string): Promise<Parent[]> {
    const parentIds: string[] = [];
    for (const key of this.studentParents) {
      const [tId, sId, pId] = key.split(':');
      if (tId === tenantId && sId === studentId) {
        parentIds.push(pId);
      }
    }
    return parentIds.map(id => this.parents.get(id)!).filter(Boolean);
  }

  async getChildrenForParent(tenantId: string, parentId: string): Promise<Student[]> {
    const studentIds: string[] = [];
    for (const key of this.studentParents) {
      const [tId, sId, pId] = key.split(':');
      if (tId === tenantId && pId === parentId) {
        studentIds.push(sId);
      }
    }
    return studentIds.map(id => this.students.get(id)!).filter(Boolean);
  }

  async isParentOfStudent(tenantId: string, parentId: string, studentId: string): Promise<boolean> {
    return this.studentParents.has(`${tenantId}:${studentId}:${parentId}`);
  }

  // Drivers
  async createDriver(driver: Driver): Promise<Driver> {
    this.drivers.set(driver.id, driver);
    return driver;
  }

  async findDriverByUserId(tenantId: string, userId: string): Promise<Driver | null> {
    for (const d of this.drivers.values()) {
      if (d.tenantId === tenantId && d.userId === userId) {
        return d;
      }
    }
    return null;
  }

  // Routes
  async createRoute(route: Route): Promise<Route> {
    this.routes.set(route.id, route);
    return route;
  }

  // Services & Shifts
  async createService(service: any): Promise<any> {
    this.services.set(service.id, service);
    return service;
  }

  async createShift(shift: Shift): Promise<Shift> {
    this.shifts.set(shift.id, shift);
    return shift;
  }

  async getShift(tenantId: string, shiftId: string): Promise<Shift | null> {
    const shift = this.shifts.get(shiftId);
    if (shift && shift.tenantId === tenantId) {
      return shift;
    }
    return null;
  }

  // Assignments
  async assignDriverToShift(tenantId: string, driverId: string, shiftId: string): Promise<void> {
    this.driverShiftAssignments.set(`${tenantId}:${driverId}:${shiftId}`, {
      tenantId,
      driverId,
      shiftId
    });
  }

  async isDriverAssignedToShift(tenantId: string, driverId: string, shiftId: string): Promise<boolean> {
    return this.driverShiftAssignments.has(`${tenantId}:${driverId}:${shiftId}`);
  }

  async findShiftsForDriver(tenantId: string, driverUserId: string): Promise<Shift[]> {
    const driver = await this.findDriverByUserId(tenantId, driverUserId);
    if (!driver) return [];
    const shifts: Shift[] = [];
    for (const key of this.driverShiftAssignments.keys()) {
      const [tId, dId, sId] = key.split(':');
      if (tId === tenantId && dId === driver.id) {
        const shift = this.shifts.get(sId);
        if (shift) shifts.push(shift);
      }
    }
    return shifts;
  }

  async assignStudentToRoute(tenantId: string, routeId: string, studentId: string): Promise<void> {
    this.routeStudentAssignments.set(`${tenantId}:${routeId}:${studentId}`, {
      tenantId,
      routeId,
      studentId
    });
  }

  async getStudentsForRoute(tenantId: string, routeId: string): Promise<Student[]> {
    const students: Student[] = [];
    for (const key of this.routeStudentAssignments.keys()) {
      const [tId, rId, sId] = key.split(':');
      if (tId === tenantId && rId === routeId) {
        const student = this.students.get(sId);
        if (student && student.tenantId === tenantId) {
          students.push(student);
        }
      }
    }
    return students;
  }

  // Absence Reports (P1-2)
  async recordAbsenceReport(report: AbsenceReport): Promise<AbsenceReport> {
    this.absenceReports.set(`${report.tenantId}:${report.childId}:${report.date}`, report);
    return report;
  }

  isStudentReportedAbsent(tenantId: string, childId: string, date: string): boolean {
    return this.absenceReports.has(`${tenantId}:${childId}:${date}`);
  }

  // Driver Manifest Query
  async getDriverManifest(
    tenantId: string,
    driverUserId: string,
    shiftId: string,
    attendanceEvents: any[]
  ): Promise<{ shift: Shift; route: Route; students: DriverManifestItem[] }> {
    const driver = await this.findDriverByUserId(tenantId, driverUserId);
    if (!driver) {
      throw new Error('DRIVER_NOT_FOUND');
    }

    const shift = await this.getShift(tenantId, shiftId);
    if (!shift) {
      throw new Error('SHIFT_NOT_FOUND');
    }

    const isAssigned = await this.isDriverAssignedToShift(tenantId, driver.id, shiftId);
    if (!isAssigned) {
      throw new Error('DRIVER_NOT_ASSIGNED_TO_SHIFT');
    }

    const service = this.services.get(shift.serviceId);
    if (!service || service.tenantId !== tenantId) {
      throw new Error('SERVICE_NOT_FOUND');
    }

    const route = this.routes.get(service.routeId);
    if (!route || route.tenantId !== tenantId) {
      throw new Error('ROUTE_NOT_FOUND');
    }

    const assignedStudents = await this.getStudentsForRoute(tenantId, route.id);

    const todayDateStr = new Date().toISOString().split('T')[0];
    const manifestStudents: DriverManifestItem[] = [];
    for (const s of assignedStudents) {
      const parents = await this.getParentsForStudent(tenantId, s.id);
      
      const latestEvent = attendanceEvents
        .filter(e => e.tenantId === tenantId && e.studentId === s.id && e.serviceId === service.id)
        .sort((a, b) => new Date(b.clientTimestamp).getTime() - new Date(a.clientTimestamp).getTime())[0];

      const isReportedAbsent = this.isStudentReportedAbsent(tenantId, s.id, todayDateStr);
      const primaryPhone = parents[0]?.phoneNumber || '09121234567';

      manifestStudents.push({
        student_id: s.id,
        first_name: s.firstName,
        last_name: s.lastName,
        grade: s.grade,
        attendance_status: latestEvent ? latestEvent.eventType : (isReportedAbsent ? 'ABSENT' : 'NOT_MARKED'),
        parent_phones: parents.map(p => p.phoneNumber),
        contact_phone: primaryPhone,
        reported_absent: isReportedAbsent,
        absence_reason: isReportedAbsent ? 'اعلام عدم حضور توسط والد' : undefined
      });
    }

    return {
      shift,
      route,
      students: manifestStudents
    };
  }

  clear() {
    this.students.clear();
    this.parents.clear();
    this.studentParents.clear();
    this.drivers.clear();
    this.routes.clear();
    this.services.clear();
    this.shifts.clear();
    this.driverShiftAssignments.clear();
    this.routeStudentAssignments.clear();
  }
}
