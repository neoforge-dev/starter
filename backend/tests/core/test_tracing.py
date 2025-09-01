"""Tests for OpenTelemetry tracing utilities."""

from unittest.mock import MagicMock, Mock, patch

import pytest

from app.core.tracing import (
    _parse_otlp_headers,
    get_current_trace_context,
    inject_trace_headers,
    setup_instrumentation,
    setup_otlp_tracer_provider,
)


class TestTraceContext:
    """Test trace context utilities."""

    def test_get_current_trace_context_no_otel(self):
        """Test trace context when OpenTelemetry is not available."""
        with patch("app.core.tracing.trace", side_effect=ImportError):
            result = get_current_trace_context()
            assert result is None

    def test_get_current_trace_context_no_span(self):
        """Test trace context when no active span."""
        mock_span = Mock()
        mock_span.get_span_context.return_value.is_valid = False

        with patch("app.core.tracing.trace") as mock_trace:
            mock_trace.get_current_span.return_value = mock_span
            result = get_current_trace_context()
            assert result is None

    def test_get_current_trace_context_success(self):
        """Test successful trace context extraction."""
        mock_span = Mock()
        mock_span.get_span_context.return_value.is_valid = True

        mock_propagator = Mock()
        mock_propagator.inject.side_effect = lambda carrier: carrier.update(
            {"traceparent": "test-trace-id"}
        )

        with patch("app.core.tracing.trace") as mock_trace, patch(
            "app.core.tracing.TraceContextTextMapPropagator",
            return_value=mock_propagator,
        ):
            mock_trace.get_current_span.return_value = mock_span
            result = get_current_trace_context()
            assert result == "test-trace-id"

    def test_inject_trace_headers_no_otel(self):
        """Test header injection when OpenTelemetry is not available."""
        headers = {"existing": "header"}
        with patch(
            "app.core.tracing.TraceContextTextMapPropagator", side_effect=ImportError
        ):
            result = inject_trace_headers(headers)
            assert result == headers

    def test_inject_trace_headers_success(self):
        """Test successful header injection."""
        headers = {"existing": "header"}
        mock_propagator = Mock()

        with patch(
            "app.core.tracing.TraceContextTextMapPropagator",
            return_value=mock_propagator,
        ):
            result = inject_trace_headers(headers)
            assert result == headers
            mock_propagator.inject.assert_called_once_with(headers)


class TestOTLPHeaderParsing:
    """Test OTLP header parsing utilities."""

    def test_parse_otlp_headers_empty(self):
        """Test parsing empty headers string."""
        result = _parse_otlp_headers("")
        assert result == {}

    def test_parse_otlp_headers_single(self):
        """Test parsing single header."""
        result = _parse_otlp_headers("key=value")
        assert result == {"key": "value"}

    def test_parse_otlp_headers_multiple(self):
        """Test parsing multiple headers."""
        result = _parse_otlp_headers("key1=value1,key2=value2")
        assert result == {"key1": "value1", "key2": "value2"}

    def test_parse_otlp_headers_with_spaces(self):
        """Test parsing headers with spaces."""
        result = _parse_otlp_headers(" key1 = value1 , key2 = value2 ")
        assert result == {"key1": "value1", "key2": "value2"}

    def test_parse_otlp_headers_invalid_format(self):
        """Test parsing headers with invalid format."""
        result = _parse_otlp_headers("invalid,key=value")
        assert result == {"key": "value"}

    def test_parse_otlp_headers_equals_in_value(self):
        """Test parsing headers with equals sign in value."""
        result = _parse_otlp_headers("key=value=with=equals")
        assert result == {"key": "value=with=equals"}


