# syntax=docker/dockerfile:1.4

# Base stage with shared dependencies
FROM python:3.11-slim-bookworm AS base

# Install UV package manager (pinned version for reproducibility)
RUN pip install --no-cache-dir uv==0.5.29

# Set environment variables for optimization
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    UV_NO_CACHE=1 \
    DEBIAN_FRONTEND=noninteractive \
    TZ=UTC \
    PYTHON_VENV_PATH="/opt/venv" \
    PATH="/opt/venv/bin:$PATH"

# Install essential runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    postgresql-client \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /tmp/* /var/tmp/*

# Builder stage for compiling dependencies
FROM base AS builder

# Install build dependencies (minimal set)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    libpq-dev \
    libssl-dev \
    pkg-config \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /tmp/* /var/tmp/*

WORKDIR /app

# Copy only dependency files first for better caching
COPY pyproject.toml requirements.txt requirements.test.txt ./

# Create optimized virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install core dependencies first
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=cache,target=/root/.cache/pip \
    uv pip install --no-deps -r requirements.txt

# Install additional production dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=cache,target=/root/.cache/pip \
    uv pip install \
    psycopg2-binary \
    alembic \
    prometheus_client \
    psutil

# Clean up unnecessary files in venv
RUN find /opt/venv -name "*.pyc" -delete && \
    find /opt/venv -name "*.pyo" -delete && \
    find /opt/venv -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find /opt/venv -name "*.so" -exec strip {} \; 2>/dev/null || true

# Test dependencies stage
FROM builder AS test-builder

# Install test-only dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=cache,target=/root/.cache/pip \
    uv pip install -r requirements.test.txt && \
    uv pip install pytest pytest-asyncio pytest-cov httpx

# Development stage
FROM base AS development

# Add development tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /tmp/* /var/tmp/*

WORKDIR /app

# Copy test dependencies virtual environment
COPY --from=test-builder /opt/venv /opt/venv

# Copy application files
COPY pyproject.toml requirements.txt requirements.test.txt ./
COPY app ./app
COPY tests ./tests
COPY alembic ./alembic
COPY alembic.ini ./
COPY pytest.ini ./
COPY .env.test ./

# Production stage - minimal and optimized
FROM base AS production

# Create app user for security
RUN groupadd -r appuser && useradd -r -g appuser -s /bin/false appuser && \
    mkdir -p /app && chown -R appuser:appuser /app

WORKDIR /app

# Copy production virtual environment
COPY --from=builder --chown=appuser:appuser /opt/venv /opt/venv

# Copy only necessary files
COPY --chown=appuser:appuser pyproject.toml ./
COPY --chown=appuser:appuser app ./app
COPY --chown=appuser:appuser alembic ./alembic
COPY --chown=appuser:appuser alembic.ini ./

# Create alembic script wrapper
RUN echo '#!/bin/sh\nexec python -m alembic "$@"' > /opt/venv/bin/alembic && \
    chmod +x /opt/venv/bin/alembic

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Optimized startup command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--access-log"]