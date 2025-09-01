"""
Subscription and billing models for NeoForge SaaS platform.
Handles subscription plans, user subscriptions, payments, and usage tracking.
"""

from datetime import datetime
from typing import Optional, List, Any
from sqlalchemy import Integer, String, DateTime, Float, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base_class import Base


class SubscriptionPlan(Base):
    """Subscription plan model defining available pricing tiers."""

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    stripe_price_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    price_monthly: Mapped[float] = mapped_column(Float, nullable=False)
    price_yearly: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD")

    # Plan limits
    max_projects: Mapped[int] = mapped_column(Integer, default=1)
    max_users_per_project: Mapped[int] = mapped_column(Integer, default=1)
    max_storage_gb: Mapped[int] = mapped_column(Integer, default=5)
    max_api_calls_per_month: Mapped[int] = mapped_column(Integer, default=10000)

    # Features and metadata
    features: Mapped[Optional[List[str]]] = mapped_column(JSON)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_popular: Mapped[bool] = mapped_column(Boolean, default=False)
    trial_days: Mapped[int] = mapped_column(Integer, default=0)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class UserSubscription(Base):
    """User subscription linking users to their active subscription plans."""

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id: Mapped[int] = mapped_column(Integer, ForeignKey("subscription_plans.id"), nullable=False)

    # Stripe integration
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True)
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(100))

    # Subscription status
    status: Mapped[str] = mapped_column(String(20), default="active")  # active, canceled, past_due, etc.
    billing_cycle: Mapped[str] = mapped_column(String(20), default="monthly")  # monthly, yearly

    # Dates
    current_period_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    current_period_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    trial_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    trial_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    canceled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Settings
    auto_renew: Mapped[bool] = mapped_column(Boolean, default=True)
    proration_mode: Mapped[str] = mapped_column(String(20), default="create_prorations")

    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User")
    plan = relationship("SubscriptionPlan")
    payments = relationship("Payment")
    usage_records = relationship("UsageRecord")
    events = relationship("SubscriptionEvent")


class Payment(Base):
    """Payment transaction records for subscription billing."""

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    subscription_id: Mapped[int] = mapped_column(Integer, ForeignKey("user_subscriptions.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)

    # Stripe integration
    stripe_payment_intent_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True)
    stripe_invoice_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True)

    # Payment details
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, succeeded, failed, canceled
    payment_method: Mapped[str] = mapped_column(String(50), default="card")  # card, bank_transfer, etc.

    # Billing period
    billing_period_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    billing_period_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Additional info
    description: Mapped[Optional[str]] = mapped_column(Text)
    failure_reason: Mapped[Optional[str]] = mapped_column(Text)
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    subscription = relationship("UserSubscription")
    user = relationship("User")


class UsageRecord(Base):
    """Usage tracking for metered billing and analytics."""

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    subscription_id: Mapped[int] = mapped_column(Integer, ForeignKey("user_subscriptions.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)

    # Usage details
    metric_type: Mapped[str] = mapped_column(String(50), nullable=False)  # api_calls, storage, projects, etc.
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(20), default="count")  # count, gb, mb, etc.

    # Time period
    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Metadata
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    source: Mapped[str] = mapped_column(String(50), default="system")  # system, api, webhook

    # Relationships
    subscription = relationship("UserSubscription")
    user = relationship("User")


class Invoice(Base):
    """Generated invoices for billing and record keeping."""

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    subscription_id: Mapped[int] = mapped_column(Integer, ForeignKey("user_subscriptions.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)

    # Invoice details
    invoice_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    stripe_invoice_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft, open, paid, void, uncollectible

    # Billing period
    billing_period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    billing_period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Dates
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Additional info
    line_items: Mapped[Optional[List[dict]]] = mapped_column(JSON)
    tax_amount: Mapped[float] = mapped_column(Float, default=0.0)
    discount_amount: Mapped[float] = mapped_column(Float, default=0.0)

    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    subscription = relationship("UserSubscription")
    user = relationship("User")


class PromoCode(Base):
    """Promotional codes and discount management."""

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)

    # Discount details
    discount_type: Mapped[str] = mapped_column(String(20), nullable=False)  # percentage, fixed_amount
    discount_value: Mapped[float] = mapped_column(Float, nullable=False)
    max_discount_amount: Mapped[Optional[float]] = mapped_column(Float)

    # Usage limits
    max_uses: Mapped[Optional[int]] = mapped_column(Integer)
    used_count: Mapped[int] = mapped_column(Integer, default=0)
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    valid_until: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Restrictions
    applicable_plans: Mapped[Optional[List[int]]] = mapped_column(JSON)  # List of plan IDs
    first_time_customers_only: Mapped[bool] = mapped_column(Boolean, default=False)
    minimum_subscription_amount: Mapped[float] = mapped_column(Float, default=0.0)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class SubscriptionEvent(Base):
    """Audit log for subscription-related events."""

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    subscription_id: Mapped[int] = mapped_column(Integer, ForeignKey("user_subscriptions.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)

    # Event details
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)  # created, updated, canceled, payment_failed, etc.
    event_description: Mapped[Optional[str]] = mapped_column(Text)
    old_values: Mapped[Optional[dict]] = mapped_column(JSON)  # Previous state for updates
    new_values: Mapped[Optional[dict]] = mapped_column(JSON)  # New state for updates

    # Stripe webhook data
    stripe_event_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True)
    stripe_event_type: Mapped[Optional[str]] = mapped_column(String(100))

    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    ip_address: Mapped[Optional[str]] = mapped_column(String(45))
    user_agent: Mapped[Optional[str]] = mapped_column(Text)

    # Relationships
    subscription = relationship("UserSubscription")
    user = relationship("User")