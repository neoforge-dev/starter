# syntax=docker/dockerfile:1.4

# Base stage with shared dependencies
FROM python:3.12-slim AS base

# Install UV package manager
COPY --from=ghcr.io/astral-sh/uv:0.5.11 /uv /usr/local/bin/uv

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    UV_NO_CACHE=1

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    postgresql-client \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Builder stage for compiling dependencies
FROM base AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
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
    uv pip install --system -e . && \
    uv pip install --system ".[dev]" && \
    uv pip freeze > requirements.txt

# Development stage
FROM base AS development

WORKDIR /app

# Copy dependency files and virtual environment
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy only dependency files
COPY pyproject.toml ./

# Install dev dependencies with cache mount
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install -e ".[dev]"

# Copy application code
COPY app ./app
COPY tests ./tests

# Production stage
FROM base AS production

WORKDIR /app

# Copy only necessary files and virtual environment
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy only dependency files and application code
COPY pyproject.toml ./
COPY app ./app

# Set user for security
USER nobody

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]