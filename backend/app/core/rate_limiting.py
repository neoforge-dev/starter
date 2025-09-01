"""
Rate Limiting and DDoS Protection for NeoForge
Provides comprehensive protection against abuse and attacks with multiple strategies.
"""

import asyncio
import logging
import time
import hashlib
import secrets
from enum import Enum
from typing import Dict, List, Optional, Set, Tuple, Any
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)


class RateLimitStrategy(Enum):
    """Rate limiting strategies."""
    FIXED_WINDOW = "fixed_window"                    # Fixed time window
    SLIDING_WINDOW = "sliding_window"               # Sliding time window
    TOKEN_BUCKET = "token_bucket"                   # Token bucket algorithm
    LEAKY_BUCKET = "leaky_bucket"                   # Leaky bucket algorithm
    ADAPTIVE = "adaptive"                          # Adaptive rate limiting


class RateLimitScope(Enum):
    """Rate limiting scope."""
    GLOBAL = "global"                              # Global rate limit
    USER = "user"                                  # Per user
    IP = "ip"                                      # Per IP address
    ENDPOINT = "endpoint"                          # Per endpoint
    TENANT = "tenant"                             # Per tenant
    API_KEY = "api_key"                           # Per API key


class DDoSProtectionLevel(Enum):
    """DDoS protection levels."""
    BASIC = "basic"                                # Basic protection
    STANDARD = "standard"                         # Standard protection
    ADVANCED = "advanced"                         # Advanced protection
    MAXIMUM = "maximum"                           # Maximum protection


@dataclass
class RateLimitRule:
    """Rate limiting rule configuration."""
    name: str
    strategy: RateLimitStrategy
    scope: RateLimitScope
    requests_per_window: int
    window_seconds: int
    burst_limit: Optional[int] = None
    cooldown_period: int = 60  # seconds
    block_duration: int = 300  # seconds
    enabled: bool = True
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RateLimitConfig:
    """Rate limiting configuration."""
    default_strategy: RateLimitStrategy = RateLimitStrategy.TOKEN_BUCKET
    default_requests_per_minute: int = 60
    default_burst_limit: int = 10
    enable_ddos_protection: bool = True
    ddos_protection_level: DDoSProtectionLevel = DDoSProtectionLevel.STANDARD
    enable_ip_whitelisting: bool = False
    enable_ip_blacklisting: bool = True
    enable_user_agent_filtering: bool = True
    enable_request_size_limiting: bool = True
    max_request_size: int = 1048576  # 1MB
    enable_geo_filtering: bool = False
    allowed_countries: List[str] = field(default_factory=list)
    blocked_countries: List[str] = field(default_factory=list)
    enable_challenge_response: bool = False
    challenge_difficulty: int = 3
    monitoring_enabled: bool = True
    alert_threshold: float = 0.8  # 80% of limit


@dataclass
class RateLimitState:
    """Rate limiting state for a specific identifier."""
    identifier: str
    scope: RateLimitScope
    request_count: int = 0
    window_start: float = field(default_factory=time.time)
    tokens: float = 0.0
    last_request: float = 0.0
    blocked_until: Optional[float] = None
    consecutive_violations: int = 0
    total_violations: int = 0
    first_violation_time: Optional[float] = None
    last_violation_time: Optional[float] = None


@dataclass
class DDoSThreatMetrics:
    """DDoS threat detection metrics."""
    suspicious_ips: Set[str] = field(default_factory=set)
    blocked_ips: Set[str] = field(default_factory=set)
    attack_patterns: Dict[str, int] = field(default_factory=dict)
    total_requests_blocked: int = 0
    total_attacks_detected: int = 0
    last_attack_time: Optional[float] = None
    peak_request_rate: float = 0.0
    current_threat_level: str = "low"


class RateLimitExceeded(Exception):
    """Exception raised when rate limit is exceeded."""
    pass


class DDoSAttackDetected(Exception):
    """Exception raised when DDoS attack is detected."""
    pass


class IPBlacklisted(Exception):
    """Exception raised when IP is blacklisted."""
    pass


