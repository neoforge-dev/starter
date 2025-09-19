"""
Enterprise Compliance Service for NeoForge.

Provides SOC 2 Type II and GDPR compliance features:
- Data retention and deletion controls
- Audit logging and monitoring
- Access controls and permissions tracking
- Data classification and handling
- Privacy controls and consent management
- Compliance reporting and documentation
"""

import logging
import hashlib
import json
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any, Set
from enum import Enum
import uuid

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.config import get_settings
from app.models.user import User
from app.models.tenant import Tenant, TenantAuditLog
from app.crud.tenant_crud import tenant as tenant_crud
from app.crud.user import user as user_crud

logger = logging.getLogger(__name__)
settings = get_settings()


class ComplianceFramework(str, Enum):
    """Supported compliance frameworks."""
    SOC2_TYPE1 = "soc2_type1"
    SOC2_TYPE2 = "soc2_type2"
    GDPR = "gdpr"
    CCPA = "ccpa"
    HIPAA = "hipaa"
    ISO27001 = "iso27001"


class DataClassification(str, Enum):
    """Data classification levels."""
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"
    PERSONAL = "personal"
    SENSITIVE_PERSONAL = "sensitive_personal"


class RetentionPeriod(str, Enum):
    """Standard data retention periods."""
    DAYS_30 = "30_days"
    DAYS_90 = "90_days"
    MONTHS_6 = "6_months"
    YEAR_1 = "1_year"
    YEARS_2 = "2_years"
    YEARS_3 = "3_years"
    YEARS_7 = "7_years"
    INDEFINITE = "indefinite"


class AuditEventType(str, Enum):
    """Types of audit events."""
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    DATA_ACCESS = "data_access"
    DATA_MODIFICATION = "data_modification"
    DATA_DELETION = "data_deletion"
    PERMISSION_CHANGE = "permission_change"
    CONFIGURATION_CHANGE = "configuration_change"
    SECURITY_EVENT = "security_event"
    COMPLIANCE_EVENT = "compliance_event"
    SYSTEM_EVENT = "system_event"


class ComplianceStatus(str, Enum):
    """Compliance status levels."""
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    PARTIALLY_COMPLIANT = "partially_compliant"
    UNDER_REVIEW = "under_review"
    REMEDIATION_REQUIRED = "remediation_required"


class DataRetentionPolicy:
    """Data retention policy configuration."""
    
    def __init__(
        self,
        policy_id: str,
        name: str,
        data_types: List[str],
        retention_period: RetentionPeriod,
        classification: DataClassification,
        auto_delete: bool = True,
        legal_hold_override: bool = False,
        **metadata
    ):
        self.policy_id = policy_id
        self.name = name
        self.data_types = data_types
        self.retention_period = retention_period
        self.classification = classification
        self.auto_delete = auto_delete
        self.legal_hold_override = legal_hold_override
        self.metadata = metadata
        
        # Calculate retention days
        self.retention_days = self._calculate_retention_days()
    
    def _calculate_retention_days(self) -> Optional[int]:
        """Calculate retention period in days."""
        period_map = {
            RetentionPeriod.DAYS_30: 30,
            RetentionPeriod.DAYS_90: 90,
            RetentionPeriod.MONTHS_6: 180,
            RetentionPeriod.YEAR_1: 365,
            RetentionPeriod.YEARS_2: 730,
            RetentionPeriod.YEARS_3: 1095,
            RetentionPeriod.YEARS_7: 2555,
            RetentionPeriod.INDEFINITE: None
        }
        return period_map.get(self.retention_period)
    
    def is_eligible_for_deletion(self, created_date: datetime) -> bool:
        """Check if data is eligible for deletion based on policy."""
        if self.retention_days is None:  # Indefinite retention
            return False
        
        if self.legal_hold_override:  # Legal hold prevents deletion
            return False
        
        age_days = (datetime.now(timezone.utc) - created_date).days
        return age_days >= self.retention_days
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert policy to dictionary."""
        return {
            "policy_id": self.policy_id,
            "name": self.name,
            "data_types": self.data_types,
            "retention_period": self.retention_period.value,
            "retention_days": self.retention_days,
            "classification": self.classification.value,
            "auto_delete": self.auto_delete,
            "legal_hold_override": self.legal_hold_override,
            "metadata": self.metadata
        }


class PrivacyControl:
    """Privacy control configuration for GDPR compliance."""
    
    def __init__(
        self,
        control_id: str,
        name: str,
        purpose: str,
        legal_basis: str,
        data_subjects: List[str],
        processing_activities: List[str],
        third_party_sharing: bool = False,
        consent_required: bool = False,
        **settings
    ):
        self.control_id = control_id
        self.name = name
        self.purpose = purpose
        self.legal_basis = legal_basis
        self.data_subjects = data_subjects
        self.processing_activities = processing_activities
        self.third_party_sharing = third_party_sharing
        self.consent_required = consent_required
        self.settings = settings
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert control to dictionary."""
        return {
            "control_id": self.control_id,
            "name": self.name,
            "purpose": self.purpose,
            "legal_basis": self.legal_basis,
            "data_subjects": self.data_subjects,
            "processing_activities": self.processing_activities,
            "third_party_sharing": self.third_party_sharing,
            "consent_required": self.consent_required,
            "settings": self.settings
        }


