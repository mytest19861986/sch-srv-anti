/**
 * Production Monitoring Alert Thresholds & Capacity Scaling Triggers
 * Reference: docs/CAPACITY_PLAN.md & docs/PERFORMANCE_REVIEW.md
 * Phase 16: Evidence-Based Capacity Planning & Performance Review (Order #12)
 */

export interface MetricAlertRule {
  id: string;
  name: string;
  category: 'LATENCY' | 'THROUGHPUT' | 'RESOURCE' | 'QUEUE' | 'STORAGE';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  metricName: string;
  threshold: number;
  unit: string;
  evaluationWindowSeconds: number;
  scalingActionRequired: boolean;
  description: string;
}

export const CAPACITY_ALERT_THRESHOLDS: MetricAlertRule[] = [
  // 1. Latency Alerts
  {
    id: 'ALERT-LAT-001',
    name: 'Driver Ingestion API High P99 Latency',
    category: 'LATENCY',
    severity: 'WARNING',
    metricName: 'http_request_duration_ms_p99{route="/api/v1/attendance/events"}',
    threshold: 150,
    unit: 'ms',
    evaluationWindowSeconds: 300, // 5 minutes
    scalingActionRequired: true,
    description: 'Trigger HPA Scale-Out for backend API pods when P99 latency exceeds 150ms for 5 minutes.'
  },
  {
    id: 'ALERT-LAT-002',
    name: 'Parent App Status API Critical Latency',
    category: 'LATENCY',
    severity: 'CRITICAL',
    metricName: 'http_request_duration_ms_p99{route="/api/v1/parent/children/:id/status"}',
    threshold: 300,
    unit: 'ms',
    evaluationWindowSeconds: 180,
    scalingActionRequired: true,
    description: 'Alert on degraded Parent Read path. Route traffic to PostgreSQL Read Replica.'
  },

  // 2. Resource Utilization Alerts
  {
    id: 'ALERT-RES-001',
    name: 'API Pod High CPU Saturation',
    category: 'RESOURCE',
    severity: 'WARNING',
    metricName: 'container_cpu_usage_percentage',
    threshold: 70,
    unit: '%',
    evaluationWindowSeconds: 300,
    scalingActionRequired: true,
    description: 'Trigger horizontal container auto-scaling when CPU usage exceeds 70%.'
  },
  {
    id: 'ALERT-RES-002',
    name: 'DB Connection Pool Saturation',
    category: 'RESOURCE',
    severity: 'CRITICAL',
    metricName: 'db_connection_pool_utilization_ratio',
    threshold: 0.85,
    unit: 'ratio',
    evaluationWindowSeconds: 60,
    scalingActionRequired: false,
    description: 'Alert when active connections exceed 85% of pool capacity. Investigate long-running transactions.'
  },

  // 3. Queue & Worker Alerts
  {
    id: 'ALERT-QUE-001',
    name: 'Outbox Queue High Backlog Lag',
    category: 'QUEUE',
    severity: 'WARNING',
    metricName: 'outbox_pending_events_count',
    threshold: 5000,
    unit: 'events',
    evaluationWindowSeconds: 120,
    scalingActionRequired: true,
    description: 'Trigger horizontal scale-out of Outbox Worker pods when pending backlog exceeds 5,000 events.'
  },
  {
    id: 'ALERT-QUE-002',
    name: 'Oldest Pending Event SLA Breach',
    category: 'QUEUE',
    severity: 'CRITICAL',
    metricName: 'outbox_oldest_event_age_seconds',
    threshold: 60,
    unit: 'seconds',
    evaluationWindowSeconds: 60,
    scalingActionRequired: true,
    description: 'Alert when any pending notification waits longer than 60s in the outbox queue.'
  },
  {
    id: 'ALERT-QUE-003',
    name: 'Queue Throughput Transition Trigger',
    category: 'QUEUE',
    severity: 'WARNING',
    metricName: 'outbox_ingestion_rate_eps',
    threshold: 2000,
    unit: 'EPS',
    evaluationWindowSeconds: 600,
    scalingActionRequired: false,
    description: 'Saturation threshold for PostgreSQL SKIP LOCKED. Initiate migration plan to Redis BullMQ / Kafka.'
  },

  // 4. Storage & Partitioning Alerts
  {
    id: 'ALERT-STO-001',
    name: 'Attendance Events Table Partitioning Trigger',
    category: 'STORAGE',
    severity: 'WARNING',
    metricName: 'db_table_records_count{table="attendance_events"}',
    threshold: 20000000, // 20 Million Records
    unit: 'records',
    evaluationWindowSeconds: 3600,
    scalingActionRequired: false,
    description: 'Trigger execution of Zero-Downtime Monthly Time-based Partitioning migration.'
  },
  {
    id: 'ALERT-STO-002',
    name: 'Database Storage Growth 6-Month Capacity Threshold',
    category: 'STORAGE',
    severity: 'WARNING',
    metricName: 'db_disk_usage_projected_6m_ratio',
    threshold: 0.80,
    unit: 'ratio',
    evaluationWindowSeconds: 86400,
    scalingActionRequired: false,
    description: 'Alert storage engineering team when database disk growth trajectory exceeds 80% of projected volume.'
  }
];

export function evaluateMetricAlert(metricName: string, currentValue: number): MetricAlertRule | null {
  const rule = CAPACITY_ALERT_THRESHOLDS.find(r => r.metricName === metricName);
  if (!rule) return null;
  if (currentValue >= rule.threshold) {
    return rule;
  }
  return null;
}
