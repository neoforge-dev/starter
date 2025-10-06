"""
Enterprise SAML SSO Integration Service for NeoForge.

Provides SAML 2.0 Single Sign-On support for enterprise customers with:
- Multi-tenant SSO configuration
- Integration with major identity providers (Okta, Azure AD, Google Workspace)
- Just-in-time (JIT) user provisioning
- Secure SAML assertion handling
- Enterprise-grade audit logging
"""

import logging
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple, Any
from urllib.parse import urlencode, urlparse
import base64
import uuid
import hashlib
import hmac

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend
from cryptography.x509 import load_pem_x509_certificate
import defusedxml.ElementTree as safe_ET
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.config import get_settings
from app.core.security import create_access_token
from app.models.user import User
from app.models.tenant import Tenant, TenantAuditLog
from app.crud.user import user as user_crud
from app.crud.tenant_crud import tenant as tenant_crud

logger = logging.getLogger(__name__)
settings = get_settings()

# SAML 2.0 namespace constants
SAML_ASSERTION_NS = "urn:oasis:names:tc:SAML:2.0:assertion"
SAML_PROTOCOL_NS = "urn:oasis:names:tc:SAML:2.0:protocol"
SAML_METADATA_NS = "urn:oasis:names:tc:SAML:2.0:metadata"


class SAMLError(Exception):
    """Base exception for SAML-related errors."""
    pass


class SAMLConfigurationError(SAMLError):
    """Error in SAML configuration."""
    pass


class SAMLValidationError(SAMLError):
    """Error validating SAML assertion."""
    pass


class SAMLUserProvisioningError(SAMLError):
    """Error during user provisioning."""
    pass


class SAMLConfiguration:
    """SAML configuration for a tenant."""
    
    def __init__(
        self,
        tenant_id: int,
        idp_entity_id: str,
        idp_sso_url: str,
        idp_x509_cert: str,
        sp_entity_id: str = None,
        sp_acs_url: str = None,
        sp_slo_url: str = None,
        attribute_mapping: Dict[str, str] = None,
        auto_provision: bool = True,
        require_signed_assertions: bool = True,
        **kwargs
    ):
        self.tenant_id = tenant_id
        self.idp_entity_id = idp_entity_id
        self.idp_sso_url = idp_sso_url
        self.idp_x509_cert = idp_x509_cert
        
        # Service Provider configuration
        self.sp_entity_id = sp_entity_id or f"{settings.server_host}/saml/metadata/{tenant_id}"
        self.sp_acs_url = sp_acs_url or f"{settings.server_host}/api/v1/auth/saml/acs/{tenant_id}"
        self.sp_slo_url = sp_slo_url or f"{settings.server_host}/api/v1/auth/saml/slo/{tenant_id}"
        
        # User provisioning settings
        self.attribute_mapping = attribute_mapping or {
            "email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
            "first_name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
            "last_name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
            "groups": "http://schemas.microsoft.com/ws/2008/06/identity/claims/groups"
        }
        self.auto_provision = auto_provision
        
        # Security settings
        self.require_signed_assertions = require_signed_assertions
        
        # Additional configuration
        for key, value in kwargs.items():
            setattr(self, key, value)


