# API Pattern Comparison: Legacy CRUD vs DDD

**Status:** Both patterns coexist during migration period
**Deprecation Timeline:** Legacy CRUD patterns will be removed in v2.0.0 (Q2 2025)
**Recommendation:** Use DDD patterns for all new development

## Quick Decision Guide

Use **DDD Patterns** for:
- ✅ All new features and modules
- ✅ Complex business logic
- ✅ Event-driven workflows
- ✅ Long-term production code

Use **Legacy CRUD** only for:
- ⚠️ Maintaining existing legacy code
- ⚠️ Quick prototypes (migrate before production)

**DO NOT** use Legacy CRUD for new development.

## Key Differences

| Aspect | Legacy CRUD (Deprecated) | DDD (Current Standard) |
|--------|-------------------------|------------------------|
| **Location** | `/app/crud/`, `/app/schemas/` | `/app/domain/`, `/app/application/` |
| **Business Logic** | Scattered across layers | Centralized in domain entities |
| **Data Access** | Direct database calls | Repository pattern (abstracted) |
| **Testing** | Requires database | Unit testable without database |
| **Events** | Not supported | Domain events built-in |
| **Scalability** | Monolithic | Easy microservice extraction |
| **Status** | ⚠️ Deprecated (v2.0.0) | ✅ Active standard |

## Example Comparison

### Legacy Pattern (Deprecated)

```python
# app/crud/user.py - Business logic in CRUD layer
class CRUDUser:
    def create(self, db: Session, obj_in: UserCreate) -> User:
        db_obj = User(email=obj_in.email, ...)
        db.add(db_obj)
        db.commit()
        return db_obj

# app/api/endpoints/users.py - Validation in API layer
@router.post("/users", deprecated=True)
async def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    if crud_user.get_by_email(db, email=user_in.email):
        raise HTTPException(400, "Email exists")
    return crud_user.create(db, obj_in=user_in)
```

Problems: Business logic scattered, tight database coupling, hard to test.

### DDD Pattern (Recommended)

```python
# app/domain/entities/user.py - Business logic in entity
@dataclass
class User:
    id: UUID
    email: Email  # Value object with validation
    hashed_password: HashedPassword

    @classmethod
    def create(cls, email: str, password: str) -> "User":
        return cls(
            id=uuid4(),
            email=Email(email),  # Validates format
            hashed_password=HashedPassword.from_plain(password),
        )

# app/application/commands/create_user_command.py
class CreateUserHandler:
    async def handle(self, cmd: CreateUserCommand) -> UUID:
        if await self._repo.get_by_email(Email(cmd.email)):
            raise ValueError("Email exists")
        user = User.create(cmd.email, cmd.password)
        await self._repo.save(user)
        return user.id

# app/interfaces/api/v1/users.py - Thin API layer
@router.post("/api/v1/users")
async def create_user(
    request: CreateUserRequest,
    handler: CreateUserHandler = Depends(...)
):
    return await handler.handle(CreateUserCommand(**request.dict()))
```

Benefits: Testable domain logic, clear separation, repository abstraction.

## Migration Checklist

- [ ] Review [Migration Guide](/docs/architecture/migration-guide-crud-to-ddd.md)
- [ ] Create domain entities (no SQLModel inheritance)
- [ ] Extract value objects with validation
- [ ] Define repository interface (domain layer)
- [ ] Implement repository (infrastructure layer)
- [ ] Write commands/queries (application layer)
- [ ] Update API endpoints to use handlers
- [ ] Add unit tests for domain logic
- [ ] Mark legacy code as deprecated
- [ ] Update documentation

## Resources

- [Migration Guide](/docs/architecture/migration-guide-crud-to-ddd.md) - Step-by-step migration instructions
- [ADR 0001](/docs/architecture/decisions/0001-domain-driven-design-migration.md) - Architecture decision record
- [DDD Best Practices](/docs/architecture/ddd-best-practices.md) - Patterns and examples

## Deprecation Notice

All legacy CRUD patterns (`/app/crud/`, `/app/schemas/`, `/app/api/endpoints/`) are deprecated and will be removed in **v2.0.0 (Q2 2025)**.

Update your code to use DDD patterns immediately. See the migration guide for detailed instructions.
