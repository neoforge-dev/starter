"""
Subscription management API endpoints.
Handles subscription plans, user subscriptions, payments, and billing.
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.models.user import User

# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
# Import schemas directly to avoid circular imports
from app.api.v1.endpoints.subscription_schemas import (
    SubscriptionPlanResponse,
    UserSubscriptionResponse,
    SubscriptionCreateRequest,
    SubscriptionUpdateRequest,
    PaymentResponse,
    UsageRecordResponse
)

logger = logging.getLogger(__name__)

router = APIRouter()


# Mock data for demonstration - replace with actual database queries
MOCK_PLANS = [
    {
        "id": 1,
        "name": "Starter",
        "description": "Perfect for individual developers",
        "stripe_price_id": "price_starter_monthly",
        "price_monthly": 9.99,
        "price_yearly": 99.99,
        "currency": "USD",
        "max_projects": 5,
        "max_users_per_project": 1,
        "max_storage_gb": 5,
        "max_api_calls_per_month": 10000,
        "features": ["Basic analytics", "Community support", "5GB storage"],
        "is_active": True,
        "is_popular": False,
        "trial_days": 14,
        "sort_order": 1
    },
    {
        "id": 2,
        "name": "Pro",
        "description": "For growing teams and projects",
        "stripe_price_id": "price_pro_monthly",
        "price_monthly": 29.99,
        "price_yearly": 299.99,
        "currency": "USD",
        "max_projects": 25,
        "max_users_per_project": 10,
        "max_storage_gb": 50,
        "max_api_calls_per_month": 100000,
        "features": ["Advanced analytics", "Priority support", "50GB storage", "Custom integrations"],
        "is_active": True,
        "is_popular": True,
        "trial_days": 14,
        "sort_order": 2
    },
    {
        "id": 3,
        "name": "Enterprise",
        "description": "For large organizations",
        "stripe_price_id": "price_enterprise_monthly",
        "price_monthly": 99.99,
        "price_yearly": 999.99,
        "currency": "USD",
        "max_projects": -1,  # Unlimited
        "max_users_per_project": -1,  # Unlimited
        "max_storage_gb": 500,
        "max_api_calls_per_month": -1,  # Unlimited
        "features": ["Enterprise analytics", "Dedicated support", "500GB storage", "Custom integrations", "SLA guarantee"],
        "is_active": True,
        "is_popular": False,
        "trial_days": 30,
        "sort_order": 3
    }
]

MOCK_USER_SUBSCRIPTIONS = [
    {
        "id": 1,
        "user_id": 1,
        "plan_id": 2,
        "stripe_subscription_id": "sub_mock123",
        "stripe_customer_id": "cus_mock123",
        "status": "active",
        "current_period_start": datetime.utcnow(),
        "current_period_end": datetime.utcnow().replace(month=datetime.utcnow().month + 1),
        "billing_cycle": "monthly",
        "auto_renew": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
]


@router.get("/plans", response_model=List[SubscriptionPlanResponse])
async def get_subscription_plans(
    active_only: bool = True,
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get all available subscription plans."""
    try:
        plans = [plan for plan in MOCK_PLANS if not active_only or plan["is_active"]]
        return plans
    except Exception as e:
        logger.error(f"Failed to get subscription plans: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve subscription plans"
        )


