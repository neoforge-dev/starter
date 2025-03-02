# syntax=docker/dockerfile:1.4

# Base stage with shared dependencies
FROM python:3.13-slim-bookworm AS base

# Install UV package manager
RUN pip install --no-cache-dir uv==0.5.29

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    UV_NO_CACHE=1 \
    DEBIAN_FRONTEND=noninteractive \
    TZ=UTC

# Install essential runtime dependencies first
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    postgresql-client \
    libpq5 \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Builder stage for compiling dependencies
FROM base AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only dependency files first
COPY pyproject.toml ./

# Create a virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install dependencies with cache mount
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install -e . && \
    uv pip install -e .[dev]

# Install additional dependencies explicitly
RUN uv pip install psutil prometheus_client pytest pytest-asyncio pytest-cov

# Install and configure Alembic
RUN uv pip install alembic psycopg2-binary && \
    mkdir -p /opt/venv/bin && \
    echo '#!/bin/sh' > /opt/venv/bin/alembic && \
    echo 'exec python -m alembic "$@"' >> /opt/venv/bin/alembic && \
    chmod +x /opt/venv/bin/alembic

# Development stage
FROM base AS development

WORKDIR /app

# Copy dependency files and virtual environment
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy dependency files
COPY pyproject.toml ./

# Copy application code
COPY app ./app
COPY tests ./tests
COPY alembic ./alembic
COPY alembic.ini ./

# Install dependencies in development stage
RUN uv pip install -e .[dev] && \
    uv pip install psutil prometheus_client

# Production stage
FROM base AS production

WORKDIR /app

# Copy virtual environment and code
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY pyproject.toml ./
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./

# Set user for security
USER nobody

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]