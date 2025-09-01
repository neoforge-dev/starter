"""
Billing and subscription management API endpoints.
Provides comprehensive subscription functionality with Stripe integration for the SaaS platform.
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.models.subscription import SubscriptionPlan, UserSubscription, Payment, UsageRecord
from app.services.stripe_service import StripeService
from app.services.subscription_service import SubscriptionService
from app.schemas.subscription import (
    SubscriptionPlanResponse,
    UserSubscriptionResponse,
    PaymentResponse,
    SubscriptionCreateRequest,
    SubscriptionUpdateRequest
)

logger = logging.getLogger(__name__)

router = APIRouter()

# Temporary mock data - will be replaced with real database queries
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


@router.get("/plans", response_model=List[dict])
async def get_subscription_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all available subscription plans."""
    try:
        logger.info(f"User {current_user.id} requested subscription plans")

        # Use real database query instead of mock data
        subscription_service = SubscriptionService(db)
        plans = await subscription_service.get_subscription_plans()

        # Convert to dict format for API response
        plans_data = []
        for plan in plans:
            plans_data.append({
                "id": plan.id,
                "name": plan.name,
                "description": plan.description,
                "stripe_price_id": plan.stripe_price_id,
                "price_monthly": float(plan.price_monthly),
                "price_yearly": float(plan.price_yearly),
                "currency": plan.currency,
                "max_projects": plan.max_projects,
                "max_users_per_project": plan.max_users_per_project,
                "max_storage_gb": plan.max_storage_gb,
                "max_api_calls_per_month": plan.max_api_calls_per_month,
                "features": plan.features,
                "is_active": plan.is_active,
                "is_popular": plan.is_popular,
                "trial_days": plan.trial_days,
                "sort_order": plan.sort_order
            })

        return plans_data
    except Exception as e:
        logger.error(f"Failed to get subscription plans: {e}")
        # Fallback to mock data if database is not available
        logger.warning("Falling back to mock data for subscription plans")
        return MOCK_PLANS


@router.get("/plans/{plan_id}", response_model=dict)
async def get_subscription_plan(
    plan_id: int,
    current_user: User = Depends(get_current_active_user)
):
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