@router.get("/plans/{plan_id}", response_model=SubscriptionPlanResponse)
async def get_subscription_plan(
    plan_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get a specific subscription plan by ID."""
    try:
        plan = next((p for p in MOCK_PLANS if p["id"] == plan_id), None)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription plan not found"
            )
        return plan
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get subscription plan {plan_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve subscription plan"
        )


@router.get("/user", response_model=UserSubscriptionResponse)
async def get_user_subscription(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get current user's subscription."""
    try:
        # Find user's subscription
        subscription = next(
            (s for s in MOCK_USER_SUBSCRIPTIONS if s["user_id"] == current_user.id),
            None
        )

        if not subscription:
            # Return default free tier
            return {
                "id": 0,
                "user_id": current_user.id,
                "plan_id": 0,
                "status": "none",
                "billing_cycle": "monthly",
                "auto_renew": False,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "plan": {
                    "id": 0,
                    "name": "Free",
                    "description": "Basic features for getting started",
                    "price_monthly": 0.0,
                    "price_yearly": 0.0,
                    "max_projects": 1,
                    "max_users_per_project": 1,
                    "max_storage_gb": 1,
                    "max_api_calls_per_month": 1000,
                    "features": ["Basic features", "Community support"]
                }
            }

        # Get plan details
        plan = next((p for p in MOCK_PLANS if p["id"] == subscription["plan_id"]), None)

        return {
            **subscription,
            "plan": plan
        }
    except Exception as e:
        logger.error(f"Failed to get user subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user subscription"
        )


@router.post("/create", response_model=UserSubscriptionResponse)
async def create_subscription(
    subscription_request: SubscriptionCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Create a new subscription for the user."""
    try:
        # Validate plan exists
        plan = next((p for p in MOCK_PLANS if p["id"] == subscription_request.plan_id), None)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription plan not found"
            )

        # Check if user already has an active subscription
        existing_subscription = next(
            (s for s in MOCK_USER_SUBSCRIPTIONS
             if s["user_id"] == current_user.id and s["status"] in ["active", "trialing"]),
            None
        )

        if existing_subscription:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has an active subscription"
            )

        # Create new subscription (mock implementation)
        new_subscription = {
            "id": len(MOCK_USER_SUBSCRIPTIONS) + 1,
            "user_id": current_user.id,
            "plan_id": subscription_request.plan_id,
            "stripe_subscription_id": f"sub_mock_{len(MOCK_USER_SUBSCRIPTIONS) + 1}",
            "stripe_customer_id": f"cus_mock_{current_user.id}",
            "status": "trialing" if plan["trial_days"] > 0 else "active",
            "current_period_start": datetime.utcnow(),
            "current_period_end": datetime.utcnow().replace(
                month=datetime.utcnow().month + (12 if subscription_request.billing_cycle == "yearly" else 1)
            ),
            "trial_start": datetime.utcnow() if plan["trial_days"] > 0 else None,
            "trial_end": datetime.utcnow().replace(days=plan["trial_days"]) if plan["trial_days"] > 0 else None,
            "billing_cycle": subscription_request.billing_cycle,
            "auto_renew": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        MOCK_USER_SUBSCRIPTIONS.append(new_subscription)

        return {
            **new_subscription,
            "plan": plan
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create subscription"
        )


@router.patch("/update", response_model=UserSubscriptionResponse)
async def update_subscription(
    subscription_update: SubscriptionUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Update user's subscription."""
    try:
        # Find user's subscription
        subscription = next(
            (s for s in MOCK_USER_SUBSCRIPTIONS if s["user_id"] == current_user.id),
            None
        )

        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active subscription found"
            )

        # Update subscription
        for key, value in subscription_update.dict(exclude_unset=True).items():
            if key in subscription:
                subscription[key] = value

        subscription["updated_at"] = datetime.utcnow()

        # Get plan details
        plan = next((p for p in MOCK_PLANS if p["id"] == subscription["plan_id"]), None)

        return {
            **subscription,
            "plan": plan
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update subscription"
        )


@router.post("/cancel", response_model=Dict[str, str])
async def cancel_subscription(
    immediate: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """Cancel user's subscription."""
    try:
        # Find user's subscription
        subscription = next(
            (s for s in MOCK_USER_SUBSCRIPTIONS if s["user_id"] == current_user.id),
            None
        )

        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active subscription found"
            )

        # Update subscription status
        subscription["status"] = "canceled" if immediate else "canceling"
        subscription["canceled_at"] = datetime.utcnow()
        subscription["auto_renew"] = False
        subscription["updated_at"] = datetime.utcnow()

        return {
            "message": f"Subscription {'canceled' if immediate else 'will be canceled at the end of the billing period'}",
            "status": subscription["status"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to cancel subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel subscription"
        )


@router.get("/usage", response_model=List[UsageRecordResponse])
async def get_usage_records(
    period_start: Optional[datetime] = None,
    period_end: Optional[datetime] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get usage records for the current user."""
    try:
        # Mock usage data
        usage_records = [
            {
                "id": 1,
                "subscription_id": 1,
                "metric_type": "projects",
                "metric_value": 3,
                "unit": "count",
                "period_start": datetime.utcnow().replace(day=1),
                "period_end": datetime.utcnow().replace(day=1, month=datetime.utcnow().month + 1) - timedelta(days=1),
                "recorded_at": datetime.utcnow(),
                "metadata": {"project_names": ["Project Alpha", "Project Beta", "Project Gamma"]}
            },
            {
                "id": 2,
                "subscription_id": 1,
                "metric_type": "api_calls",
                "metric_value": 15420,
                "unit": "count",
                "period_start": datetime.utcnow().replace(day=1),
                "period_end": datetime.utcnow().replace(day=1, month=datetime.utcnow().month + 1) - timedelta(days=1),
                "recorded_at": datetime.utcnow(),
                "metadata": {"daily_average": 514}
            },
            {
                "id": 3,
                "subscription_id": 1,
                "metric_type": "storage",
                "metric_value": 2.4,
                "unit": "gb",
                "period_start": datetime.utcnow().replace(day=1),
                "period_end": datetime.utcnow().replace(day=1, month=datetime.utcnow().month + 1) - timedelta(days=1),
                "recorded_at": datetime.utcnow(),
                "metadata": {"largest_project": "Project Alpha"}
            }
        ]

        return usage_records
    except Exception as e:
        logger.error(f"Failed to get usage records: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve usage records"
        )


@router.get("/payments", response_model=List[PaymentResponse])
async def get_payment_history(
    limit: int = 10,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get payment history for the current user."""
    try:
        # Mock payment history
        payments = [
            {
                "id": 1,
                "subscription_id": 1,
                "stripe_payment_intent_id": "pi_mock123",
                "amount": 29.99,
                "currency": "USD",
                "status": "succeeded",
                "payment_method": "card",
                "billing_period_start": datetime.utcnow().replace(day=1),
                "billing_period_end": datetime.utcnow().replace(day=1, month=datetime.utcnow().month + 1) - timedelta(days=1),
                "description": "Pro Plan - Monthly",
                "processed_at": datetime.utcnow(),
                "created_at": datetime.utcnow()
            }
        ]

        return payments[:limit]
    except Exception as e:
        logger.error(f"Failed to get payment history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve payment history"
        )


@router.post("/webhook")
async def stripe_webhook(
    request: Any,
    stripe_signature: str = None,
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """Handle Stripe webhook events."""
    try:
        # This would process actual Stripe webhook events
        # For now, just return success
        logger.info("Received webhook event")

        return {"status": "processed"}
    except Exception as e:
        logger.error(f"Failed to process webhook: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to process webhook"
        )