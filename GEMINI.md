# GEMINI Analysis of NeoForge

This document provides a comprehensive overview of the NeoForge project, intended to be used as instructional context for future interactions with the Gemini AI.

## Project Overview

NeoForge is a full-stack starter kit designed for rapid MVP development. It features a modern technology stack optimized for performance, cost-efficiency, and scalability.

*   **Backend:** The backend is built with **FastAPI**, a high-performance Python web framework. It utilizes **PostgreSQL** as its primary database and **Redis** for caching and background tasks. The backend includes features like asynchronous support, Pydantic data validation, and JWT-based authentication.
*   **Frontend:** The frontend is built with **Lit**, a lightweight library for creating fast, lightweight web components. It's configured as a Progressive Web App (PWA), enabling offline capabilities. **Vite** is used for the build process.
*   **Infrastructure:** The project is fully containerized using **Docker** and **Docker Compose**. It also includes configurations for **Nomad** for container orchestration and **Terraform** for infrastructure as code, demonstrating a clear path to production and scalability.

## Building and Running

The project uses a `Makefile` to streamline common development tasks.

*   **Initial Setup:**
    ```bash
    make setup
    ```
    This command copies the example environment file (`.env.example`) to `.env`, builds the necessary Docker images, and installs frontend dependencies.

*   **Running the Development Environment:**
    ```bash
    make dev
    ```
    This starts all services, including the FastAPI backend and the Lit frontend, with hot-reloading enabled.

*   **Running Tests:**
    *   **Backend Tests:**
        ```bash
        make test
        ```
        This command executes the `pytest` test suite within the backend Docker container.
    *   **Frontend Tests:**
        ```bash
        make test-frontend
        ```
        This command runs the `vitest` unit tests for the frontend.

## Development Conventions

*   **Code Style:** The project uses `ruff` for linting and `black` for formatting the Python code.
*   **API Documentation:** The FastAPI backend automatically generates interactive API documentation (Swagger UI and ReDoc), which is a key feature of the framework.
*   **Database Migrations:** `Alembic` is used for managing database schema migrations.
*   **Modularity:** The project is structured with clear separation between the `backend` and `frontend` applications. The backend itself is further organized into modules for API endpoints, core logic, CRUD operations, database models, and schemas.
*   **Component-Based Frontend:** The Lit frontend follows a component-based architecture, with components organized into atoms, molecules, and organisms, which is a common pattern for building scalable user interfaces.
