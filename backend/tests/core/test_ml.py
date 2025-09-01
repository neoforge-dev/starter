"""
Test ML module functionality.

This test verifies that the ML module works correctly, including:
- Model metrics validation
- Training run logging
- Handling of missing MLflow dependency

All tests use mocking to avoid actual MLflow connections.
"""

import sys
from unittest.mock import MagicMock, patch

import pytest
from pydantic import ValidationError

from app.core.ml import ModelMetrics, log_training_run


@pytest.fixture
def valid_metrics():
    """Create valid model metrics."""
    return ModelMetrics(
        accuracy=0.85,
        precision=0.78,
        recall=0.92,
        training_cost=12.5,
    )


def test_model_metrics_validation():
    """Test that ModelMetrics validates input values correctly."""
    # Valid metrics
    metrics = ModelMetrics(
        accuracy=0.85,
        precision=0.78,
        recall=0.92,
        training_cost=12.5,
    )
    assert metrics.accuracy == 0.85
    assert metrics.precision == 0.78
    assert metrics.recall == 0.92
    assert metrics.training_cost == 12.5

    # Test boundary values
    metrics = ModelMetrics(
        accuracy=0.0,
        precision=0.0,
        recall=0.0,
        training_cost=0.1,
    )
    assert metrics.accuracy == 0.0
    assert metrics.precision == 0.0
    assert metrics.recall == 0.0
    assert metrics.training_cost == 0.1

    metrics = ModelMetrics(
        accuracy=1.0,
        precision=1.0,
        recall=1.0,
        training_cost=1000.0,
    )
    assert metrics.accuracy == 1.0
    assert metrics.precision == 1.0
    assert metrics.recall == 1.0
    assert metrics.training_cost == 1000.0


def test_model_metrics_validation_errors():
    """Test that ModelMetrics raises validation errors for invalid values."""
    # Test accuracy out of range
    with pytest.raises(ValidationError):
        ModelMetrics(
            accuracy=-0.1,  # Invalid: less than 0
            precision=0.78,
            recall=0.92,
            training_cost=12.5,
        )

    with pytest.raises(ValidationError):
        ModelMetrics(
            accuracy=1.1,  # Invalid: greater than 1
            precision=0.78,
            recall=0.92,
            training_cost=12.5,
        )

    # Test precision out of range
    with pytest.raises(ValidationError):
        ModelMetrics(
            accuracy=0.85,
            precision=-0.1,  # Invalid: less than 0
            recall=0.92,
            training_cost=12.5,
        )

    with pytest.raises(ValidationError):
        ModelMetrics(
            accuracy=0.85,
            precision=1.1,  # Invalid: greater than 1
            recall=0.92,
            training_cost=12.5,
        )

    # Test recall out of range
    with pytest.raises(ValidationError):
        ModelMetrics(
            accuracy=0.85,
            precision=0.78,
            recall=-0.1,  # Invalid: less than 0
            training_cost=12.5,
        )

    with pytest.raises(ValidationError):
        ModelMetrics(
            accuracy=0.85,
            precision=0.78,
            recall=1.1,  # Invalid: greater than 1
            training_cost=12.5,
        )

    # Test training_cost not positive
    with pytest.raises(ValidationError):
        ModelMetrics(
            accuracy=0.85,
            precision=0.78,
            recall=0.92,
            training_cost=0.0,  # Invalid: not greater than 0
        )

    with pytest.raises(ValidationError):
        ModelMetrics(
            accuracy=0.85,
            precision=0.78,
            recall=0.92,
            training_cost=-1.0,  # Invalid: negative
        )


@patch("app.core.ml.mlflow")
def test_log_training_run(mock_mlflow, valid_metrics):
    """Test that log_training_run logs metrics to MLflow correctly."""
    # Setup mock
    mock_start_run = MagicMock()
    mock_mlflow.start_run.return_value.__enter__ = mock_start_run

    # Call function
    log_training_run(valid_metrics)

    # Verify MLflow calls
    mock_mlflow.start_run.assert_called_once()
    mock_mlflow.log_param.assert_called_once_with(
        "model_type", "sklearn.ensemble.RandomForestClassifier"
    )

    # Verify metrics logging
    mock_mlflow.log_metric.assert_any_call("accuracy", valid_metrics.accuracy)
    mock_mlflow.log_metric.assert_any_call("precision", valid_metrics.precision)
    mock_mlflow.log_metric.assert_any_call("recall", valid_metrics.recall)
    mock_mlflow.log_metric.assert_any_call(
        "training_cost_usd", valid_metrics.training_cost
    )


@patch("app.core.ml.mlflow", None)
def test_log_training_run_without_mlflow(valid_metrics, capsys):
    """Test that log_training_run handles missing MLflow gracefully."""
    # Call function
    log_training_run(valid_metrics)

    # Verify warning message
    captured = capsys.readouterr()
    assert "Warning: MLflow not available. Skipping metrics logging." in captured.out


@patch("app.core.ml.mlflow")
def test_log_training_run_with_exception(mock_mlflow, valid_metrics):
    """Test that log_training_run handles exceptions gracefully."""
    # Setup mock to raise exception
    mock_mlflow.start_run.side_effect = Exception("Test exception")

    # Call function and expect exception to propagate
    with pytest.raises(Exception) as excinfo:
        log_training_run(valid_metrics)

    # Verify exception
    assert "Test exception" in str(excinfo.value)
