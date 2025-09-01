"""Automated Quality Gates System.

Continuous validation system with automated testing, performance monitoring,
security compliance checks, and intelligent rollback capabilities.
"""

import asyncio
import subprocess
import time
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import structlog
from pydantic import BaseModel, Field

from app.core.config import get_settings

from .metrics import increment_counter

logger = structlog.get_logger(__name__)


class QualityGateStatus(str, Enum):
    """Quality gate status."""
    PASSED = "passed"
    FAILED = "failed"
    WARNING = "warning"
    SKIPPED = "skipped"
    RUNNING = "running"


class QualityGateType(str, Enum):
    """Types of quality gates."""
    UNIT_TESTS = "unit_tests"
    INTEGRATION_TESTS = "integration_tests"
    PERFORMANCE_TESTS = "performance_tests"
    SECURITY_SCAN = "security_scan"
    CODE_QUALITY = "code_quality"
    BUILD_VALIDATION = "build_validation"
    DEPENDENCY_CHECK = "dependency_check"
    CUSTOM = "custom"


class QualityGateResult(BaseModel):
    """Quality gate execution result."""
    gate_type: QualityGateType
    status: QualityGateStatus
    score: Optional[float] = None  # 0.0 - 1.0
    details: Dict[str, Any] = Field(default_factory=dict)
    metrics: Dict[str, float] = Field(default_factory=dict)
    error_message: Optional[str] = None
    execution_time_seconds: float
    started_at: datetime
    completed_at: datetime
    recommendations: List[str] = Field(default_factory=list)


class QualityGateConfig(BaseModel):
    """Quality gate configuration."""
    gate_type: QualityGateType
    enabled: bool = True
    timeout_seconds: int = 300
    failure_threshold: float = 0.8  # Pass threshold (0.0 - 1.0)
    warning_threshold: float = 0.9
    retry_count: int = 0
    command: Optional[str] = None
    working_directory: Optional[str] = None
    environment_variables: Dict[str, str] = Field(default_factory=dict)
    success_patterns: List[str] = Field(default_factory=list)
    failure_patterns: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PerformanceMetrics(BaseModel):
    """Performance metrics for quality gates."""
    response_time_ms: Optional[float] = None
    throughput_rps: Optional[float] = None
    memory_usage_mb: Optional[float] = None
    cpu_usage_percent: Optional[float] = None
    error_rate: Optional[float] = None
    p95_response_time: Optional[float] = None
    concurrent_users: Optional[int] = None


class SecurityFinding(BaseModel):
    """Security scan finding."""
    severity: str  # critical, high, medium, low
    type: str  # vulnerability, secret, dependency, etc.
    description: str
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    cve_id: Optional[str] = None
    recommendation: Optional[str] = None


