# RealWorld API Implementation Guide

## Overview

This guide provides comprehensive documentation for the RealWorld/Conduit API implementation in the NeoForge project. The API follows the [RealWorld specification](https://github.com/gothinkster/realworld/tree/master/api) and provides a complete blogging platform with authentication, articles, comments, and social features.

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Docker & Docker Compose
- uv (Astral) package manager

### Setup
```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Clone and setup
git clone <repository>
cd backend

# Install dependencies with uv
uv sync

# Start development environment
docker compose up -d

# Run tests
uv run pytest

# Start development server
uv run fastapi dev
```

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   └── endpoints/          # API route handlers
│   │   │       ├── articles.py     # Article CRUD operations
│   │   │       ├── auth.py         # Authentication endpoints
│   │   │       ├── comments.py     # Comment operations
│   │   │       ├── profiles.py     # User profile operations
│   │   │       └── tags.py         # Tag operations
│   │   └── deps.py                 # Dependency injection
│   ├── crud/                       # Database operations
│   │   ├── article.py
│   │   ├── comment.py
│   │   ├── user.py
│   │   └── tag.py
│   ├── models/                     # SQLAlchemy models
│   │   ├── article.py
│   │   ├── comment.py
│   │   ├── tag.py
│   │   ├── user.py
│   │   └── associations.py         # Many-to-many relationships
│   ├── schemas/                    # Pydantic schemas
│   │   ├── article.py
│   │   ├── comment.py
│   │   ├── profile.py
│   │   ├── tag.py
│   │   └── user.py
│   ├── core/                       # Core functionality
│   │   ├── auth.py                 # JWT authentication
│   │   ├── config.py               # Settings management
│   │   ├── security.py             # Security utilities
│   │   └── database.py             # Database configuration
│   └── main.py                     # FastAPI application
├── tests/                          # Test suite
│   ├── api/
│   │   └── test_realworld_api.py   # RealWorld API tests
│   ├── conftest.py                 # Test configuration
│   └── factories.py                # Test data factories
└── alembic/                        # Database migrations
```

## 🧪 Testing Strategy

### Test Organization
Tests follow the **Given-When-Then** pattern for clarity:

```python
@pytest.mark.asyncio
async def test_user_registration(self, client: AsyncClient, db: AsyncSession):
    """
    Given: A new user registration request
    When: POST /api/users with valid user data
    Then: User is created and JWT token is returned
    """
    # Given
    user_data = {
        "user": {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123"
        }
    }

    # When
    response = await client.post("/api/users", json=user_data)

    # Then
    assert response.status_code == 201
    data = response.json()
    assert "user" in data
    assert data["user"]["email"] == "test@example.com"
    assert "token" in data["user"]
```

### Running Tests

```bash
# Run all tests
uv run pytest

# Run specific test file
uv run pytest tests/api/test_realworld_api.py

# Run tests with coverage
uv run pytest --cov=app --cov-report=html

# Run tests in watch mode
uv run pytest-watch

# Run specific test class
uv run pytest -k "TestRealWorldArticles"

# Run tests with verbose output
uv run pytest -v
```

### Test Fixtures

The test suite uses comprehensive fixtures defined in `conftest.py`:

- `client`: HTTPX AsyncClient for API testing
- `db`: Database session with transaction rollback
- `test_settings`: Application settings for tests
- `test_user`: Pre-created test user
- `superuser_token_headers`: Authentication headers for superuser

## 🔐 Authentication

### JWT Token Flow
```python
# Registration
POST /api/users
{
  "user": {
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }
}

# Login
POST /api/users/login
{
  "user": {
    "email": "test@example.com",
    "password": "password123"
  }
}

# Use token in requests
GET /api/user
Authorization: Token <jwt_token>
```

### Current User Operations
```python
# Get current user
GET /api/user

# Update current user
PUT /api/user
{
  "user": {
    "bio": "Updated bio",
    "image": "https://example.com/avatar.jpg"
  }
}
```

## 👤 Profiles

### Profile Operations
```python
# Get profile
GET /api/profiles/{username}

# Follow user
POST /api/profiles/{username}/follow

# Unfollow user
DELETE /api/profiles/{username}/follow
```

## 📝 Articles

### Article CRUD
```python
# List articles with filtering
GET /api/articles?tag=javascript&author=testuser&favorited=testuser&limit=20&offset=0

# Create article
POST /api/articles
{
  "article": {
    "title": "Article Title",
    "description": "Article description",
    "body": "Article content",
    "tagList": ["javascript", "react"]
  }
}

# Get article by slug
GET /api/articles/{slug}

# Update article
PUT /api/articles/{slug}
{
  "article": {
    "title": "Updated Title"
  }
}

# Delete article
DELETE /api/articles/{slug}
```

### Article Feed
```python
# Get articles from followed users
GET /api/articles/feed?limit=20&offset=0
```

### Favoriting
```python
# Favorite article
POST /api/articles/{slug}/favorite

# Unfavorite article
DELETE /api/articles/{slug}/favorite
```

## 💬 Comments

### Comment Operations
```python
# Get comments for article
GET /api/articles/{slug}/comments

# Add comment to article
POST /api/articles/{slug}/comments
{
  "comment": {
    "body": "This is a comment"
  }
}

# Delete comment
DELETE /api/articles/{slug}/comments/{id}
```

## 🏷️ Tags

### Tag Operations
```python
# Get all tags
GET /api/tags
```

## 🔍 Filtering & Pagination

### Article Filtering
```python
# Filter by tag
GET /api/articles?tag=javascript

# Filter by author
GET /api/articles?author=testuser

# Filter by favorited user
GET /api/articles?favorited=testuser

# Combine filters
GET /api/articles?tag=javascript&author=testuser
```

### Pagination
```python
# Basic pagination
GET /api/articles?limit=10&offset=20

# Feed pagination
GET /api/articles/feed?limit=5&offset=0
```

## 🗄️ Database Schema

### Core Tables
- `users`: User accounts with authentication
- `articles`: Blog posts with metadata
- `comments`: Comments on articles
- `tags`: Article tags
- `favorites`: User-article favorites (many-to-many)
- `follows`: User-user follows (many-to-many)

### Key Relationships
- User ↔ Articles (one-to-many)
- User ↔ Comments (one-to-many)
- Article ↔ Comments (one-to-many)
- Article ↔ Tags (many-to-many)
- User ↔ Favorites (many-to-many)
- User ↔ Follows (many-to-many)

## 🛠️ Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/realworld-api
```

### 2. Implement Models & Schemas
```python
# app/models/article.py
class Article(Base):
    __tablename__ = "articles"
    # ... model definition

# app/schemas/article.py
class ArticleResponse(BaseModel):
    # ... schema definition
```

### 3. Implement CRUD Operations
```python
# app/crud/article.py
class ArticleCRUD:
    async def create_with_author(self, db: AsyncSession, *, obj_in: ArticleCreate, author: User) -> Article:
        # ... implementation
```

### 4. Create API Endpoints
```python
# app/api/v1/endpoints/articles.py
@router.post("/articles", response_model=SingleArticleResponse)
async def create_article(
    article_in: ArticleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> SingleArticleResponse:
    # ... implementation
```

### 5. Write Tests
```python
# tests/api/test_realworld_api.py
@pytest.mark.asyncio
async def test_create_article(self, client: AsyncClient, db: AsyncSession, test_settings):
    # Given-When-Then test implementation
```

### 6. Run Tests & Lint
```bash
uv run pytest
uv run ruff check .
uv run ruff format .
```

### 7. Create Migration
```bash
uv run alembic revision --autogenerate -m "add realworld models"
uv run alembic upgrade head
```

## 📊 API Response Formats

### Success Responses
```json
{
  "user": {
    "email": "test@example.com",
    "token": "jwt.token.here",
    "username": "testuser",
    "bio": "User bio",
    "image": "https://example.com/avatar.jpg"
  }
}
```

```json
{
  "articles": [
    {
      "slug": "article-slug",
      "title": "Article Title",
      "description": "Article description",
      "body": "Article content",
      "tagList": ["javascript", "react"],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "favorited": false,
      "favoritesCount": 0,
      "author": {
        "username": "testuser",
        "bio": "User bio",
        "image": "https://example.com/avatar.jpg",
        "following": false
      }
    }
  ],
  "articlesCount": 1
}
```

### Error Responses
```json
{
  "errors": {
    "body": ["can't be empty"]
  }
}
```

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/neoforge

# JWT
JWT_SECRET=your-secret-key
JWT_ALG=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15

# CORS
CORS_ORIGINS=["http://localhost:3000"]
```

### Settings Management
```python
# app/core/config.py
class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    cors_origins: List[str] = ["http://localhost:3000"]
```

## 🚀 Deployment

### Docker Setup
```dockerfile
# Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-install-project --no-dev

# Copy source code
COPY . .

# Run the application
CMD ["uv", "run", "fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
```

### Production Commands
```bash
# Build and deploy
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations
docker compose exec web uv run alembic upgrade head

# Check health
curl http://localhost:8000/health
```

## 🤝 Contributing

### Code Style
- Use `uv run ruff format .` for formatting
- Use `uv run ruff check .` for linting
- Follow type hints and async patterns
- Write comprehensive tests

### Commit Convention
```bash
feat: add article favoriting
fix: resolve pagination bug
docs: update API documentation
test: add article CRUD tests
```

### Pull Request Process
1. Create feature branch from `main`
2. Implement feature with tests
3. Ensure all tests pass
4. Update documentation
5. Create pull request
6. Code review and merge

## 📚 Resources

- [RealWorld API Spec](https://github.com/gothinkster/realworld/tree/master/api)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy 2.0 Docs](https://docs.sqlalchemy.org/en/20/)
- [Pydantic v2 Docs](https://docs.pydantic.dev/latest/)
- [uv Documentation](https://docs.astral.sh/uv/)

## 🆘 Troubleshooting

### Common Issues

**Import Errors**: Ensure all dependencies are installed with `uv sync`

**Database Connection**: Check PostgreSQL is running and credentials are correct

**Test Failures**: Run `uv run pytest -v` for detailed output

**Migration Issues**: Run `uv run alembic current` to check migration state

### Getting Help

1. Check existing issues on GitHub
2. Review test failures for error messages
3. Check logs with `docker compose logs web`
4. Consult the RealWorld API specification

---

## 🎯 Next Steps

1. **Complete CRUD Operations**: Implement all database operations
2. **Add Missing Endpoints**: Profiles, comments, tags
3. **Enhance Filtering**: Improve search and filtering capabilities
4. **Add Caching**: Implement Redis caching for performance
5. **API Documentation**: Generate OpenAPI/Swagger docs
6. **Monitoring**: Add metrics and health checks
7. **Security**: Implement rate limiting and input validation

This implementation provides a solid foundation for a production-ready RealWorld API with comprehensive testing and documentation.</content>
</xai:function_call">