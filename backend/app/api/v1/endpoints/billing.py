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


@router.get("/plans", response_model=List[dict])
async def get_subscription_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all available subscription plans."""
    try:
        logger.info(f"User {current_user.id} requested subscription plans")

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
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Subscription service temporarily unavailable"
        )


@router.get("/plans/{plan_id}", response_model=dict)
async def get_subscription_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific subscription plan by ID."""
    try:
        subscription_service = SubscriptionService(db)
        plan = await subscription_service.get_subscription_plan(plan_id)
        
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription plan not found"
            )

        return {
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
        }
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's subscription."""
    try:
        subscription_service = SubscriptionService(db)
        subscription = await subscription_service.get_user_active_subscription(current_user.id)

        if not subscription:
            return {
                "status": "none",
                "message": "No active subscription found"
            }

        # Get the associated plan
        plan = await subscription_service.get_subscription_plan(subscription.plan_id)

        return {
            "id": subscription.id,
            "user_id": subscription.user_id,
            "plan_id": subscription.plan_id,
            "stripe_subscription_id": subscription.stripe_subscription_id,
            "stripe_customer_id": subscription.stripe_customer_id,
            "status": subscription.status,
            "current_period_start": subscription.current_period_start.isoformat() if subscription.current_period_start else None,
            "current_period_end": subscription.current_period_end.isoformat() if subscription.current_period_end else None,
            "billing_cycle": subscription.billing_cycle,
            "auto_renew": subscription.auto_renew,
            "trial_start": subscription.trial_start.isoformat() if subscription.trial_start else None,
            "trial_end": subscription.trial_end.isoformat() if subscription.trial_end else None,
            "plan": {
                "id": plan.id,
                "name": plan.name,
                "description": plan.description,
                "price_monthly": float(plan.price_monthly),
                "price_yearly": float(plan.price_yearly),
                "currency": plan.currency,
                "features": plan.features
            } if plan else None
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
        logger.info(f"Creating subscription for user {current_user.id}, plan {plan_id}, billing {billing_cycle}")

        subscription_service = SubscriptionService(db)
        
        # Check if plan exists
        plan = await subscription_service.get_subscription_plan(plan_id)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription plan not found"
            )

        # Check if user already has an active subscription
        existing_subscription = await subscription_service.get_user_active_subscription(current_user.id)
        if existing_subscription:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has an active subscription"
            )

        # Create subscription through Stripe and database
        subscription = await subscription_service.create_subscription(
            user_id=current_user.id,
            plan_id=plan_id,
            billing_cycle=billing_cycle
        )

        logger.info(f"Successfully created subscription {subscription.id} for user {current_user.id}")

        return {
            "message": f"Successfully subscribed to {plan.name} - {billing_cycle}",
            "subscription": {
                "id": subscription.id,
                "status": subscription.status,
                "billing_cycle": subscription.billing_cycle,
                "current_period_start": subscription.current_period_start.isoformat() if subscription.current_period_start else None,
                "current_period_end": subscription.current_period_end.isoformat() if subscription.current_period_end else None,
                "stripe_subscription_id": subscription.stripe_subscription_id
            },
            "plan": {
                "id": plan.id,
                "name": plan.name,
                "price_monthly": float(plan.price_monthly),
                "price_yearly": float(plan.price_yearly)
            }
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update user's subscription."""
    try:
        subscription_service = SubscriptionService(db)
        
        # Get user's active subscription
        subscription = await subscription_service.get_user_active_subscription(current_user.id)
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active subscription found"
            )

        # Update subscription
        updated_subscription = await subscription_service.update_subscription(
            subscription_id=subscription.id,
            plan_id=plan_id,
            billing_cycle=billing_cycle,
            auto_renew=auto_renew
        )

        # Get updated plan details
        plan = await subscription_service.get_subscription_plan(updated_subscription.plan_id)

        return {
            "message": "Subscription updated successfully",
            "subscription": {
                "id": updated_subscription.id,
                "status": updated_subscription.status,
                "billing_cycle": updated_subscription.billing_cycle,
                "auto_renew": updated_subscription.auto_renew
            },
            "plan": {
                "id": plan.id,
                "name": plan.name,
                "price_monthly": float(plan.price_monthly),
                "price_yearly": float(plan.price_yearly)
            } if plan else None
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Cancel user's subscription."""
    try:
        subscription_service = SubscriptionService(db)
        
        # Get user's active subscription
        subscription = await subscription_service.get_user_active_subscription(current_user.id)
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active subscription found"
            )

        # Cancel subscription
        canceled_subscription = await subscription_service.cancel_subscription(
            subscription_id=subscription.id,
            immediate=immediate
        )

        message = f"Subscription {'canceled' if immediate else 'will be canceled at the end of the billing period'}"

        return {
            "message": message,
            "subscription": {
                "id": canceled_subscription.id,
                "status": canceled_subscription.status,
                "canceled_at": canceled_subscription.canceled_at.isoformat() if canceled_subscription.canceled_at else None,
                "current_period_end": canceled_subscription.current_period_end.isoformat() if canceled_subscription.current_period_end else None
            }
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get payment history for the current user."""
    try:
        subscription_service = SubscriptionService(db)
        payments = await subscription_service.get_user_payments(current_user.id, limit=limit)

        payments_data = []
        for payment in payments:
            payments_data.append({
                "id": payment.id,
                "amount": float(payment.amount),
                "currency": payment.currency,
                "status": payment.status,
                "payment_method": payment.payment_method,
                "description": payment.description,
                "stripe_payment_intent_id": payment.stripe_payment_intent_id,
                "stripe_invoice_id": payment.stripe_invoice_id,
                "created_at": payment.created_at.isoformat() if payment.created_at else None
            })

        return payments_data
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

        subscription_service = SubscriptionService(db)
        
        # Get user's active subscription
        subscription = await subscription_service.get_user_active_subscription(current_user.id)
        if not subscription:
            return {
                "message": "No active subscription found",
                "api_calls": {"current": 0, "limit": 0, "percentage": 0},
                "storage": {"current": 0, "limit": 0, "percentage": 0},
                "projects": {"current": 0, "limit": 0, "percentage": 0},
                "period_start": (datetime.utcnow().replace(day=1)).isoformat(),
                "period_end": (datetime.utcnow().replace(day=1, month=datetime.utcnow().month + 1) - timedelta(days=1)).isoformat()
            }

        # Get plan details for limits
        plan = await subscription_service.get_subscription_plan(subscription.plan_id)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Subscription plan not found"
            )

        # Get actual usage records
        usage_records = await subscription_service.get_user_usage_records(
            user_id=current_user.id,
            subscription_id=subscription.id,
            start_date=subscription.current_period_start,
            end_date=subscription.current_period_end
        )

        # Calculate current usage from records
        api_calls_current = sum(record.quantity for record in usage_records if record.metric_name == "api_calls")
        storage_current = sum(record.quantity for record in usage_records if record.metric_name == "storage_gb")
        projects_current = len(set(record.metadata.get("project_id") for record in usage_records if record.metadata and record.metadata.get("project_id")))

        usage = {
            "api_calls": {
                "current": api_calls_current,
                "limit": plan.max_api_calls_per_month if plan.max_api_calls_per_month > 0 else -1,
                "percentage": round((api_calls_current / plan.max_api_calls_per_month) * 100, 1) if plan.max_api_calls_per_month > 0 else 0
            },
            "storage": {
                "current": storage_current,
                "limit": plan.max_storage_gb if plan.max_storage_gb > 0 else -1,
                "percentage": round((storage_current / plan.max_storage_gb) * 100, 1) if plan.max_storage_gb > 0 else 0
            },
            "projects": {
                "current": projects_current,
                "limit": plan.max_projects if plan.max_projects > 0 else -1,
                "percentage": round((projects_current / plan.max_projects) * 100, 1) if plan.max_projects > 0 else 0
            },
            "period_start": subscription.current_period_start.isoformat() if subscription.current_period_start else None,
            "period_end": subscription.current_period_end.isoformat() if subscription.current_period_end else None,
            "subscription_id": subscription.id,
            "plan_name": plan.name
        }

        logger.info(f"Usage summary for user {current_user.id}: API={api_calls_current}/{plan.max_api_calls_per_month}, Storage={storage_current}/{plan.max_storage_gb}GB, Projects={projects_current}/{plan.max_projects}")

        return usage
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get usage summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve usage summary"
        )