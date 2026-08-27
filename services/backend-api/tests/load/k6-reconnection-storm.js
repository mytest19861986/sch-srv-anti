import http from 'k6/http';
import { check, sleep } from 'k6';

// Scenario 2: Reconnection Storm (10,000 drivers replaying 50 offline events each)
export const options = {
  scenarios: {
    reconnection_storm: {
      executor: 'ramping-arrival-rate',
      startRate: 50,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 500,
      stages: [
        { duration: '30s', target: 200 },   // Initial wave
        { duration: '1m', target: 1000 },   // Massive reconnection storm
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    'http_req_duration{type:batch_sync}': ['p(95)<200'],
    'http_req_failed': ['rate<0.05'], // Max 5% failure under storm with graceful 429/503
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';
const DRIVER_TOKEN = __ENV.DRIVER_TOKEN || '';

export default function () {
  const events = [];
  for (let i = 0; i < 50; i++) {
    events.push({
      client_generated_id: `offline-${__VU}-${__ITER}-${i}`,
      student_id: `student-${i}`,
      service_id: 'service-storm-1',
      event_type: 'PICKED_UP',
      client_timestamp: new Date(Date.now() - (50 - i) * 60000).toISOString(),
    });
  }

  const payload = JSON.stringify({
    device_id: `handset-${__VU}`,
    events: events,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DRIVER_TOKEN}`,
    },
    tags: { type: 'batch_sync' },
  };

  const res = http.post(`${BASE_URL}/api/v1/sync/batch`, payload, params);

  check(res, {
    'sync processed or rate limited': (r) => [200, 201, 429, 503].includes(r.status),
  });

  sleep(0.1);
}
