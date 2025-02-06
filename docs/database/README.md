# 🗃 Database Schema

```mermaid
erDiagram
    USERS ||--o{ ORDERS : places
    USERS {
        string email
        datetime created_at
    }
```

## Migration Guide
- SQLite → PostgreSQL 