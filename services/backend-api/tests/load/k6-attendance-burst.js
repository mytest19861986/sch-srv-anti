import http from 'k6/http';
import { check, sleep } from 'k6';

// Scenario 1: Morning Burst (500 EPS -> 1000 EPS -> 2000 EPS -> 5000 EPS)
export const options = {
  stages: [
    { duration: '30s', target: 50 },    // Ramp up to 500 EPS
    { duration: '1m', target: 100 },    // Ramp up to 1000 EPS
    { duration: '1m', target: 200 },    // Ramp up to 2000 EPS
    { duration: '1m', target: 500 },    // Peak Burst: 5000 EPS
    { duration: '30s', target: 0 },     // Cool down
  ],
  thresholds: {
    'http_req_duration{type:attendance_write}': ['p(99)<50'], // Target P99 < 50ms
    'http_req_failed': ['rate<0.001'],                         // Target error < 0.1%
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';
const DRIVER_TOKEN = __ENV.DRIVER_TOKEN || '';

export default function () {
  const isDuplicate = Math.random() < 0.10; // 10% idempotent replay
  const eventId = isDuplicate ? '00000000-0000-0000-0000-000000000001' : `evt-${__VU}-${__ITER}-${Date.now()}`;

  const payload = JSON.stringify({
    student_id: `student-${__VU}`,
    service_id: 'service-rush-1',
    event_type: 'PICKED_UP',
    client_generated_id: eventId,
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
    'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'latency is under 50ms': (r) => r.timings.duration < 50,
  });

  sleep(0.01);
}
