import http from 'k6/http';
import { check, sleep } from 'k6';

// Scenario 3: Worker Backpressure & Decoupling Validation
// Worker is intentionally slowed down with 2s synthetic delay, verifying driver write API remains fast.
export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 150 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'http_req_duration{type:attendance_write}': ['p(99)<50'], // Must remain under 50ms despite worker backlog
    'http_req_failed': ['rate<0.001'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';
const DRIVER_TOKEN = __ENV.DRIVER_TOKEN || '';

export default function () {
  const payload = JSON.stringify({
    student_id: `student-backpressure-${__VU}`,
    service_id: 'service-backpressure-1',
    event_type: 'PICKED_UP',
    client_generated_id: `bp-${__VU}-${__ITER}-${Date.now()}-${Math.random()}`,
    client_timestamp: new Date().toISOString(),
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DRIVER_TOKEN}`,
    },
    tags: { type: 'attendance_write' },
  };

  const res = http.post(`${BASE_URL}/api/v1/attendance/events`, payload, params);

  check(res, {
    'driver write is unaffected by worker delay': (r) => r.status === 201 && r.timings.duration < 50,
  });

  sleep(0.02);
}
