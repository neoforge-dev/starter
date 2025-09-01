# Architecture Guide

**In-depth system architecture, design decisions (ADRs), security model, and technical foundation documentation.**

## 🏗️ System Architecture

### Complete System Overview
- **[System Architecture](../architecture.md)** - **MAIN CANONICAL** - Complete system design, technical decisions, and data flow
- **[Information Architecture](../../INFORMATION_ARCHITECTURE.md)** - Strategic system organization

## 🔧 Component Architecture

### Backend Architecture
- **[Backend Design](../backend/)** - FastAPI, SQLModel, Celery architecture
- **[Database Architecture](../database/)** - PostgreSQL, Redis, data modeling
- **[API Design](../api/)** - REST API architecture and patterns

### Frontend Architecture
- **[Frontend Design](../frontend/)** - Lit components, PWA architecture
- **[Component System](../frontend/adr/)** - Architecture Decision Records for frontend
- **[Performance Architecture](../../frontend/docs/PERFORMANCE_POLYFILL.md)** - Performance design patterns

### Infrastructure Architecture
- **[Infrastructure Design](../infrastructure/)** - Docker, deployment architecture
- **[Infrastructure Deployment](../../frontend/docs/infrastructure/architecture.md)** - **SPECIALIZED** - Detailed deployment architecture with monitoring
- **[Security Model](../security.md)** - Security architecture and patterns
- **[Monitoring Architecture](../monitoring.md)** - Observability and metrics design

### Specialized Architecture
- **[Playground Architecture](../../frontend/src/playground/architecture.md)** - **SPECIALIZED** - Component playground system architecture

## 📋 Architecture Decision Records (ADRs)

### Frontend ADRs
- **[Use Lit Elements](../frontend/adr/0001-use-lit-elements.md)** - Component framework decision
- **[No Build Tooling](../frontend/adr/0002-no-build-tooling.md)** - Development approach
- **[PWA First](../frontend/adr/0003-pwa-first.md)** - Progressive Web App strategy
- **[Authentication Strategy](../frontend/adr/0004-authentication-strategy.md)** - Auth architecture

### System Design Decisions
- **[Tech Stack Selection](../../CLAUDE.md#tech-stack)** - Technology choices and rationale
- **[Testing Strategy](../../backend/TESTING.md#architecture)** - Testing architecture approach

## 🔍 Technical Specifications

### Performance Architecture
- **[Backend Performance](../../backend/README.md#performance-targets)** - Performance requirements and design
- **[Frontend Performance](../../frontend/README.md#performance)** - Client-side performance architecture
- **[Cost Optimization](../costs.md)** - Cost-efficient architectural decisions

### Security Architecture
- **[Security Model](../security.md)** - Complete security architecture
- **[Authentication Design](../frontend/adr/0004-authentication-strategy.md)** - Auth system architecture
- **[Data Security](../../backend/README.md#security)** - Data protection design

## 🔗 Related Resources

- **[Development Guide](../development/)** - How to develop within this architecture
- **[Deployment Guide](../deployment.md)** - How to deploy this architecture
- **[Operations Guide](../operations/)** - How to operate this architecture

---

*This architecture is designed for cost-efficient, rapid MVP development while maintaining production-ready standards.*
