"""Test ML module."""
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, UTC

from app.core.ml import ModelMetrics, log_training_run


def test_model_metrics_validation():
    """Test ModelMetrics validation."""
    # Test valid metrics
    metrics = ModelMetrics(
        accuracy=0.95,
        precision=0.92,
        recall=0.89,
        training_cost=123.45,
    )
    assert metrics.accuracy == 0.95
    assert metrics.precision == 0.92
    assert metrics.recall == 0.89
    assert metrics.training_cost == 123.45

    # Test invalid metrics
    with pytest.raises(ValueError, match="Input should be greater than or equal to 0"):
        ModelMetrics(
            accuracy=-0.5,  # Invalid: negative accuracy
            precision=0.92,
            recall=0.89,
            training_cost=123.45,
        )
    
    with pytest.raises(ValueError, match="Input should be less than or equal to 1"):
        ModelMetrics(
            accuracy=1.5,  # Invalid: accuracy > 1
            precision=0.92,
            recall=0.89,
            training_cost=123.45,
        )
    
    with pytest.raises(ValueError, match="Input should be greater than 0"):
        ModelMetrics(
            accuracy=0.95,
            precision=0.92,
            recall=0.89,
            training_cost=0.0,  # Invalid: zero training cost
        )

    # Test invalid precision
    with pytest.raises(ValueError, match="Input should be greater than or equal to 0"):
        ModelMetrics(
            accuracy=0.95,
            precision=-0.1,  # Invalid: negative precision
            recall=0.89,
            training_cost=123.45,
        )
    
    with pytest.raises(ValueError, match="Input should be less than or equal to 1"):
        ModelMetrics(
            accuracy=0.95,
            precision=1.1,  # Invalid: precision > 1
            recall=0.89,
            training_cost=123.45,
        )

    # Test invalid recall
    with pytest.raises(ValueError, match="Input should be greater than or equal to 0"):
        ModelMetrics(
            accuracy=0.95,
            precision=0.92,
            recall=-0.1,  # Invalid: negative recall
            training_cost=123.45,
        )
    
    with pytest.raises(ValueError, match="Input should be less than or equal to 1"):
        ModelMetrics(
            accuracy=0.95,
            precision=0.92,
            recall=1.1,  # Invalid: recall > 1
            training_cost=123.45,
        )

    # Test invalid training cost
    with pytest.raises(ValueError, match="Input should be greater than 0"):
        ModelMetrics(
            accuracy=0.95,
            precision=0.92,
            recall=0.89,
            training_cost=-1.0,  # Invalid: negative training cost
        )


@patch("app.core.ml.mlflow")
def test_log_training_run(mock_mlflow):
    """Test logging training run."""
    metrics = ModelMetrics(
        accuracy=0.95,
        precision=0.92,
        recall=0.89,
        training_cost=123.45,
    )
    
    # Create a context manager mock
    mock_context = MagicMock()
    mock_mlflow.start_run.return_value = mock_context
    mock_context.__enter__.return_value = None
    mock_context.__exit__.return_value = None
    
    log_training_run(metrics)
    
    # Verify mlflow.start_run was called
    mock_mlflow.start_run.assert_called_once()
    
    # Verify log_param was called with correct arguments
    mock_mlflow.log_param.assert_called_once_with(
        "model_type", "sklearn.ensemble.RandomForestClassifier"
    )
    
    # Verify log_metric was called with correct arguments
    assert mock_mlflow.log_metric.call_count == 4
    mock_mlflow.log_metric.assert_any_call("accuracy", 0.95)
    mock_mlflow.log_metric.assert_any_call("precision", 0.92)
    mock_mlflow.log_metric.assert_any_call("recall", 0.89)
    mock_mlflow.log_metric.assert_any_call("training_cost_usd", 123.45)


@patch("app.core.ml.mlflow")
def test_log_training_run_with_error(mock_mlflow):
    """Test logging training run with error."""
    metrics = ModelMetrics(
        accuracy=0.95,
        precision=0.92,
        recall=0.89,
        training_cost=123.45,
    )

    # Create a context manager mock
    mock_context = MagicMock()
    mock_mlflow.start_run.return_value = mock_context
    mock_context.__enter__.return_value = None
    mock_context.__exit__.return_value = None

    # Mock log_param to raise an exception
    mock_mlflow.log_param.side_effect = Exception("MLflow error")

    # The function should raise the exception
    with pytest.raises(Exception) as exc_info:
        log_training_run(metrics)

    assert str(exc_info.value) == "MLflow error"
    mock_mlflow.start_run.assert_called_once()
    mock_mlflow.log_param.assert_called_once()
    assert mock_mlflow.log_metric.call_count == 0