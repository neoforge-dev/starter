"""
Enterprise Billing Service for NeoForge SaaS platform.

Extends the basic billing service with enterprise-grade features:
- Custom contract management
- Multiple payment methods (ACH, wire transfers, purchase orders)
- Usage-based billing with enterprise-scale metering
- Invoice customization and branding
- Advanced payment terms and NET billing
- Multi-entity billing and consolidated invoicing
- Compliance and audit features
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, List, Any, Tuple
from decimal import Decimal
from enum import Enum
import uuid

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.config import get_settings
from app.models.subscription import (
    SubscriptionPlan,
    UserSubscription,
    Payment,
    UsageRecord,
    Invoice
)
from app.models.user import User
from app.models.tenant import Tenant
from app.services.billing_service import BillingService
from app.crud.base import CRUDBase
from app.crud.tenant_crud import tenant as tenant_crud

logger = logging.getLogger(__name__)
settings = get_settings()


class PaymentMethod(str, Enum):
    """Enterprise payment methods."""
    CREDIT_CARD = "credit_card"
    ACH = "ach"
    WIRE_TRANSFER = "wire_transfer"
    PURCHASE_ORDER = "purchase_order"
    CHECK = "check"
    INVOICE = "invoice"


class PaymentTerms(str, Enum):
    """Enterprise payment terms."""
    NET_0 = "net_0"  # Immediate
    NET_15 = "net_15"  # 15 days
    NET_30 = "net_30"  # 30 days
    NET_60 = "net_60"  # 60 days
    NET_90 = "net_90"  # 90 days


class ContractType(str, Enum):
    """Enterprise contract types."""
    STANDARD = "standard"
    CUSTOM = "custom"
    VOLUME_DISCOUNT = "volume_discount"
    ENTERPRISE_AGREEMENT = "enterprise_agreement"
    PILOT = "pilot"


class BillingFrequency(str, Enum):
    """Enterprise billing frequencies."""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    SEMI_ANNUAL = "semi_annual"
    ANNUAL = "annual"
    CUSTOM = "custom"


class EnterpriseContract:
    """Enterprise contract configuration."""
    
    def __init__(
        self,
        tenant_id: int,
        contract_id: str,
        contract_type: ContractType,
        start_date: datetime,
        end_date: datetime,
        payment_terms: PaymentTerms,
        billing_frequency: BillingFrequency,
        currency: str = "USD",
        **terms
    ):
        self.tenant_id = tenant_id
        self.contract_id = contract_id
        self.contract_type = contract_type
        self.start_date = start_date
        self.end_date = end_date
        self.payment_terms = payment_terms
        self.billing_frequency = billing_frequency
        self.currency = currency
        
        # Contract terms
        self.minimum_commitment = terms.get('minimum_commitment', 0)
        self.volume_discounts = terms.get('volume_discounts', {})
        self.custom_pricing = terms.get('custom_pricing', {})
        self.auto_renewal = terms.get('auto_renewal', True)
        self.termination_notice_days = terms.get('termination_notice_days', 30)
        
        # Enterprise features
        self.consolidated_billing = terms.get('consolidated_billing', False)
        self.multi_entity_billing = terms.get('multi_entity_billing', False)
        self.custom_invoice_branding = terms.get('custom_invoice_branding', True)
        self.dedicated_support = terms.get('dedicated_support', True)
        
        # Additional terms
        self.additional_terms = {k: v for k, v in terms.items() 
                               if k not in ['minimum_commitment', 'volume_discounts', 'custom_pricing',
                                          'auto_renewal', 'termination_notice_days', 'consolidated_billing',
                                          'multi_entity_billing', 'custom_invoice_branding', 'dedicated_support']}
    
    def get_volume_discount(self, usage_amount: Decimal) -> Decimal:
        """Calculate volume discount based on usage."""
        if not self.volume_discounts:
            return Decimal('0')
        
        # Sort thresholds descending
        thresholds = sorted(self.volume_discounts.keys(), key=lambda x: Decimal(str(x)), reverse=True)
        
        for threshold in thresholds:
            if usage_amount >= Decimal(str(threshold)):
                return Decimal(str(self.volume_discounts[threshold]))
        
        return Decimal('0')
    
    def calculate_custom_price(self, metric_type: str, base_price: Decimal) -> Decimal:
        """Calculate custom pricing for a metric."""
        if not self.custom_pricing or metric_type not in self.custom_pricing:
            return base_price
        
        custom_config = self.custom_pricing[metric_type]
        
        # Fixed price override
        if 'fixed_price' in custom_config:
            return Decimal(str(custom_config['fixed_price']))
        
        # Percentage discount/markup
        if 'percentage_adjustment' in custom_config:
            adjustment = Decimal(str(custom_config['percentage_adjustment']))
            return base_price * (Decimal('1') + adjustment / Decimal('100'))
        
        return base_price
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert contract to dictionary."""
        return {
            "tenant_id": self.tenant_id,
            "contract_id": self.contract_id,
            "contract_type": self.contract_type.value,
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "payment_terms": self.payment_terms.value,
            "billing_frequency": self.billing_frequency.value,
            "currency": self.currency,
            "minimum_commitment": float(self.minimum_commitment),
            "volume_discounts": {str(k): float(v) for k, v in self.volume_discounts.items()},
            "custom_pricing": self.custom_pricing,
            "auto_renewal": self.auto_renewal,
            "termination_notice_days": self.termination_notice_days,
            "consolidated_billing": self.consolidated_billing,
            "multi_entity_billing": self.multi_entity_billing,
            "custom_invoice_branding": self.custom_invoice_branding,
            "dedicated_support": self.dedicated_support,
            "additional_terms": self.additional_terms
        }


