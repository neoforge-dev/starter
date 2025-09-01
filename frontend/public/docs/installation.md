---
title: Installation Guide
description: Detailed instructions for installing and configuring NeoForge
---

# Installation Guide

This guide will walk you through the complete installation process for NeoForge, including all prerequisites and configuration steps.

## Prerequisites

Before installing NeoForge, ensure you have the following installed:

- Node.js (v18 or later)
- Python 3.10 or later
- Docker and Docker Compose
- Git

## Frontend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/neoforge.git
   cd neoforge/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your settings.

4. Start development server:
   ```bash
   npm run dev
   ```

## Backend Setup

1. Navigate to backend directory:
   ```bash
   cd ../backend
   ```

2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database and API settings.

5. Start backend services:
   ```bash
   docker-compose up -d
   uvicorn src.main:app --reload
   ```

## Development Environment

### VS Code Configuration

We recommend using Visual Studio Code with the following extensions:

- Lit-Plugin
- Python
- Docker
- ESLint
- Prettier

### Browser Setup

For the best development experience:

1. Install Chrome or Firefox
2. Enable developer tools
3. Install Redux DevTools extension
4. Enable source maps

## Production Setup

For production deployment:

1. Build frontend assets:
   ```bash
   npm run build
   ```

2. Configure production environment:
   ```bash
   cp .env.production.example .env.production
   ```

3. Start production services:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000 and 8000 are available
2. **Database connection**: Verify PostgreSQL is running
3. **Node modules**: Try deleting node_modules and reinstalling

### Getting Help

If you encounter issues:

1. Check our [FAQ](./faq)
2. Search GitHub issues
3. Join our Discord community
4. Contact support

## Next Steps

- Read our [Architecture Guide](./architecture)
- Explore [Components](./components)
- Review [Best Practices](./best-practices)
- Set up [Continuous Integration](./ci-cd)