class TestTracerProviderSetup:
    """Test OTLP tracer provider setup."""

    def test_setup_otlp_tracer_provider_disabled(self):
        """Test tracer provider setup when disabled."""
        mock_settings = Mock()
        mock_settings.otel_sdk_disabled = True
        mock_settings.environment = "production"

        result = setup_otlp_tracer_provider(mock_settings)
        assert result is None

    def test_setup_otlp_tracer_provider_none_exporter(self):
        """Test tracer provider setup with none exporter."""
        mock_settings = Mock()
        mock_settings.otel_sdk_disabled = False
        mock_settings.otel_traces_exporter = "none"
        mock_settings.environment = "development"

        result = setup_otlp_tracer_provider(mock_settings)
        assert result is None

    def test_setup_otlp_tracer_provider_test_environment(self):
        """Test tracer provider setup in test environment."""
        mock_settings = Mock()
        mock_settings.otel_sdk_disabled = False
        mock_settings.otel_traces_exporter = "console"
        mock_settings.environment = "test"

        result = setup_otlp_tracer_provider(mock_settings)
        assert result is None

    @patch("app.core.tracing.trace")
    @patch("app.core.tracing.TracerProvider")
    @patch("app.core.tracing.Resource")
    @patch("app.core.tracing.AlwaysOnSampler")
    @patch("app.core.tracing._create_span_processor")
    def test_setup_otlp_tracer_provider_console(
        self,
        mock_create_processor,
        mock_sampler,
        mock_resource,
        mock_provider,
        mock_trace,
    ):
        """Test tracer provider setup with console exporter."""
        mock_settings = Mock()
        mock_settings.otel_sdk_disabled = False
        mock_settings.otel_traces_exporter = "console"
        mock_settings.environment = "development"
        mock_settings.otel_service_name = "test-service"
        mock_settings.otel_service_version = None
        mock_settings.otel_resource_attributes = None
        mock_settings.otel_traces_sampler = "always_on"
        mock_settings.otel_traces_sampler_arg = None

        mock_processor_instance = Mock()
        mock_create_processor.return_value = mock_processor_instance
        mock_provider_instance = Mock()
        mock_provider.return_value = mock_provider_instance

        result = setup_otlp_tracer_provider(mock_settings)

        assert result == mock_provider_instance
        mock_provider_instance.add_span_processor.assert_called_once_with(
            mock_processor_instance
        )
        mock_trace.set_tracer_provider.assert_called_once_with(mock_provider_instance)

    @patch("app.core.tracing.trace")
    @patch("app.core.tracing.TracerProvider")
    @patch("app.core.tracing.Resource")
    @patch("app.core.tracing.TraceIdRatioBasedSampler")
    @patch("app.core.tracing._create_span_processor")
    def test_setup_otlp_tracer_provider_ratio_sampler(
        self,
        mock_create_processor,
        mock_ratio_sampler,
        mock_resource,
        mock_provider,
        mock_trace,
    ):
        """Test tracer provider setup with ratio sampler."""
        mock_settings = Mock()
        mock_settings.otel_sdk_disabled = False
        mock_settings.otel_traces_exporter = "console"
        mock_settings.environment = "development"
        mock_settings.otel_service_name = "test-service"
        mock_settings.otel_service_version = "1.0.0"
        mock_settings.otel_resource_attributes = "env=dev,team=backend"
        mock_settings.otel_traces_sampler = "ratio"
        mock_settings.otel_traces_sampler_arg = "0.1"

        mock_processor_instance = Mock()
        mock_create_processor.return_value = mock_processor_instance
        mock_provider_instance = Mock()
        mock_provider.return_value = mock_provider_instance

        result = setup_otlp_tracer_provider(
            mock_settings, service_name_suffix="-worker"
        )

        assert result == mock_provider_instance
        mock_ratio_sampler.assert_called_once_with(0.1)

    def test_setup_otlp_tracer_provider_import_error(self):
        """Test tracer provider setup with import error."""
        mock_settings = Mock()
        mock_settings.otel_sdk_disabled = False
        mock_settings.otel_traces_exporter = "console"
        mock_settings.environment = "development"

        with patch(
            "app.core.tracing.trace", side_effect=ImportError("otel not installed")
        ):
            result = setup_otlp_tracer_provider(mock_settings)
            assert result is None


