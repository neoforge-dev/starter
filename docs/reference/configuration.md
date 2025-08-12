# Configuration Reference

**Complete configuration options, environment variables, and settings for NeoForge deployment and development.**

## 🔧 Environment Configuration

### Backend Configuration

**Core Settings (`backend/app/core/config.py`):**

```python
# Database Configuration
DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost/neoforge"
TEST_DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost/neoforge_test"

# Redis Configuration  
REDIS_URL: str = "redis://localhost:6379"

# Security Configuration
SECRET_KEY: str = "your-secret-key-here"  # MUST be changed in production
ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
REFRESH_TOKEN_EXPIRE_DAYS: int = 7

# CORS Configuration
CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8080"]  # Update for production
CORS_CREDENTIALS: bool = True
CORS_METHODS: List[str] = ["*"]
CORS_HEADERS: List[str] = ["*"]
```

**Email System Configuration:**

```python
# SMTP Settings
SMTP_SERVER: str = "localhost"
SMTP_PORT: int = 1025  # MailHog for development
SMTP_USERNAME: Optional[str] = None
SMTP_PASSWORD: Optional[str] = None
SMTP_TLS: bool = False
SMTP_SSL: bool = False

# Email Templates
FROM_EMAIL: str = "noreply@neoforge.dev"
FROM_NAME: str = "NeoForge"

# Celery Configuration
CELERY_BROKER_URL: str = "redis://localhost:6379/0"
CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
```

**Production Security Settings:**

```python
# Production Environment
ENVIRONMENT: str = "development"  # Set to "production" in production

# Security Headers (when ENVIRONMENT=production)
SECURITY_HEADERS_ENABLED: bool = True
RATE_LIMIT_ENABLED: bool = True
RATE_LIMIT_REQUESTS: int = 100
RATE_LIMIT_PERIOD: int = 60  # seconds

# Logging Configuration
LOG_LEVEL: str = "INFO"  # DEBUG, INFO, WARNING, ERROR, CRITICAL
STRUCTURED_LOGGING: bool = True
```

### Frontend Configuration

**Build Configuration (`frontend/vite.config.js`):**

```javascript
export default defineConfig({
  // Development server
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'lit': ['lit'],
          'components': ['./src/components/index.js']
        }
      }
    }
  },
  
  // PWA Configuration
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache'
            }
          }
        ]
      }
    })
  ]
});
```

**Component Configuration:**

```javascript
// Component registry configuration
export const COMPONENT_CONFIG = {
  autoRegister: true,
  prefix: 'neo-',
  errorBoundary: true,
  devMode: process.env.NODE_ENV === 'development'
};

// Performance configuration
export const PERFORMANCE_CONFIG = {
  lazyLoadThreshold: 1000,
  bundleSplitting: true,
  cacheStrategy: 'stale-while-revalidate'
};
```

## 🐳 Docker Configuration

### Development Docker Compose

**Backend (`backend/docker-compose.dev.yml`):**

```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: neoforge
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
      
  api:
    build: .
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:postgres@db/neoforge
      - REDIS_URL=redis://redis:6379
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
    volumes:
      - .:/app
```

**Frontend (`frontend/docker-compose.yml`):**

```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - VITE_API_URL=http://localhost:8000
    volumes:
      - .:/app
      - /app/node_modules
```

### Production Configuration

**Environment Variables (.env.production):**

```bash
# Backend Production
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/neoforge_prod
REDIS_URL=redis://redis:6379
SECRET_KEY=your-super-secret-production-key-32-chars-min
ENVIRONMENT=production

# Frontend Production  
NODE_ENV=production
VITE_API_URL=https://api.yourdomain.com

# Email Production
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_TLS=true

# Security Production
CORS_ORIGINS=["https://yourdomain.com","https://www.yourdomain.com"]
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_PERIOD=60
```

## 🧪 Testing Configuration

### Backend Test Settings

**pytest Configuration (`backend/pytest.ini`):**

```ini
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_functions = test_*
addopts = 
    --strict-markers
    --disable-warnings
    --tb=short
    --cov=app
    --cov-report=html:htmlcov
    --cov-report=term-missing
    --cov-fail-under=85

markers =
    unit: Unit tests
    integration: Integration tests
    e2e: End-to-end tests
```

**Test Database Configuration:**

```python
# Test-specific settings
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost/neoforge_test"
TEST_REDIS_URL = "redis://localhost:6379/1"  # Different Redis DB
TESTING = True
```

### Frontend Test Configuration

**Vitest Configuration (`frontend/vitest.config.js`):**

```javascript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.stories.js'
      ]
    }
  }
});
```

## 🔐 Security Configuration

### Production Security Headers

```python
# Security middleware configuration
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY", 
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'",
    "Referrer-Policy": "strict-origin-when-cross-origin"
}

# Rate limiting configuration
RATE_LIMITS = {
    "/api/auth/login": "5 per minute",
    "/api/auth/register": "3 per minute", 
    "/api": "100 per minute",
    "default": "1000 per hour"
}
```

### JWT Configuration

```python
# JWT Token configuration
JWT_ALGORITHM = "HS256"
JWT_AUDIENCE = "neoforge:auth"
JWT_ISSUER = "neoforge"

# Token expiration
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7
PASSWORD_RESET_TOKEN_EXPIRE_HOURS = 1
EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS = 24
```

## 📊 Monitoring Configuration

### Prometheus Metrics

```python
# Metrics configuration
METRICS_ENABLED = True
METRICS_PATH = "/metrics"
METRICS_INCLUDE_HOSTNAME = True
METRICS_INCLUDE_METHOD = True
```

### Logging Configuration

```python
# Structured logging setup
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
            "format": "%(asctime)s %(name)s %(levelname)s %(message)s"
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json"
        }
    },
    "root": {
        "level": "INFO",
        "handlers": ["console"]
    }
}
```

## 🔗 API Configuration Reference

### OpenAPI Settings

```python
# API documentation configuration
OPENAPI_CONFIG = {
    "title": "NeoForge API",
    "description": "Modern full-stack starter kit API",
    "version": "1.0.0",
    "openapi_tags": [
        {"name": "auth", "description": "Authentication endpoints"},
        {"name": "users", "description": "User management"},
        {"name": "health", "description": "Health check endpoints"}
    ]
}
```

### CORS Production Settings

```python
# Production CORS - STRICT SETTINGS
CORS_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com"
]
CORS_CREDENTIALS = True
CORS_METHODS = ["GET", "POST", "PUT", "DELETE"]
CORS_HEADERS = ["Authorization", "Content-Type"]
```

---

*For detailed configuration examples, see the environment-specific config files in each service directory.*