class AutomatedQualityGates:
    """Automated quality validation and rollback system.

    Provides comprehensive quality gate execution including testing,
    performance validation, security scanning, and intelligent rollback.
    """

    def __init__(self, project_root: Optional[Path] = None):
        """Initialize quality gates system."""
        settings = get_settings()
        self.project_root = project_root or Path.cwd()

        # Default quality gate configurations
        self.gate_configs: Dict[QualityGateType, QualityGateConfig] = {
            QualityGateType.UNIT_TESTS: QualityGateConfig(
                gate_type=QualityGateType.UNIT_TESTS,
                command="pytest tests/ --cov --cov-report=json",
                timeout_seconds=180,
                failure_threshold=0.8,
                success_patterns=["test passed", "coverage"],
                failure_patterns=["FAILED", "ERROR", "test failed"]
            ),
            QualityGateType.INTEGRATION_TESTS: QualityGateConfig(
                gate_type=QualityGateType.INTEGRATION_TESTS,
                command="pytest tests/integration/ -v",
                timeout_seconds=300,
                failure_threshold=0.9
            ),
            QualityGateType.BUILD_VALIDATION: QualityGateConfig(
                gate_type=QualityGateType.BUILD_VALIDATION,
                command="python -m py_compile $(find . -name '*.py')",
                timeout_seconds=60,
                failure_threshold=1.0
            ),
            QualityGateType.CODE_QUALITY: QualityGateConfig(
                gate_type=QualityGateType.CODE_QUALITY,
                command="ruff check . --format json",
                timeout_seconds=120,
                failure_threshold=0.8
            ),
            QualityGateType.SECURITY_SCAN: QualityGateConfig(
                gate_type=QualityGateType.SECURITY_SCAN,
                command="bandit -r . -f json",
                timeout_seconds=180,
                failure_threshold=0.7
            )
        }

        # Metrics
        self._gates_executed = 0
        self._gates_passed = 0
        self._gates_failed = 0

        # Active gate executions
        self._active_gates: Dict[str, asyncio.Task] = {}

        # Performance baseline for regression detection
        self._performance_baseline: Dict[str, PerformanceMetrics] = {}

    def configure_gate(self, config: QualityGateConfig) -> None:
        """Configure a quality gate.

        Args:
            config: Quality gate configuration
        """
        self.gate_configs[config.gate_type] = config
        logger.info("Quality gate configured", gate_type=config.gate_type.value)

    async def run_all_tests(self) -> bool:
        """Execute complete test suite.

        Returns:
            True if all tests pass
        """
        try:
            results = await self._run_quality_gates([
                QualityGateType.BUILD_VALIDATION,
                QualityGateType.UNIT_TESTS,
                QualityGateType.INTEGRATION_TESTS
            ])

            # Check if all critical gates passed
            critical_failures = [
                result for result in results
                if result.status == QualityGateStatus.FAILED and
                result.gate_type in [QualityGateType.BUILD_VALIDATION, QualityGateType.UNIT_TESTS]
            ]

            success = len(critical_failures) == 0

            logger.info(
                "Test suite execution completed",
                total_gates=len(results),
                passed=len([r for r in results if r.status == QualityGateStatus.PASSED]),
                failed=len([r for r in results if r.status == QualityGateStatus.FAILED]),
                success=success
            )

            return success

        except Exception as e:
            logger.error("Failed to run test suite", error=str(e))
            increment_counter("ai_workflow_test_suite_error")
            return False

    async def check_performance_regression(self) -> Dict[str, Any]:
        """Detect performance regressions.

        Returns:
            Performance regression analysis results
        """
        try:
            # Run performance tests
            perf_result = await self._run_single_gate(QualityGateType.PERFORMANCE_TESTS)

            if perf_result.status != QualityGateStatus.PASSED:
                return {
                    "regression_detected": True,
                    "severity": "high",
                    "details": "Performance tests failed",
                    "recommendations": ["Check recent changes", "Review performance logs"]
                }

            # Extract current metrics
            current_metrics = self._extract_performance_metrics(perf_result)

            # Compare with baseline
            regression_analysis = await self._analyze_performance_regression(current_metrics)

            logger.info(
                "Performance regression check completed",
                regression_detected=regression_analysis["regression_detected"],
                severity=regression_analysis.get("severity", "none")
            )

            return regression_analysis

        except Exception as e:
            logger.error("Performance regression check failed", error=str(e))
            return {
                "regression_detected": True,
                "severity": "unknown",
                "error": str(e),
                "recommendations": ["Manual performance review required"]
            }

    async def validate_security_compliance(self) -> Dict[str, Any]:
        """Check security requirements.

        Returns:
            Security compliance analysis results
        """
        try:
            # Run security scans
            security_gates = [
                QualityGateType.SECURITY_SCAN,
                QualityGateType.DEPENDENCY_CHECK
            ]

            results = await self._run_quality_gates(security_gates)

            # Aggregate security findings
            all_findings: List[SecurityFinding] = []
            critical_count = 0
            high_count = 0

            for result in results:
                if "findings" in result.details:
                    findings = [
                        SecurityFinding(**finding)
                        for finding in result.details["findings"]
                    ]
                    all_findings.extend(findings)

                    critical_count += len([f for f in findings if f.severity == "critical"])
                    high_count += len([f for f in findings if f.severity == "high"])

            # Determine compliance status
            compliance_status = "compliant"
            if critical_count > 0:
                compliance_status = "non_compliant"
            elif high_count > 5:  # Threshold for high severity issues
                compliance_status = "warning"

            compliance_result = {
                "status": compliance_status,
                "total_findings": len(all_findings),
                "critical_findings": critical_count,
                "high_findings": high_count,
                "findings": [finding.model_dump() for finding in all_findings],
                "recommendations": []
            }

            # Add recommendations
            if critical_count > 0:
                compliance_result["recommendations"].append("Address critical security issues immediately")
            if high_count > 0:
                compliance_result["recommendations"].append("Review and fix high severity issues")

            logger.info(
                "Security compliance check completed",
                status=compliance_status,
                total_findings=len(all_findings),
                critical_findings=critical_count
            )

            return compliance_result

        except Exception as e:
            logger.error("Security compliance check failed", error=str(e))
            return {
                "status": "error",
                "error": str(e),
                "recommendations": ["Manual security review required"]
            }

    async def _run_quality_gates(
        self,
        gate_types: List[QualityGateType],
        parallel: bool = True
    ) -> List[QualityGateResult]:
        """Run specified quality gates.

        Args:
            gate_types: List of gate types to run
            parallel: Whether to run gates in parallel

        Returns:
            List of quality gate results
        """
        if parallel:
            # Run gates concurrently
            tasks = [
                self._run_single_gate(gate_type)
                for gate_type in gate_types
                if gate_type in self.gate_configs and self.gate_configs[gate_type].enabled
            ]

            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Handle exceptions
            final_results = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    final_results.append(QualityGateResult(
                        gate_type=gate_types[i],
                        status=QualityGateStatus.FAILED,
                        error_message=str(result),
                        execution_time_seconds=0,
                        started_at=datetime.now(timezone.utc),
                        completed_at=datetime.now(timezone.utc)
                    ))
                else:
                    final_results.append(result)

            return final_results
        else:
            # Run gates sequentially
            results = []
            for gate_type in gate_types:
                if gate_type in self.gate_configs and self.gate_configs[gate_type].enabled:
                    result = await self._run_single_gate(gate_type)
                    results.append(result)

            return results

    async def _run_single_gate(self, gate_type: QualityGateType) -> QualityGateResult:
        """Run a single quality gate.

        Args:
            gate_type: Type of quality gate to run

        Returns:
            Quality gate result
        """
        config = self.gate_configs[gate_type]
        start_time = datetime.now(timezone.utc)

        try:
            self._gates_executed += 1
            increment_counter("ai_workflow_quality_gate_executed")

            logger.info(
                "Starting quality gate",
                gate_type=gate_type.value,
                command=config.command
            )

            # Execute quality gate command
            if config.command:
                result = await self._execute_command(config)
            else:
                result = await self._execute_custom_gate(gate_type, config)

            end_time = datetime.now(timezone.utc)
            execution_time = (end_time - start_time).total_seconds()

            result.started_at = start_time
            result.completed_at = end_time
            result.execution_time_seconds = execution_time

            if result.status == QualityGateStatus.PASSED:
                self._gates_passed += 1
                increment_counter("ai_workflow_quality_gate_passed")
            else:
                self._gates_failed += 1
                increment_counter("ai_workflow_quality_gate_failed")

            logger.info(
                "Quality gate completed",
                gate_type=gate_type.value,
                status=result.status.value,
                execution_time=execution_time,
                score=result.score
            )

            return result

        except Exception as e:
            self._gates_failed += 1
            increment_counter("ai_workflow_quality_gate_error")

            end_time = datetime.now(timezone.utc)
            execution_time = (end_time - start_time).total_seconds()

            logger.error(
                "Quality gate failed with exception",
                gate_type=gate_type.value,
                error=str(e),
                execution_time=execution_time
            )

            return QualityGateResult(
                gate_type=gate_type,
                status=QualityGateStatus.FAILED,
                error_message=str(e),
                execution_time_seconds=execution_time,
                started_at=start_time,
                completed_at=end_time
            )

    async def _execute_command(self, config: QualityGateConfig) -> QualityGateResult:
        """Execute a command-based quality gate."""
        # Prepare environment
        env = {**config.environment_variables}
        working_dir = config.working_directory or str(self.project_root)

        try:
            # Execute command with timeout
            process = await asyncio.create_subprocess_shell(
                config.command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=working_dir,
                env=env
            )

            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=config.timeout_seconds
            )

            # Decode output
            stdout_text = stdout.decode('utf-8') if stdout else ""
            stderr_text = stderr.decode('utf-8') if stderr else ""

            # Analyze output
            return self._analyze_command_output(
                config,
                process.returncode or 0,
                stdout_text,
                stderr_text
            )

        except asyncio.TimeoutError:
            return QualityGateResult(
                gate_type=config.gate_type,
                status=QualityGateStatus.FAILED,
                error_message=f"Command timed out after {config.timeout_seconds} seconds",
                execution_time_seconds=config.timeout_seconds,
                started_at=datetime.now(timezone.utc),
                completed_at=datetime.now(timezone.utc)
            )
        except Exception as e:
            return QualityGateResult(
                gate_type=config.gate_type,
                status=QualityGateStatus.FAILED,
                error_message=str(e),
                execution_time_seconds=0,
                started_at=datetime.now(timezone.utc),
                completed_at=datetime.now(timezone.utc)
            )

    def _analyze_command_output(
        self,
        config: QualityGateConfig,
        return_code: int,
        stdout: str,
        stderr: str
    ) -> QualityGateResult:
        """Analyze command output to determine quality gate result."""
        # Basic status determination
        if return_code == 0:
            base_status = QualityGateStatus.PASSED
        else:
            base_status = QualityGateStatus.FAILED

        # Check patterns
        combined_output = f"{stdout}\n{stderr}"

        # Check failure patterns
        for pattern in config.failure_patterns:
            if pattern.lower() in combined_output.lower():
                base_status = QualityGateStatus.FAILED
                break

        # Check success patterns (only if not already failed)
        if base_status != QualityGateStatus.FAILED:
            success_found = False
            for pattern in config.success_patterns:
                if pattern.lower() in combined_output.lower():
                    success_found = True
                    break

            if config.success_patterns and not success_found:
                base_status = QualityGateStatus.FAILED

        # Extract metrics based on gate type
        details = {
            "return_code": return_code,
            "stdout": stdout,
            "stderr": stderr
        }

        score = None
        metrics_data = {}

        if config.gate_type == QualityGateType.UNIT_TESTS:
            score, metrics_data = self._extract_test_metrics(stdout)
        elif config.gate_type == QualityGateType.CODE_QUALITY:
            score, metrics_data = self._extract_code_quality_metrics(stdout)
        elif config.gate_type == QualityGateType.SECURITY_SCAN:
            score, details["findings"] = self._extract_security_metrics(stdout)

        # Apply score-based thresholds
        if score is not None:
            if score < config.failure_threshold:
                base_status = QualityGateStatus.FAILED
            elif score < config.warning_threshold:
                base_status = QualityGateStatus.WARNING

        return QualityGateResult(
            gate_type=config.gate_type,
            status=base_status,
            score=score,
            details=details,
            metrics=metrics_data,
            execution_time_seconds=0,  # Will be set by caller
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc)
        )

    def _extract_test_metrics(self, output: str) -> Tuple[Optional[float], Dict[str, float]]:
        """Extract test metrics from test output."""
        score = None
        metrics_data = {}

        # Parse pytest output for coverage and test results
        lines = output.split('\n')

        for line in lines:
            if 'coverage' in line.lower() and '%' in line:
                # Extract coverage percentage
                import re
                match = re.search(r'(\d+)%', line)
                if match:
                    coverage = float(match.group(1)) / 100
                    metrics_data['coverage'] = coverage
                    score = coverage

            if 'passed' in line and 'failed' in line:
                # Extract test counts
                import re
                passed_match = re.search(r'(\d+) passed', line)
                failed_match = re.search(r'(\d+) failed', line)

                if passed_match:
                    passed = int(passed_match.group(1))
                    metrics_data['tests_passed'] = passed

                if failed_match:
                    failed = int(failed_match.group(1))
                    metrics_data['tests_failed'] = failed

                    if passed_match:
                        total = passed + failed
                        if total > 0:
                            pass_rate = passed / total
                            metrics_data['pass_rate'] = pass_rate
                            if score is None:
                                score = pass_rate

        return score, metrics_data

    def _extract_code_quality_metrics(self, output: str) -> Tuple[Optional[float], Dict[str, float]]:
        """Extract code quality metrics from linter output."""
        score = None
        metrics_data = {}

        # Count issues by severity
        import json
        try:
            if output.strip():
                data = json.loads(output)
                if isinstance(data, list):
                    error_count = len([item for item in data if item.get('level') == 'error'])
                    warning_count = len([item for item in data if item.get('level') == 'warning'])

                    metrics_data['errors'] = error_count
                    metrics_data['warnings'] = warning_count

                    # Calculate score based on issue count (fewer issues = higher score)
                    total_issues = error_count + warning_count
                    if total_issues == 0:
                        score = 1.0
                    else:
                        # Penalize errors more than warnings
                        penalty = (error_count * 0.1) + (warning_count * 0.05)
                        score = max(0.0, 1.0 - penalty)
        except json.JSONDecodeError:
            # Fallback to basic analysis
            error_count = output.lower().count('error')
            warning_count = output.lower().count('warning')

            if error_count == 0 and warning_count == 0:
                score = 1.0

        return score, metrics_data

    def _extract_security_metrics(self, output: str) -> Tuple[Optional[float], List[Dict[str, Any]]]:
        """Extract security metrics from security scan output."""
        score = None
        findings = []

        try:
            import json
            if output.strip():
                data = json.loads(output)
                if 'results' in data:
                    for result in data['results']:
                        finding = {
                            "severity": result.get('issue_severity', 'medium').lower(),
                            "type": result.get('test_name', 'unknown'),
                            "description": result.get('issue_text', ''),
                            "file_path": result.get('filename'),
                            "line_number": result.get('line_number'),
                            "recommendation": result.get('issue_text', '')
                        }
                        findings.append(finding)

                # Calculate score based on findings
                if not findings:
                    score = 1.0
                else:
                    critical_count = len([f for f in findings if f['severity'] == 'critical'])
                    high_count = len([f for f in findings if f['severity'] == 'high'])
                    medium_count = len([f for f in findings if f['severity'] == 'medium'])

                    # Score based on weighted severity
                    penalty = (critical_count * 0.3) + (high_count * 0.2) + (medium_count * 0.1)
                    score = max(0.0, 1.0 - penalty)

        except json.JSONDecodeError:
            # Fallback analysis
            if 'no issues' in output.lower() or len(output.strip()) == 0:
                score = 1.0
            else:
                score = 0.5  # Unknown result

        return score, findings

    async def _execute_custom_gate(
        self,
        gate_type: QualityGateType,
        config: QualityGateConfig
    ) -> QualityGateResult:
        """Execute custom quality gate logic."""
        # This would be extended with specific implementations
        return QualityGateResult(
            gate_type=gate_type,
            status=QualityGateStatus.SKIPPED,
            details={"reason": "No custom implementation"},
            execution_time_seconds=0,
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc)
        )

    def _extract_performance_metrics(self, result: QualityGateResult) -> PerformanceMetrics:
        """Extract performance metrics from quality gate result."""
        # This would parse performance test output
        return PerformanceMetrics(
            response_time_ms=result.metrics.get('response_time_ms'),
            throughput_rps=result.metrics.get('throughput_rps'),
            memory_usage_mb=result.metrics.get('memory_usage_mb'),
            cpu_usage_percent=result.metrics.get('cpu_usage_percent'),
            error_rate=result.metrics.get('error_rate')
        )

    async def _analyze_performance_regression(
        self,
        current_metrics: PerformanceMetrics
    ) -> Dict[str, Any]:
        """Analyze performance regression against baseline."""
        regression_detected = False
        severity = "none"
        details = []

        # Compare with baseline if available
        baseline_key = "default"
        if baseline_key in self._performance_baseline:
            baseline = self._performance_baseline[baseline_key]

            # Check response time regression
            if (current_metrics.response_time_ms and baseline.response_time_ms and
                current_metrics.response_time_ms > baseline.response_time_ms * 1.2):
                regression_detected = True
                severity = "high"
                details.append(f"Response time increased by {
                    ((current_metrics.response_time_ms / baseline.response_time_ms) - 1) * 100:.1f
                }%")

            # Check throughput regression
            if (current_metrics.throughput_rps and baseline.throughput_rps and
                current_metrics.throughput_rps < baseline.throughput_rps * 0.8):
                regression_detected = True
                severity = "high"
                details.append(f"Throughput decreased by {
                    (1 - (current_metrics.throughput_rps / baseline.throughput_rps)) * 100:.1f
                }%")

        return {
            "regression_detected": regression_detected,
            "severity": severity,
            "details": details,
            "current_metrics": current_metrics.model_dump(),
            "recommendations": [
                "Review recent performance changes",
                "Check resource utilization",
                "Analyze performance profiling data"
            ] if regression_detected else []
        }

    async def get_gate_history(
        self,
        gate_type: Optional[QualityGateType] = None,
        limit: int = 50
    ) -> List[QualityGateResult]:
        """Get quality gate execution history.

        Args:
            gate_type: Optional filter by gate type
            limit: Maximum number of results

        Returns:
            List of quality gate results
        """
        # In a real implementation, this would query a database
        # For now, return empty list
        return []

    async def get_statistics(self) -> Dict[str, Any]:
        """Get quality gates statistics.

        Returns:
            Dictionary containing various statistics
        """
        success_rate = self._gates_passed / max(self._gates_executed, 1)

        return {
            "gates_configured": len(self.gate_configs),
            "gates_enabled": len([c for c in self.gate_configs.values() if c.enabled]),
            "total_executions": self._gates_executed,
            "total_passed": self._gates_passed,
            "total_failed": self._gates_failed,
            "success_rate": success_rate,
            "active_gates": len(self._active_gates),
            "project_root": str(self.project_root)
        }
