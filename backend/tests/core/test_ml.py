"""Tests for ML module."""
import pytest
from unittest.mock import patch, MagicMock
from pydantic import ValidationError

from app.core.ml import ModelMetrics, log_training_run


def test_model_metrics_validation():
    """Test ModelMetrics validation."""
    # Valid metrics
    metrics = ModelMetrics(
        accuracy=0.95,
        precision=0.92,
        recall=0.89,
        training_cost=10.50
    )
    assert metrics.accuracy == 0.95
    assert metrics.precision == 0.92
    assert metrics.recall == 0.89
    assert metrics.training_cost == 10.50

    # Invalid accuracy (> 1.0)
    with pytest.raises(ValidationError):
        ModelMetrics(
            accuracy=1.1,
            precision=0.92,
            recall=0.89,
            training_cost=10.50
        )

    # Invalid precision (< 0.0)
    with pytest.raises(ValidationError):
        ModelMetrics(
            accuracy=0.95,
            precision=-0.1,
            recall=0.89,
            training_cost=10.50
        )

    # Invalid recall (> 1.0)
    with pytest.raises(ValidationError):
        ModelMetrics(
            accuracy=0.95,
            precision=0.92,
            recall=1.1,
            training_cost=10.50
        )

    # Invalid training cost (≤ 0.0)
    with pytest.raises(ValidationError):
        ModelMetrics(
            accuracy=0.95,
            precision=0.92,
            recall=0.89,
            training_cost=0.0
        )


def test_log_training_run_with_mlflow():
    """Test log_training_run with MLflow available."""
    metrics = ModelMetrics(
        accuracy=0.95,
        precision=0.92,
        recall=0.89,
        training_cost=10.50
    )

    mock_mlflow = MagicMock()
    mock_context = MagicMock()
    mock_mlflow.start_run.return_value = mock_context

    with patch('app.core.ml.mlflow', mock_mlflow):
        log_training_run(metrics)

        # Verify MLflow interactions
        mock_mlflow.start_run.assert_called_once()
        mock_mlflow.log_param.assert_called_once_with(
            "model_type", "sklearn.ensemble.RandomForestClassifier"
        )
        mock_mlflow.log_metric.assert_any_call("accuracy", 0.95)
        mock_mlflow.log_metric.assert_any_call("precision", 0.92)
        mock_mlflow.log_metric.assert_any_call("recall", 0.89)
        mock_mlflow.log_metric.assert_any_call("training_cost_usd", 10.50)


def test_log_training_run_without_mlflow():
    """Test log_training_run with MLflow not available."""
    metrics = ModelMetrics(
        accuracy=0.95,
        precision=0.92,
        recall=0.89,
        training_cost=10.50
    )

    with patch('app.core.ml.mlflow', None):
        # Should not raise any exceptions
        log_training_run(metrics)