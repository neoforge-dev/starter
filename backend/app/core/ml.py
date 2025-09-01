"""ML module."""
from importlib.metadata import version
from typing import Optional

from pydantic import BaseModel, Field

# Import MLflow
try:
    import mlflow
except ImportError:
    print("Warning: MLflow not available. Metrics logging will be disabled.")
    mlflow = None


class ModelMetrics(BaseModel):
    """Model metrics."""

    accuracy: float = Field(ge=0.0, le=1.0)
    precision: float = Field(ge=0.0, le=1.0)
    recall: float = Field(ge=0.0, le=1.0)
    training_cost: float = Field(gt=0.0)


def log_training_run(metrics: ModelMetrics) -> None:
    """
    Log model training metrics to MLflow.

    Args:
        metrics: Model metrics to log
    """
    if mlflow is None:
        print("Warning: MLflow not available. Skipping metrics logging.")
        return

    with mlflow.start_run():
        mlflow.log_param("model_type", "sklearn.ensemble.RandomForestClassifier")
        mlflow.log_metric("accuracy", metrics.accuracy)
        mlflow.log_metric("precision", metrics.precision)
        mlflow.log_metric("recall", metrics.recall)
        mlflow.log_metric("training_cost_usd", metrics.training_cost)
