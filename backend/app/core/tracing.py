"""Tracing utilities for OpenTelemetry integration."""

from typing import Optional


def get_current_trace_context() -> Optional[str]:
    """Get current trace context as traceparent header for propagation to background tasks."""
    try:
        from opentelemetry import trace
        from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
        
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
        from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
        
        propagator = TraceContextTextMapPropagator()
        propagator.inject(headers)
        
        return headers
        
    except ImportError:
        # OpenTelemetry not available
        return headers
    except Exception:
        # Any other error, return original headers
        return headers