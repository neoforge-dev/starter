"""
Pydantic schemas for subscription and billing models.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class SubscriptionPlanBase(BaseModel):
    """Base subscription plan schema."""
    name: str = Field(..., description="Plan name")
    description: Optional[str] = Field(None, description="Plan description")
    stripe_price_id: str = Field(..., description="Stripe price ID")
    price_monthly: float = Field(..., description="Monthly price")
    price_yearly: float = Field(..., description="Yearly price")
    currency: str = Field("USD", description="Currency code")
    max_projects: int = Field(5, description="Maximum projects allowed")
    max_users_per_project: int = Field(10, description="Maximum users per project")
    max_storage_gb: int = Field(5, description="Maximum storage in GB")
    max_api_calls_per_month: int = Field(10000, description="Maximum API calls per month")
    features: List[str] = Field(default_factory=list, description="List of plan features")
    is_active: bool = Field(True, description="Whether plan is active")
    is_popular: bool = Field(False, description="Whether plan is marked as popular")
    trial_days: int = Field(14, description="Number of trial days")
    sort_order: int = Field(0, description="Display order")


class SubscriptionPlanCreate(SubscriptionPlanBase):
    """Schema for creating subscription plans."""
    pass


class SubscriptionPlanUpdate(BaseModel):
    """Schema for updating subscription plans."""
    name: Optional[str] = None
    description: Optional[str] = None
    price_monthly: Optional[float] = None
    price_yearly: Optional[float] = None
    is_active: Optional[bool] = None
    is_popular: Optional[bool] = None
    trial_days: Optional[int] = None
    sort_order: Optional[int] = None


class SubscriptionPlanResponse(SubscriptionPlanBase):
    """Response schema for subscription plans."""
    id: int = Field(..., description="Plan ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    class Config:
        from_attributes = True


class UserSubscriptionBase(BaseModel):
    """Base user subscription schema."""
    user_id: int = Field(..., description="User ID")
    plan_id: int = Field(..., description="Plan ID")
    billing_cycle: str = Field("monthly", description="Billing cycle (monthly/yearly)")


class SubscriptionCreateRequest(BaseModel):
    """Request schema for creating subscriptions."""
    plan_id: int = Field(..., description="Plan ID to subscribe to")
    billing_cycle: str = Field("monthly", description="Billing cycle")
    promo_code: Optional[str] = Field(None, description="Promotional code")


class SubscriptionUpdateRequest(BaseModel):
    """Request schema for updating subscriptions."""
    plan_id: Optional[int] = Field(None, description="New plan ID")
    billing_cycle: Optional[str] = Field(None, description="New billing cycle")
    auto_renew: Optional[bool] = Field(None, description="Auto-renew setting")


class UserSubscriptionResponse(BaseModel):
    """Response schema for user subscriptions."""
    id: int = Field(..., description="Subscription ID")
    user_id: int = Field(..., description="User ID")
    plan_id: int = Field(..., description="Plan ID")
    stripe_subscription_id: Optional[str] = Field(None, description="Stripe subscription ID")
    stripe_customer_id: Optional[str] = Field(None, description="Stripe customer ID")
    status: str = Field(..., description="Subscription status")
    current_period_start: Optional[datetime] = Field(None, description="Current period start")
    current_period_end: Optional[datetime] = Field(None, description="Current period end")
    trial_start: Optional[datetime] = Field(None, description="Trial start date")
    trial_end: Optional[datetime] = Field(None, description="Trial end date")
    billing_cycle: str = Field(..., description="Billing cycle")
    auto_renew: bool = Field(True, description="Auto-renew setting")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    canceled_at: Optional[datetime] = Field(None, description="Cancellation timestamp")
    plan: SubscriptionPlanResponse = Field(..., description="Plan details")

    class Config:
        from_attributes = True


class PaymentResponse(BaseModel):
    """Response schema for payment records."""
    id: int = Field(..., description="Payment ID")
    subscription_id: int = Field(..., description="Subscription ID")
    stripe_payment_intent_id: Optional[str] = Field(None, description="Stripe payment intent ID")
    stripe_invoice_id: Optional[str] = Field(None, description="Stripe invoice ID")
    amount: float = Field(..., description="Payment amount")
    currency: str = Field(..., description="Currency code")
    status: str = Field(..., description="Payment status")
    payment_method: Optional[str] = Field(None, description="Payment method")
    billing_period_start: Optional[datetime] = Field(None, description="Billing period start")
    billing_period_end: Optional[datetime] = Field(None, description="Billing period end")
    description: Optional[str] = Field(None, description="Payment description")
    processed_at: Optional[datetime] = Field(None, description="Processing timestamp")
    created_at: datetime = Field(..., description="Creation timestamp")

    class Config:
        from_attributes = True


class UsageRecordResponse(BaseModel):
    """Response schema for usage records."""
    id: int = Field(..., description="Usage record ID")
    subscription_id: int = Field(..., description="Subscription ID")
    metric_type: str = Field(..., description="Metric type (projects, users, storage, api_calls)")
    metric_value: float = Field(..., description="Metric value")
    unit: str = Field(..., description="Unit of measurement")
    period_start: datetime = Field(..., description="Period start date")
    period_end: datetime = Field(..., description="Period end date")
    recorded_at: datetime = Field(..., description="Recording timestamp")
    project_id: Optional[int] = Field(None, description="Associated project ID")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

    class Config:
        from_attributes = True


class PromoCodeResponse(BaseModel):
    """Response schema for promotional codes."""
    id: int = Field(..., description="Promo code ID")
    code: str = Field(..., description="Promo code")
    name: str = Field(..., description="Promo code name")
    description: Optional[str] = Field(None, description="Promo code description")
    discount_type: str = Field(..., description="Discount type (percent/fixed)")
    discount_value: float = Field(..., description="Discount value")
    max_discount_amount: Optional[float] = Field(None, description="Maximum discount amount")
    max_uses: Optional[int] = Field(None, description="Maximum uses")
    max_uses_per_user: int = Field(..., description="Uses per user")
    current_uses: int = Field(..., description="Current usage count")
    valid_from: datetime = Field(..., description="Validity start date")
    valid_until: Optional[datetime] = Field(None, description="Validity end date")
    is_active: bool = Field(..., description="Whether code is active")
    applicable_plans: List[int] = Field(default_factory=list, description="Applicable plan IDs")
    first_time_customers_only: bool = Field(..., description="First-time customers only")
    minimum_subscription_amount: Optional[float] = Field(None, description="Minimum subscription amount")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    class Config:
        from_attributes = True


class SubscriptionEventResponse(BaseModel):
    """Response schema for subscription events."""
    id: int = Field(..., description="Event ID")
    subscription_id: Optional[int] = Field(None, description="Subscription ID")
    user_id: Optional[int] = Field(None, description="User ID")
    event_type: str = Field(..., description="Event type")
    event_description: Optional[str] = Field(None, description="Event description")
    old_values: Optional[Dict[str, Any]] = Field(None, description="Previous values")
    new_values: Optional[Dict[str, Any]] = Field(None, description="New values")
    stripe_event_id: Optional[str] = Field(None, description="Stripe event ID")
    stripe_event_type: Optional[str] = Field(None, description="Stripe event type")
    created_at: datetime = Field(..., description="Creation timestamp")
    ip_address: Optional[str] = Field(None, description="IP address")
    user_agent: Optional[str] = Field(None, description="User agent string")

    class Config:
        from_attributes = True


class WebhookEvent(BaseModel):
    """Schema for webhook events."""
    id: str = Field(..., description="Event ID")
    type: str = Field(..., description="Event type")
    data: Dict[str, Any] = Field(..., description="Event data")
    created: int = Field(..., description="Creation timestamp")


class WebhookResponse(BaseModel):
    """Response schema for webhook processing."""
    status: str = Field(..., description="Processing status")
    event_type: Optional[str] = Field(None, description="Event type processed")