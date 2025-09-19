"""
Growth Intelligence Integration Service for NeoForge.

Integrates growth analytics with existing subscription and event tracking systems
to provide seamless data flow and automated insights generation.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session

from app.models.subscription import UserSubscription, Payment, SubscriptionEvent
from app.models.event import Event
from app.models.user import User
from app.services.revenue_analytics import RevenueAnalyticsService
from app.services.customer_health import CustomerHealthService
from app.services.growth_automation import GrowthAutomationService
from app.crud.base import CRUDBase

logger = logging.getLogger(__name__)


class GrowthIntegrationService:
    """Service for integrating growth analytics with existing systems."""

    def __init__(self, db: Session):
        self.db = db
        self.revenue_service = RevenueAnalyticsService(db)
        self.health_service = CustomerHealthService(db)
        self.growth_service = GrowthAutomationService(db)
        
        # CRUD instances for data integration
        self.subscription_crud = CRUDBase(UserSubscription)
        self.event_crud = CRUDBase(Event)
        self.payment_crud = CRUDBase(Payment)

    async def handle_subscription_event(self, subscription_event: Dict[str, Any]) -> Dict[str, Any]:
        """Handle subscription events and trigger growth analytics updates."""
        
        event_type = subscription_event.get("event_type")
        user_id = subscription_event.get("user_id")
        subscription_id = subscription_event.get("subscription_id")
        
        logger.info(f"Processing subscription event: {event_type} for user {user_id}")
        
        result = {
            "event_processed": True,
            "actions_triggered": [],
            "recommendations": [],
            "health_score_updated": False,
            "campaigns_triggered": []
        }
        
        try:
            # Update customer health score
            if user_id:
                health_score = await self.health_service.calculate_health_score(user_id)
                result["health_score_updated"] = True
                result["current_health_score"] = health_score.overall_score
                
                # Trigger specific actions based on event type
                if event_type == "subscription_created":
                    await self._handle_new_subscription(user_id, subscription_id, result)
                
                elif event_type == "subscription_canceled":
                    await self._handle_subscription_cancellation(user_id, health_score, result)
                
                elif event_type == "payment_failed":
                    await self._handle_payment_failure(user_id, health_score, result)
                
                elif event_type == "plan_updated":
                    await self._handle_plan_update(user_id, subscription_event, result)
                
                # Check for automated campaign triggers
                campaigns = await self._evaluate_campaign_triggers(user_id, event_type, health_score)
                result["campaigns_triggered"] = campaigns
        
        except Exception as e:
            logger.error(f"Error handling subscription event: {e}")
            result["event_processed"] = False
            result["error"] = str(e)
        
        return result

    async def handle_usage_event(self, usage_event: Dict[str, Any]) -> Dict[str, Any]:
        """Handle usage events and update growth intelligence."""
        
        user_id = usage_event.get("user_id")
        metric_type = usage_event.get("metric_type", "api_calls")
        quantity = usage_event.get("quantity", 0)
        
        logger.info(f"Processing usage event: {metric_type}={quantity} for user {user_id}")
        
        result = {
            "event_processed": True,
            "usage_recorded": False,
            "health_impact": None,
            "upgrade_opportunity": None,
            "milestone_achieved": None
        }
        
        try:
            # Record usage data
            subscription = await self._get_user_subscription(user_id)
            if subscription:
                await self.revenue_service.record_usage(
                    subscription.id, metric_type, quantity
                )
                result["usage_recorded"] = True
            
            # Check for usage-based milestones
            milestone = await self._check_usage_milestones(user_id, metric_type, quantity)
            if milestone:
                result["milestone_achieved"] = milestone
                await self._trigger_milestone_campaign(user_id, milestone)
            
            # Evaluate upgrade opportunities based on usage
            if metric_type == "api_calls" and quantity > 0:
                upgrade_opp = await self._evaluate_usage_based_upgrade(user_id, quantity)
                result["upgrade_opportunity"] = upgrade_opp
            
            # Update health score if usage indicates significant change
            if await self._should_update_health_score(user_id, metric_type, quantity):
                health_score = await self.health_service.calculate_health_score(user_id)
                result["health_impact"] = {
                    "score": health_score.overall_score,
                    "status": health_score.health_status.value,
                    "risk_level": health_score.risk_level.value
                }
        
        except Exception as e:
            logger.error(f"Error handling usage event: {e}")
            result["event_processed"] = False
            result["error"] = str(e)
        
        return result

    async def handle_user_activity_event(self, activity_event: Dict[str, Any]) -> Dict[str, Any]:
        """Handle user activity events for engagement tracking."""
        
        user_id = activity_event.get("user_id")
        event_name = activity_event.get("event_name")
        event_type = activity_event.get("event_type", "interaction")
        
        logger.info(f"Processing activity event: {event_name} for user {user_id}")
        
        result = {
            "event_processed": True,
            "engagement_updated": False,
            "actions_triggered": []
        }
        
        try:
            # Track engagement-affecting events
            if event_name in ["user_login", "feature_used", "api_call_made", "project_created"]:
                # Update engagement metrics
                engagement_metrics = await self.health_service.analyze_engagement_patterns(user_id)
                result["engagement_updated"] = True
                result["engagement_score"] = engagement_metrics.login_frequency
                
                # Check for re-engagement after inactivity
                if event_name == "user_login":
                    await self._handle_user_login(user_id, result)
                
                # Check for feature adoption milestones
                if event_name == "feature_used":
                    await self._handle_feature_usage(user_id, activity_event, result)
                
                # Check for productivity milestones
                if event_name in ["project_created", "api_call_made"]:
                    await self._handle_productivity_event(user_id, event_name, result)
        
        except Exception as e:
            logger.error(f"Error handling activity event: {e}")
            result["event_processed"] = False
            result["error"] = str(e)
        
        return result

    async def sync_customer_health_scores(self, batch_size: int = 100) -> Dict[str, Any]:
        """Sync customer health scores for all active customers."""
        
        logger.info("Starting customer health score sync")
        
        result = {
            "total_processed": 0,
            "successful_updates": 0,
            "failed_updates": 0,
            "at_risk_identified": 0,
            "upgrade_opportunities": 0,
            "errors": []
        }
        
        try:
            # Get all active customers in batches
            offset = 0
            while True:
                customers = await self._get_active_customers_batch(offset, batch_size)
                if not customers:
                    break
                
                for user_id in customers:
                    try:
                        # Calculate health score
                        health_score = await self.health_service.calculate_health_score(user_id)
                        result["successful_updates"] += 1
                        
                        # Check if at-risk
                        if health_score.churn_probability > 0.6:
                            result["at_risk_identified"] += 1
                            await self._handle_at_risk_identification(user_id, health_score)
                        
                        # Check for upgrade opportunities
                        upgrade_opp = await self.growth_service._analyze_upgrade_opportunity(user_id)
                        if upgrade_opp and upgrade_opp.confidence_score > 0.7:
                            result["upgrade_opportunities"] += 1
                            await self._handle_upgrade_opportunity(user_id, upgrade_opp)
                        
                        result["total_processed"] += 1
                        
                    except Exception as e:
                        result["failed_updates"] += 1
                        result["errors"].append(f"User {user_id}: {str(e)}")
                        logger.warning(f"Failed to update health score for user {user_id}: {e}")
                
                offset += batch_size
        
        except Exception as e:
            logger.error(f"Error in health score sync: {e}")
            result["sync_error"] = str(e)
        
        logger.info(f"Health score sync completed: {result}")
        return result

    async def generate_growth_insights_report(self, days_back: int = 30) -> Dict[str, Any]:
        """Generate comprehensive growth insights report."""
        
        logger.info(f"Generating growth insights report for last {days_back} days")
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days_back)
        
        try:
            # Revenue metrics
            revenue_metrics = await self.revenue_service.get_revenue_metrics(start_date, end_date)
            
            # Customer health overview
            at_risk_customers = await self.health_service.get_at_risk_customers(limit=50)
            
            # Growth opportunities
            upgrade_opportunities = await self.growth_service.identify_upgrade_opportunities()
            retention_insights = await self.growth_service.generate_retention_insights()
            
            # Campaign performance
            campaign_performance = await self.growth_service.optimize_campaign_performance()
            
            # Calculate key insights
            total_at_risk_revenue = 0
            if at_risk_customers:
                for customer in at_risk_customers:
                    clv = await self.revenue_service.calculate_customer_lifetime_value(
                        user_id=customer.user_id
                    )
                    total_at_risk_revenue += clv.clv * customer.churn_probability
            
            total_upgrade_potential = sum(
                opp.potential_revenue_increase for opp in upgrade_opportunities
            )
            
            report = {
                "report_period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat(),
                    "days": days_back
                },
                "revenue_summary": {
                    "mrr": revenue_metrics.mrr,
                    "arr": revenue_metrics.arr,
                    "growth_rate": revenue_metrics.month_over_month_growth,
                    "churn_rate": revenue_metrics.churn_rate,
                    "customer_count": revenue_metrics.customer_count
                },
                "customer_health": {
                    "at_risk_customers": len(at_risk_customers),
                    "total_at_risk_revenue": total_at_risk_revenue,
                    "critical_risk_customers": len([
                        c for c in at_risk_customers 
                        if c.risk_level.value == "critical"
                    ]),
                    "avg_health_score": sum(
                        c.overall_score for c in at_risk_customers
                    ) / max(1, len(at_risk_customers))
                },
                "growth_opportunities": {
                    "upgrade_opportunities": len(upgrade_opportunities),
                    "total_upgrade_potential": total_upgrade_potential,
                    "high_confidence_upgrades": len([
                        o for o in upgrade_opportunities 
                        if o.confidence_score > 0.8
                    ]),
                    "retention_actions_needed": len(retention_insights)
                },
                "campaign_insights": {
                    "top_performing": campaign_performance.get("top_performing_campaigns", []),
                    "underperforming": campaign_performance.get("underperforming_campaigns", []),
                    "optimization_recommendations": campaign_performance.get(
                        "optimization_recommendations", []
                    )
                },
                "actionable_insights": await self._generate_actionable_insights(
                    revenue_metrics, at_risk_customers, upgrade_opportunities, retention_insights
                ),
                "generated_at": datetime.utcnow().isoformat()
            }
            
            return report
            
        except Exception as e:
            logger.error(f"Error generating growth insights report: {e}")
            return {
                "error": str(e),
                "generated_at": datetime.utcnow().isoformat()
            }

    # Private helper methods

    async def _handle_new_subscription(
        self, 
        user_id: int, 
        subscription_id: int, 
        result: Dict[str, Any]
    ) -> None:
        """Handle new subscription creation."""
        
        # Trigger onboarding campaign
        result["actions_triggered"].append("onboarding_campaign_queued")
        
        # Schedule milestone tracking
        result["actions_triggered"].append("milestone_tracking_enabled")
        
        # Add to new customer cohort
        result["actions_triggered"].append("added_to_cohort")

    async def _handle_subscription_cancellation(
        self, 
        user_id: int, 
        health_score, 
        result: Dict[str, Any]
    ) -> None:
        """Handle subscription cancellation."""
        
        # Trigger win-back campaign
        result["actions_triggered"].append("win_back_campaign_triggered")
        
        # Record churn reason (if available)
        result["actions_triggered"].append("churn_analysis_updated")
        
        # Add to churn cohort for analysis
        result["actions_triggered"].append("added_to_churn_cohort")

    async def _handle_payment_failure(
        self, 
        user_id: int, 
        health_score, 
        result: Dict[str, Any]
    ) -> None:
        """Handle payment failure."""
        
        # Trigger payment recovery campaign
        result["actions_triggered"].append("payment_recovery_campaign")
        
        # Increase health score monitoring
        result["actions_triggered"].append("increased_monitoring")
        
        # Consider retention intervention
        if health_score.overall_score < 60:
            result["actions_triggered"].append("retention_intervention_triggered")

    async def _handle_plan_update(
        self, 
        user_id: int, 
        subscription_event: Dict[str, Any], 
        result: Dict[str, Any]
    ) -> None:
        """Handle plan update/upgrade."""
        
        old_plan_id = subscription_event.get("old_values", {}).get("plan_id")
        new_plan_id = subscription_event.get("new_values", {}).get("plan_id")
        
        # Trigger upgrade celebration if it's an upgrade
        if new_plan_id and old_plan_id and new_plan_id > old_plan_id:
            result["actions_triggered"].append("upgrade_celebration_triggered")
            result["actions_triggered"].append("success_story_potential")
        
        # Update usage expectations
        result["actions_triggered"].append("usage_expectations_updated")

    async def _evaluate_campaign_triggers(
        self, 
        user_id: int, 
        event_type: str, 
        health_score
    ) -> List[Dict[str, Any]]:
        """Evaluate if any campaigns should be triggered."""
        
        campaigns = []
        
        # Event-based campaign triggers
        if event_type == "payment_failed" and health_score.overall_score < 70:
            campaigns.append({
                "type": "retention",
                "urgency": "high",
                "reason": "payment_failure_low_health"
            })
        
        if health_score.churn_probability > 0.7:
            campaigns.append({
                "type": "retention",
                "urgency": "critical",
                "reason": "high_churn_probability"
            })
        
        if health_score.api_calls_last_30_days > 8000:
            campaigns.append({
                "type": "upgrade",
                "urgency": "medium",
                "reason": "high_usage"
            })
        
        return campaigns

    async def _check_usage_milestones(
        self, 
        user_id: int, 
        metric_type: str, 
        quantity: float
    ) -> Optional[Dict[str, Any]]:
        """Check if usage event represents a milestone."""
        
        if metric_type == "api_calls":
            # Check for API call milestones
            if quantity == 1:  # First API call
                return {"type": "first_api_call", "threshold": 1, "actual": quantity}
            elif quantity >= 1000:  # Power user milestone
                # Check if this is the first time hitting 1000
                total_calls = await self._get_total_usage(user_id, "api_calls")
                if total_calls >= 1000 and total_calls - quantity < 1000:
                    return {"type": "power_user", "threshold": 1000, "actual": total_calls}
        
        elif metric_type == "projects":
            if quantity == 1:  # First project
                return {"type": "first_project", "threshold": 1, "actual": quantity}
        
        return None

    async def _evaluate_usage_based_upgrade(
        self, 
        user_id: int, 
        api_calls: float
    ) -> Optional[Dict[str, Any]]:
        """Evaluate upgrade opportunity based on usage."""
        
        # Get current plan limits
        subscription = await self._get_user_subscription(user_id)
        if not subscription or not subscription.plan:
            return None
        
        plan_limit = subscription.plan.max_api_calls_per_month
        usage_percentage = (api_calls / plan_limit) * 100 if plan_limit > 0 else 0
        
        if usage_percentage > 80:
            return {
                "current_usage": api_calls,
                "plan_limit": plan_limit,
                "usage_percentage": usage_percentage,
                "recommendation": "upgrade_suggested",
                "urgency": "high" if usage_percentage > 95 else "medium"
            }
        
        return None

    async def _should_update_health_score(
        self, 
        user_id: int, 
        metric_type: str, 
        quantity: float
    ) -> bool:
        """Determine if health score should be updated based on usage."""
        
        # Update health score for significant usage events
        if metric_type == "api_calls" and quantity > 100:
            return True
        
        # Update for milestone achievements
        if metric_type in ["projects", "features"] and quantity > 0:
            return True
        
        return False

    async def _handle_user_login(self, user_id: int, result: Dict[str, Any]) -> None:
        """Handle user login event."""
        
        # Check if this ends a period of inactivity
        last_login = await self._get_last_login_time(user_id)
        if last_login:
            days_inactive = (datetime.utcnow() - last_login).days
            if days_inactive > 7:
                result["actions_triggered"].append("re_engagement_successful")
                
                # Cancel any active win-back campaigns
                result["actions_triggered"].append("win_back_campaign_cancelled")

    async def _handle_feature_usage(
        self, 
        user_id: int, 
        activity_event: Dict[str, Any], 
        result: Dict[str, Any]
    ) -> None:
        """Handle feature usage event."""
        
        feature_name = activity_event.get("properties", {}).get("feature_name")
        if feature_name:
            # Track feature adoption
            result["actions_triggered"].append(f"feature_adoption_{feature_name}")
            
            # Check for advanced feature usage
            if feature_name in ["advanced_analytics", "api_automation", "custom_integrations"]:
                result["actions_triggered"].append("advanced_user_identified")

    async def _handle_productivity_event(
        self, 
        user_id: int, 
        event_name: str, 
        result: Dict[str, Any]
    ) -> None:
        """Handle productivity-related events."""
        
        if event_name == "project_created":
            # Check for project creation milestones
            total_projects = await self._get_total_usage(user_id, "projects")
            if total_projects in [1, 5, 10, 25]:
                result["actions_triggered"].append(f"project_milestone_{total_projects}")
        
        elif event_name == "api_call_made":
            # Track API usage patterns
            result["actions_triggered"].append("api_usage_tracked")

    async def _get_user_subscription(self, user_id: int) -> Optional[UserSubscription]:
        """Get active subscription for user."""
        
        subscriptions = await self.subscription_crud.get_multi(
            self.db, filters={"user_id": user_id, "status": "active"}, limit=1
        )
        return subscriptions[0] if subscriptions else None

    async def _get_active_customers_batch(self, offset: int, limit: int) -> List[int]:
        """Get batch of active customer IDs."""
        
        subscriptions = await self.subscription_crud.get_multi(
            self.db, 
            filters={"status": "active"}, 
            offset=offset, 
            limit=limit
        )
        return [sub.user_id for sub in subscriptions]

    async def _get_total_usage(self, user_id: int, metric_type: str) -> float:
        """Get total usage for a user and metric type."""
        
        # This would query usage_records table
        # Placeholder implementation
        return 0.0

    async def _get_last_login_time(self, user_id: int) -> Optional[datetime]:
        """Get last login time for user."""
        
        events = await self.event_crud.get_multi(
            self.db,
            filters={"user_id": user_id, "event_name": "user_login"},
            order_by="timestamp DESC",
            limit=1
        )
        return events[0].timestamp if events else None

    async def _trigger_milestone_campaign(
        self, 
        user_id: int, 
        milestone: Dict[str, Any]
    ) -> None:
        """Trigger milestone celebration campaign."""
        
        logger.info(f"Triggering milestone campaign for user {user_id}: {milestone['type']}")
        # Implementation would create campaign execution record

    async def _handle_at_risk_identification(
        self, 
        user_id: int, 
        health_score
    ) -> None:
        """Handle identification of at-risk customer."""
        
        logger.info(f"At-risk customer identified: user {user_id}, score {health_score.overall_score}")
        # Implementation would trigger retention campaigns

    async def _handle_upgrade_opportunity(
        self, 
        user_id: int, 
        upgrade_opp
    ) -> None:
        """Handle upgrade opportunity identification."""
        
        logger.info(f"Upgrade opportunity identified: user {user_id}, potential ${upgrade_opp.potential_revenue_increase}")
        # Implementation would trigger upgrade campaigns

    async def _generate_actionable_insights(
        self, 
        revenue_metrics, 
        at_risk_customers, 
        upgrade_opportunities, 
        retention_insights
    ) -> List[Dict[str, Any]]:
        """Generate actionable business insights."""
        
        insights = []
        
        # Revenue insights
        if revenue_metrics.month_over_month_growth < 0:
            insights.append({
                "type": "revenue_concern",
                "priority": "high",
                "insight": f"MRR declined by {abs(revenue_metrics.month_over_month_growth):.1f}%",
                "action": "Focus on retention and upgrade campaigns"
            })
        
        # Churn insights
        if revenue_metrics.churn_rate > 10:
            insights.append({
                "type": "churn_concern",
                "priority": "high",
                "insight": f"Churn rate of {revenue_metrics.churn_rate:.1f}% is above 10% threshold",
                "action": "Implement immediate retention interventions"
            })
        
        # Growth opportunities
        if len(upgrade_opportunities) > 10:
            total_potential = sum(opp.potential_revenue_increase for opp in upgrade_opportunities)
            insights.append({
                "type": "growth_opportunity",
                "priority": "medium",
                "insight": f"{len(upgrade_opportunities)} customers ready for upgrade (${total_potential:.0f} potential)",
                "action": "Launch targeted upgrade campaigns"
            })
        
        # Customer health insights
        critical_customers = len([c for c in at_risk_customers if c.risk_level.value == "critical"])
        if critical_customers > 0:
            insights.append({
                "type": "customer_health",
                "priority": "critical",
                "insight": f"{critical_customers} customers at critical risk of churning",
                "action": "Immediate intervention required"
            })
        
        return insights