class UsageMetering:
    """Advanced usage metering for enterprise billing."""
    
    def __init__(self, tenant_id: int):
        self.tenant_id = tenant_id
        self.metrics = {}
        self.aggregations = {}
    
    def record_usage(
        self,
        metric_type: str,
        quantity: Decimal,
        unit: str,
        dimensions: Dict[str, str] = None,
        timestamp: datetime = None
    ):
        """Record usage with dimensions for detailed tracking."""
        timestamp = timestamp or datetime.now(timezone.utc)
        dimensions = dimensions or {}
        
        if metric_type not in self.metrics:
            self.metrics[metric_type] = []
        
        usage_record = {
            "quantity": quantity,
            "unit": unit,
            "dimensions": dimensions,
            "timestamp": timestamp
        }
        
        self.metrics[metric_type].append(usage_record)
    
    def aggregate_usage(
        self,
        metric_type: str,
        period_start: datetime,
        period_end: datetime,
        aggregation_method: str = "sum"
    ) -> Dict[str, Any]:
        """Aggregate usage for a specific period."""
        if metric_type not in self.metrics:
            return {"total": 0, "unit": None, "records_count": 0}
        
        # Filter records by time period
        filtered_records = [
            record for record in self.metrics[metric_type]
            if period_start <= record["timestamp"] <= period_end
        ]
        
        if not filtered_records:
            return {"total": 0, "unit": None, "records_count": 0}
        
        # Aggregate based on method
        quantities = [record["quantity"] for record in filtered_records]
        unit = filtered_records[0]["unit"]
        
        if aggregation_method == "sum":
            total = sum(quantities)
        elif aggregation_method == "average":
            total = sum(quantities) / len(quantities)
        elif aggregation_method == "max":
            total = max(quantities)
        elif aggregation_method == "min":
            total = min(quantities)
        else:
            total = sum(quantities)  # Default to sum
        
        return {
            "total": total,
            "unit": unit,
            "records_count": len(filtered_records),
            "aggregation_method": aggregation_method,
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat()
        }
    
    def get_usage_by_dimensions(
        self,
        metric_type: str,
        dimension_key: str,
        period_start: datetime,
        period_end: datetime
    ) -> Dict[str, Decimal]:
        """Get usage breakdown by dimension."""
        if metric_type not in self.metrics:
            return {}
        
        # Filter records by time period
        filtered_records = [
            record for record in self.metrics[metric_type]
            if period_start <= record["timestamp"] <= period_end
        ]
        
        # Group by dimension value
        dimension_usage = {}
        for record in filtered_records:
            dimension_value = record["dimensions"].get(dimension_key, "unknown")
            if dimension_value not in dimension_usage:
                dimension_usage[dimension_value] = Decimal('0')
            dimension_usage[dimension_value] += record["quantity"]
        
        return dimension_usage