class SAMLService:
    """Enterprise SAML SSO service."""
    
    def __init__(self, db: Session):
        self.db = db
        self._configurations: Dict[int, SAMLConfiguration] = {}
        
    async def configure_saml_for_tenant(
        self,
        tenant_id: int,
        idp_entity_id: str,
        idp_sso_url: str,
        idp_x509_cert: str,
        **config_options
    ) -> SAMLConfiguration:
        """
        Configure SAML SSO for a tenant.
        
        Args:
            tenant_id: Tenant ID
            idp_entity_id: Identity Provider Entity ID
            idp_sso_url: IdP Single Sign-On URL
            idp_x509_cert: IdP X.509 certificate for signature verification
            **config_options: Additional configuration options
            
        Returns:
            SAMLConfiguration: The configured SAML settings
            
        Raises:
            SAMLConfigurationError: If configuration is invalid
        """
        try:
            # Validate tenant exists
            tenant = await tenant_crud.get(self.db, id=tenant_id)
            if not tenant:
                raise SAMLConfigurationError(f"Tenant {tenant_id} not found")
            
            # Validate certificate format
            self._validate_x509_certificate(idp_x509_cert)
            
            # Create configuration
            config = SAMLConfiguration(
                tenant_id=tenant_id,
                idp_entity_id=idp_entity_id,
                idp_sso_url=idp_sso_url,
                idp_x509_cert=idp_x509_cert,
                **config_options
            )
            
            # Store configuration (in production, this would be in database)
            self._configurations[tenant_id] = config
            
            # Store in tenant settings
            tenant_settings = tenant.settings or {}
            tenant_settings['saml_config'] = {
                'enabled': True,
                'idp_entity_id': idp_entity_id,
                'idp_sso_url': idp_sso_url,
                'idp_x509_cert': idp_x509_cert,
                'sp_entity_id': config.sp_entity_id,
                'sp_acs_url': config.sp_acs_url,
                'attribute_mapping': config.attribute_mapping,
                'auto_provision': config.auto_provision,
                'require_signed_assertions': config.require_signed_assertions,
                'configured_at': datetime.now(timezone.utc).isoformat()
            }
            
            await tenant_crud.update(
                self.db,
                db_obj=tenant,
                obj_in={'settings': tenant_settings}
            )
            
            # Audit log
            await self._log_audit_event(
                tenant_id=tenant_id,
                action="saml.configured",
                resource_type="saml_config",
                details={
                    "idp_entity_id": idp_entity_id,
                    "configured_at": datetime.now(timezone.utc).isoformat()
                }
            )
            
            logger.info(f"SAML configured for tenant {tenant_id} with IdP {idp_entity_id}")
            return config
            
        except Exception as e:
            logger.error(f"Failed to configure SAML for tenant {tenant_id}: {str(e)}")
            raise SAMLConfigurationError(f"Failed to configure SAML: {str(e)}")
    
    def get_saml_configuration(self, tenant_id: int) -> Optional[SAMLConfiguration]:
        """Get SAML configuration for a tenant."""
        return self._configurations.get(tenant_id)
    
    async def generate_saml_request(
        self,
        tenant_id: int,
        relay_state: str = None
    ) -> Tuple[str, str]:
        """
        Generate SAML AuthnRequest for tenant.
        
        Args:
            tenant_id: Tenant ID
            relay_state: Optional relay state parameter
            
        Returns:
            Tuple of (saml_request_url, request_id)
            
        Raises:
            SAMLConfigurationError: If tenant SAML not configured
        """
        config = self.get_saml_configuration(tenant_id)
        if not config:
            raise SAMLConfigurationError(f"SAML not configured for tenant {tenant_id}")
        
        request_id = f"_{uuid.uuid4().hex}"
        issue_instant = datetime.now(timezone.utc).isoformat() + "Z"
        
        # Create SAML AuthnRequest XML
        authn_request = f"""<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest 
    xmlns:samlp="{SAML_PROTOCOL_NS}"
    xmlns:saml="{SAML_ASSERTION_NS}"
    ID="{request_id}"
    Version="2.0"
    IssueInstant="{issue_instant}"
    Destination="{config.idp_sso_url}"
    AssertionConsumerServiceURL="{config.sp_acs_url}"
    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
    <saml:Issuer>{config.sp_entity_id}</saml:Issuer>
    <samlp:NameIDPolicy 
        Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
        AllowCreate="true"/>
</samlp:AuthnRequest>"""
        
        # Encode and compress the request
        encoded_request = base64.b64encode(authn_request.encode('utf-8')).decode('ascii')
        
        # Build redirect URL
        params = {
            'SAMLRequest': encoded_request
        }
        if relay_state:
            params['RelayState'] = relay_state
            
        redirect_url = f"{config.idp_sso_url}?{urlencode(params)}"
        
        logger.info(f"Generated SAML request for tenant {tenant_id}, request_id: {request_id}")
        return redirect_url, request_id
    
    async def process_saml_response(
        self,
        tenant_id: int,
        saml_response: str,
        relay_state: str = None
    ) -> Dict[str, Any]:
        """
        Process SAML Response and authenticate user.
        
        Args:
            tenant_id: Tenant ID
            saml_response: Base64 encoded SAML Response
            relay_state: Optional relay state parameter
            
        Returns:
            Dict containing user info and access token
            
        Raises:
            SAMLValidationError: If SAML response is invalid
            SAMLUserProvisioningError: If user provisioning fails
        """
        config = self.get_saml_configuration(tenant_id)
        if not config:
            raise SAMLConfigurationError(f"SAML not configured for tenant {tenant_id}")
        
        try:
            # Decode SAML response
            decoded_response = base64.b64decode(saml_response).decode('utf-8')
            
            # Parse and validate XML
            response_tree = safe_ET.fromstring(decoded_response)
            
            # Validate response
            await self._validate_saml_response(response_tree, config)
            
            # Extract user attributes
            user_attributes = self._extract_user_attributes(response_tree, config)
            
            # Get or create user
            user = await self._provision_user(tenant_id, user_attributes, config)
            
            # Generate access token
            access_token = create_access_token(
                subject=user.id,
                settings=settings
            )
            
            # Audit log
            await self._log_audit_event(
                tenant_id=tenant_id,
                actor_id=user.id,
                action="saml.login_success",
                resource_type="user",
                resource_id=str(user.id),
                details={
                    "email": user.email,
                    "saml_attributes": user_attributes,
                    "login_at": datetime.now(timezone.utc).isoformat()
                }
            )
            
            logger.info(f"SAML authentication successful for user {user.email} in tenant {tenant_id}")
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "tenant_id": tenant_id
                },
                "relay_state": relay_state
            }
            
        except Exception as e:
            # Audit failed login attempt
            await self._log_audit_event(
                tenant_id=tenant_id,
                action="saml.login_failed",
                resource_type="authentication",
                details={
                    "error": str(e),
                    "failed_at": datetime.now(timezone.utc).isoformat()
                }
            )
            
            logger.error(f"SAML authentication failed for tenant {tenant_id}: {str(e)}")
            raise SAMLValidationError(f"SAML authentication failed: {str(e)}")
    
    async def generate_metadata(self, tenant_id: int) -> str:
        """
        Generate SAML SP metadata for a tenant.
        
        Args:
            tenant_id: Tenant ID
            
        Returns:
            SAML SP metadata XML string
        """
        config = self.get_saml_configuration(tenant_id)
        if not config:
            raise SAMLConfigurationError(f"SAML not configured for tenant {tenant_id}")
        
        metadata = f"""<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor 
    xmlns:md="{SAML_METADATA_NS}"
    entityID="{config.sp_entity_id}">
    <md:SPSSODescriptor 
        protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
        <md:AssertionConsumerService 
            Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
            Location="{config.sp_acs_url}"
            index="1"/>
        <md:SingleLogoutService
            Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
            Location="{config.sp_slo_url}"/>
    </md:SPSSODescriptor>
</md:EntityDescriptor>"""
        
        return metadata
    
    def _validate_x509_certificate(self, cert_pem: str) -> None:
        """Validate X.509 certificate format."""
        try:
            cert_bytes = cert_pem.encode('utf-8')
            load_pem_x509_certificate(cert_bytes, default_backend())
        except Exception as e:
            raise SAMLConfigurationError(f"Invalid X.509 certificate: {str(e)}")
    
    async def _validate_saml_response(
        self,
        response_tree: ET.Element,
        config: SAMLConfiguration
    ) -> None:
        """Validate SAML Response XML."""
        # Check response status
        status_elem = response_tree.find('.//{' + SAML_PROTOCOL_NS + '}Status')
        if status_elem is not None:
            status_code_elem = status_elem.find('.//{' + SAML_PROTOCOL_NS + '}StatusCode')
            if status_code_elem is not None:
                status_code = status_code_elem.get('Value', '')
                if status_code != 'urn:oasis:names:tc:SAML:2.0:status:Success':
                    raise SAMLValidationError(f"SAML response status not successful: {status_code}")
        
        # Check assertion exists
        assertion_elem = response_tree.find('.//{' + SAML_ASSERTION_NS + '}Assertion')
        if assertion_elem is None:
            raise SAMLValidationError("No SAML assertion found in response")
        
        # Validate signature if required
        if config.require_signed_assertions:
            await self._validate_signature(assertion_elem, config)
        
        # Validate conditions (NotBefore, NotOnOrAfter)
        conditions_elem = assertion_elem.find('.//{' + SAML_ASSERTION_NS + '}Conditions')
        if conditions_elem is not None:
            now = datetime.now(timezone.utc)
            
            not_before = conditions_elem.get('NotBefore')
            if not_before:
                not_before_dt = datetime.fromisoformat(not_before.replace('Z', '+00:00'))
                if now < not_before_dt:
                    raise SAMLValidationError("SAML assertion not yet valid")
            
            not_on_or_after = conditions_elem.get('NotOnOrAfter')
            if not_on_or_after:
                not_on_or_after_dt = datetime.fromisoformat(not_on_or_after.replace('Z', '+00:00'))
                if now >= not_on_or_after_dt:
                    raise SAMLValidationError("SAML assertion has expired")
    
    async def _validate_signature(
        self,
        assertion_elem: ET.Element,
        config: SAMLConfiguration
    ) -> None:
        """Validate SAML assertion signature (simplified implementation)."""
        # Validate XML digital signature
        signature_elem = assertion_elem.find('.//{http://www.w3.org/2000/09/xmldsig#}Signature')
        if signature_elem is None and config.require_signed_assertions:
            raise SAMLValidationError("SAML assertion signature required but not found")

        if signature_elem is not None:
            # SECURITY: Proper XML signature validation required
            # Using signxml library for cryptographic signature verification
            try:
                from signxml import XMLVerifier

                # Verify signature against IDP certificate
                XMLVerifier().verify(
                    assertion_elem,
                    x509_cert=config.idp_certificate,
                    require_x509=True
                )
                logger.info("SAML signature validation successful")
            except ImportError:
                logger.error("signxml library not installed - SAML signature validation DISABLED")
                if config.require_signed_assertions:
                    raise SAMLValidationError(
                        "SAML signature validation required but signxml library not available. "
                        "Install with: pip install signxml"
                    )
            except Exception as e:
                logger.error("SAML signature validation failed", error=str(e))
                raise SAMLValidationError(f"Invalid SAML assertion signature: {str(e)}")
    
    def _extract_user_attributes(
        self,
        response_tree: ET.Element,
        config: SAMLConfiguration
    ) -> Dict[str, Any]:
        """Extract user attributes from SAML assertion."""
        attributes = {}
        
        # Find attribute statements
        attr_statements = response_tree.findall('.//{' + SAML_ASSERTION_NS + '}AttributeStatement')
        
        for attr_statement in attr_statements:
            attr_elements = attr_statement.findall('.//{' + SAML_ASSERTION_NS + '}Attribute')
            
            for attr_elem in attr_elements:
                attr_name = attr_elem.get('Name', '')
                attr_values = []
                
                value_elements = attr_elem.findall('.//{' + SAML_ASSERTION_NS + '}AttributeValue')
                for value_elem in value_elements:
                    if value_elem.text:
                        attr_values.append(value_elem.text)
                
                if attr_values:
                    attributes[attr_name] = attr_values[0] if len(attr_values) == 1 else attr_values
        
        # Map attributes to user fields
        user_attributes = {}
        for user_field, saml_attr in config.attribute_mapping.items():
            if saml_attr in attributes:
                user_attributes[user_field] = attributes[saml_attr]
        
        # Extract NameID as fallback email
        name_id_elem = response_tree.find('.//{' + SAML_ASSERTION_NS + '}NameID')
        if name_id_elem is not None and name_id_elem.text:
            if 'email' not in user_attributes:
                user_attributes['email'] = name_id_elem.text
        
        return user_attributes
    
    async def _provision_user(
        self,
        tenant_id: int,
        user_attributes: Dict[str, Any],
        config: SAMLConfiguration
    ) -> User:
        """Provision or update user based on SAML attributes."""
        email = user_attributes.get('email')
        if not email:
            raise SAMLUserProvisioningError("No email attribute found in SAML response")
        
        try:
            # Try to find existing user
            user = await user_crud.get_by_email(self.db, email=email)
            
            if user:
                # Update existing user attributes
                update_data = {}
                if 'first_name' in user_attributes:
                    update_data['first_name'] = user_attributes['first_name']
                if 'last_name' in user_attributes:
                    update_data['last_name'] = user_attributes['last_name']
                
                if update_data:
                    user = await user_crud.update(self.db, db_obj=user, obj_in=update_data)
                
                logger.info(f"Updated existing user {email} from SAML")
                return user
            
            elif config.auto_provision:
                # Create new user
                user_data = {
                    'email': email,
                    'first_name': user_attributes.get('first_name', ''),
                    'last_name': user_attributes.get('last_name', ''),
                    'is_active': True,
                    'is_verified': True,  # SAML users are pre-verified
                    'hashed_password': '',  # No password for SAML users
                }
                
                user = await user_crud.create(self.db, obj_in=user_data)
                logger.info(f"Created new user {email} from SAML")
                return user
            
            else:
                raise SAMLUserProvisioningError(
                    f"User {email} not found and auto-provisioning disabled"
                )
                
        except IntegrityError as e:
            logger.error(f"Database integrity error during user provisioning: {str(e)}")
            raise SAMLUserProvisioningError(f"Failed to provision user: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error during user provisioning: {str(e)}")
            raise SAMLUserProvisioningError(f"Failed to provision user: {str(e)}")
    
    async def _log_audit_event(
        self,
        tenant_id: int,
        action: str,
        resource_type: str,
        actor_id: int = None,
        resource_id: str = None,
        details: Dict[str, Any] = None
    ) -> None:
        """Log audit event for SAML operations."""
        try:
            audit_data = {
                'tenant_id': tenant_id,
                'actor_id': actor_id,
                'action': action,
                'resource_type': resource_type,
                'resource_id': resource_id,
                'details': details or {},
                'ip_address': None,  # Would be extracted from request context
                'user_agent': None,  # Would be extracted from request context
            }
            
            audit_log = TenantAuditLog(**audit_data)
            self.db.add(audit_log)
            await self.db.commit()
            
        except Exception as e:
            logger.error(f"Failed to log audit event: {str(e)}")
            # Don't raise exception for audit logging failures
    
    async def get_tenant_saml_users(self, tenant_id: int) -> List[Dict[str, Any]]:
        """Get all SAML-authenticated users for a tenant."""
        # This would query users who have logged in via SAML
        # Implementation depends on how you track SAML users
        # For now, return empty list
        return []
    
    async def disable_saml_for_tenant(self, tenant_id: int) -> None:
        """Disable SAML SSO for a tenant."""
        config = self.get_saml_configuration(tenant_id)
        if not config:
            return
        
        # Remove from memory
        if tenant_id in self._configurations:
            del self._configurations[tenant_id]
        
        # Update tenant settings
        tenant = await tenant_crud.get(self.db, id=tenant_id)
        if tenant and tenant.settings:
            tenant_settings = tenant.settings.copy()
            if 'saml_config' in tenant_settings:
                tenant_settings['saml_config']['enabled'] = False
                tenant_settings['saml_config']['disabled_at'] = datetime.now(timezone.utc).isoformat()
                
                await tenant_crud.update(
                    self.db,
                    db_obj=tenant,
                    obj_in={'settings': tenant_settings}
                )
        
        # Audit log
        await self._log_audit_event(
            tenant_id=tenant_id,
            action="saml.disabled",
            resource_type="saml_config",
            details={
                "disabled_at": datetime.now(timezone.utc).isoformat()
            }
        )
        
        logger.info(f"SAML disabled for tenant {tenant_id}")


# Predefined SAML configurations for popular Identity Providers
SAML_IDP_PRESETS = {
    "okta": {
        "attribute_mapping": {
            "email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
            "first_name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
            "last_name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
            "groups": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/groups"
        }
    },
    "azure_ad": {
        "attribute_mapping": {
            "email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
            "first_name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
            "last_name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
            "groups": "http://schemas.microsoft.com/ws/2008/06/identity/claims/groups"
        }
    },
    "google_workspace": {
        "attribute_mapping": {
            "email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
            "first_name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
            "last_name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"
        }
    }
}


def get_saml_service(db: Session) -> SAMLService:
    """Dependency to get SAML service instance."""
    return SAMLService(db)