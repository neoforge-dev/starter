# Runbook: Queue Depth High

## Summary
Background job queue depth is above threshold, risking latency/SLA violations.

## Detection
- Prometheus alert: Queue depth high
- Dashboard: Celery/RQ queue metrics

## Immediate Actions
1. Identify offending queues and task types.
2. Check worker health, concurrency, and rate limiting.
3. Verify external dependencies (email provider, DB contention).

## Diagnostics
- Worker error rates and retries
- Long-running tasks and timeouts
- Recent deployment/config changes

## Mitigations
- Temporarily increase workers/concurrency
- Deprioritize non-critical tasks
- Apply backpressure controls

## Resolution
- Optimize hotspots, add idempotency, tune timeouts/retries
- Add SLOs and autoscaling policies

## Postmortem
- Capture RCA, corrective actions, and follow-ups