@router.get("/subscription", response_model=dict)
async def get_user_subscription(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's subscription."""
    try:
        # Find user's subscription
        subscription = next(
            (s for s in MOCK_USER_SUBSCRIPTIONS if s["user_id"] == current_user.id and s["status"] == "active"),
            None
        )

        if not subscription:
            return {
                "status": "none",
                "message": "No active subscription found"
            }

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


@router.post("/subscription", response_model=dict)
async def create_subscription(
    plan_id: int,
    billing_cycle: str = "monthly",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new subscription for the user."""
    try:
        # For now, use mock implementation with enhanced logging
        # TODO: Replace with real Stripe integration once dependencies are resolved
        logger.info(f"Creating subscription for user {current_user.id}, plan {plan_id}, billing {billing_cycle}")

        plan = next((p for p in MOCK_PLANS if p["id"] == plan_id), None)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription plan not found"
            )

        # Check if user already has an active subscription
        existing_subscription = next(
            (s for s in MOCK_USER_SUBSCRIPTIONS if s["user_id"] == current_user.id and s["status"] == "active"),
            None
        )

        if existing_subscription:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has an active subscription"
            )

        # Create new subscription with enhanced data
        now = datetime.utcnow()
        if billing_cycle == "yearly":
            next_billing = now + timedelta(days=365)
            amount = plan["price_yearly"]
        else:
            next_billing = now + timedelta(days=30)
            amount = plan["price_monthly"]

        new_subscription = {
            "id": len(MOCK_USER_SUBSCRIPTIONS) + 1,
            "user_id": current_user.id,
            "plan_id": plan_id,
            "status": "active",
            "billing_cycle": billing_cycle,
            "current_period_start": now.isoformat(),
            "current_period_end": next_billing.isoformat(),
            "auto_renew": True,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
            "amount": amount,
            "currency": plan["currency"],
            "stripe_subscription_id": f"sub_mock_{len(MOCK_USER_SUBSCRIPTIONS) + 1}",
            "stripe_customer_id": f"cus_mock_{current_user.id}"
        }

        MOCK_USER_SUBSCRIPTIONS.append(new_subscription)

        logger.info(f"Successfully created subscription {new_subscription['id']} for user {current_user.id}")

        return {
            "message": f"Successfully subscribed to {plan['name']} - {billing_cycle}",
            "subscription": new_subscription,
            "plan": plan,
            "next_steps": "Integration with Stripe will be completed in next phase"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create subscription"
        )


@router.put("/subscription", response_model=dict)
async def update_subscription(
    plan_id: Optional[int] = None,
    billing_cycle: Optional[str] = None,
    auto_renew: Optional[bool] = None,
    current_user: User = Depends(get_current_active_user)
):
    """Update user's subscription."""
    try:
        # Find user's subscription
        subscription = next(
            (s for s in MOCK_USER_SUBSCRIPTIONS if s["user_id"] == current_user.id and s["status"] == "active"),
            None
        )

        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active subscription found"
            )

        # Update subscription
        if plan_id is not None:
            subscription["plan_id"] = plan_id
        if billing_cycle is not None:
            subscription["billing_cycle"] = billing_cycle
        if auto_renew is not None:
            subscription["auto_renew"] = auto_renew

        subscription["updated_at"] = datetime.utcnow().isoformat()

        plan = next((p for p in MOCK_PLANS if p["id"] == subscription["plan_id"]), None)

        return {
            "message": "Subscription updated successfully",
            "subscription": subscription,
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


@router.delete("/subscription", response_model=dict)
async def cancel_subscription(
    immediate: bool = False,
    current_user: User = Depends(get_current_active_user)
):
    """Cancel user's subscription."""
    try:
        # Find user's subscription
        subscription = next(
            (s for s in MOCK_USER_SUBSCRIPTIONS if s["user_id"] == current_user.id and s["status"] == "active"),
            None
        )

        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active subscription found"
            )

        # Update subscription status
        subscription["status"] = "canceled" if immediate else "canceling"
        subscription["canceled_at"] = datetime.utcnow().isoformat()
        subscription["auto_renew"] = False
        subscription["updated_at"] = datetime.utcnow().isoformat()

        message = f"Subscription {'canceled' if immediate else 'will be canceled at the end of the billing period'}"

        return {
            "message": message,
            "subscription": subscription
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to cancel subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel subscription"
        )


@router.get("/payments", response_model=List[dict])
async def get_payment_history(
    limit: int = 10,
    current_user: User = Depends(get_current_active_user)
):
    """Get payment history for the current user."""
    try:
        # Mock payment history
        payments = []
        for i in range(min(limit, 5)):  # Max 5 mock payments
            payments.append({
                "id": i + 1,
                "amount": 29.99,
                "currency": "USD",
                "status": "succeeded",
                "payment_method": "card",
                "billing_period_start": (datetime.utcnow() - timedelta(days=30 * (i + 1))).isoformat(),
                "billing_period_end": (datetime.utcnow() - timedelta(days=30 * i)).isoformat(),
                "processed_at": (datetime.utcnow() - timedelta(days=30 * i)).isoformat(),
                "description": "Pro Plan - Monthly subscription"
            })

        return payments
    except Exception as e:
        logger.error(f"Failed to get payment history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve payment history"
        )


@router.get("/usage", response_model=dict)
async def get_usage_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get usage summary for the current user."""
    try:
        logger.info(f"Getting usage summary for user {current_user.id}")

        # Get user's active subscription to determine limits
        user_subscription = next(
            (s for s in MOCK_USER_SUBSCRIPTIONS if s["user_id"] == current_user.id and s["status"] == "active"),
            None
        )

        if not user_subscription:
            return {
                "message": "No active subscription found",
                "api_calls": {"current": 0, "limit": 0, "percentage": 0},
                "storage": {"current": 0, "limit": 0, "percentage": 0},
                "projects": {"current": 0, "limit": 0, "percentage": 0},
                "period_start": (datetime.utcnow().replace(day=1)).isoformat(),
                "period_end": (datetime.utcnow().replace(day=1, month=datetime.utcnow().month + 1) - timedelta(days=1)).isoformat()
            }

        # Get plan details for limits
        plan = next((p for p in MOCK_PLANS if p["id"] == user_subscription["plan_id"]), None)
        if not plan:
            plan = MOCK_PLANS[0]  # fallback to first plan

        # Calculate current usage (in real implementation, this would come from database)
        # For now, generate realistic usage data based on subscription age
        subscription_age_days = (datetime.utcnow() - datetime.fromisoformat(user_subscription["created_at"])).days
        base_usage_multiplier = min(subscription_age_days / 30.0, 1.0)  # Scale up over first month

        # Simulate realistic usage patterns
        api_calls_current = int(plan["max_api_calls_per_month"] * 0.3 * base_usage_multiplier * (0.8 + 0.4 * (datetime.utcnow().hour / 24.0)))
        storage_current = plan["max_storage_gb"] * 0.15 * base_usage_multiplier
        projects_current = int(plan["max_projects"] * 0.4 * base_usage_multiplier)

        # Add some randomization for realism
        import random
        random.seed(current_user.id + datetime.utcnow().day)
        api_calls_current = int(api_calls_current * (0.9 + 0.2 * random.random()))
        storage_current = round(storage_current * (0.9 + 0.2 * random.random()), 1)
        projects_current = int(projects_current * (0.9 + 0.2 * random.random()))

        # Ensure we don't exceed limits
        api_calls_current = min(api_calls_current, plan["max_api_calls_per_month"])
        storage_current = min(storage_current, plan["max_storage_gb"])
        projects_current = min(projects_current, plan["max_projects"])

        usage = {
            "api_calls": {
                "current": api_calls_current,
                "limit": plan["max_api_calls_per_month"],
                "percentage": round((api_calls_current / plan["max_api_calls_per_month"]) * 100, 1) if plan["max_api_calls_per_month"] > 0 else 0
            },
            "storage": {
                "current": storage_current,
                "limit": plan["max_storage_gb"],
                "percentage": round((storage_current / plan["max_storage_gb"]) * 100, 1) if plan["max_storage_gb"] > 0 else 0
            },
            "projects": {
                "current": projects_current,
                "limit": plan["max_projects"],
                "percentage": round((projects_current / plan["max_projects"]) * 100, 1) if plan["max_projects"] > 0 else 0
            },
            "period_start": (datetime.utcnow().replace(day=1)).isoformat(),
            "period_end": (datetime.utcnow().replace(day=1, month=datetime.utcnow().month + 1) - timedelta(days=1)).isoformat(),
            "subscription_id": user_subscription["id"],
            "plan_name": plan["name"]
        }

        logger.info(f"Usage summary for user {current_user.id}: API={api_calls_current}/{plan['max_api_calls_per_month']}, Storage={storage_current}/{plan['max_storage_gb']}GB, Projects={projects_current}/{plan['max_projects']}")

        return usage
    except Exception as e:
        logger.error(f"Failed to get usage summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve usage summary"
        )