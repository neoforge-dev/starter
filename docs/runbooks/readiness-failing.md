# Runbook: Readiness Failing

## Summary
Readiness probes failing; traffic should not be routed to unhealthy pods.

## Detection
- Prometheus alert: Readiness failing
- Orchestrator: pods not ready

## Immediate Actions
1. Confirm `/ready` semantics vs `/health` (readiness must check dependencies).
2. Inspect logs around startup and dependency init.
3. Pause rollouts; route traffic away from failing pods.

## Diagnostics
- DB/Redis connectivity and latency
- Migrations status
- Queue backlogs impacting readiness

## Mitigations
- Increase probe timeout/initialDelay if needed
- Scale dependencies or reduce connection pools
- Temporarily relax non-critical checks in readiness endpoint

## Resolution
- Fix underlying dependency or readiness logic; add tests

## Postmortem
- Document failure mode and prevention steps