class EnterpriseBillingService(BillingService):
    """Enhanced billing service for enterprise customers."""
    
    def __init__(self, db: Session):
        super().__init__(db)
        self._contracts: Dict[int, EnterpriseContract] = {}
        self._usage_meters: Dict[int, UsageMetering] = {}
    
    async def create_enterprise_contract(
        self,
        tenant_id: int,
        contract_type: ContractType,
        start_date: datetime,
        end_date: datetime,
        payment_terms: PaymentTerms,
        billing_frequency: BillingFrequency,
        **contract_terms
    ) -> EnterpriseContract:
        """
        Create enterprise contract for a tenant.
        
        Args:
            tenant_id: Tenant ID
            contract_type: Type of enterprise contract
            start_date: Contract start date
            end_date: Contract end date
            payment_terms: Payment terms (NET 30, etc.)
            billing_frequency: How often to bill
            **contract_terms: Additional contract terms
            
        Returns:
            EnterpriseContract: The created contract
        """
        try:
            # Validate tenant exists
            tenant = await tenant_crud.get(self.db, id=tenant_id)
            if not tenant:
                raise ValueError(f"Tenant {tenant_id} not found")
            
            # Generate contract ID
            contract_id = f"ENT-{tenant_id}-{uuid.uuid4().hex[:8].upper()}"
            
            # Create contract
            contract = EnterpriseContract(
                tenant_id=tenant_id,
                contract_id=contract_id,
                contract_type=contract_type,
                start_date=start_date,
                end_date=end_date,
                payment_terms=payment_terms,
                billing_frequency=billing_frequency,
                **contract_terms
            )
            
            # Store contract
            self._contracts[tenant_id] = contract
            
            # Store in tenant settings
            tenant_settings = tenant.settings or {}
            tenant_settings['enterprise_contract'] = contract.to_dict()
            
            await tenant_crud.update(
                self.db,
                db_obj=tenant,
                obj_in={'settings': tenant_settings}
            )
            
            logger.info(f"Enterprise contract created for tenant {tenant_id}: {contract_id}")
            return contract
            
        except Exception as e:
            logger.error(f"Failed to create enterprise contract for tenant {tenant_id}: {str(e)}")
            raise ValueError(f"Failed to create enterprise contract: {str(e)}")
    
    def get_enterprise_contract(self, tenant_id: int) -> Optional[EnterpriseContract]:
        """Get enterprise contract for a tenant."""
        return self._contracts.get(tenant_id)
    
    async def setup_ach_payment_method(
        self,
        tenant_id: int,
        account_holder_name: str,
        routing_number: str,
        account_number: str,
        account_type: str = "checking"
    ) -> Dict[str, Any]:
        """
        Set up ACH payment method for enterprise tenant.
        
        Args:
            tenant_id: Tenant ID
            account_holder_name: Name on bank account
            routing_number: Bank routing number
            account_number: Bank account number (encrypted)
            account_type: checking or savings
            
        Returns:
            Payment method configuration
        """
        try:
            # Validate routing number (basic check)
            if len(routing_number) != 9 or not routing_number.isdigit():
                raise ValueError("Invalid routing number format")
            
            # In production, encrypt the account number
            encrypted_account = f"ENCRYPTED:{account_number[-4:]}"  # Show only last 4 digits
            
            payment_method_config = {
                "method_type": PaymentMethod.ACH.value,
                "account_holder_name": account_holder_name,
                "routing_number": routing_number,
                "account_number": encrypted_account,
                "account_type": account_type,
                "status": "pending_verification",
                "configured_at": datetime.now(timezone.utc).isoformat()
            }
            
            # Store in tenant settings
            tenant = await tenant_crud.get(self.db, id=tenant_id)
            if not tenant:
                raise ValueError(f"Tenant {tenant_id} not found")
            
            tenant_settings = tenant.settings or {}
            tenant_settings.setdefault('payment_methods', []).append(payment_method_config)
            
            await tenant_crud.update(
                self.db,
                db_obj=tenant,
                obj_in={'settings': tenant_settings}
            )
            
            logger.info(f"ACH payment method configured for tenant {tenant_id}")
            return payment_method_config
            
        except Exception as e:
            logger.error(f"Failed to setup ACH payment method for tenant {tenant_id}: {str(e)}")
            raise ValueError(f"Failed to setup ACH payment method: {str(e)}")
    
    async def setup_wire_transfer_payment(
        self,
        tenant_id: int,
        bank_name: str,
        bank_address: str,
        swift_code: str,
        account_number: str,
        beneficiary_name: str,
        beneficiary_address: str
    ) -> Dict[str, Any]:
        """
        Set up wire transfer payment method for enterprise tenant.
        
        Args:
            tenant_id: Tenant ID
            bank_name: Name of the bank
            bank_address: Bank address
            swift_code: SWIFT/BIC code
            account_number: Account number
            beneficiary_name: Beneficiary name
            beneficiary_address: Beneficiary address
            
        Returns:
            Wire transfer configuration
        """
        try:
            wire_transfer_config = {
                "method_type": PaymentMethod.WIRE_TRANSFER.value,
                "bank_name": bank_name,
                "bank_address": bank_address,
                "swift_code": swift_code,
                "account_number": f"****{account_number[-4:]}",  # Mask account number
                "beneficiary_name": beneficiary_name,
                "beneficiary_address": beneficiary_address,
                "status": "active",
                "configured_at": datetime.now(timezone.utc).isoformat()
            }
            
            # Store in tenant settings
            tenant = await tenant_crud.get(self.db, id=tenant_id)
            if not tenant:
                raise ValueError(f"Tenant {tenant_id} not found")
            
            tenant_settings = tenant.settings or {}
            tenant_settings.setdefault('payment_methods', []).append(wire_transfer_config)
            
            await tenant_crud.update(
                self.db,
                db_obj=tenant,
                obj_in={'settings': tenant_settings}
            )
            
            logger.info(f"Wire transfer payment method configured for tenant {tenant_id}")
            return wire_transfer_config
            
        except Exception as e:
            logger.error(f"Failed to setup wire transfer for tenant {tenant_id}: {str(e)}")
            raise ValueError(f"Failed to setup wire transfer: {str(e)}")
    
    async def record_enterprise_usage(
        self,
        tenant_id: int,
        subscription_id: int,
        user_id: int,
        metric_type: str,
        quantity: float,
        unit: str = "count",
        dimensions: Dict[str, str] = None,
        timestamp: datetime = None
    ) -> Dict[str, Any]:
        """
        Record usage for enterprise billing with advanced metering.

        Args:
            tenant_id: Tenant ID
            subscription_id: Subscription ID for this usage
            user_id: User ID who generated this usage
            metric_type: Type of usage metric
            quantity: Usage quantity
            unit: Unit of measurement
            dimensions: Additional dimensions for tracking
            timestamp: When usage occurred

        Returns:
            Usage record details
        """
        try:
            # Get or create usage meter
            if tenant_id not in self._usage_meters:
                self._usage_meters[tenant_id] = UsageMetering(tenant_id)
            
            meter = self._usage_meters[tenant_id]
            
            # Record usage
            meter.record_usage(
                metric_type=metric_type,
                quantity=Decimal(str(quantity)),
                unit=unit,
                dimensions=dimensions or {},
                timestamp=timestamp or datetime.now(timezone.utc)
            )
            
            # Create database record with actual subscription and user IDs
            usage_record = UsageRecord(
                subscription_id=subscription_id,
                user_id=user_id,
                metric_type=metric_type,
                quantity=quantity,
                unit=unit,
                period_start=datetime.now(timezone.utc).replace(day=1),
                period_end=datetime.now(timezone.utc).replace(day=1, month=datetime.now(timezone.utc).month + 1) - timedelta(days=1),
                recorded_at=datetime.now(timezone.utc),
                source="enterprise_api"
            )
            
            self.db.add(usage_record)
            await self.db.commit()
            
            logger.info(f"Enterprise usage recorded for tenant {tenant_id}: {metric_type}={quantity}")
            
            return {
                "tenant_id": tenant_id,
                "metric_type": metric_type,
                "quantity": quantity,
                "unit": unit,
                "dimensions": dimensions or {},
                "recorded_at": (timestamp or datetime.now(timezone.utc)).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to record enterprise usage for tenant {tenant_id}: {str(e)}")
            raise ValueError(f"Failed to record enterprise usage: {str(e)}")
    
    async def generate_enterprise_invoice(
        self,
        tenant_id: int,
        period_start: datetime,
        period_end: datetime,
        custom_line_items: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate enterprise invoice with custom branding and terms.
        
        Args:
            tenant_id: Tenant ID
            period_start: Billing period start
            period_end: Billing period end
            custom_line_items: Custom line items for the invoice
            
        Returns:
            Generated invoice details
        """
        try:
            # Get contract
            contract = self.get_enterprise_contract(tenant_id)
            if not contract:
                raise ValueError(f"No enterprise contract found for tenant {tenant_id}")
            
            # Get usage data
            usage_data = await self._calculate_usage_charges(tenant_id, period_start, period_end)
            
            # Calculate total amount
            subtotal = Decimal('0')
            line_items = []
            
            # Add usage-based charges
            for usage_item in usage_data:
                unit_price = Decimal(str(usage_item['unit_price']))
                quantity = Decimal(str(usage_item['quantity']))
                line_total = unit_price * quantity
                
                # Apply volume discounts
                discount_percentage = contract.get_volume_discount(line_total)
                discount_amount = line_total * (discount_percentage / Decimal('100'))
                final_amount = line_total - discount_amount
                
                line_items.append({
                    "description": usage_item['description'],
                    "quantity": float(quantity),
                    "unit_price": float(unit_price),
                    "line_total": float(line_total),
                    "discount_percentage": float(discount_percentage),
                    "discount_amount": float(discount_amount),
                    "final_amount": float(final_amount)
                })
                
                subtotal += final_amount
            
            # Add custom line items
            if custom_line_items:
                for item in custom_line_items:
                    amount = Decimal(str(item.get('amount', 0)))
                    line_items.append({
                        "description": item.get('description', 'Custom charge'),
                        "quantity": item.get('quantity', 1),
                        "unit_price": float(amount),
                        "line_total": float(amount),
                        "discount_percentage": 0,
                        "discount_amount": 0,
                        "final_amount": float(amount)
                    })
                    subtotal += amount
            
            # Calculate taxes (placeholder)
            tax_rate = Decimal('0.08')  # 8% tax rate
            tax_amount = subtotal * tax_rate
            total_amount = subtotal + tax_amount
            
            # Generate invoice number
            invoice_number = f"INV-{tenant_id}-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
            
            # Calculate due date based on payment terms
            payment_terms_days = {
                PaymentTerms.NET_0: 0,
                PaymentTerms.NET_15: 15,
                PaymentTerms.NET_30: 30,
                PaymentTerms.NET_60: 60,
                PaymentTerms.NET_90: 90
            }
            
            due_date = datetime.now(timezone.utc) + timedelta(days=payment_terms_days.get(contract.payment_terms, 30))
            
            # Create invoice record
            invoice = Invoice(
                subscription_id=1,  # TODO: Get actual subscription ID
                user_id=1,  # TODO: Get actual user ID
                invoice_number=invoice_number,
                amount=float(total_amount),
                currency=contract.currency,
                status="open",
                billing_period_start=period_start,
                billing_period_end=period_end,
                issued_at=datetime.now(timezone.utc),
                due_date=due_date,
                line_items=line_items,
                tax_amount=float(tax_amount),
                discount_amount=0.0
            )
            
            self.db.add(invoice)
            await self.db.commit()
            
            invoice_details = {
                "invoice_number": invoice_number,
                "tenant_id": tenant_id,
                "contract_id": contract.contract_id,
                "amount": float(total_amount),
                "currency": contract.currency,
                "subtotal": float(subtotal),
                "tax_amount": float(tax_amount),
                "line_items": line_items,
                "payment_terms": contract.payment_terms.value,
                "due_date": due_date.isoformat(),
                "billing_period": {
                    "start": period_start.isoformat(),
                    "end": period_end.isoformat()
                },
                "issued_at": datetime.now(timezone.utc).isoformat()
            }
            
            logger.info(f"Enterprise invoice generated for tenant {tenant_id}: {invoice_number}")
            return invoice_details
            
        except Exception as e:
            logger.error(f"Failed to generate enterprise invoice for tenant {tenant_id}: {str(e)}")
            raise ValueError(f"Failed to generate enterprise invoice: {str(e)}")
    
    async def _calculate_usage_charges(
        self,
        tenant_id: int,
        period_start: datetime,
        period_end: datetime
    ) -> List[Dict[str, Any]]:
        """Calculate usage-based charges for the billing period."""
        if tenant_id not in self._usage_meters:
            return []
        
        meter = self._usage_meters[tenant_id]
        contract = self.get_enterprise_contract(tenant_id)
        
        # Standard pricing (would come from configuration)
        standard_pricing = {
            "api_calls": {"unit_price": 0.001, "description": "API Calls"},
            "storage_gb": {"unit_price": 0.10, "description": "Storage (GB)"},
            "users": {"unit_price": 25.00, "description": "Active Users"},
            "compute_hours": {"unit_price": 0.50, "description": "Compute Hours"}
        }
        
        usage_charges = []
        
        for metric_type in meter.metrics.keys():
            if metric_type not in standard_pricing:
                continue
            
            # Aggregate usage for the period
            aggregated = meter.aggregate_usage(metric_type, period_start, period_end)
            
            if aggregated['total'] == 0:
                continue
            
            base_unit_price = Decimal(str(standard_pricing[metric_type]['unit_price']))
            
            # Apply custom pricing if available
            if contract:
                unit_price = contract.calculate_custom_price(metric_type, base_unit_price)
            else:
                unit_price = base_unit_price
            
            usage_charges.append({
                "metric_type": metric_type,
                "description": standard_pricing[metric_type]['description'],
                "quantity": aggregated['total'],
                "unit": aggregated['unit'],
                "unit_price": float(unit_price),
                "aggregation_method": aggregated['aggregation_method']
            })
        
        return usage_charges
    
    async def get_usage_summary(
        self,
        tenant_id: int,
        period_start: datetime,
        period_end: datetime,
        breakdown_by_dimension: str = None
    ) -> Dict[str, Any]:
        """
        Get comprehensive usage summary for a tenant.
        
        Args:
            tenant_id: Tenant ID
            period_start: Period start date
            period_end: Period end date
            breakdown_by_dimension: Optional dimension to break down usage
            
        Returns:
            Usage summary with analytics
        """
        if tenant_id not in self._usage_meters:
            return {"total_usage": {}, "breakdown": {}, "trends": {}}
        
        meter = self._usage_meters[tenant_id]
        
        # Get aggregated usage for all metrics
        total_usage = {}
        for metric_type in meter.metrics.keys():
            aggregated = meter.aggregate_usage(metric_type, period_start, period_end)
            total_usage[metric_type] = aggregated
        
        # Get breakdown by dimension if requested
        breakdown = {}
        if breakdown_by_dimension:
            for metric_type in meter.metrics.keys():
                breakdown[metric_type] = meter.get_usage_by_dimensions(
                    metric_type, breakdown_by_dimension, period_start, period_end
                )
        
        # Calculate trends (compare with previous period)
        previous_period_start = period_start - (period_end - period_start)
        previous_period_end = period_start
        
        trends = {}
        for metric_type in meter.metrics.keys():
            current = meter.aggregate_usage(metric_type, period_start, period_end)
            previous = meter.aggregate_usage(metric_type, previous_period_start, previous_period_end)
            
            if previous['total'] > 0:
                growth_rate = ((current['total'] - previous['total']) / previous['total']) * 100
            else:
                growth_rate = 100.0 if current['total'] > 0 else 0.0
            
            trends[metric_type] = {
                "current_period": current['total'],
                "previous_period": previous['total'],
                "growth_rate": growth_rate,
                "trend": "up" if growth_rate > 0 else "down" if growth_rate < 0 else "flat"
            }
        
        return {
            "tenant_id": tenant_id,
            "period": {
                "start": period_start.isoformat(),
                "end": period_end.isoformat()
            },
            "total_usage": total_usage,
            "breakdown": breakdown,
            "trends": trends,
            "summary_generated_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def export_billing_data(
        self,
        tenant_id: int,
        start_date: datetime,
        end_date: datetime,
        format: str = "csv"
    ) -> Dict[str, Any]:
        """
        Export billing data for compliance and analysis.
        
        Args:
            tenant_id: Tenant ID
            start_date: Export start date
            end_date: Export end date
            format: Export format (csv, json, xlsx)
            
        Returns:
            Export details and download URL
        """
        try:
            # Get usage data
            usage_summary = await self.get_usage_summary(tenant_id, start_date, end_date)
            
            # Get invoices for the period
            # TODO: Implement invoice retrieval from database
            
            # Generate export
            export_id = f"export-{tenant_id}-{uuid.uuid4().hex[:8]}"
            export_data = {
                "export_id": export_id,
                "tenant_id": tenant_id,
                "period": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat()
                },
                "format": format,
                "usage_summary": usage_summary,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
            }
            
            # In production, this would generate the actual file and upload to cloud storage
            download_url = f"{settings.server_host}/api/v1/billing/exports/{export_id}"
            
            return {
                "export_id": export_id,
                "download_url": download_url,
                "format": format,
                "file_size_bytes": len(str(export_data)),
                "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to export billing data for tenant {tenant_id}: {str(e)}")
            raise ValueError(f"Failed to export billing data: {str(e)}")


def get_enterprise_billing_service(db: Session) -> EnterpriseBillingService:
    """Dependency to get enterprise billing service instance."""
    return EnterpriseBillingService(db)