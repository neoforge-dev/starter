"""Tracing utilities for OpenTelemetry integration."""

import logging
from typing import Any, Dict, Optional, Union

import structlog

logger = structlog.get_logger()


def get_current_trace_context() -> Optional[str]:
    """Get current trace context as traceparent header for propagation to background tasks."""
    try:
        from opentelemetry import trace
        from opentelemetry.trace.propagation.tracecontext import (
            TraceContextTextMapPropagator,
        )

        # Get current span context
        current_span = trace.get_current_span()
        if not current_span or not current_span.get_span_context().is_valid:
            return None

        # Extract traceparent header
        propagator = TraceContextTextMapPropagator()
        carrier = {}
        propagator.inject(carrier)

        return carrier.get("traceparent")

    except ImportError:
        # OpenTelemetry not available
        return None
    except Exception:
        # Any other error, fail silently
        return None


def inject_trace_headers(headers: dict) -> dict:
    """Inject trace headers into a dict for HTTP calls or task metadata."""
    try:
        from opentelemetry.trace.propagation.tracecontext import (
            TraceContextTextMapPropagator,
        )

        propagator = TraceContextTextMapPropagator()
        propagator.inject(headers)

        return headers

    except ImportError:
        # OpenTelemetry not available
        return headers
    except Exception:
        # Any other error, return original headers
        return headers


def setup_otlp_tracer_provider(
    settings, service_name_suffix: str = ""
) -> Optional[Any]:
    """Set up OpenTelemetry tracer provider with OTLP exporter based on configuration.

    Args:
        settings: Application settings with OTLP configuration
        service_name_suffix: Optional suffix to append to service name (e.g., "-worker")

    Returns:
        TracerProvider instance if successful, None if disabled or failed
    """
    try:
        # Check if tracing is disabled
        if (
            settings.otel_sdk_disabled
            or settings.otel_traces_exporter == "none"
            or settings.environment == "test"
        ):
            logger.info(
                "otel_tracing_disabled",
                reason="sdk_disabled"
                if settings.otel_sdk_disabled
                else "exporter_none",
            )
            return None

        from opentelemetry import trace
        from opentelemetry.sdk.resources import SERVICE_NAME, SERVICE_VERSION, Resource
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import (
            BatchSpanProcessor,
            ConsoleSpanExporter,
        )
        from opentelemetry.sdk.trace.sampling import (
            AlwaysOffSampler,
            AlwaysOnSampler,
            TraceIdRatioBasedSampler,
        )

        # Build resource attributes
        resource_attrs = {
            SERVICE_NAME: f"{settings.otel_service_name}{service_name_suffix}",
        }

        if settings.otel_service_version:
            resource_attrs[SERVICE_VERSION] = settings.otel_service_version

        # Parse additional resource attributes if provided
        if settings.otel_resource_attributes:
            try:
                for attr_pair in settings.otel_resource_attributes.split(","):
                    if "=" in attr_pair:
                        key, value = attr_pair.strip().split("=", 1)
                        resource_attrs[key.strip()] = value.strip()
            except Exception as e:
                logger.warning("otel_resource_attributes_parse_error", error=str(e))

        resource = Resource(attributes=resource_attrs)

        # Configure sampler
        sampler = AlwaysOnSampler()
        if settings.otel_traces_sampler == "always_off":
            sampler = AlwaysOffSampler()
        elif settings.otel_traces_sampler in ["ratio", "traceidratio"]:
            ratio = 1.0  # Default ratio
            if settings.otel_traces_sampler_arg:
                try:
                    ratio = float(settings.otel_traces_sampler_arg)
                    ratio = max(0.0, min(1.0, ratio))  # Clamp between 0 and 1
                except ValueError:
                    logger.warning(
                        "otel_invalid_sampler_ratio",
                        value=settings.otel_traces_sampler_arg,
                        fallback=ratio,
                    )
            sampler = TraceIdRatioBasedSampler(ratio)

        # Create tracer provider
        provider = TracerProvider(resource=resource, sampler=sampler)

        # Configure exporter and processor
        processor = _create_span_processor(settings)
        if processor:
            provider.add_span_processor(processor)

        trace.set_tracer_provider(provider)

        logger.info(
            "otel_tracer_provider_configured",
            service_name=resource_attrs.get(SERVICE_NAME),
            exporter=settings.otel_traces_exporter,
            sampler=settings.otel_traces_sampler,
        )

        return provider

    except ImportError as e:
        logger.warning(
            "otel_dependencies_missing",
            error=str(e),
            note="Install opentelemetry packages for tracing support",
        )
        return None
    except Exception as e:
        logger.error("otel_tracer_provider_setup_failed", error=str(e))
        return None


