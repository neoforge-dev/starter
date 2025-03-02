# syntax=docker/dockerfile:1.4

# Base stage with shared dependencies
FROM python:3.11-slim-bookworm AS base

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
    && rm -rf /var/lib/apt/lists/*

# Builder stage for compiling dependencies
FROM base AS builder

# Add Apache Arrow repository and install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    cmake \
    ninja-build \
    pkg-config \
    libssl-dev \
    gnupg \
    lsb-release \
    wget \
    && wget https://apache.jfrog.io/artifactory/arrow/$(lsb_release --id --short | tr 'A-Z' 'a-z')/apache-arrow-apt-source-latest-$(lsb_release --codename --short).deb \
    && apt-get install -y -V ./apache-arrow-apt-source-latest-$(lsb_release --codename --short).deb \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
    libarrow-dev \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f apache-arrow-apt-source-latest-$(lsb_release --codename --short).deb

WORKDIR /app

# Copy only dependency files first
COPY pyproject.toml ./
COPY requirements.txt ./
COPY requirements.test.txt ./

# Create a virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install dependencies with cache mount
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install -e . && \
    uv pip install -e ".[dev]"

# Install test dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install -r requirements.test.txt

# Install additional dependencies explicitly
RUN uv pip install psutil prometheus_client pytest pytest-asyncio pytest-cov httpx

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
COPY requirements.txt ./
COPY requirements.test.txt ./

# Copy application code
COPY app ./app
COPY tests ./tests
COPY alembic ./alembic
COPY alembic.ini ./
COPY pytest.ini ./
COPY .env.test ./

# Add Apache Arrow repository and install development dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    cmake \
    ninja-build \
    pkg-config \
    libssl-dev \
    gnupg \
    lsb-release \
    wget \
    && wget https://apache.jfrog.io/artifactory/arrow/$(lsb_release --id --short | tr 'A-Z' 'a-z')/apache-arrow-apt-source-latest-$(lsb_release --codename --short).deb \
    && apt-get install -y -V ./apache-arrow-apt-source-latest-$(lsb_release --codename --short).deb \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
    libarrow-dev \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f apache-arrow-apt-source-latest-$(lsb_release --codename --short).deb

# Ensure all test dependencies are installed
RUN uv pip install -e .[dev] && \
    uv pip install -r requirements.test.txt && \
    uv pip install psutil prometheus_client pytest pytest-asyncio pytest-cov httpx

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