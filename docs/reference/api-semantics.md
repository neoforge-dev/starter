# API Semantics: Pagination, ETag, Idempotency

## Pagination
- All list endpoints return a standard shape:
```json
{
  "items": [ ... ],
  "total": 123,
  "page": 1,
  "page_size": 10,
  "pages": 13
}
```
- Query params: `page` (default 1), `page_size` (default 10)
- Requesting pages beyond `pages` yields `items: []` with same `total` and `pages` semantics.

## ETag Caching
- Endpoints support weak ETag headers for GET responses.
- Use `If-None-Match` to allow 304 Not Modified responses.
- Currently enabled for:
  - `GET /api/v1/projects` (list)
  - `GET /api/v1/projects/{id}` (single)
  - `GET /api/v1/support/tickets` (list)
  - `GET /api/v1/community/posts` (list)

Example flow:
1. Client GETs a resource; server returns `ETag: W/"<sha256>"`.
2. Client re-GETs with `If-None-Match: W/"<sha256>"`.
3. Server returns `304 Not Modified` if content unchanged.

## Idempotency
- For non-GET requests, clients should send `Idempotency-Key` header.
- Server stores responses keyed by (method, path, request hash) and will return the stored response when the same request is retried.
- Implemented on:
  - `POST /api/v1/projects`, `PATCH /api/v1/projects/{id}`
  - `POST /api/v1/support/tickets`
  - `POST /api/v1/community/posts`

Notes:
- Idempotency keys should be unique per logical operation.
- The frontend `apiService` automatically attaches an idempotency key for non-GET requests when not provided.

## Status Endpoints
- `GET /api/v1/status` aggregates recent events to compute overall status.
- `GET /api/v1/status/services/{id}` returns latest status for the specific service.

---

For dynamic configuration (API base URL, CORS origins, security toggles), see `GET /api/v1/config` and the frontend `dynamic-config` integration.
