export const loadTestConfig = {
  baseline: {
    virtualUsers: 20,
    durationSeconds: 5,
    targetRps: 100
  },
  peakSurge: {
    virtualUsers: 50,
    durationSeconds: 10,
    targetRps: 500
  },
  thresholds: {
    p95LatencyMs: 100,
    maxErrorPercentage: 0.1
  }
};
