# NeoForge Technical Context

## Technologies Used

### Frontend
- **Framework**: Lit 4.0 (lightweight web component library)
- **Languages**: JavaScript (ES6+), HTML, CSS
- **Testing**: Vitest
- **Build Tools**: Vite, npm
- **UI Patterns**: Atomic Design
- **PWA Features**: Service Workers, Web Manifest

### Backend
- **Framework**: FastAPI (async Python)
- **Languages**: Python 3.10+
- **Database ORM**: SQLModel
- **Database**: PostgreSQL
- **Caching**: Redis
- **Testing**: pytest, pytest-asyncio
- **Authentication**: JWT
- **API Documentation**: OpenAPI/Swagger (auto-generated)

### Infrastructure
- **Containerization**: Docker
- **Orchestration**:
  - Development: Docker Compose
  - Production: Nomad
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus, Grafana
- **CDN**: Cloudflare
- **Storage**: S3-compatible object storage

## Development Setup

### Prerequisites
- Docker and Docker Compose
- Node.js 16+
- Python 3.10+
- Git

### Local Development Environment
```bash
# Clone repository
git clone https://github.com/your-org/neoforge.git
cd neoforge

# Start development environment
docker-compose up -d

# Frontend development
cd frontend
npm install
npm run dev

# Backend development (alternative to Docker approach)
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `SECRET_KEY`: JWT secret key
- `DEBUG`: Enable/disable debug mode
- `ENVIRONMENT`: Development/Staging/Production

### Common Commands
```bash
# Run frontend tests
cd frontend
npm run test:unit

# Run backend tests
cd backend
pytest

# Build frontend for production
cd frontend
npm run build

# Database migrations
cd backend
alembic upgrade head
```

## Technical Constraints

### Performance Requirements
- Page load time < 2 seconds
- API response time < 200ms for standard endpoints
- Support for 1000+ concurrent users

### Browser Support
- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

### Mobile Support
- iOS Safari 14+
- Android Chrome 90+
- PWA installation support

### Security Requirements
- HTTPS throughout
- OWASP Top 10 compliance
- Regular security audits
- Content Security Policy implementation

## Dependencies

### Frontend Dependencies
```json
{
  "dependencies": {
    "lit": "^4.0.0",
    "page": "^1.11.6",
    "marked": "^4.0.12",
    "chart.js": "^3.7.1"
  },
  "devDependencies": {
    "vite": "^2.8.6",
    "vitest": "^0.22.1",
    "@open-wc/testing": "^3.1.6",
    "eslint": "^8.9.0"
  }
}
```

### Backend Dependencies
```
fastapi==0.95.0
sqlmodel==0.0.8
alembic==1.10.2
pydantic==1.10.7
uvicorn==0.21.1
python-jose==3.3.0
passlib==1.7.4
python-multipart==0.0.6
pytest==7.3.1
pytest-asyncio==0.21.0
httpx==0.24.0
```

## Integration Points

### External Services
- **Payment Processing**: Stripe API
- **Email Service**: SendGrid
- **File Storage**: AWS S3 / MinIO
- **Analytics**: Google Analytics 4
- **Maps**: MapBox API

### Internal APIs
- Authentication API (`/api/v1/auth/`)
- User Management API (`/api/v1/users/`)
- Projects API (`/api/v1/projects/`)
- Billing API (`/api/v1/billing/`)
- Reports API (`/api/v1/reports/`) 