class TestInstrumentationSetup:
    """Test instrumentation setup."""

    @patch("app.core.tracing.FastAPIInstrumentor")
    def test_setup_instrumentation_fastapi_only(self, mock_fastapi_instrumentor):
        """Test instrumentation setup with FastAPI only."""
        mock_app = Mock()

        setup_instrumentation(app=mock_app)

        mock_fastapi_instrumentor.instrument_app.assert_called_once_with(mock_app)

    @patch("app.core.tracing.FastAPIInstrumentor")
    @patch("app.core.tracing.SQLAlchemyInstrumentor")
    @patch("app.core.tracing.RedisInstrumentor")
    @patch("app.core.tracing.HTTPXClientInstrumentor")
    @patch("app.core.tracing.CeleryInstrumentor")
    def test_setup_instrumentation_all(
        self, mock_celery, mock_httpx, mock_redis, mock_sqlalchemy, mock_fastapi
    ):
        """Test full instrumentation setup."""
        mock_app = Mock()
        mock_engine = Mock()
        mock_engine.sync_engine = Mock()

        setup_instrumentation(app=mock_app, engine=mock_engine)

        mock_fastapi.instrument_app.assert_called_once_with(mock_app)
        mock_sqlalchemy.return_value.instrument.assert_called_once_with(
            engine=mock_engine.sync_engine
        )
        mock_redis.return_value.instrument.assert_called_once()
        mock_httpx.return_value.instrument.assert_called_once()
        mock_celery.return_value.instrument.assert_called_once()

    @patch("app.core.tracing.FastAPIInstrumentor", side_effect=ImportError)
    def test_setup_instrumentation_import_error(self, mock_fastapi):
        """Test instrumentation setup with import error."""
        mock_app = Mock()

        # Should not raise exception
        setup_instrumentation(app=mock_app)


class TestConfigValidation:
    """Test configuration validation in tracing."""

    def test_invalid_sampler_ratio(self):
        """Test handling of invalid sampler ratio."""
        mock_settings = Mock()
        mock_settings.otel_sdk_disabled = False
        mock_settings.otel_traces_exporter = "console"
        mock_settings.environment = "development"
        mock_settings.otel_service_name = "test-service"
        mock_settings.otel_service_version = None
        mock_settings.otel_resource_attributes = None
        mock_settings.otel_traces_sampler = "ratio"
        mock_settings.otel_traces_sampler_arg = "invalid"

        with patch("app.core.tracing.trace"), patch(
            "app.core.tracing.TracerProvider"
        ), patch("app.core.tracing.Resource"), patch(
            "app.core.tracing.TraceIdRatioBasedSampler"
        ) as mock_ratio_sampler, patch(
            "app.core.tracing._create_span_processor"
        ):
            setup_otlp_tracer_provider(mock_settings)

            # Should use default ratio of 1.0 for invalid value
            mock_ratio_sampler.assert_called_once_with(1.0)

    def test_invalid_resource_attributes(self):
        """Test handling of invalid resource attributes."""
        mock_settings = Mock()
        mock_settings.otel_sdk_disabled = False
        mock_settings.otel_traces_exporter = "console"
        mock_settings.environment = "development"
        mock_settings.otel_service_name = "test-service"
        mock_settings.otel_service_version = None
        mock_settings.otel_resource_attributes = "invalid-format"
        mock_settings.otel_traces_sampler = "always_on"
        mock_settings.otel_traces_sampler_arg = None

        with patch("app.core.tracing.trace"), patch(
            "app.core.tracing.TracerProvider"
        ), patch("app.core.tracing.Resource") as mock_resource, patch(
            "app.core.tracing.AlwaysOnSampler"
        ), patch(
            "app.core.tracing._create_span_processor"
        ):
            setup_otlp_tracer_provider(mock_settings)

            # Should still create resource with just service name
            mock_resource.assert_called_once()
            call_args = mock_resource.call_args[1]["attributes"]
            assert "test-service" in call_args["service.name"]
