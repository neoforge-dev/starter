"""
Simplified billing service for NeoForge SaaS platform.
Provides basic subscription management and usage tracking.
Can be enhanced with Stripe integration later.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.subscription import (
    SubscriptionPlan,
    UserSubscription,
    Payment,
    UsageRecord,
    Invoice
)
from app.models.user import User
from app.crud.base import CRUDBase

logger = logging.getLogger(__name__)

settings = get_settings()


class BillingService:
    """Service for managing subscriptions, billing, and payments."""

    def __init__(self, db: Session):
        self.db = db
        self.plan_crud = CRUDBase(SubscriptionPlan)
        self.subscription_crud = CRUDBase(UserSubscription)
        self.payment_crud = CRUDBase(Payment)
        self.usage_crud = CRUDBase(UsageRecord)
        self.invoice_crud = CRUDBase(Invoice)

    async def create_subscription_plan(
        self,
        name: str,
        price_monthly: float,
        price_yearly: float,
        stripe_price_id: str = None,
        **kwargs
    ) -> SubscriptionPlan:
        """Create a new subscription plan."""
        plan_data = {
            "name": name,
            "price_monthly": price_monthly,
            "price_yearly": price_yearly,
            "stripe_price_id": stripe_price_id or f"plan_{name.lower().replace(' ', '_')}",
            "currency": "USD",
            **kwargs
        }

        plan = await self.plan_crud.create(db=self.db, obj_in=plan_data)
        logger.info(f"Created subscription plan: {plan.name}")
        return plan

    async def get_subscription_plans(self) -> List[SubscriptionPlan]:
        """Get all active subscription plans."""
        return await self.plan_crud.get_multi(db=self.db, is_active=True)

    async def create_user_subscription(
        self,
        user_id: int,
        plan_id: int,
        billing_cycle: str = "monthly"
    ) -> UserSubscription:
        """Create a new user subscription."""
        # Check if user already has an active subscription
        existing = await self.subscription_crud.get_multi(
            db=self.db,
            user_id=user_id,
            status="active"
        )

        if existing:
            raise ValueError("User already has an active subscription")

        # Get the plan
        plan = await self.plan_crud.get(db=self.db, id=plan_id)
        if not plan:
            raise ValueError("Subscription plan not found")

        # Calculate billing dates
        now = datetime.utcnow()
        if billing_cycle == "yearly":
            next_billing = now + timedelta(days=365)
            amount = plan.price_yearly
        else:
            next_billing = now + timedelta(days=30)
            amount = plan.price_monthly

        subscription_data = {
            "user_id": user_id,
            "plan_id": plan_id,
            "status": "active",
            "billing_cycle": billing_cycle,
            "current_period_start": now,
            "current_period_end": next_billing,
            "auto_renew": True
        }

        subscription = await self.subscription_crud.create(db=self.db, obj_in=subscription_data)

        # Create initial payment record
        payment_data = {
            "subscription_id": subscription.id,
            "user_id": user_id,
            "amount": amount,
            "currency": "USD",
            "status": "completed",
            "payment_method": "demo_payment",
            "billing_period_start": now,
            "billing_period_end": next_billing,
            "processed_at": now,
            "description": f"{plan.name} - {billing_cycle} subscription"
        }

        await self.payment_crud.create(db=self.db, obj_in=payment_data)

        logger.info(f"Created subscription for user {user_id}: {plan.name}")
        return subscription

    async def get_user_subscription(self, user_id: int) -> Optional[UserSubscription]:
        """Get user's active subscription."""
        subscriptions = await self.subscription_crud.get_multi(
            db=self.db,
            user_id=user_id,
            status="active"
        )
        return subscriptions[0] if subscriptions else None

    async def cancel_subscription(self, subscription_id: int) -> UserSubscription:
        """Cancel a subscription."""
        subscription = await self.subscription_crud.get(db=self.db, id=subscription_id)
        if not subscription:
            raise ValueError("Subscription not found")

        update_data = {
            "status": "canceled",
            "canceled_at": datetime.utcnow(),
            "auto_renew": False
        }

        subscription = await self.subscription_crud.update(
            db=self.db,
            db_obj=subscription,
            obj_in=update_data
        )

        logger.info(f"Canceled subscription {subscription_id}")
        return subscription

    async def record_usage(
        self,
        subscription_id: int,
        user_id: int,
        metric_type: str,
        quantity: float,
        unit: str = "count"
    ) -> UsageRecord:
        """Record usage for a subscription."""
        usage_data = {
            "subscription_id": subscription_id,
            "user_id": user_id,
            "metric_type": metric_type,
            "quantity": quantity,
            "unit": unit,
            "period_start": datetime.utcnow().replace(day=1),  # Start of current month
            "period_end": datetime.utcnow().replace(day=1, month=datetime.utcnow().month + 1) - timedelta(days=1),
            "recorded_at": datetime.utcnow()
        }

        usage = await self.usage_crud.create(db=self.db, obj_in=usage_data)
        logger.info(f"Recorded usage: {metric_type}={quantity} for subscription {subscription_id}")
        return usage

    async def get_usage_summary(self, subscription_id: int) -> Dict[str, Any]:
        """Get usage summary for a subscription."""
        usage_records = await self.usage_crud.get_multi(
            db=self.db,
            subscription_id=subscription_id
        )

        summary = {}
        for record in usage_records:
            if record.metric_type not in summary:
                summary[record.metric_type] = 0
            summary[record.metric_type] += record.quantity

        return summary

    async def get_payment_history(self, user_id: int) -> List[Payment]:
        """Get payment history for a user."""
        return await self.payment_crud.get_multi(db=self.db, user_id=user_id)

    async def generate_invoice(
        self,
        subscription_id: int,
        user_id: int,
        amount: float,
        billing_period_start: datetime,
        billing_period_end: datetime
    ) -> Invoice:
        """Generate an invoice for a billing period."""
        subscription = await self.subscription_crud.get(db=self.db, id=subscription_id)
        if not subscription:
            raise ValueError("Subscription not found")

        invoice_data = {
            "subscription_id": subscription_id,
            "user_id": user_id,
            "invoice_number": f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{subscription_id}",
            "amount": amount,
            "currency": "USD",
            "status": "paid",
            "billing_period_start": billing_period_start,
            "billing_period_end": billing_period_end,
            "issued_at": datetime.utcnow(),
            "paid_at": datetime.utcnow()
        }

        invoice = await self.invoice_crud.create(db=self.db, obj_in=invoice_data)
        logger.info(f"Generated invoice {invoice.invoice_number} for subscription {subscription_id}")
        return invoice