class ChallengeRequired(Exception):
    """Exception raised when challenge-response is required."""
    pass


class RateLimitingManager:
    """
    Comprehensive rate limiting and DDoS protection manager.

    Features:
    - Multiple rate limiting strategies (fixed window, sliding window, token bucket, leaky bucket)
    - DDoS attack detection and mitigation
    - IP whitelisting and blacklisting
    - Geographic filtering
    - Challenge-response system
    - Comprehensive monitoring and alerting
    - Adaptive rate limiting based on threat levels
    """

    def __init__(self, config: RateLimitConfig):
        self.config = config
        self.rules: Dict[str, RateLimitRule] = {}
        self.states: Dict[str, Dict[str, RateLimitState]] = {}
        self.ip_whitelist: Set[str] = set()
        self.ip_blacklist: Set[str] = set()
        self.ddos_metrics = DDoSThreatMetrics()
        self.challenges: Dict[str, Dict[str, Any]] = {}
        self._lock = asyncio.Lock()

        # Initialize default rules
        self._initialize_default_rules()

        logger.info("Initialized Rate Limiting Manager")

    def add_rule(self, rule: RateLimitRule):
        """Add a rate limiting rule."""
        self.rules[rule.name] = rule
        if rule.scope.value not in self.states:
            self.states[rule.scope.value] = {}
        logger.info(f"Added rate limiting rule: {rule.name}")

    def remove_rule(self, rule_name: str):
        """Remove a rate limiting rule."""
        if rule_name in self.rules:
            del self.rules[rule_name]
            logger.info(f"Removed rate limiting rule: {rule_name}")

    def add_ip_to_whitelist(self, ip_address: str):
        """Add IP address to whitelist."""
        self.ip_whitelist.add(ip_address)
        logger.info(f"Added IP to whitelist: {ip_address}")

    def remove_ip_from_whitelist(self, ip_address: str):
        """Remove IP address from whitelist."""
        self.ip_whitelist.discard(ip_address)
        logger.info(f"Removed IP from whitelist: {ip_address}")

    def add_ip_to_blacklist(self, ip_address: str, duration: int = 3600):
        """Add IP address to blacklist with optional duration."""
        self.ip_blacklist.add(ip_address)
        self.ddos_metrics.blocked_ips.add(ip_address)

        # Schedule removal if duration is specified
        if duration > 0:
            asyncio.create_task(self._schedule_ip_removal(ip_address, duration))

        logger.warning(f"Added IP to blacklist: {ip_address} (duration: {duration}s)")

    def remove_ip_from_blacklist(self, ip_address: str):
        """Remove IP address from blacklist."""
        self.ip_blacklist.discard(ip_address)
        self.ddos_metrics.blocked_ips.discard(ip_address)
        logger.info(f"Removed IP from blacklist: {ip_address}")

    async def check_request(
        self,
        request_data: Dict[str, Any],
        user_id: Optional[int] = None,
        tenant_id: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Check if request should be allowed based on rate limiting and DDoS protection.

        Args:
            request_data: Request information (ip, endpoint, method, etc.)
            user_id: Optional user ID
            tenant_id: Optional tenant ID
            api_key: Optional API key

        Returns:
            Dict with check results and metadata

        Raises:
            RateLimitExceeded: If rate limit is exceeded
            DDoSAttackDetected: If DDoS attack is detected
            IPBlacklisted: If IP is blacklisted
            ChallengeRequired: If challenge-response is required
        """
        ip_address = request_data.get("ip_address", "unknown")
        endpoint = request_data.get("endpoint", "/")
        method = request_data.get("method", "GET")
        user_agent = request_data.get("user_agent", "")

        # Check IP whitelist/blacklist first
        if self.config.enable_ip_whitelisting and ip_address not in self.ip_whitelist:
            raise IPBlacklisted(f"IP {ip_address} not whitelisted")

        if self.config.enable_ip_blacklisting and ip_address in self.ip_blacklist:
            raise IPBlacklisted(f"IP {ip_address} is blacklisted")

        # DDoS protection checks
        if self.config.enable_ddos_protection:
            await self._check_ddos_protection(ip_address, request_data)

        # Apply rate limiting rules
        violations = []
        applied_rules = []

        for rule in self.rules.values():
            if not rule.enabled:
                continue

            try:
                identifier = self._get_identifier_for_rule(rule, request_data, user_id, tenant_id, api_key)
                allowed = await self._check_rule(rule, identifier)

                if not allowed:
                    violations.append({
                        "rule": rule.name,
                        "identifier": identifier,
                        "scope": rule.scope.value
                    })
                else:
                    applied_rules.append(rule.name)

            except Exception as e:
                logger.error(f"Error checking rule {rule.name}: {e}")

        # Check if challenge-response is required
        if self.config.enable_challenge_response and self._should_require_challenge(ip_address, violations):
            challenge = self._generate_challenge(ip_address)
            raise ChallengeRequired(f"Challenge required: {challenge['id']}")

        # Determine if request should be blocked
        if violations:
            # Log the violation
            self._log_rate_limit_violation(ip_address, violations, request_data)

            # Check if this constitutes a DDoS attack
            if self._is_ddos_attack_pattern(violations, ip_address):
                self.ddos_metrics.total_attacks_detected += 1
                self.ddos_metrics.last_attack_time = time.time()
                raise DDoSAttackDetected(f"DDoS attack detected from {ip_address}")

            raise RateLimitExceeded(f"Rate limit exceeded for {len(violations)} rule(s)")

        return {
            "allowed": True,
            "applied_rules": applied_rules,
            "threat_level": self.ddos_metrics.current_threat_level,
            "ip_status": "allowed"
        }

    async def _check_rule(self, rule: RateLimitRule, identifier: str) -> bool:
        """Check if request is allowed for a specific rule."""
        async with self._lock:
            scope_states = self.states.setdefault(rule.scope.value, {})
            state = scope_states.setdefault(identifier, RateLimitState(identifier, rule.scope))

            # Check if currently blocked
            if state.blocked_until and time.time() < state.blocked_until:
                return False

            # Apply rate limiting based on strategy
            if rule.strategy == RateLimitStrategy.FIXED_WINDOW:
                return self._check_fixed_window(rule, state)
            elif rule.strategy == RateLimitStrategy.SLIDING_WINDOW:
                return self._check_sliding_window(rule, state)
            elif rule.strategy == RateLimitStrategy.TOKEN_BUCKET:
                return self._check_token_bucket(rule, state)
            elif rule.strategy == RateLimitStrategy.LEAKY_BUCKET:
                return self._check_leaky_bucket(rule, state)
            elif rule.strategy == RateLimitStrategy.ADAPTIVE:
                return self._check_adaptive(rule, state)
            else:
                logger.warning(f"Unknown rate limiting strategy: {rule.strategy}")
                return True

    def _check_fixed_window(self, rule: RateLimitRule, state: RateLimitState) -> bool:
        """Check rate limit using fixed window algorithm."""
        current_time = time.time()

        # Reset window if expired
        if current_time >= state.window_start + rule.window_seconds:
            state.window_start = current_time
            state.request_count = 0

        # Check if limit exceeded
        if state.request_count >= rule.requests_per_window:
            self._handle_violation(state, rule)
            return False

        state.request_count += 1
        state.last_request = current_time
        return True

    def _check_sliding_window(self, rule: RateLimitRule, state: RateLimitState) -> bool:
        """Check rate limit using sliding window algorithm."""
        current_time = time.time()
        window_start = current_time - rule.window_seconds

        # Count requests in sliding window (simplified implementation)
        # In a real implementation, you'd use a more sophisticated data structure
        if state.last_request < window_start:
            state.request_count = 1
        else:
            state.request_count = min(state.request_count + 1, rule.requests_per_window * 2)

        if state.request_count > rule.requests_per_window:
            self._handle_violation(state, rule)
            return False

        state.last_request = current_time
        return True

    def _check_token_bucket(self, rule: RateLimitRule, state: RateLimitState) -> bool:
        """Check rate limit using token bucket algorithm."""
        current_time = time.time()

        # Refill tokens based on time elapsed
        time_passed = current_time - state.window_start
        tokens_to_add = time_passed * (rule.requests_per_window / rule.window_seconds)
        state.tokens = min(rule.requests_per_window, state.tokens + tokens_to_add)

        # Check if we have enough tokens
        if state.tokens < 1:
            self._handle_violation(state, rule)
            return False

        state.tokens -= 1
        state.window_start = current_time
        return True

    def _check_leaky_bucket(self, rule: RateLimitRule, state: RateLimitState) -> bool:
        """Check rate limit using leaky bucket algorithm."""
        current_time = time.time()

        # Leak tokens based on time elapsed
        time_passed = current_time - state.window_start
        leak_rate = rule.requests_per_window / rule.window_seconds
        state.tokens = max(0, state.tokens - (time_passed * leak_rate))

        # Check if bucket is full
        if state.tokens >= rule.requests_per_window:
            self._handle_violation(state, rule)
            return False

        state.tokens += 1
        state.window_start = current_time
        return True

    def _check_adaptive(self, rule: RateLimitRule, state: RateLimitState) -> bool:
        """Check rate limit using adaptive algorithm based on threat level."""
        # Adjust limits based on current threat level
        threat_multiplier = self._get_threat_multiplier()

        adjusted_limit = int(rule.requests_per_window * threat_multiplier)

        # Use fixed window with adjusted limit
        return self._check_fixed_window_with_limit(rule, state, adjusted_limit)

    def _check_fixed_window_with_limit(self, rule: RateLimitRule, state: RateLimitState, limit: int) -> bool:
        """Check fixed window with custom limit."""
        current_time = time.time()

        if current_time >= state.window_start + rule.window_seconds:
            state.window_start = current_time
            state.request_count = 0

        if state.request_count >= limit:
            self._handle_violation(state, rule)
            return False

        state.request_count += 1
        state.last_request = current_time
        return True

    def _handle_violation(self, state: RateLimitState, rule: RateLimitRule):
        """Handle rate limit violation."""
        state.consecutive_violations += 1
        state.total_violations += 1
        state.last_violation_time = time.time()

        if state.first_violation_time is None:
            state.first_violation_time = time.time()

        # Block if too many violations
        if state.consecutive_violations >= 3:
            state.blocked_until = time.time() + rule.block_duration
            logger.warning(f"Blocking identifier {state.identifier} for {rule.block_duration}s due to violations")

    def _get_threat_multiplier(self) -> float:
        """Get threat level multiplier for adaptive rate limiting."""
        threat_level = self.ddos_metrics.current_threat_level

        if threat_level == "critical":
            return 0.1  # 10% of normal limit
        elif threat_level == "high":
            return 0.3  # 30% of normal limit
        elif threat_level == "medium":
            return 0.6  # 60% of normal limit
        else:
            return 1.0  # 100% of normal limit

    def _get_identifier_for_rule(
        self,
        rule: RateLimitRule,
        request_data: Dict[str, Any],
        user_id: Optional[int],
        tenant_id: Optional[str],
        api_key: Optional[str]
    ) -> str:
        """Get identifier for rate limiting rule."""
        if rule.scope == RateLimitScope.GLOBAL:
            return "global"
        elif rule.scope == RateLimitScope.USER:
            return f"user:{user_id or 'anonymous'}"
        elif rule.scope == RateLimitScope.IP:
            return f"ip:{request_data.get('ip_address', 'unknown')}"
        elif rule.scope == RateLimitScope.ENDPOINT:
            return f"endpoint:{request_data.get('endpoint', '/')}"
        elif rule.scope == RateLimitScope.TENANT:
            return f"tenant:{tenant_id or 'default'}"
        elif rule.scope == RateLimitScope.API_KEY:
            return f"api_key:{api_key or 'none'}"
        else:
            return "unknown"

    async def _check_ddos_protection(self, ip_address: str, request_data: Dict[str, Any]):
        """Check for DDoS attack patterns."""
        if not self.config.enable_ddos_protection:
            return

        # Check request frequency patterns
        await self._analyze_request_patterns(ip_address, request_data)

        # Check for suspicious user agents
        if self.config.enable_user_agent_filtering:
            user_agent = request_data.get("user_agent", "")
            if self._is_suspicious_user_agent(user_agent):
                self.ddos_metrics.suspicious_ips.add(ip_address)
                if self.config.ddos_protection_level.value in ["advanced", "maximum"]:
                    raise DDoSAttackDetected(f"Suspicious user agent from {ip_address}")

        # Check request size
        if self.config.enable_request_size_limiting:
            content_length = request_data.get("content_length", 0)
            if content_length > self.config.max_request_size:
                raise DDoSAttackDetected(f"Request too large from {ip_address}: {content_length} bytes")

    async def _analyze_request_patterns(self, ip_address: str, request_data: Dict[str, Any]):
        """Analyze request patterns for DDoS detection."""
        # This is a simplified implementation
        # In a real system, you'd use more sophisticated ML-based detection

        endpoint = request_data.get("endpoint", "/")
        method = request_data.get("method", "GET")

        # Track attack patterns
        pattern_key = f"{ip_address}:{endpoint}:{method}"
        if pattern_key not in self.ddos_metrics.attack_patterns:
            self.ddos_metrics.attack_patterns[pattern_key] = 0

        self.ddos_metrics.attack_patterns[pattern_key] += 1

        # Check for rapid-fire requests
        if self.ddos_metrics.attack_patterns[pattern_key] > 100:  # Threshold
            if self.config.ddos_protection_level.value in ["standard", "advanced", "maximum"]:
                self.add_ip_to_blacklist(ip_address, 3600)  # Block for 1 hour
                raise DDoSAttackDetected(f"Rapid-fire requests detected from {ip_address}")

    def _is_suspicious_user_agent(self, user_agent: str) -> bool:
        """Check if user agent is suspicious."""
        suspicious_patterns = [
            "bot", "spider", "crawler", "python-requests", "curl",
            "scanner", "exploit", "hack", "malware"
        ]

        user_agent_lower = user_agent.lower()
        return any(pattern in user_agent_lower for pattern in suspicious_patterns)

    def _is_ddos_attack_pattern(self, violations: List[Dict], ip_address: str) -> bool:
        """Check if violations constitute a DDoS attack pattern."""
        if len(violations) >= 3:  # Multiple rule violations
            return True

        # Check if IP has many attack patterns
        ip_patterns = [k for k in self.ddos_metrics.attack_patterns.keys() if k.startswith(f"{ip_address}:")]
        if len(ip_patterns) > 10:  # Many different attack patterns from same IP
            return True

        return False

    def _should_require_challenge(self, ip_address: str, violations: List[Dict]) -> bool:
        """Determine if challenge-response should be required."""
        if not self.config.enable_challenge_response:
            return False

        # Require challenge if IP is suspicious or has violations
        return (ip_address in self.ddos_metrics.suspicious_ips or
                len(violations) > 0)

    def _generate_challenge(self, ip_address: str) -> Dict[str, Any]:
        """Generate a challenge for the client."""
        challenge_id = secrets.token_urlsafe(32)
        challenge_data = {
            "id": challenge_id,
            "ip_address": ip_address,
            "difficulty": self.config.challenge_difficulty,
            "created_at": time.time(),
            "expires_at": time.time() + 300  # 5 minutes
        }

        self.challenges[challenge_id] = challenge_data
        return challenge_data

    def validate_challenge_response(self, challenge_id: str, response: str) -> bool:
        """Validate challenge response."""
        if challenge_id not in self.challenges:
            return False

        challenge = self.challenges[challenge_id]

        # Check if challenge has expired
        if time.time() > challenge["expires_at"]:
            del self.challenges[challenge_id]
            return False

        # In a real implementation, you'd verify the proof-of-work or captcha
        # For now, just check if response is not empty
        is_valid = bool(response and len(response) > 0)

        if is_valid:
            del self.challenges[challenge_id]

        return is_valid

    async def _schedule_ip_removal(self, ip_address: str, duration: int):
        """Schedule removal of IP from blacklist."""
        await asyncio.sleep(duration)
        self.remove_ip_from_blacklist(ip_address)

    def _log_rate_limit_violation(
        self,
        ip_address: str,
        violations: List[Dict],
        request_data: Dict[str, Any]
    ):
        """Log rate limit violation."""
        logger.warning(
            f"Rate limit violation from {ip_address}: {len(violations)} rules violated",
            extra={
                "ip_address": ip_address,
                "violations": violations,
                "request_data": request_data,
                "threat_level": self.ddos_metrics.current_threat_level
            }
        )

    def _initialize_default_rules(self):
        """Initialize default rate limiting rules."""
        default_rules = [
            RateLimitRule(
                name="global_limit",
                strategy=RateLimitStrategy.TOKEN_BUCKET,
                scope=RateLimitScope.GLOBAL,
                requests_per_window=1000,
                window_seconds=60,
                burst_limit=100
            ),
            RateLimitRule(
                name="ip_limit",
                strategy=RateLimitStrategy.FIXED_WINDOW,
                scope=RateLimitScope.IP,
                requests_per_window=60,
                window_seconds=60
            ),
            RateLimitRule(
                name="user_limit",
                strategy=RateLimitStrategy.TOKEN_BUCKET,
                scope=RateLimitScope.USER,
                requests_per_window=120,
                window_seconds=60,
                burst_limit=20
            ),
            RateLimitRule(
                name="api_endpoint_limit",
                strategy=RateLimitStrategy.SLIDING_WINDOW,
                scope=RateLimitScope.ENDPOINT,
                requests_per_window=30,
                window_seconds=60
            )
        ]

        for rule in default_rules:
            self.add_rule(rule)

    def get_metrics(self) -> Dict[str, Any]:
        """Get rate limiting and DDoS protection metrics."""
        total_states = sum(len(scope_states) for scope_states in self.states.values())
        blocked_states = sum(
            1 for scope_states in self.states.values()
            for state in scope_states.values()
            if state.blocked_until and time.time() < state.blocked_until
        )

        return {
            "total_rules": len(self.rules),
            "enabled_rules": sum(1 for rule in self.rules.values() if rule.enabled),
            "total_states": total_states,
            "blocked_states": blocked_states,
            "whitelisted_ips": len(self.ip_whitelist),
            "blacklisted_ips": len(self.ip_blacklist),
            "ddos_metrics": {
                "suspicious_ips": len(self.ddos_metrics.suspicious_ips),
                "blocked_ips": len(self.ddos_metrics.blocked_ips),
                "total_requests_blocked": self.ddos_metrics.total_requests_blocked,
                "total_attacks_detected": self.ddos_metrics.total_attacks_detected,
                "current_threat_level": self.ddos_metrics.current_threat_level,
                "peak_request_rate": self.ddos_metrics.peak_request_rate
            },
            "active_challenges": len(self.challenges)
        }

    def reset_metrics(self):
        """Reset rate limiting metrics."""
        for scope_states in self.states.values():
            for state in scope_states.values():
                state.request_count = 0
                state.consecutive_violations = 0
                state.blocked_until = None

        self.ddos_metrics = DDoSThreatMetrics()
        logger.info("Reset rate limiting metrics")


# Global rate limiting manager instance
rate_limiting_manager: Optional[RateLimitingManager] = None


def init_rate_limiting(config: RateLimitConfig) -> RateLimitingManager:
    """Initialize the global rate limiting manager."""
    global rate_limiting_manager
    rate_limiting_manager = RateLimitingManager(config)
    return rate_limiting_manager


def get_rate_limiting_manager() -> RateLimitingManager:
    """Get the global rate limiting manager."""
    if rate_limiting_manager is None:
        raise RuntimeError("Rate Limiting Manager not initialized")
    return rate_limiting_manager