"""Test ML module."""
import pytest
from unittest.mock import patch

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


@patch("app.core.ml.mlflow.start_run")
def test_log_training_run(mock_start_run):
    """Test logging training run."""
    metrics = ModelMetrics(
        accuracy=0.95,
        precision=0.92,
        recall=0.89,
        training_cost=123.45,
    )
    
    with patch("app.core.ml.mlflow.log_param") as mock_log_param, \
         patch("app.core.ml.mlflow.log_metric") as mock_log_metric:
        log_training_run(metrics)
        
        # Verify mlflow.start_run was called
        mock_start_run.assert_called_once()
        
        # Verify log_param was called with correct arguments
        mock_log_param.assert_called_once_with(
            "model_type", "sklearn.ensemble.RandomForestClassifier"
        )
        
        # Verify log_metric was called with correct arguments
        assert mock_log_metric.call_count == 4
        mock_log_metric.assert_any_call("accuracy", 0.95)
        mock_log_metric.assert_any_call("precision", 0.92)
        mock_log_metric.assert_any_call("recall", 0.89)
        mock_log_metric.assert_any_call("training_cost_usd", 123.45)