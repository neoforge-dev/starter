# NeoForge Best Practices and Naming Conventions

## Table of Contents

- [Code Organization](#code-organization)
- [Naming Conventions](#naming-conventions)
- [Code Style](#code-style)
- [API Design](#api-design)
- [Frontend Practices](#frontend-practices)
- [Database Practices](#database-practices)
- [Testing Guidelines](#testing-guidelines)
- [Security Practices](#security-practices)
- [Performance Practices](#performance-practices)

## Modern Development Stack

### Key Principles

- Use UV for all Python package management
- Ruff for all linting and formatting
- Browser-native features over frameworks
- Debug-first development approach
- Resource-conscious deployment

### Project Structure

```
neoforge-project/
├── backend/
│   ├── api/                 # API endpoints
│   │   ├── v1/             # Version 1 endpoints
│   │   └── deps/           # Dependencies
│   ├── core/               # Core functionality
│   ├── models/             # Data models
│   └── services/           # Business logic
├── frontend/
│   ├── components/         # Reusable components
│   ├── pages/             # Route pages
│   ├── services/          # API services
│   └── utils/             # Utilities
└── deploy/                # Deployment configs
```

### Module Organization

```python
# Good: Organized imports
from typing import Optional, List
from fastapi import APIRouter, Depends
from sqlmodel import Session, select

# Bad: Unorganized imports
import fastapi
from typing import *
from sqlmodel import *
```

## Naming Conventions

### Python (Backend)

#### Variables and Functions

```python
# Variables: lowercase with underscores
user_count = 0
first_name = "John"

# Functions: lowercase with underscores
def get_user_by_id(user_id: int) -> User:
    pass

def calculate_total_price(items: List[Item]) -> float:
    pass
```

#### Classes and Models

```python
# Classes: PascalCase
class UserService:
    pass

# Models: PascalCase with clear purpose
class UserCreate(SQLModel):
    email: str
    password: str

class UserRead(SQLModel):
    id: int
    email: str
```

#### Constants

```python
# Constants: UPPERCASE with underscores
MAX_CONNECTIONS = 100
DEFAULT_TIMEOUT_SECONDS = 30
```

### TypeScript/JavaScript (Frontend)

#### Components

```typescript
// Components: PascalCase
@customElement('user-profile')
export class UserProfile extends LitElement {
    // ...
}

// Properties: camelCase
@property({ type: String })
firstName = '';
```

#### Files and Folders

```
components/
  UserProfile.ts          # Component files: PascalCase
  data-table.ts          # Web component files: kebab-case
services/
  userService.ts         # Service files: camelCase
  apiClient.ts
utils/
  formatters.ts          # Utility files: camelCase
  validators.ts
```

### Database

#### Tables

```sql
-- Tables: snake_case, plural
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL
);

-- Junction tables: combine both table names
CREATE TABLE user_organizations (
    user_id INTEGER REFERENCES users(id),
    organization_id INTEGER REFERENCES organizations(id)
);
```

#### Columns

```sql
-- Columns: snake_case
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    unit_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);
```

## Code Style

### Python Style

```python
# Use type hints
def process_user(user: User) -> dict:
    pass

# Use meaningful variable names
# Bad
def p(u):
    pass

# Good
def process_payment(user_transaction):
    pass

# Use docstrings for complex functions
def calculate_subscription_price(
    base_price: float,
    user_tier: str,
    months: int
) -> float:
    """
    Calculate subscription price with discounts.

    Args:
        base_price: Monthly base price
        user_tier: User's subscription tier
        months: Number of months

    Returns:
        Final price after discounts
    """
    pass
```

### TypeScript Style

```typescript
// Use interfaces for complex types
interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  timezone: string;
}

// Use proper typing
@property({ type: Array })
users: User[] = [];

// Use meaningful event names
this.dispatchEvent(new CustomEvent('user-selected', {
  detail: { userId: this.selectedId }
}));
```

## API Design

### Endpoint Naming

```python
# RESTful endpoint structure
@router.get("/users")                  # List users
@router.get("/users/{user_id}")        # Get user
@router.post("/users")                 # Create user
@router.put("/users/{user_id}")        # Update user
@router.delete("/users/{user_id}")     # Delete user

# Resource relationships
@router.get("/users/{user_id}/orders") # List user's orders
```

### Response Format

```python
# Consistent response structure
def standard_response(
    data: Optional[dict] = None,
    error: Optional[str] = None,
    meta: Optional[dict] = None
) -> dict:
    return {
        "data": data,
        "error": error,
        "meta": meta,
        "timestamp": datetime.utcnow().isoformat()
    }
```

## Frontend Practices

### Component Design

```typescript
// Single responsibility principle
@customElement('user-card')
export class UserCard extends LitElement {
    @property({ type: Object }) user!: User;

    // Encapsulated styles
    static styles = css`
        :host {
            display: block;
            padding: 1rem;
        }
    `;

    // Clean render method
    render() {
        return html`
            <div class="user-card">
                <h3>${this.user.name}</h3>
                <p>${this.user.email}</p>
            </div>
        `;
    }
}
```

### State Management

```typescript
// Use stores for shared state
export const userStore = createStore({
    state: {
        currentUser: null,
        preferences: {}
    },
    actions: {
        updatePreferences(prefs) {
            this.preferences = prefs;
        }
    }
});
```

## Database Practices

### Model Design

```python
# Use clear relationships
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)

    # Relationships
    orders: List["Order"] = Relationship(back_populates="user")

    # Audit fields
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default=None)
```

### Query Optimization

```python
# Use selective loading
async def get_user_summary(user_id: int):
    query = select(User).options(
        selectinload(User.orders)
    ).where(User.id == user_id)

    return await db.execute(query)
```

## Testing Guidelines

### Test Structure

```python
# Use descriptive test names
async def test_user_creation_with_valid_data_succeeds():
    user_data = {"email": "test@example.com", "name": "Test"}
    response = await client.post("/users", json=user_data)
    assert response.status_code == 201

# Group related tests
class TestUserAuthentication:
    async def test_login_with_valid_credentials(self):
        pass

    async def test_login_with_invalid_password(self):
        pass
```

### Test Data

```python
# Use factories for test data
class UserFactory(SQLModelFactory):
    class Meta:
        model = User

    email = Faker('email')
    name = Faker('name')
```

## Security Practices

### Authentication

```python
# Use proper token validation
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY)
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return await get_user(db, user_id)
```

### Data Validation

```python
# Use strict validation
class UserCreate(SQLModel):
    email: EmailStr
    password: str = Field(min_length=8)

    @validator('password')
    def validate_password(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain uppercase letter')
        return v
```

## Performance Practices

### Caching

```python
# Use proper cache keys
def get_cache_key(user_id: int, resource: str) -> str:
    return f"user:{user_id}:{resource}"

# Implement caching middleware
async def cache_response(
    resource: str,
    ttl: int = 3600,
    user_id: Optional[int] = None
):
    cache_key = get_cache_key(user_id, resource)
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)
```

### Query Optimization

```python
# Use database indexes effectively
class User(SQLModel, table=True):
    __table_args__ = (
        Index('idx_user_email_status', 'email', 'status'),
    )

    email: str
    status: str
```

Remember:

1. Consistency is key - follow conventions throughout the project
2. Code for maintainability - future you will thank you
3. Keep performance in mind from the start
4. Security is not an afterthought
5. Write tests as you code
6. Document significant decisions
