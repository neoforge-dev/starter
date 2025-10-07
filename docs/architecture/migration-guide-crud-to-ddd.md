# Migration Guide: CRUD to Domain-Driven Design

**Target Audience:** Developers working with NeoForge backend code
**Prerequisites:** Understanding of FastAPI, SQLModel, and basic DDD concepts
**Related:** [ADR 0001: DDD Migration](/docs/architecture/decisions/0001-domain-driven-design-migration.md)

## Overview

This guide helps you migrate existing CRUD-based code to the new Domain-Driven Design (DDD) architecture. Both patterns currently coexist in the codebase, but we're gradually moving all features to DDD.

## Quick Reference: Pattern Comparison

| Concern | Legacy CRUD | New DDD |
|---------|-------------|---------|
| **Data Models** | `/app/models/` (SQLModel) | `/app/domain/entities/` (Pure Python) |
| **Database Access** | `/app/crud/` (Direct DB) | `/app/infrastructure/repositories/` (Abstracted) |
| **Business Logic** | Scattered across CRUD/API | `/app/domain/services/` (Centralized) |
| **API Endpoints** | `/app/api/endpoints/` | `/app/interfaces/api/v1/` |
| **Data Transfer** | `/app/schemas/` (Pydantic) | `/app/interfaces/dto/` (DTOs) |
| **Operations** | CRUD functions | `/app/application/commands/` + `/queries/` |

## Migration Steps

### Step 1: Identify the Bounded Context

**Before migrating**, understand what you're building:

```python
# Questions to ask:
# - What business capability does this represent?
# - What are the core entities and their relationships?
# - What business rules must be enforced?
# - What events should be published?
```

**Example:** Migrating User management

- **Bounded Context:** User Management
- **Entities:** User (aggregate root), UserProfile (entity)
- **Value Objects:** Email, Password, UserRole
- **Business Rules:** Email uniqueness, password strength, role-based permissions
- **Events:** UserCreated, UserActivated, UserDeactivated

### Step 2: Create Domain Entities

Transform SQLModel models into domain entities.

**Legacy (CRUD):**
```python
# app/models/user.py
from sqlmodel import SQLModel, Field

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

**New (DDD):**
```python
# app/domain/entities/user.py
from dataclasses import dataclass
from uuid import UUID, uuid4
from datetime import datetime
from app.domain.value_objects.email import Email
from app.domain.value_objects.password import HashedPassword
from app.domain.events.user_events import UserCreated

@dataclass
class User:
    """User aggregate root - manages user identity and authentication."""

    id: UUID
    email: Email
    hashed_password: HashedPassword
    is_active: bool
    created_at: datetime
    _domain_events: list = field(default_factory=list)

    @classmethod
    def create(cls, email: str, password: str) -> "User":
        """Factory method for creating new users with business rules."""
        user = cls(
            id=uuid4(),
            email=Email(email),  # Value object validates email format
            hashed_password=HashedPassword.from_plain(password),
            is_active=False,  # Requires email verification
            created_at=datetime.utcnow(),
        )
        user._domain_events.append(UserCreated(user_id=user.id, email=str(user.email)))
        return user

    def activate(self) -> None:
        """Business method: activate user after email verification."""
        if self.is_active:
            raise ValueError("User already active")
        self.is_active = True
        self._domain_events.append(UserActivated(user_id=self.id))

    def change_password(self, new_password: str) -> None:
        """Business method: change user password with validation."""
        self.hashed_password = HashedPassword.from_plain(new_password)
        self._domain_events.append(UserPasswordChanged(user_id=self.id))
```

**Key Changes:**
- No database concerns (no SQLModel inheritance)
- Business logic embedded in entity methods
- Value objects enforce invariants
- Domain events track state changes
- Factory methods for complex creation logic

### Step 3: Create Value Objects

Extract validation logic into immutable value objects.

```python
# app/domain/value_objects/email.py
from dataclasses import dataclass
import re

@dataclass(frozen=True)
class Email:
    """Email value object with built-in validation."""

    value: str

    def __post_init__(self):
        if not self._is_valid(self.value):
            raise ValueError(f"Invalid email format: {self.value}")

    @staticmethod
    def _is_valid(email: str) -> bool:
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None

    def __str__(self) -> str:
        return self.value
