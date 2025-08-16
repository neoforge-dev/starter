# Runbook: High 5xx Rate

## Summary
Service is returning elevated 5xx responses indicating server-side errors.

## Detection
- Prometheus alert: High 5xx rate
- Dashboard panel: 5xx per route

## Immediate Actions
1. Check recent deploys and error logs with `request_id` correlation.
2. Inspect hotspot routes and upstream dependencies.
3. Roll back last deploy if spike aligns with release.

## Diagnostics
- Verify DB/Redis health and timeouts
- Review recent config changes and feature flags
- Check error traces if OTLP is enabled

## Mitigations
- Temporarily scale replicas
- Disable new features via flags
- Apply targeted hotfix if root cause known

## Resolution
- Implement fix with tests
- Add regression guardrails (alerts/tests)

## Postmortem
- Record root cause, impact, fix
- Add action items and owners
