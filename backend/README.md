# NeoForge Backend API

An ultramodern FastAPI backend optimized for bootstrapped founders. Built with UV, Ruff, and modern Python practices.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/neoforge/backend
cd backend

# Create and activate environment using UV
curl -LsSf https://astral.sh/uv/install.sh | sh
uv venv
source .venv/bin/activate

# Install dependencies
uv pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run development server
uvicorn app.main:app --reload
```

Visit `http://localhost:8000/docs` for interactive API documentation.

## 🧪 Running Tests

All tests are designed to run inside Docker containers to ensure consistent environments and proper isolation.

### Initialize Test Environment

```bash
# Initialize the test environment (builds containers, creates test database)
./scripts/init_test_env.sh
```

### Run Tests with Make

```bash
# Run all tests
make test

# Run specific test suites
make test-db     # Database tests
make test-api    # API tests
make test-core   # Core module tests

# Run tests with coverage report
make test-coverage

# Rebuild containers and run tests
make rebuild-test

# Create/recreate test database and run tests
make test-with-db

# Fix PostgreSQL collation issues and run tests
make fix-collation
```

### Run Tests Directly

```bash
# Run all tests with verbose output
docker compose -f docker-compose.dev.yml run --rm api pytest -v

# Run specific tests
docker compose -f docker-compose.dev.yml run --rm api pytest tests/api/test_users.py -v

# Run tests with specific markers
docker compose -f docker-compose.dev.yml run --rm api pytest -m "not db" -v

# Run tests with coverage report
docker compose -f docker-compose.dev.yml run --rm api pytest --cov --cov-report=html -v
```

## 🏗 Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── v1/             # API v1 endpoints
│   │   ├── deps.py         # Dependencies
│   │   └── router.py       # Main router
│   ├── core/
│   │   ├── config.py       # Settings
│   │   ├── security.py     # Security utilities
│   │   └── logging.py      # Logging setup
│   ├── db/
│   │   ├── base.py         # Database setup
│   │   └── session.py      # Session management
│   ├── models/             # SQLModel models
│   ├── schemas/            # Pydantic schemas
│   ├── services/           # Business logic
│   └── main.py            # Application entry
├── tests/
│   ├── conftest.py         # Test configuration
│   ├── factories/          # Test factories
│   └── api/                # API tests
├── pyproject.toml          # Python config
├── requirements.txt        # Production deps
└── requirements-dev.txt    # Development deps
```

## ⚙️ Development Setup

### Environment Variables

```env
# .env
DATABASE_URL=sqlite:///./app.db    # Use SQLite for development
ENVIRONMENT=development
DEBUG=true
SECRET_KEY=your-secret-key
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/api/test_users.py
```

### Code Quality

```bash
# Format and lint with Ruff
ruff check .
ruff format .

# Type checking
mypy .
```

## 🔑 Key Features

### FastAPI Setup

```python
# app/main.py
from fastapi import FastAPI
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await db.connect()
    yield
    # Shutdown
    await db.disconnect()

app = FastAPI(lifespan=lifespan)
```

### Database Models

```python
# app/models/user.py
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

### API Routes

```python
# app/api/v1/users.py
from fastapi import APIRouter, Depends, HTTPException
from app.models import User
from app.schemas import UserCreate, UserRead

router = APIRouter()

@router.post("/users/", response_model=UserRead)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    if await user_exists(db, user.email):
        raise HTTPException(400, "Email already registered")
    return await create_user_in_db(db, user)
```

## 📈 Performance Optimization

### Caching Example

```python
# app/core/cache.py
from functools import wraps
from app.core.config import settings

def cache_response(ttl_seconds: int = 3600):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = f"{func.__name__}:{args}:{kwargs}"

            # Check cache
            if cached := await redis.get(cache_key):
                return json.loads(cached)

            # Get fresh data
            result = await func(*args, **kwargs)

            # Cache result
            await redis.set(cache_key, json.dumps(result), ex=ttl_seconds)
            return result
        return wrapper
    return decorator
```

### Database Optimization

```python
# app/db/session.py
from sqlmodel import create_engine
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30
)
```

## 🔒 Security Features

### Authentication

```python
# app/core/security.py
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def create_access_token(data: dict) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = data.copy()
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
```

### Rate Limiting

```python
# app/core/limiter.py
from fastapi import Request
from app.core.config import settings

async def rate_limit(request: Request):
    client_ip = request.client.host
    current = await redis.incr(f"rate_limit:{client_ip}")

    if current == 1:
        await redis.expire(f"rate_limit:{client_ip}", 60)
    elif current > settings.RATE_LIMIT:
        raise HTTPException(429, "Too many requests")
```

## 📝 API Documentation

Interactive API documentation is available at:

- Swagger UI: `/docs`
- ReDoc: `/redoc`

### Custom Documentation

```python
# app/main.py
app = FastAPI(
    title="NeoForge API",
    description="Modern FastAPI backend for bootstrapped founders",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)
```

## 🧪 Testing

### Test Setup

```python
# tests/conftest.py
import pytest
from app.core.config import settings
from sqlmodel import SQLModel

@pytest.fixture(autouse=True)
async def setup_db():
    SQLModel.metadata.create_all(engine)
    yield
    SQLModel.metadata.drop_all(engine)
```

### API Tests

```python
# tests/api/test_users.py
async def test_create_user(client, user_factory):
    user_data = user_factory.build()
    response = await client.post("/api/v1/users/", json=user_data)
    assert response.status_code == 201
    assert response.json()["email"] == user_data["email"]
```

## 🚀 Deployment

### Production Configuration

```python
# app/core/config.py
class Settings(BaseSettings):
    ENVIRONMENT: str
    DATABASE_URL: str
    REDIS_URL: Optional[str] = None
    SECRET_KEY: str
    DEBUG: bool = False

    class Config:
        env_file = ".env"
```

### Health Check

```python
# app/api/health.py
@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": settings.VERSION
    }
```

## 📊 Monitoring

See [Monitoring Guide](../monitoring.md) for detailed setup.

Basic metrics endpoint:

```python
# app/api/metrics.py
@router.get("/metrics")
async def metrics():
    return {
        "requests_total": await redis.get("metrics:requests_total"),
        "errors_total": await redis.get("metrics:errors_total"),
        "response_time_avg": await redis.get("metrics:response_time_avg")
    }
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

### Development Guidelines

- Use UV for dependency management
- Run Ruff before committing
- Add tests for new features
- Update documentation
- Follow conventional commits

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

Remember:

1. Start with SQLite for development
2. Use UV for all Python operations
3. Run Ruff before commits
4. Keep monitoring enabled
5. Test thoroughly