```

```python
# app/domain/value_objects/password.py
from dataclasses import dataclass
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@dataclass(frozen=True)
class HashedPassword:
    """Password value object handling hashing and verification."""

    value: str

    @classmethod
    def from_plain(cls, plain_password: str) -> "HashedPassword":
        """Create from plain text password with strength validation."""
        if len(plain_password) < 8:
            raise ValueError("Password must be at least 8 characters")
        # Add more validation: uppercase, lowercase, numbers, special chars
        return cls(value=pwd_context.hash(plain_password))

    def verify(self, plain_password: str) -> bool:
        """Verify plain password against hashed value."""
        return pwd_context.verify(plain_password, self.value)
```

### Step 4: Define Repository Interface

Create repository interface in the domain layer (no implementation details).

```python
# app/domain/repositories/user_repository.py
from typing import Protocol, Optional
from uuid import UUID
from app.domain.entities.user import User
from app.domain.value_objects.email import Email

class UserRepository(Protocol):
    """Repository interface for User aggregate.

    Implementation details are in infrastructure layer.
    """

    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        """Retrieve user by ID."""
        ...

    async def get_by_email(self, email: Email) -> Optional[User]:
        """Retrieve user by email address."""
        ...

    async def save(self, user: User) -> None:
        """Persist user (insert or update)."""
        ...

    async def delete(self, user_id: UUID) -> None:
        """Remove user from persistence."""
        ...

    async def list_active(self, skip: int = 0, limit: int = 100) -> list[User]:
        """List active users with pagination."""
        ...
```

### Step 5: Implement Repository

Create concrete implementation in infrastructure layer.

```python
# app/infrastructure/repositories/sqlmodel_user_repository.py
from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.domain.entities.user import User
from app.domain.value_objects.email import Email
from app.infrastructure.database.models.user_model import UserModel

class SQLModelUserRepository:
    """SQLModel implementation of UserRepository."""

    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        db_user = await self._session.get(UserModel, user_id)
        return self._to_entity(db_user) if db_user else None

    async def get_by_email(self, email: Email) -> Optional[User]:
        stmt = select(UserModel).where(UserModel.email == str(email))
        result = await self._session.execute(stmt)
        db_user = result.scalar_one_or_none()
        return self._to_entity(db_user) if db_user else None

    async def save(self, user: User) -> None:
        db_user = await self._session.get(UserModel, user.id)
        if db_user:
            # Update existing
            db_user.email = str(user.email)
            db_user.hashed_password = user.hashed_password.value
            db_user.is_active = user.is_active
        else:
            # Insert new
            db_user = UserModel(
                id=user.id,
                email=str(user.email),
                hashed_password=user.hashed_password.value,
                is_active=user.is_active,
                created_at=user.created_at,
            )
            self._session.add(db_user)
        await self._session.commit()

    def _to_entity(self, db_user: UserModel) -> User:
        """Convert database model to domain entity."""
        return User(
            id=db_user.id,
            email=Email(db_user.email),
            hashed_password=HashedPassword(db_user.hashed_password),
            is_active=db_user.is_active,
            created_at=db_user.created_at,
        )
```

```python
# app/infrastructure/database/models/user_model.py
from sqlmodel import SQLModel, Field
from uuid import UUID
from datetime import datetime

