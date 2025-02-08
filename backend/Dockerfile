# Build stage
FROM python:3.13-slim AS builder

WORKDIR /app

# Install build dependencies and UV
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    gcc \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/* 

# Install UV
COPY --from=ghcr.io/astral-sh/uv:0.5.11 /uv /usr/local/bin/uv

# Copy package files first
COPY pyproject.toml ./
COPY app ./app

# Install dependencies using UV's layer caching
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system -e . && \
    uv pip install --system ".[dev]" && \
    uv pip freeze > requirements.txt

# Development stage
FROM python:3.13-slim AS development

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    postgresql-client \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first (for better layer caching)
COPY pyproject.toml ./
COPY app ./app
COPY tests ./tests

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin/* /usr/local/bin/

# Install dev dependencies
RUN pip install -e ".[dev]"

# Set development environment variables
ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    ENVIRONMENT=development \
    PORT=8000 \
    HOST=0.0.0.0 \
    PATH="/usr/local/bin:$PATH"

# Health check for development
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Keep container running for development
CMD ["uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]

# Test stage
FROM development AS test

WORKDIR /app

# Install setuptools and pkg-resources first
RUN pip install --no-cache-dir setuptools>=69.2.0 pkg_resources>=0.0.0

# Set test environment variables
ENV ENVIRONMENT=test \
    TESTING=1 \
    PYTHONPATH=/app \
    PYTHONUNBUFFERED=1

# Production stage
FROM python:3.13-slim AS production

WORKDIR /app

# Install minimal runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    postgresql-client \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Create and switch to non-root user early
RUN useradd -m -u 1000 app && \
    chown -R app:app /app
USER app

# Copy package files first (for better layer caching)
COPY --chown=app:app pyproject.toml ./
COPY --chown=app:app app ./app

# Copy installed packages and binaries from builder
COPY --from=builder --chown=app:app /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder --chown=app:app /usr/local/bin/uvicorn /usr/local/bin/uvicorn
COPY --from=builder --chown=app:app /app/requirements.txt ./requirements.txt

# Set production environment variables
ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    ENVIRONMENT=production \
    PORT=8000 \
    HOST=0.0.0.0 \
    WORKERS=4 \
    PATH="/usr/local/bin:$PATH"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Start Uvicorn server directly (FastAPI recommended)
CMD ["uvicorn", "app.main:app", \
    "--workers", "4", \
    "--host", "0.0.0.0", \
    "--port", "8000", \
    "--proxy-headers", \
    "--forwarded-allow-ips", "*"]