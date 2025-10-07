# ADR 0001: Migration to Domain-Driven Design Architecture

**Status:** Accepted
**Date:** 2025-01-07
**Decision Makers:** Development Team
**Related Issues:** feature/domain-driven-refactor branch

## Context

NeoForge started as a simple full-stack starter kit with traditional CRUD operations and SQLModel-based data access patterns. As the project evolved to support more complex business logic, event-driven workflows, and enterprise features (AI workflows, personalization, multi-tenancy), the limitations of the CRUD pattern became apparent:

1. **Business Logic Scattered**: Domain logic spread across CRUD operations, API endpoints, and service layers
2. **Tight Coupling**: Direct database model dependencies in API layers made testing and changes difficult
3. **Scalability Concerns**: Growing feature set required better separation of concerns
4. **Maintainability**: No clear boundaries between layers led to circular dependencies
5. **Testing Complexity**: Difficult to unit test business logic without database dependencies

## Decision

We will migrate the backend architecture from traditional CRUD patterns to **Domain-Driven Design (DDD)** with the following structure:

```
backend/app/
├── domain/              # Pure business logic (no infrastructure dependencies)
│   ├── entities/        # Business entities with identity
│   ├── value_objects/   # Immutable domain concepts
│   ├── repositories/    # Repository interfaces (ports)
│   ├── events/          # Domain events
│   └── services/        # Domain services (complex business logic)
│
├── application/         # Use cases and application logic
│   ├── commands/        # Write operations (CQRS pattern)
│   ├── queries/         # Read operations (CQRS pattern)
│   ├── use_cases/       # Orchestration of domain operations
│   └── event_handlers/  # Async event processing
│
├── infrastructure/      # External concerns (adapters)
│   ├── repositories/    # Concrete repository implementations
│   ├── database/        # SQLModel models, migrations
│   ├── external/        # Third-party integrations
│   └── messaging/       # Event bus, queues
│
└── interfaces/          # API layer
    ├── api/             # FastAPI endpoints
    ├── dto/             # Data Transfer Objects
    └── middleware/      # HTTP middleware
```

### Key Principles

1. **Dependency Inversion**: Domain layer depends on nothing; infrastructure depends on domain
2. **CQRS Pattern**: Separate read (queries) from write (commands) operations
3. **Repository Pattern**: Abstract data access behind interfaces
4. **Event-Driven**: Domain events for loose coupling between bounded contexts
5. **Immutable Value Objects**: Encapsulate business rules in value objects

## Consequences

### Positive

1. **Testability**: Domain logic can be unit tested without database/framework dependencies
2. **Maintainability**: Clear separation makes changes predictable and localized
3. **Scalability**: Easier to extract bounded contexts into microservices later
4. **Flexibility**: Can swap infrastructure (database, queue) without changing business logic
5. **Team Alignment**: DDD provides shared language between developers and domain experts

### Negative

1. **Complexity**: More layers and abstractions than simple CRUD
2. **Learning Curve**: Team must understand DDD concepts and patterns
3. **Boilerplate**: More files and interfaces to maintain
4. **Migration Effort**: Significant refactoring required for existing code
5. **Overkill Risk**: May be excessive for simple CRUD operations

### Migration Strategy

**Phase 1: Coexistence** (Current State)
- Both CRUD and DDD patterns exist simultaneously
- New features built with DDD patterns
- Critical paths migrated first (auth, users, core entities)
- Legacy CRUD marked with deprecation warnings

**Phase 2: Gradual Migration**
- Identify bounded contexts and aggregate roots
- Migrate feature-by-feature to DDD
- Maintain backward compatibility in API layer
- Comprehensive testing at each step

**Phase 3: Legacy Removal**
- Remove deprecated CRUD layer
- Consolidate patterns across codebase
- Update all documentation and examples
- Version bump to indicate breaking changes

### When to Use Each Pattern

**Use DDD when:**
- Complex business rules and workflows
- Multiple bounded contexts with clear boundaries
- Rich domain model with behavior, not just data
- Event-driven interactions between components
- Long-term maintainability is critical

**Use Simple CRUD when:**
- Pure CRUD operations with minimal business logic
- Reporting and analytics queries
- Admin panels and simple data management
- Prototyping and MVPs where speed matters
- Clear one-to-one mapping between API and database

## Implementation Notes

### Repository Pattern Example

```python
# Domain layer: Interface only
class UserRepository(Protocol):
    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        ...
    async def save(self, user: User) -> None:
        ...

# Infrastructure layer: Concrete implementation
class SQLModelUserRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        db_user = await self._session.get(UserModel, user_id)
        return User.from_orm(db_user) if db_user else None
```

### Command/Query Pattern Example

```python
# Application layer: Command
@dataclass
class CreateUserCommand:
    email: str
    password: str
    full_name: str

class CreateUserHandler:
    def __init__(self, user_repo: UserRepository, event_bus: EventBus):
        self._repo = user_repo
        self._events = event_bus

    async def handle(self, cmd: CreateUserCommand) -> User:
        user = User.create(email=cmd.email, password=cmd.password)
        await self._repo.save(user)
        await self._events.publish(UserCreatedEvent(user_id=user.id))
        return user
```

## References

- [Domain-Driven Design by Eric Evans](https://www.domainlanguage.com/ddd/)
- [Implementing Domain-Driven Design by Vaughn Vernon](https://vaughnvernon.com/)
- [CQRS Pattern Documentation](https://martinfowler.com/bliki/CQRS.html)
- [Clean Architecture by Robert Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

## Review Schedule

This decision should be reviewed after completing the migration (estimated Q2 2025) to assess:
- Developer productivity impact
- Code maintainability improvements
- Performance characteristics
- Team satisfaction and understanding
