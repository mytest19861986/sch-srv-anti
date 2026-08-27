import { pgTable, serial, text, timestamp, varchar, jsonb, pgEnum, uuid, primaryKey, integer, date, index } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER', 'PARENT']);
export const eventTypeEnum = pgEnum('event_type', ['PICKED_UP', 'DROPPED_OFF']);
export const outboxStatusEnum = pgEnum('outbox_status', ['pending', 'processed', 'failed']);
export const routeDirectionEnum = pgEnum('route_direction', ['TO_SCHOOL', 'FROM_SCHOOL']);
export const shiftStatusEnum = pgEnum('shift_status', ['SCHEDULED', 'ACTIVE', 'COMPLETED']);
export const notificationStatusEnum = pgEnum('notification_status', ['sent', 'failed', 'pending']);
export const auditActionEnum = pgEnum('audit_action', ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'ROLE_CHANGE', 'SETTING_CHANGE']);

export const tenants = pgTable('tenants', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  isActive: varchar('is_active', { length: 10 }).default('true').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const users = pgTable('users', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull(),
  isActive: varchar('is_active', { length: 10 }).default('true').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const students = pgTable('students', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  grade: varchar('grade', { length: 50 }).notNull(),
  schoolId: varchar('school_id', { length: 64 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const parents = pgTable('parents', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id),
  userId: varchar('user_id', { length: 64 }).notNull().references(() => users.id),
  phoneNumber: varchar('phone_number', { length: 30 }).notNull(),
  fcmToken: text('fcm_token'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const studentParents = pgTable('student_parents', {
  studentId: varchar('student_id', { length: 64 }).notNull().references(() => students.id),
  parentId: varchar('parent_id', { length: 64 }).notNull().references(() => parents.id),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id)
}, (table) => ({
  pk: primaryKey({ columns: [table.studentId, table.parentId] })
}));

export const drivers = pgTable('drivers', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id),
  userId: varchar('user_id', { length: 64 }).notNull().references(() => users.id),
  vehicleId: varchar('vehicle_id', { length: 64 }),
  licenseNumber: varchar('license_number', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const routes = pgTable('routes', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull(),
  direction: routeDirectionEnum('direction').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const services = pgTable('services', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id),
  routeId: varchar('route_id', { length: 64 }).notNull().references(() => routes.id),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const shifts = pgTable('shifts', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id),
  serviceId: varchar('service_id', { length: 64 }).notNull().references(() => services.id),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }),
  status: shiftStatusEnum('status').default('SCHEDULED').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const driverShiftAssignments = pgTable('driver_shift_assignments', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id),
  driverId: varchar('driver_id', { length: 64 }).notNull().references(() => drivers.id),
  shiftId: varchar('shift_id', { length: 64 }).notNull().references(() => shifts.id),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull()
});

export const routeStudentAssignments = pgTable('route_student_assignments', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id),
  studentId: varchar('student_id', { length: 64 }).notNull().references(() => students.id),
  routeId: varchar('route_id', { length: 64 }).notNull().references(() => routes.id),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull()
});

export const attendanceEvents = pgTable('attendance_events', {
  id: serial('id').primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id),
  clientGeneratedId: varchar('client_generated_id', { length: 36 }).notNull().unique(),
  studentId: varchar('student_id', { length: 64 }).notNull(),
  serviceId: varchar('service_id', { length: 64 }).notNull(),
  eventType: eventTypeEnum('event_type').notNull(),
  clientTimestamp: timestamp('client_timestamp', { withTimezone: true }).notNull(),
  serverTimestamp: timestamp('server_timestamp', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const outboxEvents = pgTable('outbox_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull(),
  aggregateType: varchar('aggregate_type', { length: 64 }).notNull(),
  aggregateId: varchar('aggregate_id', { length: 64 }).notNull(),
  eventType: varchar('event_type', { length: 64 }).notNull(),
  payload: jsonb('payload').notNull(),
  status: outboxStatusEnum('status').default('pending').notNull(),
  retryCount: integer('retry_count').default(0).notNull(),
  maxRetries: integer('max_retries').default(5).notNull(),
  nextRetryAt: timestamp('next_retry_at', { withTimezone: true }).defaultNow().notNull(),
  lastError: text('last_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true })
});

export const syncMetadata = pgTable('sync_metadata', {
  deviceId: varchar('device_id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }).defaultNow().notNull(),
  pendingCount: integer('pending_count').default(0).notNull(),
  lastError: text('last_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const attendanceDailySummary = pgTable('attendance_daily_summary', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id),
  date: varchar('date', { length: 10 }).notNull(),
  shiftId: varchar('shift_id', { length: 64 }),
  serviceId: varchar('service_id', { length: 64 }).notNull().references(() => services.id),
  routeId: varchar('route_id', { length: 64 }),
  totalStudents: integer('total_students').default(0).notNull(),
  pickedUpCount: integer('picked_up_count').default(0).notNull(),
  droppedOffCount: integer('dropped_off_count').default(0).notNull(),
  pendingCount: integer('pending_count').default(0).notNull(),
  absentCount: integer('absent_count').default(0).notNull(),
  lastEventAt: timestamp('last_event_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  tenantDateShiftIdx: index('summary_tenant_date_shift_idx').on(table.tenantId, table.date, table.shiftId),
  tenantDateServiceIdx: index('summary_tenant_date_service_idx').on(table.tenantId, table.date, table.serviceId)
}));

export const notificationLog = pgTable('notification_log', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).notNull().references(() => tenants.id),
  parentId: varchar('parent_id', { length: 64 }).notNull().references(() => parents.id),
  studentId: varchar('student_id', { length: 64 }).notNull().references(() => students.id),
  eventId: varchar('event_id', { length: 64 }),
  notificationType: varchar('notification_type', { length: 64 }).default('PUSH').notNull(),
  status: notificationStatusEnum('status').default('sent').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  parentCreatedIdx: index('notif_parent_created_idx').on(table.tenantId, table.parentId, table.createdAt),
  studentCreatedIdx: index('notif_student_created_idx').on(table.tenantId, table.studentId, table.createdAt)
}));

export const auditLog = pgTable('audit_log', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }),
  userId: varchar('user_id', { length: 64 }).notNull(),
  action: auditActionEnum('action').notNull(),
  resourceType: varchar('resource_type', { length: 64 }).notNull(),
  resourceId: varchar('resource_id', { length: 64 }).notNull(),
  changes: jsonb('changes'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  tenantCreatedIdx: index('audit_tenant_created_idx').on(table.tenantId, table.createdAt),
  userCreatedIdx: index('audit_user_created_idx').on(table.userId, table.createdAt),
  actionCreatedIdx: index('audit_action_created_idx').on(table.action, table.createdAt)
}));

export const platformSettings = pgTable('platform_settings', {
  key: varchar('key', { length: 128 }).primaryKey(),
  value: jsonb('value').notNull(),
  description: text('description'),
  updatedBy: varchar('updated_by', { length: 64 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});