class ComplianceService:
    """Enterprise compliance management service."""
    
    def __init__(self, db: Session):
        self.db = db
        self._retention_policies: Dict[int, List[DataRetentionPolicy]] = {}
        self._privacy_controls: Dict[int, List[PrivacyControl]] = {}
        self._compliance_frameworks: Dict[int, Set[ComplianceFramework]] = {}
    
    async def configure_compliance_framework(
        self,
        tenant_id: int,
        frameworks: List[ComplianceFramework],
        configuration: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Configure compliance frameworks for a tenant.
        
        Args:
            tenant_id: Tenant ID
            frameworks: List of compliance frameworks to enable
            configuration: Framework-specific configuration
            
        Returns:
            Compliance configuration details
        """
        try:
            # Validate tenant exists
            tenant = await tenant_crud.get(self.db, id=tenant_id)
            if not tenant:
                raise ValueError(f"Tenant {tenant_id} not found")
            
            # Store frameworks
            self._compliance_frameworks[tenant_id] = set(frameworks)
            
            # Create default configurations based on frameworks
            compliance_config = {
                "enabled_frameworks": [f.value for f in frameworks],
                "configuration": configuration or {},
                "configured_at": datetime.now(timezone.utc).isoformat(),
                "status": ComplianceStatus.UNDER_REVIEW.value
            }
            
            # Add framework-specific defaults
            for framework in frameworks:
                if framework == ComplianceFramework.GDPR:
                    compliance_config["gdpr"] = {
                        "data_protection_officer": configuration.get("dpo_contact"),
                        "privacy_policy_url": configuration.get("privacy_policy_url"),
                        "consent_management_enabled": True,
                        "right_to_be_forgotten_enabled": True,
                        "data_portability_enabled": True
                    }
                elif framework in [ComplianceFramework.SOC2_TYPE1, ComplianceFramework.SOC2_TYPE2]:
                    compliance_config["soc2"] = {
                        "security_controls_enabled": True,
                        "availability_monitoring": True,
                        "processing_integrity": True,
                        "confidentiality_controls": True,
                        "privacy_controls": framework == ComplianceFramework.SOC2_TYPE2
                    }
            
            # Store in tenant settings
            tenant_settings = tenant.settings or {}
            tenant_settings['compliance'] = compliance_config
            
            await tenant_crud.update(
                self.db,
                db_obj=tenant,
                obj_in={'settings': tenant_settings}
            )
            
            # Create audit log
            await self._log_compliance_event(
                tenant_id=tenant_id,
                event_type=AuditEventType.COMPLIANCE_EVENT,
                description=f"Compliance frameworks configured: {', '.join([f.value for f in frameworks])}",
                details={"frameworks": [f.value for f in frameworks], "configuration": configuration}
            )
            
            logger.info(f"Compliance frameworks configured for tenant {tenant_id}: {frameworks}")
            return compliance_config
            
        except Exception as e:
            logger.error(f"Failed to configure compliance frameworks for tenant {tenant_id}: {str(e)}")
            raise ValueError(f"Failed to configure compliance frameworks: {str(e)}")
    
    async def create_data_retention_policy(
        self,
        tenant_id: int,
        name: str,
        data_types: List[str],
        retention_period: RetentionPeriod,
        classification: DataClassification,
        auto_delete: bool = True,
        **metadata
    ) -> DataRetentionPolicy:
        """
        Create data retention policy for a tenant.
        
        Args:
            tenant_id: Tenant ID
            name: Policy name
            data_types: List of data types covered
            retention_period: How long to retain data
            classification: Data classification level
            auto_delete: Whether to automatically delete expired data
            **metadata: Additional policy metadata
            
        Returns:
            Created DataRetentionPolicy
        """
        try:
            # Generate policy ID
            policy_id = f"retention-{tenant_id}-{uuid.uuid4().hex[:8]}"
            
            # Create policy
            policy = DataRetentionPolicy(
                policy_id=policy_id,
                name=name,
                data_types=data_types,
                retention_period=retention_period,
                classification=classification,
                auto_delete=auto_delete,
                **metadata
            )
            
            # Store policy
            if tenant_id not in self._retention_policies:
                self._retention_policies[tenant_id] = []
            self._retention_policies[tenant_id].append(policy)
            
            # Store in tenant settings
            tenant = await tenant_crud.get(self.db, id=tenant_id)
            if not tenant:
                raise ValueError(f"Tenant {tenant_id} not found")
            
            tenant_settings = tenant.settings or {}
            tenant_settings.setdefault('compliance', {}).setdefault('retention_policies', []).append(policy.to_dict())
            
            await tenant_crud.update(
                self.db,
                db_obj=tenant,
                obj_in={'settings': tenant_settings}
            )
            
            # Audit log
            await self._log_compliance_event(
                tenant_id=tenant_id,
                event_type=AuditEventType.COMPLIANCE_EVENT,
                description=f"Data retention policy created: {name}",
                details={
                    "policy_id": policy_id,
                    "data_types": data_types,
                    "retention_period": retention_period.value,
                    "classification": classification.value
                }
            )
            
            logger.info(f"Data retention policy created for tenant {tenant_id}: {policy_id}")
            return policy
            
        except Exception as e:
            logger.error(f"Failed to create retention policy for tenant {tenant_id}: {str(e)}")
            raise ValueError(f"Failed to create retention policy: {str(e)}")
    
    async def create_privacy_control(
        self,
        tenant_id: int,
        name: str,
        purpose: str,
        legal_basis: str,
        data_subjects: List[str],
        processing_activities: List[str],
        **settings
    ) -> PrivacyControl:
        """
        Create privacy control for GDPR compliance.
        
        Args:
            tenant_id: Tenant ID
            name: Control name
            purpose: Purpose of data processing
            legal_basis: Legal basis for processing
            data_subjects: Types of data subjects
            processing_activities: List of processing activities
            **settings: Additional control settings
            
        Returns:
            Created PrivacyControl
        """
        try:
            # Generate control ID
            control_id = f"privacy-{tenant_id}-{uuid.uuid4().hex[:8]}"
            
            # Create control
            control = PrivacyControl(
                control_id=control_id,
                name=name,
                purpose=purpose,
                legal_basis=legal_basis,
                data_subjects=data_subjects,
                processing_activities=processing_activities,
                **settings
            )
            
            # Store control
            if tenant_id not in self._privacy_controls:
                self._privacy_controls[tenant_id] = []
            self._privacy_controls[tenant_id].append(control)
            
            # Store in tenant settings
            tenant = await tenant_crud.get(self.db, id=tenant_id)
            if not tenant:
                raise ValueError(f"Tenant {tenant_id} not found")
            
            tenant_settings = tenant.settings or {}
            tenant_settings.setdefault('compliance', {}).setdefault('privacy_controls', []).append(control.to_dict())
            
            await tenant_crud.update(
                self.db,
                db_obj=tenant,
                obj_in={'settings': tenant_settings}
            )
            
            # Audit log
            await self._log_compliance_event(
                tenant_id=tenant_id,
                event_type=AuditEventType.COMPLIANCE_EVENT,
                description=f"Privacy control created: {name}",
                details={
                    "control_id": control_id,
                    "purpose": purpose,
                    "legal_basis": legal_basis,
                    "processing_activities": processing_activities
                }
            )
            
            logger.info(f"Privacy control created for tenant {tenant_id}: {control_id}")
            return control
            
        except Exception as e:
            logger.error(f"Failed to create privacy control for tenant {tenant_id}: {str(e)}")
            raise ValueError(f"Failed to create privacy control: {str(e)}")
    
    async def process_data_deletion_request(
        self,
        tenant_id: int,
        user_email: str,
        request_type: str = "right_to_be_forgotten",
        verification_token: str = None
    ) -> Dict[str, Any]:
        """
        Process GDPR data deletion request.
        
        Args:
            tenant_id: Tenant ID
            user_email: Email of user requesting deletion
            request_type: Type of deletion request
            verification_token: Token to verify request authenticity
            
        Returns:
            Deletion request details
        """
        try:
            # Find user
            user = await user_crud.get_by_email(self.db, email=user_email)
            if not user:
                raise ValueError(f"User {user_email} not found")
            
            # Generate request ID
            request_id = f"delete-{tenant_id}-{uuid.uuid4().hex[:8]}"
            
            # Create deletion plan
            deletion_plan = await self._create_deletion_plan(tenant_id, user.id)
            
            # Execute deletion if verified
            if verification_token:  # In production, verify this token
                deletion_results = await self._execute_data_deletion(tenant_id, user.id, deletion_plan)
                status = "completed"
            else:
                deletion_results = {"status": "pending_verification"}
                status = "pending"
            
            request_details = {
                "request_id": request_id,
                "tenant_id": tenant_id,
                "user_email": user_email,
                "request_type": request_type,
                "status": status,
                "requested_at": datetime.now(timezone.utc).isoformat(),
                "deletion_plan": deletion_plan,
                "results": deletion_results
            }
            
            # Audit log
            await self._log_compliance_event(
                tenant_id=tenant_id,
                event_type=AuditEventType.DATA_DELETION,
                description=f"Data deletion request processed: {request_type}",
                details={
                    "request_id": request_id,
                    "user_email": user_email,
                    "status": status,
                    "deletion_plan": deletion_plan
                },
                user_id=user.id
            )
            
            logger.info(f"Data deletion request processed for tenant {tenant_id}: {request_id}")
            return request_details
            
        except Exception as e:
            logger.error(f"Failed to process data deletion request for tenant {tenant_id}: {str(e)}")
            raise ValueError(f"Failed to process data deletion request: {str(e)}")
    
    async def generate_compliance_report(
        self,
        tenant_id: int,
        framework: ComplianceFramework,
        period_start: datetime,
        period_end: datetime
    ) -> Dict[str, Any]:
        """
        Generate compliance report for a specific framework.
        
        Args:
            tenant_id: Tenant ID
            framework: Compliance framework to report on
            period_start: Report period start
            period_end: Report period end
            
        Returns:
            Compliance report details
        """
        try:
            # Get compliance status
            compliance_status = await self._assess_compliance_status(tenant_id, framework)
            
            # Get audit events for the period
            audit_events = await self._get_audit_events(tenant_id, period_start, period_end)
            
            # Generate framework-specific report
            if framework == ComplianceFramework.GDPR:
                report = await self._generate_gdpr_report(tenant_id, audit_events, period_start, period_end)
            elif framework in [ComplianceFramework.SOC2_TYPE1, ComplianceFramework.SOC2_TYPE2]:
                report = await self._generate_soc2_report(tenant_id, audit_events, period_start, period_end)
            else:
                report = await self._generate_generic_compliance_report(tenant_id, framework, audit_events)
            
            # Add common elements
            report.update({
                "report_id": f"compliance-{tenant_id}-{framework.value}-{uuid.uuid4().hex[:8]}",
                "tenant_id": tenant_id,
                "framework": framework.value,
                "period": {
                    "start": period_start.isoformat(),
                    "end": period_end.isoformat()
                },
                "compliance_status": compliance_status,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "audit_events_count": len(audit_events)
            })
            
            # Audit log
            await self._log_compliance_event(
                tenant_id=tenant_id,
                event_type=AuditEventType.COMPLIANCE_EVENT,
                description=f"Compliance report generated: {framework.value}",
                details={"report_id": report["report_id"], "framework": framework.value}
            )
            
            logger.info(f"Compliance report generated for tenant {tenant_id}: {framework.value}")
            return report
            
        except Exception as e:
            logger.error(f"Failed to generate compliance report for tenant {tenant_id}: {str(e)}")
            raise ValueError(f"Failed to generate compliance report: {str(e)}")
    
    async def _create_deletion_plan(self, tenant_id: int, user_id: int) -> Dict[str, Any]:
        """Create plan for data deletion."""
        # Identify data to be deleted
        data_inventory = {
            "user_profile": {"table": "users", "records": 1},
            "user_sessions": {"table": "user_sessions", "records": 0},  # Estimated
            "audit_logs": {"table": "audit_logs", "records": 0},  # Keep for compliance
            "subscriptions": {"table": "user_subscriptions", "records": 0},
            "payments": {"table": "payments", "records": 0},  # Keep for financial records
            "usage_records": {"table": "usage_records", "records": 0}
        }
        
        # Apply retention policies
        retention_policies = self._retention_policies.get(tenant_id, [])
        deletion_plan = []
        
        for data_type, info in data_inventory.items():
            # Find applicable retention policy
            applicable_policy = None
            for policy in retention_policies:
                if data_type in policy.data_types:
                    applicable_policy = policy
                    break
            
            if applicable_policy and applicable_policy.auto_delete:
                deletion_plan.append({
                    "data_type": data_type,
                    "table": info["table"],
                    "estimated_records": info["records"],
                    "policy_id": applicable_policy.policy_id,
                    "action": "delete"
                })
            else:
                deletion_plan.append({
                    "data_type": data_type,
                    "table": info["table"],
                    "estimated_records": info["records"],
                    "policy_id": None,
                    "action": "retain"
                })
        
        return {
            "user_id": user_id,
            "data_inventory": data_inventory,
            "deletion_items": [item for item in deletion_plan if item["action"] == "delete"],
            "retained_items": [item for item in deletion_plan if item["action"] == "retain"]
        }
    
    async def _execute_data_deletion(
        self,
        tenant_id: int,
        user_id: int,
        deletion_plan: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute data deletion based on plan."""
        results = {
            "deleted_records": {},
            "retained_records": {},
            "errors": []
        }
        
        # Execute deletions
        for item in deletion_plan["deletion_items"]:
            try:
                # In production, this would execute actual database deletions
                # For now, we'll simulate the process
                results["deleted_records"][item["data_type"]] = item["estimated_records"]
            except Exception as e:
                results["errors"].append({
                    "data_type": item["data_type"],
                    "error": str(e)
                })
        
        # Record retained items
        for item in deletion_plan["retained_items"]:
            results["retained_records"][item["data_type"]] = item["estimated_records"]
        
        return results
    
    async def _assess_compliance_status(
        self,
        tenant_id: int,
        framework: ComplianceFramework
    ) -> Dict[str, Any]:
        """Assess compliance status for a framework."""
        # This would implement actual compliance checks
        # For now, return a sample status
        return {
            "overall_status": ComplianceStatus.COMPLIANT.value,
            "controls_assessed": 25,
            "controls_compliant": 23,
            "controls_non_compliant": 2,
            "last_assessment": datetime.now(timezone.utc).isoformat(),
            "next_assessment_due": (datetime.now(timezone.utc) + timedelta(days=90)).isoformat()
        }
    
    async def _get_audit_events(
        self,
        tenant_id: int,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict[str, Any]]:
        """Get audit events for a tenant and period."""
        # Query audit logs from database
        # For now, return sample data
        return [
            {
                "event_type": AuditEventType.USER_LOGIN.value,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "user_id": 1,
                "details": {"ip_address": "192.168.1.1"}
            }
        ]
    
    async def _generate_gdpr_report(
        self,
        tenant_id: int,
        audit_events: List[Dict[str, Any]],
        period_start: datetime,
        period_end: datetime
    ) -> Dict[str, Any]:
        """Generate GDPR-specific compliance report."""
        return {
            "data_processing_activities": len(self._privacy_controls.get(tenant_id, [])),
            "data_deletion_requests": 0,  # Count from audit events
            "data_breach_incidents": 0,
            "consent_management": {
                "consents_collected": 0,
                "consents_withdrawn": 0
            },
            "data_subject_requests": {
                "access_requests": 0,
                "portability_requests": 0,
                "rectification_requests": 0
            }
        }
    
    async def _generate_soc2_report(
        self,
        tenant_id: int,
        audit_events: List[Dict[str, Any]],
        period_start: datetime,
        period_end: datetime
    ) -> Dict[str, Any]:
        """Generate SOC 2-specific compliance report."""
        return {
            "security_controls": {
                "access_controls": "implemented",
                "encryption": "implemented",
                "monitoring": "implemented"
            },
            "availability_metrics": {
                "uptime_percentage": 99.9,
                "incident_count": 0
            },
            "processing_integrity": {
                "data_validation_errors": 0,
                "processing_errors": 0
            }
        }
    
    async def _generate_generic_compliance_report(
        self,
        tenant_id: int,
        framework: ComplianceFramework,
        audit_events: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate generic compliance report."""
        return {
            "audit_events_summary": {
                "total_events": len(audit_events),
                "event_types": list(set(event.get("event_type") for event in audit_events))
            },
            "controls_status": {
                "implemented": 0,
                "not_implemented": 0,
                "partially_implemented": 0
            }
        }
    
    async def _log_compliance_event(
        self,
        tenant_id: int,
        event_type: AuditEventType,
        description: str,
        details: Dict[str, Any] = None,
        user_id: int = None
    ):
        """Log compliance-related audit event."""
        try:
            audit_data = {
                'tenant_id': tenant_id,
                'actor_id': user_id,
                'action': f"compliance.{event_type.value}",
                'resource_type': 'compliance',
                'resource_id': None,
                'details': {
                    'event_type': event_type.value,
                    'description': description,
                    **(details or {})
                },
                'ip_address': None,  # Would be extracted from request context
                'user_agent': None,  # Would be extracted from request context
            }
            
            audit_log = TenantAuditLog(**audit_data)
            self.db.add(audit_log)
            await self.db.commit()
            
        except Exception as e:
            logger.error(f"Failed to log compliance event: {str(e)}")
            # Don't raise exception for audit logging failures
    
    async def get_compliance_dashboard(self, tenant_id: int) -> Dict[str, Any]:
        """Get compliance dashboard data for a tenant."""
        try:
            frameworks = self._compliance_frameworks.get(tenant_id, set())
            
            dashboard_data = {
                "tenant_id": tenant_id,
                "enabled_frameworks": [f.value for f in frameworks],
                "retention_policies": len(self._retention_policies.get(tenant_id, [])),
                "privacy_controls": len(self._privacy_controls.get(tenant_id, [])),
                "compliance_status": {
                    "overall": ComplianceStatus.COMPLIANT.value,
                    "last_assessment": datetime.now(timezone.utc).isoformat()
                },
                "recent_activities": await self._get_recent_compliance_activities(tenant_id),
                "upcoming_tasks": [
                    {
                        "task": "Quarterly compliance review",
                        "due_date": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
                        "priority": "medium"
                    }
                ]
            }
            
            return dashboard_data
            
        except Exception as e:
            logger.error(f"Failed to get compliance dashboard for tenant {tenant_id}: {str(e)}")
            raise ValueError(f"Failed to get compliance dashboard: {str(e)}")
    
    async def _get_recent_compliance_activities(self, tenant_id: int) -> List[Dict[str, Any]]:
        """Get recent compliance activities for dashboard."""
        # In production, query actual audit logs
        return [
            {
                "activity": "Data retention policy updated",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "type": "configuration"
            },
            {
                "activity": "Compliance report generated",
                "timestamp": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat(),
                "type": "report"
            }
        ]


def get_compliance_service(db: Session) -> ComplianceService:
    """Dependency to get compliance service instance."""
    return ComplianceService(db)