class UserModel(SQLModel, table=True):
    """Database model for users table.

    Note: This is infrastructure concern, not domain entity.
    """
    __tablename__ = "users"

    id: UUID = Field(primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

### Step 6: Create Commands and Queries

Use CQRS pattern to separate write (commands) from read (queries) operations.

**Commands (Write Operations):**
```python
# app/application/commands/create_user_command.py
from dataclasses import dataclass
from uuid import UUID
from app.domain.repositories.user_repository import UserRepository
from app.domain.entities.user import User
from app.application.events.event_bus import EventBus

@dataclass
class CreateUserCommand:
    """Command to create a new user."""
    email: str
    password: str
    full_name: str

class CreateUserHandler:
    """Handler for CreateUserCommand."""

    def __init__(self, user_repo: UserRepository, event_bus: EventBus):
        self._repo = user_repo
        self._events = event_bus

    async def handle(self, cmd: CreateUserCommand) -> UUID:
        """Execute command and return user ID."""
        # Business logic validation
        existing = await self._repo.get_by_email(Email(cmd.email))
        if existing:
            raise ValueError(f"Email already registered: {cmd.email}")

        # Create entity using domain factory
        user = User.create(email=cmd.email, password=cmd.password)

        # Persist
        await self._repo.save(user)

        # Publish domain events
        for event in user._domain_events:
            await self._events.publish(event)

        return user.id
```

**Queries (Read Operations):**
```python
# app/application/queries/get_user_query.py
from dataclasses import dataclass
from uuid import UUID
from typing import Optional
from app.domain.repositories.user_repository import UserRepository
from app.interfaces.dto.user_dto import UserDTO

@dataclass
class GetUserQuery:
    """Query to retrieve user by ID."""
    user_id: UUID

class GetUserHandler:
    """Handler for GetUserQuery."""

    def __init__(self, user_repo: UserRepository):
        self._repo = user_repo

    async def handle(self, query: GetUserQuery) -> Optional[UserDTO]:
        """Execute query and return DTO."""
        user = await self._repo.get_by_id(query.user_id)
        if not user:
            return None

        # Convert to DTO for API response
        return UserDTO(
            id=user.id,
            email=str(user.email),
            is_active=user.is_active,
            created_at=user.created_at,
        )
```

### Step 7: Update API Endpoints

Refactor endpoints to use commands/queries instead of CRUD.

**Legacy (CRUD):**
```python
# app/api/endpoints/users.py
from fastapi import APIRouter, Depends
from app.crud.user import crud_user
from app.schemas.user import UserCreate, UserResponse

router = APIRouter()

@router.post("/users", response_model=UserResponse)
async def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    user = crud_user.create(db, obj_in=user_in)
    return user
```

**New (DDD):**
```python
# app/interfaces/api/v1/users.py
from fastapi import APIRouter, Depends, status
from uuid import UUID
from app.application.commands.create_user_command import CreateUserCommand, CreateUserHandler
from app.application.queries.get_user_query import GetUserQuery, GetUserHandler
from app.interfaces.dto.user_dto import CreateUserRequest, UserResponse
from app.interfaces.dependencies import get_command_handler, get_query_handler

router = APIRouter(prefix="/api/v1/users", tags=["users"])

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    request: CreateUserRequest,
    handler: CreateUserHandler = Depends(get_command_handler(CreateUserHandler)),
):
    """Create a new user account."""
    command = CreateUserCommand(
        email=request.email,
        password=request.password,
        full_name=request.full_name,
    )
    user_id = await handler.handle(command)

    # Fetch created user for response
    query_handler = Depends(get_query_handler(GetUserHandler))
    user = await query_handler.handle(GetUserQuery(user_id=user_id))
    return user

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    handler: GetUserHandler = Depends(get_query_handler(GetUserHandler)),
):
    """Retrieve user by ID."""
    user = await handler.handle(GetUserQuery(user_id=user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

### Step 8: Set Up Dependency Injection

Configure FastAPI dependencies for handlers and repositories.

```python
# app/interfaces/dependencies.py
from typing import Type, TypeVar, Callable
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.infrastructure.database.session import get_db_session
from app.infrastructure.repositories.sqlmodel_user_repository import SQLModelUserRepository
from app.application.events.event_bus import EventBus

T = TypeVar('T')

def get_user_repository(session: AsyncSession = Depends(get_db_session)):
    """Provide UserRepository implementation."""
    return SQLModelUserRepository(session)

def get_event_bus():
    """Provide EventBus instance (could be Redis, RabbitMQ, etc.)."""
    return EventBus()

def get_command_handler(handler_cls: Type[T]) -> Callable:
    """Generic dependency for command handlers."""
    def _get_handler(
        user_repo=Depends(get_user_repository),
        event_bus=Depends(get_event_bus),
    ) -> T:
        return handler_cls(user_repo=user_repo, event_bus=event_bus)
    return _get_handler

def get_query_handler(handler_cls: Type[T]) -> Callable:
    """Generic dependency for query handlers."""
    def _get_handler(user_repo=Depends(get_user_repository)) -> T:
        return handler_cls(user_repo=user_repo)
    return _get_handler
```

## Testing Strategy

### Unit Testing Domain Logic

```python
# tests/unit/domain/test_user.py
import pytest
from app.domain.entities.user import User
from app.domain.value_objects.email import Email

def test_create_user_with_valid_data():
    user = User.create(email="test@example.com", password="SecurePass123!")
    assert user.email == Email("test@example.com")
    assert not user.is_active  # Requires verification
    assert len(user._domain_events) == 1  # UserCreated event

def test_create_user_with_invalid_email():
    with pytest.raises(ValueError, match="Invalid email format"):
        User.create(email="invalid-email", password="SecurePass123!")

def test_activate_user():
    user = User.create(email="test@example.com", password="SecurePass123!")
    user.activate()
    assert user.is_active
    assert len(user._domain_events) == 2  # UserCreated + UserActivated
```

### Integration Testing with Repository

```python
# tests/integration/infrastructure/test_user_repository.py
import pytest
from app.infrastructure.repositories.sqlmodel_user_repository import SQLModelUserRepository
from app.domain.entities.user import User
from app.domain.value_objects.email import Email

@pytest.mark.asyncio
async def test_save_and_retrieve_user(db_session):
    repo = SQLModelUserRepository(db_session)

    # Create and save
    user = User.create(email="test@example.com", password="SecurePass123!")
    await repo.save(user)

    # Retrieve
    retrieved = await repo.get_by_id(user.id)
    assert retrieved is not None
    assert retrieved.email == user.email
    assert retrieved.id == user.id
```

### API Testing

```python
# tests/api/test_users_api.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_user_endpoint(client: AsyncClient):
    response = await client.post(
        "/api/v1/users/",
        json={
            "email": "newuser@example.com",
            "password": "SecurePass123!",
            "full_name": "Test User",
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert "id" in data
```

## Common Pitfalls

### 1. Domain Logic in Infrastructure
❌ **Wrong:**
```python
class SQLModelUserRepository:
    async def save(self, user: User) -> None:
        # DON'T: Business logic in repository
        if not user.email:
            raise ValueError("Email required")
        # ...
```

✅ **Correct:**
```python
class User:
    def __post_init__(self):
        # Business logic in entity
        if not self.email:
            raise ValueError("Email required")
```

### 2. Exposing Domain Entities in API
❌ **Wrong:**
```python
@router.get("/users/{id}", response_model=User)  # DON'T: Expose domain entity
async def get_user(id: UUID): ...
```

✅ **Correct:**
```python
@router.get("/users/{id}", response_model=UserDTO)  # DO: Use DTO
async def get_user(id: UUID): ...
```

### 3. Direct Database Access in Domain
❌ **Wrong:**
```python
class User:
    async def deactivate(self, db: Session):
        # DON'T: Database dependency in domain
        self.is_active = False
        db.commit()
```

✅ **Correct:**
```python
class User:
    def deactivate(self) -> None:
        # DO: Pure business logic
        self.is_active = False
        self._domain_events.append(UserDeactivated(user_id=self.id))
```

## Checklist: CRUD → DDD Migration

- [ ] Identify bounded context and aggregate roots
- [ ] Create domain entities (pure Python, no SQLModel)
- [ ] Extract value objects with validation
- [ ] Define repository interface in domain layer
- [ ] Implement repository in infrastructure layer
- [ ] Create database models (separate from entities)
- [ ] Write commands for write operations
- [ ] Write queries for read operations
- [ ] Update API endpoints to use commands/queries
- [ ] Set up dependency injection
- [ ] Add unit tests for domain logic
- [ ] Add integration tests for repositories
- [ ] Add API tests for endpoints
- [ ] Update documentation
- [ ] Mark legacy CRUD as deprecated
- [ ] Plan for legacy code removal

## Need Help?

- Review [ADR 0001](/docs/architecture/decisions/0001-domain-driven-design-migration.md) for architectural decisions
- Check [DDD Pattern Examples](/docs/architecture/ddd-patterns.md) for more code samples
- See [Testing Strategy](/docs/testing/strategy.md) for comprehensive test guidance
- Join discussions in GitHub issues tagged with `architecture`

## Next Steps

Once you've migrated your feature:
1. Update feature documentation to reference new patterns
2. Add deprecation warnings to legacy CRUD code
3. Submit PR with migration checklist completed
4. Share learnings with team for continuous improvement
