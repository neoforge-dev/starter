"""
Pydantic schemas for subscription API endpoints.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class SubscriptionPlanResponse(BaseModel):
    """Response schema for subscription plans."""
    id: int = Field(..., description="Plan ID")
    name: str = Field(..., description="Plan name")
    description: Optional[str] = Field(None, description="Plan description")
    stripe_price_id: str = Field(..., description="Stripe price ID")
    price_monthly: float = Field(..., description="Monthly price")
    price_yearly: float = Field(..., description="Yearly price")
    currency: str = Field(..., description="Currency code")
    max_projects: int = Field(..., description="Maximum projects allowed")
    max_users_per_project: int = Field(..., description="Maximum users per project")
    max_storage_gb: int = Field(..., description="Maximum storage in GB")
    max_api_calls_per_month: int = Field(..., description="Maximum API calls per month")
    features: List[str] = Field(..., description="List of plan features")
    is_active: bool = Field(..., description="Whether plan is active")
    is_popular: bool = Field(..., description="Whether plan is marked as popular")
    trial_days: int = Field(..., description="Number of trial days")
    sort_order: int = Field(..., description="Display order")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


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
    auto_renew: bool = Field(..., description="Auto-renew setting")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    canceled_at: Optional[datetime] = Field(None, description="Cancellation timestamp")
    plan: SubscriptionPlanResponse = Field(..., description="Plan details")


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
    metadata: Dict[str, Any] = Field(..., description="Additional metadata")