# NeoForge

A modern, cost-efficient starter kit for bootstrapped founders.

## Features

- 🚀 Ultra-modern, minimal tooling (UV, Ruff, ESBuild)
- 🌐 Browser-native features over heavy frameworks
- 💰 Cost-optimized for bootstrap phase ($10-15/month)
- 🔍 Debug-friendly development
- 🏗️ Future-proof architecture

## Tech Stack

### Backend
- FastAPI with async operations
- SQLModel for database
- UV for package management
- Ruff for linting and formatting
- Pydantic v2 for validation

### Frontend
- Lit 4.0 web components
- Browser-native features
- TypeScript
- Vite for building

### Infrastructure
- DigitalOcean droplet
- Nomad for orchestration
- Terraform for infrastructure
- GitHub Actions CI/CD
- Cloudflare CDN

## Quick Start

### Backend Setup
```bash
# Install UV package manager
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create virtual environment and install dependencies
uv venv
source .venv/bin/activate
uv pip install -r backend/requirements.txt

# Start the development server
cd backend
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Infrastructure Setup
```bash
cd deploy/terraform
terraform init
terraform apply
```

## Development Guidelines

- Follow [Conventional Commits](https://www.conventionalcommits.org/)
- Run tests before committing: `pytest` for backend, `npm test` for frontend
- Use provided linting configurations
- Keep monitoring and debugging tools active

## Documentation

- API documentation: http://localhost:8000/docs
- Architecture decisions: `/docs/adr`
- Component catalog: http://localhost:3000/catalog

## License

MIT 