def _create_span_processor(settings) -> Optional[Any]:
    """Create and configure span processor based on settings."""
    try:
        from opentelemetry.sdk.trace.export import (
            BatchSpanProcessor,
            ConsoleSpanExporter,
        )

        if settings.otel_traces_exporter == "console":
            processor = BatchSpanProcessor(ConsoleSpanExporter())
            logger.info("otel_console_exporter_configured")
            return processor

        elif settings.otel_traces_exporter == "otlp":
            return _create_otlp_processor(settings)

        else:
            logger.warning(
                "otel_unknown_exporter", exporter=settings.otel_traces_exporter
            )
            return None

    except Exception as e:
        logger.error("otel_span_processor_creation_failed", error=str(e))
        return None


def _create_otlp_processor(settings) -> Optional[Any]:
    """Create OTLP span processor with proper configuration."""
    try:
        # Determine endpoint - traces-specific takes precedence
        endpoint = (
            settings.otel_exporter_otlp_traces_endpoint
            or settings.otel_exporter_otlp_endpoint
        )
        if not endpoint:
            logger.warning(
                "otel_otlp_endpoint_missing",
                note="Set OTEL_EXPORTER_OTLP_ENDPOINT or OTEL_EXPORTER_OTLP_TRACES_ENDPOINT",
            )
            return None

        # Determine protocol - traces-specific takes precedence
        protocol = (
            settings.otel_exporter_otlp_traces_protocol
            or settings.otel_exporter_otlp_protocol
        )

        # Parse headers - traces-specific takes precedence
        headers_str = (
            settings.otel_exporter_otlp_traces_headers
            or settings.otel_exporter_otlp_headers
        )
        headers = _parse_otlp_headers(headers_str) if headers_str else None

        # Determine timeout - traces-specific takes precedence
        timeout = (
            settings.otel_exporter_otlp_traces_timeout
            or settings.otel_exporter_otlp_timeout
        )

        # Determine compression - traces-specific takes precedence
        compression = (
            settings.otel_exporter_otlp_traces_compression
            or settings.otel_exporter_otlp_compression
        )

        # Create exporter based on protocol
        if protocol == "grpc":
            return _create_grpc_otlp_processor(endpoint, headers, timeout, compression)
        else:
            # Default to HTTP (protobuf or json)
            return _create_http_otlp_processor(endpoint, headers, timeout, compression)

    except Exception as e:
        logger.error("otel_otlp_processor_creation_failed", error=str(e))
        return None


def _create_http_otlp_processor(
    endpoint: str, headers: Optional[Dict], timeout: int, compression: Optional[str]
) -> Optional[Any]:
    """Create HTTP OTLP processor."""
    try:
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import (
            OTLPSpanExporter,
        )
        from opentelemetry.sdk.trace.export import BatchSpanProcessor

        exporter_kwargs = {
            "endpoint": endpoint,
            "timeout": timeout,
        }

        if headers:
            exporter_kwargs["headers"] = headers

        if compression:
            exporter_kwargs["compression"] = compression

        exporter = OTLPSpanExporter(**exporter_kwargs)
        processor = BatchSpanProcessor(exporter)

        logger.info(
            "otel_http_otlp_exporter_configured",
            endpoint=endpoint,
            timeout=timeout,
            compression=compression,
            headers_count=len(headers) if headers else 0,
        )

        return processor

    except ImportError:
        logger.warning(
            "otel_http_otlp_exporter_unavailable",
            note="Install opentelemetry-exporter-otlp for HTTP OTLP support",
        )
        return None


