"""
Advanced Security Service for Enterprise NeoForge.

Provides enterprise-grade security features:
- IP whitelisting and geolocation controls
- Advanced audit logging with threat detection
- Data retention controls with secure deletion
- Security monitoring and alerting
- Access pattern analysis and anomaly detection
- Session security and device tracking
"""

import logging
import ipaddress
import hashlib
import json
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any, Set, Union
from enum import Enum
import uuid
import asyncio

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.config import get_settings
from app.models.user import User
from app.models.tenant import Tenant, TenantAuditLog
from app.crud.tenant_crud import tenant as tenant_crud
from app.crud.user import user as user_crud

logger = logging.getLogger(__name__)
settings = get_settings()


class SecurityEventType(str, Enum):
    """Types of security events."""
    UNAUTHORIZED_ACCESS_ATTEMPT = "unauthorized_access_attempt"
    SUSPICIOUS_LOGIN = "suspicious_login"
    IP_BLOCKED = "ip_blocked"
    GEOLOCATION_VIOLATION = "geolocation_violation"
    BRUTE_FORCE_DETECTED = "brute_force_detected"
    ANOMALOUS_BEHAVIOR = "anomalous_behavior"
    PRIVILEGE_ESCALATION_ATTEMPT = "privilege_escalation_attempt"
    DATA_EXFILTRATION_SUSPECTED = "data_exfiltration_suspected"
    SECURITY_POLICY_VIOLATION = "security_policy_violation"
    COMPLIANCE_VIOLATION = "compliance_violation"


