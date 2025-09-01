"""
Stripe payment processing service for NeoForge SaaS platform.
Handles customer creation, subscription management, and payment processing.
"""

import logging
from datetime import datetime
from typing import Optional, Dict, List, Any
from decimal import Decimal

import stripe
from fastapi import HTTPException

from app.core.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

# Initialize Stripe with API key
if settings.stripe_secret_key:
    stripe.api_key = settings.stripe_secret_key.get_secret_value()
else:
    logger.warning("STRIPE_SECRET_KEY not configured - Stripe integration disabled")


class StripeService:
    """Service for handling Stripe payment operations."""

    @staticmethod
    async def create_customer(email: str, name: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        """Create a Stripe customer."""
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata=metadata or {}
            )
            logger.info(f"Created Stripe customer: {customer.id}")
            return customer.id
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create Stripe customer: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to create customer: {str(e)}")

    @staticmethod
    async def create_subscription(
        customer_id: str,
        price_id: str,
        trial_days: int = 0,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a Stripe subscription."""
        try:
            subscription_data = {
                "customer": customer_id,
                "items": [{"price": price_id}],
                "payment_behavior": "default_incomplete",
                "expand": ["latest_invoice.payment_intent"],
                "metadata": metadata or {}
            }

            if trial_days > 0:
                subscription_data["trial_period_days"] = trial_days

            subscription = stripe.Subscription.create(**subscription_data)

            logger.info(f"Created Stripe subscription: {subscription.id}")
            return {
                "subscription_id": subscription.id,
                "status": subscription.status,
                "current_period_start": datetime.fromtimestamp(subscription.current_period_start),
                "current_period_end": datetime.fromtimestamp(subscription.current_period_end),
                "trial_start": datetime.fromtimestamp(subscription.trial_start) if subscription.trial_start else None,
                "trial_end": datetime.fromtimestamp(subscription.trial_end) if subscription.trial_end else None,
                "latest_invoice": subscription.latest_invoice
            }
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create Stripe subscription: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to create subscription: {str(e)}")

    @staticmethod
    async def cancel_subscription(subscription_id: str, immediate: bool = False) -> Dict[str, Any]:
        """Cancel a Stripe subscription."""
        try:
            subscription = stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=not immediate
            )
            logger.info(f"Cancelled Stripe subscription: {subscription_id} (immediate: {immediate})")
            return {
                "subscription_id": subscription.id,
                "status": subscription.status,
                "canceled_at": datetime.fromtimestamp(subscription.canceled_at) if subscription.canceled_at else None
            }
        except stripe.error.StripeError as e:
            logger.error(f"Failed to cancel Stripe subscription: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to cancel subscription: {str(e)}")

    @staticmethod
    async def update_subscription(
        subscription_id: str,
        new_price_id: str,
        proration_behavior: str = "create_prorations"
    ) -> Dict[str, Any]:
        """Update subscription to a different price plan."""
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            subscription_item_id = subscription.items.data[0].id

            updated_subscription = stripe.Subscription.modify(
                subscription_id,
                items=[{
                    "id": subscription_item_id,
                    "price": new_price_id,
                }],
                proration_behavior=proration_behavior
            )

            logger.info(f"Updated Stripe subscription: {subscription_id} to price: {new_price_id}")
            return {
                "subscription_id": updated_subscription.id,
                "status": updated_subscription.status,
                "current_period_start": datetime.fromtimestamp(updated_subscription.current_period_start),
                "current_period_end": datetime.fromtimestamp(updated_subscription.current_period_end)
            }
        except stripe.error.StripeError as e:
            logger.error(f"Failed to update Stripe subscription: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to update subscription: {str(e)}")

    @staticmethod
    async def get_subscription(subscription_id: str) -> Dict[str, Any]:
        """Get subscription details from Stripe."""
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            return {
                "subscription_id": subscription.id,
                "status": subscription.status,
                "current_period_start": datetime.fromtimestamp(subscription.current_period_start),
                "current_period_end": datetime.fromtimestamp(subscription.current_period_end),
                "canceled_at": datetime.fromtimestamp(subscription.canceled_at) if subscription.canceled_at else None,
                "items": [
                    {
                        "price_id": item.price.id,
                        "quantity": item.quantity
                    } for item in subscription.items.data
                ]
            }
        except stripe.error.StripeError as e:
            logger.error(f"Failed to get Stripe subscription: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to get subscription: {str(e)}")

    @staticmethod
    async def create_payment_intent(
        amount: int,
        currency: str = "usd",
        customer_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a Stripe PaymentIntent for one-time payments."""
        try:
            payment_intent_data = {
                "amount": amount,
                "currency": currency,
                "metadata": metadata or {}
            }

            if customer_id:
                payment_intent_data["customer"] = customer_id

            payment_intent = stripe.PaymentIntent.create(**payment_intent_data)

            logger.info(f"Created PaymentIntent: {payment_intent.id}")
            return {
                "payment_intent_id": payment_intent.id,
                "client_secret": payment_intent.client_secret,
                "amount": payment_intent.amount,
                "currency": payment_intent.currency,
                "status": payment_intent.status
            }
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create PaymentIntent: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to create payment intent: {str(e)}")

    @staticmethod
    async def confirm_payment_intent(payment_intent_id: str) -> Dict[str, Any]:
        """Confirm a PaymentIntent."""
        try:
            payment_intent = stripe.PaymentIntent.confirm(payment_intent_id)
            logger.info(f"Confirmed PaymentIntent: {payment_intent_id}")
            return {
                "payment_intent_id": payment_intent.id,
                "status": payment_intent.status,
                "amount": payment_intent.amount,
                "currency": payment_intent.currency
            }
        except stripe.error.StripeError as e:
            logger.error(f"Failed to confirm PaymentIntent: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to confirm payment: {str(e)}")

    @staticmethod
    async def create_price(
        unit_amount: int,
        currency: str = "usd",
        recurring: Optional[Dict[str, str]] = None,
        product_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """Create a Stripe price object."""
        try:
            price_data = {
                "unit_amount": unit_amount,
                "currency": currency,
            }

            if recurring:
                price_data["recurring"] = recurring

            if product_data:
                price_data["product_data"] = product_data

            price = stripe.Price.create(**price_data)
            logger.info(f"Created Stripe price: {price.id}")
            return price.id
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create Stripe price: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to create price: {str(e)}")

    @staticmethod
    async def get_payment_methods(customer_id: str) -> List[Dict[str, Any]]:
        """Get customer's payment methods."""
        try:
            payment_methods = stripe.PaymentMethod.list(
                customer=customer_id,
                type="card"
            )

            return [
                {
                    "id": pm.id,
                    "type": pm.type,
                    "card": {
                        "brand": pm.card.brand,
                        "last4": pm.card.last4,
                        "exp_month": pm.card.exp_month,
                        "exp_year": pm.card.exp_year
                    } if pm.card else {}
                }
                for pm in payment_methods.data
            ]
        except stripe.error.StripeError as e:
            logger.error(f"Failed to get payment methods: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to get payment methods: {str(e)}")

    @staticmethod
    async def attach_payment_method(customer_id: str, payment_method_id: str) -> bool:
        """Attach a payment method to a customer."""
        try:
            payment_method = stripe.PaymentMethod.attach(
                payment_method_id,
                customer=customer_id
            )
            logger.info(f"Attached payment method {payment_method_id} to customer {customer_id}")
            return True
        except stripe.error.StripeError as e:
            logger.error(f"Failed to attach payment method: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to attach payment method: {str(e)}")

    @staticmethod
    async def detach_payment_method(payment_method_id: str) -> bool:
        """Detach a payment method from a customer."""
        try:
            payment_method = stripe.PaymentMethod.detach(payment_method_id)
            logger.info(f"Detached payment method {payment_method_id}")
            return True
        except stripe.error.StripeError as e:
            logger.error(f"Failed to detach payment method: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to detach payment method: {str(e)}")

    @staticmethod
    async def construct_webhook_event(payload: str, signature: str, webhook_secret: str) -> Dict[str, Any]:
        """Construct and verify webhook event from Stripe."""
        try:
            event = stripe.Webhook.construct_event(payload, signature, webhook_secret)
            return {
                "id": event.id,
                "type": event.type,
                "data": event.data.object,
                "created": event.created
            }
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Webhook signature verification failed: {e}")
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
        except Exception as e:
            logger.error(f"Failed to construct webhook event: {e}")
            raise HTTPException(status_code=400, detail="Invalid webhook payload")