def _create_grpc_otlp_processor(
    endpoint: str, headers: Optional[Dict], timeout: int, compression: Optional[str]
) -> Optional[Any]:
    """Create gRPC OTLP processor."""
    try:
        from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import (
            OTLPSpanExporter,
        )
        from opentelemetry.sdk.trace.export import BatchSpanProcessor

        exporter_kwargs = {
            "endpoint": endpoint,
            "timeout": timeout,
        }

        if headers:
            exporter_kwargs["headers"] = headers

        if compression:
            exporter_kwargs["compression"] = compression

        exporter = OTLPSpanExporter(**exporter_kwargs)
        processor = BatchSpanProcessor(exporter)

        logger.info(
            "otel_grpc_otlp_exporter_configured",
            endpoint=endpoint,
            timeout=timeout,
            compression=compression,
            headers_count=len(headers) if headers else 0,
        )

        return processor

    except ImportError:
        logger.warning(
            "otel_grpc_otlp_exporter_unavailable",
            note="Install opentelemetry-exporter-otlp for gRPC OTLP support",
        )
        return None


def _parse_otlp_headers(headers_str: str) -> Dict[str, str]:
    """Parse OTLP headers string into dictionary.

    Format: "key1=value1,key2=value2"
    """
    headers = {}
    try:
        for header_pair in headers_str.split(","):
            header_pair = header_pair.strip()
            if "=" in header_pair:
                key, value = header_pair.split("=", 1)
                headers[key.strip()] = value.strip()
    except Exception as e:
        logger.warning("otel_headers_parse_error", headers=headers_str, error=str(e))

    return headers


def setup_instrumentation(app=None, engine=None) -> None:
    """Set up automatic instrumentation for FastAPI, SQLAlchemy, Redis, etc.

    Args:
        app: FastAPI application instance (optional)
        engine: SQLAlchemy engine instance (optional)
    """
    try:
        # FastAPI instrumentation
        if app:
            from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

            FastAPIInstrumentor.instrument_app(app)
            logger.info("otel_fastapi_instrumentation_enabled")

        # SQLAlchemy instrumentation
        if engine:
            from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor

            try:
                # Handle both async and sync engines
                sync_engine = getattr(engine, "sync_engine", engine)
                SQLAlchemyInstrumentor().instrument(engine=sync_engine)
                logger.info("otel_sqlalchemy_instrumentation_enabled")
            except Exception as e:
                logger.warning("otel_sqlalchemy_instrumentation_failed", error=str(e))

        # Redis instrumentation
        try:
            from opentelemetry.instrumentation.redis import RedisInstrumentor

            RedisInstrumentor().instrument()
            logger.info("otel_redis_instrumentation_enabled")
        except Exception as e:
            logger.warning("otel_redis_instrumentation_failed", error=str(e))

        # HTTPX instrumentation for outbound HTTP calls
        try:
            from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor

            HTTPXClientInstrumentor().instrument()
            logger.info("otel_httpx_instrumentation_enabled")
        except Exception as e:
            logger.warning("otel_httpx_instrumentation_failed", error=str(e))

        # Celery instrumentation (for workers)
        try:
            from opentelemetry.instrumentation.celery import CeleryInstrumentor

            CeleryInstrumentor().instrument()
            logger.info("otel_celery_instrumentation_enabled")
        except Exception as e:
            logger.warning("otel_celery_instrumentation_failed", error=str(e))

    except ImportError as e:
        logger.warning("otel_instrumentation_dependencies_missing", error=str(e))
    except Exception as e:
        logger.error("otel_instrumentation_setup_failed", error=str(e))