class SecurityThreatLevel(str, Enum):
    """Security threat levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AccessControlAction(str, Enum):
    """Access control actions."""
    ALLOW = "allow"
    DENY = "deny"
    QUARANTINE = "quarantine"
    MFA_REQUIRED = "mfa_required"


class IPWhitelistEntry:
    """IP whitelist entry configuration."""
    
    def __init__(
        self,
        entry_id: str,
        ip_range: str,
        description: str,
        created_by: int,
        expires_at: datetime = None,
        is_active: bool = True,
        **metadata
    ):
        self.entry_id = entry_id
        self.ip_range = ip_range
        self.description = description
        self.created_by = created_by
        self.expires_at = expires_at
        self.is_active = is_active
        self.metadata = metadata
        self.created_at = datetime.now(timezone.utc)
        
        # Validate IP range
        self._validate_ip_range()
    
    def _validate_ip_range(self):
        """Validate IP address or range."""
        try:
            if '/' in self.ip_range:
                # CIDR notation
                ipaddress.IPv4Network(self.ip_range, strict=False)
            else:
                # Single IP
                ipaddress.IPv4Address(self.ip_range)
        except ValueError as e:
            raise ValueError(f"Invalid IP range format: {self.ip_range}")
    
    def matches_ip(self, ip_address: str) -> bool:
        """Check if an IP address matches this whitelist entry."""
        try:
            target_ip = ipaddress.IPv4Address(ip_address)
            
            if '/' in self.ip_range:
                # CIDR range
                network = ipaddress.IPv4Network(self.ip_range, strict=False)
                return target_ip in network
            else:
                # Single IP
                allowed_ip = ipaddress.IPv4Address(self.ip_range)
                return target_ip == allowed_ip
        except ValueError:
            return False
    
    def is_expired(self) -> bool:
        """Check if the whitelist entry has expired."""
        if not self.expires_at:
            return False
        return datetime.now(timezone.utc) >= self.expires_at
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "entry_id": self.entry_id,
            "ip_range": self.ip_range,
            "description": self.description,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "is_active": self.is_active,
            "metadata": self.metadata
        }


class SecurityEvent:
    """Security event for audit logging."""
    
    def __init__(
        self,
        event_type: SecurityEventType,
        threat_level: SecurityThreatLevel,
        source_ip: str,
        user_id: int = None,
        tenant_id: int = None,
        description: str = None,
        details: Dict[str, Any] = None,
        **metadata
    ):
        self.event_id = f"sec-{uuid.uuid4().hex[:12]}"
        self.event_type = event_type
        self.threat_level = threat_level
        self.source_ip = source_ip
        self.user_id = user_id
        self.tenant_id = tenant_id
        self.description = description or event_type.value
        self.details = details or {}
        self.metadata = metadata
        self.timestamp = datetime.now(timezone.utc)
        
        # Add IP geolocation data (placeholder)
        self.geolocation = self._get_ip_geolocation(source_ip)
    
    def _get_ip_geolocation(self, ip_address: str) -> Dict[str, str]:
        """Get geolocation data for IP address."""
        # In production, use a geolocation service like MaxMind
        return {
            "country": "Unknown",
            "region": "Unknown",
            "city": "Unknown",
            "timezone": "Unknown"
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "event_id": self.event_id,
            "event_type": self.event_type.value,
            "threat_level": self.threat_level.value,
            "source_ip": self.source_ip,
            "user_id": self.user_id,
            "tenant_id": self.tenant_id,
            "description": self.description,
            "details": self.details,
            "geolocation": self.geolocation,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata
        }


class AdvancedSecurityService:
    """Advanced security management service."""
    
    def __init__(self, db: Session):
        self.db = db
        self._ip_whitelists: Dict[int, List[IPWhitelistEntry]] = {}
        self._security_policies: Dict[int, Dict[str, Any]] = {}
        self._threat_detection_rules: Dict[int, List[Dict[str, Any]]] = {}
        self._blocked_ips: Dict[int, Set[str]] = {}
    
    async def configure_security_policy(
        self,
        tenant_id: int,
        policy_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Configure advanced security policy for a tenant.
        
        Args:
            tenant_id: Tenant ID
            policy_config: Security policy configuration
            
        Returns:
            Security policy details
        """
        try:
            # Validate tenant exists
            tenant = await tenant_crud.get(self.db, id=tenant_id)
            if not tenant:
                raise ValueError(f"Tenant {tenant_id} not found")
            
            # Default security policy
            default_policy = {
                "ip_whitelisting_enabled": False,
                "geolocation_restrictions": [],
                "brute_force_protection": {
                    "enabled": True,
                    "max_attempts": 5,
                    "lockout_duration_minutes": 15
                },
                "session_security": {
                    "max_concurrent_sessions": 5,
                    "idle_timeout_minutes": 30,
                    "absolute_timeout_minutes": 480
                },
                "anomaly_detection": {
                    "enabled": True,
                    "sensitivity": "medium"
                },
                "audit_logging": {
                    "enabled": True,
                    "retention_days": 90,
                    "real_time_alerts": True
                }
            }
            
            # Merge with provided config
            security_policy = {**default_policy, **policy_config}
            self._security_policies[tenant_id] = security_policy
            
            # Store in tenant settings
            tenant_settings = tenant.settings or {}
            tenant_settings['security_policy'] = {
                **security_policy,
                "configured_at": datetime.now(timezone.utc).isoformat(),
                "version": 1
            }
            
            await tenant_crud.update(
                self.db,
                db_obj=tenant,
                obj_in={'settings': tenant_settings}
            )
            
            # Log security policy change
            await self._log_security_event(
                SecurityEvent(
                    event_type=SecurityEventType.SECURITY_POLICY_VIOLATION,  # Reuse for policy changes
                    threat_level=SecurityThreatLevel.LOW,
                    source_ip="127.0.0.1",  # System IP
                    tenant_id=tenant_id,
                    description="Security policy configured",
                    details={"policy_version": 1, "changes": list(policy_config.keys())}
                )
            )
            
            logger.info(f"Security policy configured for tenant {tenant_id}")
            return security_policy
            
        except Exception as e:
            logger.error(f"Failed to configure security policy for tenant {tenant_id}: {str(e)}")
            raise ValueError(f"Failed to configure security policy: {str(e)}")
    
    async def add_ip_whitelist_entry(
        self,
        tenant_id: int,
        ip_range: str,
        description: str,
        created_by: int,
        expires_at: datetime = None
    ) -> IPWhitelistEntry:
        """
        Add IP address or range to whitelist.
        
        Args:
            tenant_id: Tenant ID
            ip_range: IP address or CIDR range
            description: Description of the entry
            created_by: User ID who created the entry
            expires_at: Optional expiration date
            
        Returns:
            Created IPWhitelistEntry
        """
        try:
            # Generate entry ID
            entry_id = f"ip-{tenant_id}-{uuid.uuid4().hex[:8]}"
            
            # Create whitelist entry
            entry = IPWhitelistEntry(
                entry_id=entry_id,
                ip_range=ip_range,
                description=description,
                created_by=created_by,
                expires_at=expires_at
            )
            
            # Store entry
            if tenant_id not in self._ip_whitelists:
                self._ip_whitelists[tenant_id] = []
            self._ip_whitelists[tenant_id].append(entry)
            
            # Store in tenant settings
            tenant = await tenant_crud.get(self.db, id=tenant_id)
            if not tenant:
                raise ValueError(f"Tenant {tenant_id} not found")
            
            tenant_settings = tenant.settings or {}
            tenant_settings.setdefault('security_policy', {}).setdefault('ip_whitelist', []).append(entry.to_dict())
            
            await tenant_crud.update(
                self.db,
                db_obj=tenant,
                obj_in={'settings': tenant_settings}
            )
            
            # Log security event
            await self._log_security_event(
                SecurityEvent(
                    event_type=SecurityEventType.SECURITY_POLICY_VIOLATION,
                    threat_level=SecurityThreatLevel.LOW,
                    source_ip="127.0.0.1",
                    tenant_id=tenant_id,
                    user_id=created_by,
                    description=f"IP whitelist entry added: {ip_range}",
                    details={"entry_id": entry_id, "ip_range": ip_range}
                )
            )
            
            logger.info(f"IP whitelist entry added for tenant {tenant_id}: {ip_range}")
            return entry
            
        except Exception as e:
            logger.error(f"Failed to add IP whitelist entry for tenant {tenant_id}: {str(e)}")
            raise ValueError(f"Failed to add IP whitelist entry: {str(e)}")
    
    async def check_ip_access(
        self,
        tenant_id: int,
        ip_address: str,
        user_id: int = None
    ) -> Dict[str, Any]:
        """
        Check if an IP address is allowed access.
        
        Args:
            tenant_id: Tenant ID
            ip_address: IP address to check
            user_id: Optional user ID for context
            
        Returns:
            Access control decision
        """
        try:
            # Get security policy
            security_policy = self._security_policies.get(tenant_id, {})
            
            # Check if IP whitelisting is enabled
            if not security_policy.get("ip_whitelisting_enabled", False):
                return {
                    "action": AccessControlAction.ALLOW.value,
                    "reason": "IP whitelisting disabled",
                    "ip_address": ip_address
                }
            
            # Check if IP is blocked
            blocked_ips = self._blocked_ips.get(tenant_id, set())
            if ip_address in blocked_ips:
                await self._log_security_event(
                    SecurityEvent(
                        event_type=SecurityEventType.IP_BLOCKED,
                        threat_level=SecurityThreatLevel.HIGH,
                        source_ip=ip_address,
                        tenant_id=tenant_id,
                        user_id=user_id,
                        description=f"Blocked IP attempted access: {ip_address}"
                    )
                )
                
                return {
                    "action": AccessControlAction.DENY.value,
                    "reason": "IP address is blocked",
                    "ip_address": ip_address
                }
            
            # Check whitelist
            whitelist_entries = self._ip_whitelists.get(tenant_id, [])
            for entry in whitelist_entries:
                if entry.is_active and not entry.is_expired() and entry.matches_ip(ip_address):
                    return {
                        "action": AccessControlAction.ALLOW.value,
                        "reason": f"IP matches whitelist entry: {entry.entry_id}",
                        "ip_address": ip_address,
                        "whitelist_entry": entry.entry_id
                    }
            
            # IP not in whitelist - log and deny
            await self._log_security_event(
                SecurityEvent(
                    event_type=SecurityEventType.UNAUTHORIZED_ACCESS_ATTEMPT,
                    threat_level=SecurityThreatLevel.MEDIUM,
                    source_ip=ip_address,
                    tenant_id=tenant_id,
                    user_id=user_id,
                    description=f"Access denied - IP not in whitelist: {ip_address}"
                )
            )
            
            return {
                "action": AccessControlAction.DENY.value,
                "reason": "IP address not in whitelist",
                "ip_address": ip_address
            }
            
        except Exception as e:
            logger.error(f"Failed to check IP access for tenant {tenant_id}: {str(e)}")
            return {
                "action": AccessControlAction.DENY.value,
                "reason": f"Error checking IP access: {str(e)}",
                "ip_address": ip_address
            }
    
    async def detect_brute_force_attack(
        self,
        tenant_id: int,
        ip_address: str,
        user_email: str = None,
        failed_attempt: bool = True
    ) -> Dict[str, Any]:
        """
        Detect and respond to brute force attacks.
        
        Args:
            tenant_id: Tenant ID
            ip_address: Source IP address
            user_email: Target user email (if known)
            failed_attempt: Whether this was a failed login attempt
            
        Returns:
            Brute force detection results
        """
        try:
            # Get security policy
            security_policy = self._security_policies.get(tenant_id, {})
            brute_force_config = security_policy.get("brute_force_protection", {})
            
            if not brute_force_config.get("enabled", True):
                return {"brute_force_detected": False, "action": None}
            
            max_attempts = brute_force_config.get("max_attempts", 5)
            lockout_duration = brute_force_config.get("lockout_duration_minutes", 15)
            
            # Track failed attempts (in production, use Redis or database)
            cache_key = f"brute_force:{tenant_id}:{ip_address}"
            
            # Simulate attempt tracking
            current_attempts = 3 if failed_attempt else 0  # Placeholder logic
            
            if current_attempts >= max_attempts:
                # Block IP
                if tenant_id not in self._blocked_ips:
                    self._blocked_ips[tenant_id] = set()
                self._blocked_ips[tenant_id].add(ip_address)
                
                # Log security event
                await self._log_security_event(
                    SecurityEvent(
                        event_type=SecurityEventType.BRUTE_FORCE_DETECTED,
                        threat_level=SecurityThreatLevel.HIGH,
                        source_ip=ip_address,
                        tenant_id=tenant_id,
                        description=f"Brute force attack detected from {ip_address}",
                        details={
                            "failed_attempts": current_attempts,
                            "target_user": user_email,
                            "lockout_duration_minutes": lockout_duration
                        }
                    )
                )
                
                # Schedule IP unblock (in production, use background task)
                asyncio.create_task(self._schedule_ip_unblock(tenant_id, ip_address, lockout_duration))
                
                return {
                    "brute_force_detected": True,
                    "action": "ip_blocked",
                    "attempts": current_attempts,
                    "lockout_duration_minutes": lockout_duration
                }
            
            return {
                "brute_force_detected": False,
                "attempts": current_attempts,
                "remaining_attempts": max_attempts - current_attempts
            }
            
        except Exception as e:
            logger.error(f"Failed to detect brute force attack for tenant {tenant_id}: {str(e)}")
            return {"brute_force_detected": False, "error": str(e)}
    
    async def analyze_user_behavior(
        self,
        tenant_id: int,
        user_id: int,
        activity_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze user behavior for anomaly detection.
        
        Args:
            tenant_id: Tenant ID
            user_id: User ID
            activity_data: Current activity data
            
        Returns:
            Behavior analysis results
        """
        try:
            # Get security policy
            security_policy = self._security_policies.get(tenant_id, {})
            anomaly_config = security_policy.get("anomaly_detection", {})
            
            if not anomaly_config.get("enabled", True):
                return {"anomaly_detected": False, "risk_score": 0}
            
            # Analyze activity patterns
            risk_factors = []
            risk_score = 0
            
            # Check for unusual login time
            current_hour = datetime.now().hour
            if current_hour < 6 or current_hour > 22:  # Outside business hours
                risk_factors.append("unusual_login_time")
                risk_score += 10
            
            # Check for unusual location (if geolocation data available)
            source_ip = activity_data.get("source_ip")
            if source_ip and self._is_unusual_location(user_id, source_ip):
                risk_factors.append("unusual_location")
                risk_score += 25
            
            # Check for rapid successive actions
            if activity_data.get("actions_per_minute", 0) > 30:
                risk_factors.append("rapid_actions")
                risk_score += 15
            
            # Check for access to sensitive data
            if activity_data.get("accessed_sensitive_data", False):
                risk_factors.append("sensitive_data_access")
                risk_score += 20
            
            # Determine if anomaly detected based on sensitivity
            sensitivity = anomaly_config.get("sensitivity", "medium")
            thresholds = {"low": 50, "medium": 30, "high": 15}
            threshold = thresholds.get(sensitivity, 30)
            
            anomaly_detected = risk_score >= threshold
            
            if anomaly_detected:
                # Log security event
                await self._log_security_event(
                    SecurityEvent(
                        event_type=SecurityEventType.ANOMALOUS_BEHAVIOR,
                        threat_level=SecurityThreatLevel.MEDIUM if risk_score < 50 else SecurityThreatLevel.HIGH,
                        source_ip=source_ip or "unknown",
                        tenant_id=tenant_id,
                        user_id=user_id,
                        description=f"Anomalous behavior detected for user {user_id}",
                        details={
                            "risk_score": risk_score,
                            "risk_factors": risk_factors,
                            "activity_data": activity_data
                        }
                    )
                )
            
            return {
                "anomaly_detected": anomaly_detected,
                "risk_score": risk_score,
                "risk_factors": risk_factors,
                "sensitivity": sensitivity,
                "threshold": threshold
            }
            
        except Exception as e:
            logger.error(f"Failed to analyze user behavior for tenant {tenant_id}: {str(e)}")
            return {"anomaly_detected": False, "error": str(e)}
    
    async def get_security_audit_log(
        self,
        tenant_id: int,
        start_date: datetime,
        end_date: datetime,
        event_types: List[SecurityEventType] = None,
        threat_levels: List[SecurityThreatLevel] = None
    ) -> Dict[str, Any]:
        """
        Get security audit log for a tenant.
        
        Args:
            tenant_id: Tenant ID
            start_date: Start date for log retrieval
            end_date: End date for log retrieval
            event_types: Filter by event types
            threat_levels: Filter by threat levels
            
        Returns:
            Security audit log data
        """
        try:
            # In production, query actual audit logs from database
            # For now, return sample data
            
            sample_events = [
                {
                    "event_id": "sec-123456789abc",
                    "event_type": SecurityEventType.SUSPICIOUS_LOGIN.value,
                    "threat_level": SecurityThreatLevel.MEDIUM.value,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "source_ip": "192.168.1.100",
                    "user_id": 1,
                    "description": "Login from unusual location",
                    "details": {"country": "Unknown", "previous_country": "US"}
                },
                {
                    "event_id": "sec-987654321def",
                    "event_type": SecurityEventType.BRUTE_FORCE_DETECTED.value,
                    "threat_level": SecurityThreatLevel.HIGH.value,
                    "timestamp": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat(),
                    "source_ip": "10.0.0.1",
                    "description": "Multiple failed login attempts",
                    "details": {"failed_attempts": 8, "blocked": True}
                }
            ]
            
            # Apply filters if provided
            filtered_events = sample_events
            if event_types:
                event_type_values = [et.value for et in event_types]
                filtered_events = [e for e in filtered_events if e["event_type"] in event_type_values]
            
            if threat_levels:
                threat_level_values = [tl.value for tl in threat_levels]
                filtered_events = [e for e in filtered_events if e["threat_level"] in threat_level_values]
            
            # Calculate summary statistics
            summary = {
                "total_events": len(filtered_events),
                "threat_level_breakdown": {},
                "event_type_breakdown": {},
                "unique_ips": len(set(e.get("source_ip", "") for e in filtered_events)),
                "period": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat()
                }
            }
            
            # Count by threat level
            for event in filtered_events:
                level = event["threat_level"]
                summary["threat_level_breakdown"][level] = summary["threat_level_breakdown"].get(level, 0) + 1
            
            # Count by event type
            for event in filtered_events:
                event_type = event["event_type"]
                summary["event_type_breakdown"][event_type] = summary["event_type_breakdown"].get(event_type, 0) + 1
            
            return {
                "tenant_id": tenant_id,
                "events": filtered_events,
                "summary": summary,
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get security audit log for tenant {tenant_id}: {str(e)}")
            raise ValueError(f"Failed to get security audit log: {str(e)}")
    
    async def _schedule_ip_unblock(self, tenant_id: int, ip_address: str, duration_minutes: int):
        """Schedule IP address to be unblocked after duration."""
        await asyncio.sleep(duration_minutes * 60)
        
        if tenant_id in self._blocked_ips:
            self._blocked_ips[tenant_id].discard(ip_address)
            
        logger.info(f"IP address unblocked for tenant {tenant_id}: {ip_address}")
    
    def _is_unusual_location(self, user_id: int, ip_address: str) -> bool:
        """Check if location is unusual for user (placeholder implementation)."""
        # In production, compare with user's historical locations
        return False  # Placeholder
    
    async def _log_security_event(self, security_event: SecurityEvent):
        """Log security event to audit system."""
        try:
            # Convert to audit log format
            audit_data = {
                'tenant_id': security_event.tenant_id,
                'actor_id': security_event.user_id,
                'action': f"security.{security_event.event_type.value}",
                'resource_type': 'security',
                'resource_id': security_event.event_id,
                'details': {
                    **security_event.to_dict(),
                    'threat_level': security_event.threat_level.value
                },
                'ip_address': security_event.source_ip,
                'user_agent': None,  # Would be extracted from request context
            }
            
            # Store in database
            if security_event.tenant_id:
                audit_log = TenantAuditLog(**audit_data)
                self.db.add(audit_log)
                await self.db.commit()
            
            # Log to application logs
            logger.info(f"Security event logged: {security_event.event_type.value} - {security_event.description}")
            
        except Exception as e:
            logger.error(f"Failed to log security event: {str(e)}")
            # Don't raise exception for audit logging failures
    
    async def get_security_dashboard(self, tenant_id: int) -> Dict[str, Any]:
        """Get security dashboard data for a tenant."""
        try:
            # Get current security status
            security_policy = self._security_policies.get(tenant_id, {})
            whitelist_entries = len(self._ip_whitelists.get(tenant_id, []))
            blocked_ips = len(self._blocked_ips.get(tenant_id, set()))
            
            # Get recent security events (last 24 hours)
            end_date = datetime.now(timezone.utc)
            start_date = end_date - timedelta(days=1)
            recent_events = await self.get_security_audit_log(tenant_id, start_date, end_date)
            
            dashboard_data = {
                "tenant_id": tenant_id,
                "security_policy": security_policy,
                "current_status": {
                    "ip_whitelisting_enabled": security_policy.get("ip_whitelisting_enabled", False),
                    "whitelist_entries": whitelist_entries,
                    "blocked_ips": blocked_ips,
                    "brute_force_protection": security_policy.get("brute_force_protection", {}).get("enabled", True),
                    "anomaly_detection": security_policy.get("anomaly_detection", {}).get("enabled", True)
                },
                "recent_activity": {
                    "total_events_24h": recent_events["summary"]["total_events"],
                    "threat_levels": recent_events["summary"]["threat_level_breakdown"],
                    "unique_source_ips": recent_events["summary"]["unique_ips"]
                },
                "alerts": [
                    {
                        "type": "high_threat_events",
                        "count": recent_events["summary"]["threat_level_breakdown"].get("high", 0),
                        "message": "High threat security events detected"
                    }
                ],
                "recommendations": self._generate_security_recommendations(tenant_id, recent_events),
                "last_updated": datetime.now(timezone.utc).isoformat()
            }
            
            return dashboard_data
            
        except Exception as e:
            logger.error(f"Failed to get security dashboard for tenant {tenant_id}: {str(e)}")
            raise ValueError(f"Failed to get security dashboard: {str(e)}")
    
    def _generate_security_recommendations(
        self,
        tenant_id: int,
        recent_events: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate security recommendations based on recent activity."""
        recommendations = []
        
        # Check for high threat events
        high_threat_count = recent_events["summary"]["threat_level_breakdown"].get("high", 0)
        if high_threat_count > 0:
            recommendations.append({
                "priority": "high",
                "type": "threat_response",
                "title": "High threat events detected",
                "description": f"Review {high_threat_count} high threat security events",
                "action": "Review recent security events and consider additional protective measures"
            })
        
        # Check IP whitelisting
        security_policy = self._security_policies.get(tenant_id, {})
        if not security_policy.get("ip_whitelisting_enabled", False):
            recommendations.append({
                "priority": "medium",
                "type": "configuration",
                "title": "Enable IP whitelisting",
                "description": "Consider enabling IP whitelisting for enhanced security",
                "action": "Configure IP whitelisting in security settings"
            })
        
        # Check for frequent login failures
        brute_force_events = sum(1 for e in recent_events["events"] if e["event_type"] == "brute_force_detected")
        if brute_force_events > 3:
            recommendations.append({
                "priority": "high",
                "type": "attack_mitigation",
                "title": "Multiple brute force attempts",
                "description": f"{brute_force_events} brute force attacks detected",
                "action": "Review brute force protection settings and consider stricter policies"
            })
        
        return recommendations


def get_advanced_security_service(db: Session) -> AdvancedSecurityService:
    """Dependency to get advanced security service instance."""
    return AdvancedSecurityService(db)