# NeoForge Development Guide

## Build/Lint/Test Commands
- **Backend Tests**: `docker compose -f backend/docker-compose.dev.yml run --rm api pytest [path]`
- **Single Backend Test**: `docker compose -f backend/docker-compose.dev.yml run --rm api pytest tests/path/to/test_file.py::test_function_name`
- **Frontend Tests**: `npm run test` (in frontend directory)
- **Single Frontend Test**: `npm run test -- component-name`
- **Backend Lint**: `ruff check backend/`
- **Frontend Lint**: `npm run lint` (in frontend directory)
- **Start Dev**: `make dev`

## Code Style Guidelines
- **Python**: Follow PEP8, 88 char line limit, type hints required
- **JS/TS**: Use ES2021+, Lit component patterns
- **Imports**: Group standard library, third-party, then local imports
- **Components**: Follow atomic design (atoms → molecules → organisms)
- **Error Handling**: Use domain-specific exceptions, log appropriately
- **Types**: Use strict typing in both Python and TypeScript
- **Naming**: snake_case for Python, camelCase for JS/TS
- **Tests**: Follow AAA pattern (Arrange-Act-Assert)
- **Documentation**: Docstrings for Python, JSDoc for JS/TS