"""
Growth Automation Service for NeoForge Intelligence Platform.

Provides automated retention campaigns, proactive upgrade suggestions, success milestone 
celebrations, and data-driven growth optimization to reduce churn and increase revenue.
"""

import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import text, func, and_, or_
from sqlalchemy.orm import Session

from app.models.subscription import UserSubscription, SubscriptionPlan, Payment
from app.models.user import User
from app.models.event import Event
from app.crud.base import CRUDBase
from app.services.customer_health import CustomerHealthService, HealthStatus, RiskLevel
from app.services.revenue_analytics import RevenueAnalyticsService

logger = logging.getLogger(__name__)


class CampaignType(Enum):
    """Types of automated campaigns."""
    RETENTION = "retention"
    UPGRADE = "upgrade"
    ONBOARDING = "onboarding"
    MILESTONE = "milestone"
    WIN_BACK = "win_back"
    USAGE_EXPANSION = "usage_expansion"


class CampaignStatus(Enum):
    """Campaign execution status."""
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
    FAILED = "failed"


class TriggerCondition(Enum):
    """Campaign trigger conditions."""
    HEALTH_SCORE_DROP = "health_score_drop"
    USAGE_DECLINE = "usage_decline"
    PAYMENT_FAILURE = "payment_failure"
    INACTIVITY_PERIOD = "inactivity_period"
    USAGE_THRESHOLD = "usage_threshold"
    MILESTONE_REACHED = "milestone_reached"
    UPGRADE_OPPORTUNITY = "upgrade_opportunity"


@dataclass
class CampaignRule:
    """Automated campaign rule definition."""
    id: str
    name: str
    campaign_type: CampaignType
    trigger_condition: TriggerCondition
    conditions: Dict[str, Any]
    actions: List[Dict[str, Any]]
    priority: int
    is_active: bool
    cooldown_hours: int = 72  # Minimum time between campaigns for same user


@dataclass
class CampaignExecution:
    """Campaign execution record."""
    id: str
    user_id: int
    rule_id: str
    campaign_type: CampaignType
    status: CampaignStatus
    triggered_at: datetime
    executed_at: Optional[datetime]
    completed_at: Optional[datetime]
    metadata: Dict[str, Any]
    results: Optional[Dict[str, Any]] = None


@dataclass
class UpgradeRecommendation:
    """Upgrade recommendation for a customer."""
    user_id: int
    current_plan_id: int
    recommended_plan_id: int
    confidence_score: float
    potential_revenue_increase: float
    reasoning: List[str]
    urgency: str  # low, medium, high
    suggested_actions: List[str]


@dataclass
class RetentionInsight:
    """Customer retention insight."""
    user_id: int
    churn_risk: float
    retention_actions: List[str]
    success_probability: float
    estimated_clv_at_risk: float
    recommended_timeline: str


class GrowthAutomationService:
    """Service for automated growth and retention campaigns."""

    def __init__(self, db: Session):
        self.db = db
        self.health_service = CustomerHealthService(db)
        self.revenue_service = RevenueAnalyticsService(db)
        self.subscription_crud = CRUDBase(UserSubscription)
        self.plan_crud = CRUDBase(SubscriptionPlan)
        self.user_crud = CRUDBase(User)
        
        # Initialize default campaign rules
        self.campaign_rules = self._initialize_campaign_rules()

    async def run_automation_cycle(self) -> Dict[str, Any]:
        """Run a complete automation cycle to identify and execute campaigns."""
        
        results = {
            "campaigns_triggered": 0,
            "campaigns_executed": 0,
            "retention_actions": 0,
            "upgrade_opportunities": 0,
            "errors": []
        }
        
        try:
            # Get all active customers
            active_customers = await self._get_active_customers()
            
            for user_id in active_customers:
                try:
                    # Evaluate campaign rules for this customer
                    triggered_campaigns = await self._evaluate_campaign_rules(user_id)
                    
                    for campaign in triggered_campaigns:
                        # Check cooldown period
                        if await self._is_in_cooldown(user_id, campaign.rule_id):
                            continue
                        
                        # Execute campaign
                        execution_result = await self._execute_campaign(campaign)
                        
                        if execution_result["success"]:
                            results["campaigns_executed"] += 1
                            
                            if campaign.campaign_type == CampaignType.RETENTION:
                                results["retention_actions"] += 1
                            elif campaign.campaign_type == CampaignType.UPGRADE:
                                results["upgrade_opportunities"] += 1
                        
                        results["campaigns_triggered"] += 1
                
                except Exception as e:
                    logger.error(f"Error processing user {user_id}: {e}")
                    results["errors"].append(f"User {user_id}: {str(e)}")
            
            # Log automation cycle completion
            logger.info(f"Automation cycle completed: {results}")
            
        except Exception as e:
            logger.error(f"Automation cycle failed: {e}")
            results["errors"].append(f"Cycle failure: {str(e)}")
        
        return results

    async def identify_upgrade_opportunities(
        self, 
        min_confidence: float = 0.7
    ) -> List[UpgradeRecommendation]:
        """Identify customers ready for plan upgrades."""
        
        upgrade_opportunities = []
        
        # Get active customers
        active_customers = await self._get_active_customers()
        
        for user_id in active_customers:
            try:
                recommendation = await self._analyze_upgrade_opportunity(user_id)
                
                if recommendation and recommendation.confidence_score >= min_confidence:
                    upgrade_opportunities.append(recommendation)
                    
            except Exception as e:
                logger.warning(f"Failed to analyze upgrade for user {user_id}: {e}")
                continue
        
        # Sort by potential revenue increase
        return sorted(
            upgrade_opportunities, 
            key=lambda x: x.potential_revenue_increase, 
            reverse=True
        )

    async def generate_retention_insights(
        self, 
        risk_threshold: float = 0.6
    ) -> List[RetentionInsight]:
        """Generate retention insights for at-risk customers."""
        
        retention_insights = []
        
        # Get at-risk customers
        at_risk_customers = await self.health_service.get_at_risk_customers(
            risk_threshold=risk_threshold * 100
        )
        
        for health_score in at_risk_customers:
            try:
                insight = await self._generate_retention_insight(health_score)
                retention_insights.append(insight)
                
            except Exception as e:
                logger.warning(f"Failed to generate retention insight for user {health_score.user_id}: {e}")
                continue
        
        return retention_insights

    async def trigger_milestone_celebrations(self) -> List[Dict[str, Any]]:
        """Trigger milestone celebration campaigns for qualifying customers."""
        
        celebrations = []
        
        # Define milestones to track
        milestones = [
            {"type": "first_api_call", "threshold": 1, "event": "api_call_made"},
            {"type": "power_user", "threshold": 1000, "event": "api_call_made"},
            {"type": "one_month_subscriber", "threshold": 30, "event": "subscription_active_days"},
            {"type": "six_month_subscriber", "threshold": 180, "event": "subscription_active_days"},
            {"type": "first_project", "threshold": 1, "event": "project_created"},
            {"type": "project_milestone", "threshold": 5, "event": "project_created"}
        ]
        
        active_customers = await self._get_active_customers()
        
        for user_id in active_customers:
            for milestone in milestones:
                if await self._check_milestone_achievement(user_id, milestone):
                    celebration = await self._trigger_milestone_celebration(user_id, milestone)
                    if celebration:
                        celebrations.append(celebration)
        
        return celebrations

    async def optimize_campaign_performance(self) -> Dict[str, Any]:
        """Analyze and optimize campaign performance."""
        
        # Get campaign performance data
        performance_data = await self._get_campaign_performance()
        
        optimization_results = {
            "top_performing_campaigns": [],
            "underperforming_campaigns": [],
            "optimization_recommendations": [],
            "roi_analysis": {}
        }
        
        # Analyze performance by campaign type
        for campaign_type in CampaignType:
            campaign_data = performance_data.get(campaign_type.value, {})
            
            if campaign_data:
                success_rate = campaign_data.get("success_rate", 0)
                roi = campaign_data.get("roi", 0)
                
                if success_rate > 0.7 and roi > 2.0:
                    optimization_results["top_performing_campaigns"].append({
                        "type": campaign_type.value,
                        "success_rate": success_rate,
                        "roi": roi,
                        "recommendation": "Scale up this campaign type"
                    })
                elif success_rate < 0.3 or roi < 0.5:
                    optimization_results["underperforming_campaigns"].append({
                        "type": campaign_type.value,
                        "success_rate": success_rate,
                        "roi": roi,
                        "recommendation": "Review and optimize campaign rules"
                    })
        
        return optimization_results

    # Private helper methods

    def _initialize_campaign_rules(self) -> List[CampaignRule]:
        """Initialize default campaign rules."""
        
        return [
            # Retention campaigns
            CampaignRule(
                id="retention_health_drop",
                name="Health Score Drop Retention",
                campaign_type=CampaignType.RETENTION,
                trigger_condition=TriggerCondition.HEALTH_SCORE_DROP,
                conditions={"health_score_threshold": 60, "drop_percentage": 20},
                actions=[
                    {"type": "email", "template": "retention_offer"},
                    {"type": "discount", "amount": 0.2, "duration": 30}
                ],
                priority=1,
                is_active=True,
                cooldown_hours=168  # 1 week
            ),
            
            # Upgrade campaigns
            CampaignRule(
                id="upgrade_usage_threshold",
                name="Usage Threshold Upgrade",
                campaign_type=CampaignType.UPGRADE,
                trigger_condition=TriggerCondition.USAGE_THRESHOLD,
                conditions={"api_calls_threshold": 8000, "percentage_of_limit": 80},
                actions=[
                    {"type": "email", "template": "upgrade_suggestion"},
                    {"type": "in_app_notification", "message": "upgrade_benefits"}
                ],
                priority=2,
                is_active=True,
                cooldown_hours=720  # 30 days
            ),
            
            # Win-back campaigns
            CampaignRule(
                id="winback_inactive",
                name="Inactive User Win-back",
                campaign_type=CampaignType.WIN_BACK,
                trigger_condition=TriggerCondition.INACTIVITY_PERIOD,
                conditions={"days_inactive": 14},
                actions=[
                    {"type": "email", "template": "winback_offer"},
                    {"type": "feature_highlight", "features": ["new_features", "tutorials"]}
                ],
                priority=3,
                is_active=True,
                cooldown_hours=336  # 2 weeks
            ),
            
            # Milestone celebrations
            CampaignRule(
                id="milestone_celebration",
                name="Milestone Achievement",
                campaign_type=CampaignType.MILESTONE,
                trigger_condition=TriggerCondition.MILESTONE_REACHED,
                conditions={"milestone_types": ["first_api_call", "power_user", "anniversary"]},
                actions=[
                    {"type": "email", "template": "milestone_celebration"},
                    {"type": "badge", "badge_type": "achievement"}
                ],
                priority=4,
                is_active=True,
                cooldown_hours=2160  # 90 days
            )
        ]

    async def _get_active_customers(self) -> List[int]:
        """Get list of active customer user IDs."""
        
        query = text("""
            SELECT DISTINCT user_id
            FROM user_subscriptions
            WHERE status = 'active'
            ORDER BY created_at DESC
            LIMIT 1000
        """)
        
        result = await self.db.execute(query)
        return [row.user_id for row in result.fetchall()]

    async def _evaluate_campaign_rules(self, user_id: int) -> List[CampaignExecution]:
        """Evaluate all campaign rules for a specific user."""
        
        triggered_campaigns = []
        
        # Get customer health score
        try:
            health_score = await self.health_service.calculate_health_score(user_id)
        except Exception as e:
            logger.warning(f"Failed to get health score for user {user_id}: {e}")
            return triggered_campaigns
        
        for rule in self.campaign_rules:
            if not rule.is_active:
                continue
            
            # Check if rule conditions are met
            if await self._check_rule_conditions(user_id, rule, health_score):
                campaign_execution = CampaignExecution(
                    id=f"{rule.id}_{user_id}_{int(datetime.utcnow().timestamp())}",
                    user_id=user_id,
                    rule_id=rule.id,
                    campaign_type=rule.campaign_type,
                    status=CampaignStatus.PENDING,
                    triggered_at=datetime.utcnow(),
                    executed_at=None,
                    completed_at=None,
                    metadata={
                        "health_score": health_score.overall_score,
                        "rule_conditions": rule.conditions,
                        "trigger_reason": rule.trigger_condition.value
                    }
                )
                triggered_campaigns.append(campaign_execution)
        
        return triggered_campaigns

    async def _check_rule_conditions(
        self, 
        user_id: int, 
        rule: CampaignRule, 
        health_score
    ) -> bool:
        """Check if a campaign rule's conditions are met for a user."""
        
        try:
            if rule.trigger_condition == TriggerCondition.HEALTH_SCORE_DROP:
                threshold = rule.conditions.get("health_score_threshold", 60)
                return health_score.overall_score < threshold
            
            elif rule.trigger_condition == TriggerCondition.USAGE_THRESHOLD:
                api_threshold = rule.conditions.get("api_calls_threshold", 8000)
                return health_score.api_calls_last_30_days >= api_threshold
            
            elif rule.trigger_condition == TriggerCondition.INACTIVITY_PERIOD:
                days_threshold = rule.conditions.get("days_inactive", 14)
                return health_score.days_since_last_login >= days_threshold
            
            elif rule.trigger_condition == TriggerCondition.PAYMENT_FAILURE:
                return health_score.payment_issues_count > 0
            
            elif rule.trigger_condition == TriggerCondition.MILESTONE_REACHED:
                return await self._check_any_milestone_reached(user_id)
            
            return False
            
        except Exception as e:
            logger.warning(f"Error checking rule conditions for user {user_id}, rule {rule.id}: {e}")
            return False

    async def _is_in_cooldown(self, user_id: int, rule_id: str) -> bool:
        """Check if user is in cooldown period for a specific campaign rule."""
        
        # In a real implementation, this would check a campaign execution log
        # For now, return False to allow campaigns
        return False

    async def _execute_campaign(self, campaign: CampaignExecution) -> Dict[str, Any]:
        """Execute a campaign for a customer."""
        
        try:
            campaign.executed_at = datetime.utcnow()
            campaign.status = CampaignStatus.ACTIVE
            
            # Get the campaign rule
            rule = next((r for r in self.campaign_rules if r.id == campaign.rule_id), None)
            if not rule:
                return {"success": False, "error": "Campaign rule not found"}
            
            # Execute each action in the campaign
            action_results = []
            
            for action in rule.actions:
                action_result = await self._execute_campaign_action(campaign.user_id, action)
                action_results.append(action_result)
            
            # Update campaign status
            campaign.status = CampaignStatus.COMPLETED
            campaign.completed_at = datetime.utcnow()
            campaign.results = {
                "actions_executed": len(action_results),
                "actions_successful": len([r for r in action_results if r.get("success")]),
                "action_details": action_results
            }
            
            # Log campaign execution
            await self._log_campaign_execution(campaign)
            
            return {"success": True, "campaign": campaign}
            
        except Exception as e:
            campaign.status = CampaignStatus.FAILED
            logger.error(f"Campaign execution failed for {campaign.id}: {e}")
            return {"success": False, "error": str(e)}

    async def _execute_campaign_action(self, user_id: int, action: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a specific campaign action."""
        
        action_type = action.get("type")
        
        try:
            if action_type == "email":
                return await self._send_campaign_email(user_id, action.get("template"))
            
            elif action_type == "discount":
                return await self._apply_discount(user_id, action.get("amount"), action.get("duration"))
            
            elif action_type == "in_app_notification":
                return await self._send_in_app_notification(user_id, action.get("message"))
            
            elif action_type == "feature_highlight":
                return await self._highlight_features(user_id, action.get("features"))
            
            elif action_type == "badge":
                return await self._award_badge(user_id, action.get("badge_type"))
            
            else:
                return {"success": False, "error": f"Unknown action type: {action_type}"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _analyze_upgrade_opportunity(self, user_id: int) -> Optional[UpgradeRecommendation]:
        """Analyze upgrade opportunity for a specific customer."""
        
        # Get customer data
        customer_data = await self._get_customer_subscription_data(user_id)
        if not customer_data:
            return None
        
        current_plan = customer_data["plan"]
        health_score = await self.health_service.calculate_health_score(user_id)
        
        # Get available plans
        available_plans = await self._get_upgrade_plans(current_plan["id"])
        
        best_recommendation = None
        highest_confidence = 0.0
        
        for plan in available_plans:
            confidence = await self._calculate_upgrade_confidence(user_id, current_plan, plan, health_score)
            
            if confidence > highest_confidence and confidence > 0.5:
                revenue_increase = await self._calculate_revenue_increase(current_plan, plan)
                reasoning = self._generate_upgrade_reasoning(health_score, current_plan, plan)
                
                best_recommendation = UpgradeRecommendation(
                    user_id=user_id,
                    current_plan_id=current_plan["id"],
                    recommended_plan_id=plan["id"],
                    confidence_score=confidence,
                    potential_revenue_increase=revenue_increase,
                    reasoning=reasoning,
                    urgency=self._determine_upgrade_urgency(health_score, confidence),
                    suggested_actions=self._generate_upgrade_actions(confidence)
                )
                highest_confidence = confidence
        
        return best_recommendation

    async def _generate_retention_insight(self, health_score) -> RetentionInsight:
        """Generate retention insight for an at-risk customer."""
        
        # Calculate estimated CLV at risk
        clv_data = await self.revenue_service.calculate_customer_lifetime_value(
            user_id=health_score.user_id
        )
        
        # Generate retention actions based on health score components
        retention_actions = []
        
        if health_score.usage_score < 50:
            retention_actions.extend([
                "Provide personalized onboarding session",
                "Share relevant use case tutorials",
                "Offer technical consultation"
            ])
        
        if health_score.engagement_score < 50:
            retention_actions.extend([
                "Send re-engagement email series",
                "Invite to product webinar",
                "Provide feature highlights"
            ])
        
        if health_score.payment_score < 70:
            retention_actions.extend([
                "Address payment issues proactively",
                "Offer payment plan flexibility",
                "Review billing concerns"
            ])
        
        # Calculate success probability based on historical data
        success_probability = await self._calculate_retention_success_probability(health_score)
        
        # Determine recommended timeline
        recommended_timeline = "immediate" if health_score.risk_level == RiskLevel.CRITICAL else "within_7_days"
        
        return RetentionInsight(
            user_id=health_score.user_id,
            churn_risk=health_score.churn_probability,
            retention_actions=retention_actions,
            success_probability=success_probability,
            estimated_clv_at_risk=clv_data.clv,
            recommended_timeline=recommended_timeline
        )

    async def _check_milestone_achievement(self, user_id: int, milestone: Dict[str, Any]) -> bool:
        """Check if user has achieved a specific milestone."""
        
        milestone_type = milestone["type"]
        threshold = milestone["threshold"]
        
        if milestone_type == "first_api_call":
            # Check if user has made their first API call
            query = text("""
                SELECT COUNT(*) as count
                FROM usage_records
                WHERE user_id = :user_id
                AND metric_type = 'api_calls'
                AND quantity > 0
            """)
            
            result = await self.db.execute(query, {"user_id": user_id})
            return (result.scalar() or 0) >= threshold
        
        elif milestone_type == "power_user":
            # Check if user has made 1000+ API calls total
            query = text("""
                SELECT COALESCE(SUM(quantity), 0) as total
                FROM usage_records
                WHERE user_id = :user_id
                AND metric_type = 'api_calls'
            """)
            
            result = await self.db.execute(query, {"user_id": user_id})
            return (result.scalar() or 0) >= threshold
        
        elif milestone_type in ["one_month_subscriber", "six_month_subscriber"]:
            # Check subscription duration
            query = text("""
                SELECT MIN(created_at) as first_subscription
                FROM user_subscriptions
                WHERE user_id = :user_id
            """)
            
            result = await self.db.execute(query, {"user_id": user_id})
            first_subscription = result.scalar()
            
            if first_subscription:
                days_subscribed = (datetime.utcnow() - first_subscription).days
                return days_subscribed >= threshold
        
        return False

    async def _trigger_milestone_celebration(
        self, 
        user_id: int, 
        milestone: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Trigger a milestone celebration campaign."""
        
        # Check if already celebrated this milestone
        if await self._milestone_already_celebrated(user_id, milestone["type"]):
            return None
        
        celebration = {
            "user_id": user_id,
            "milestone_type": milestone["type"],
            "threshold": milestone["threshold"],
            "triggered_at": datetime.utcnow(),
            "actions": [
                {"type": "email", "template": f"milestone_{milestone['type']}"},
                {"type": "badge", "badge_type": milestone["type"]}
            ]
        }
        
        # Execute celebration actions
        for action in celebration["actions"]:
            await self._execute_campaign_action(user_id, action)
        
        # Mark milestone as celebrated
        await self._mark_milestone_celebrated(user_id, milestone["type"])
        
        return celebration

    # Placeholder implementations for campaign actions

    async def _send_campaign_email(self, user_id: int, template: str) -> Dict[str, Any]:
        """Send campaign email to user."""
        logger.info(f"Sending email template '{template}' to user {user_id}")
        return {"success": True, "action": "email_sent", "template": template}

    async def _apply_discount(self, user_id: int, amount: float, duration: int) -> Dict[str, Any]:
        """Apply discount to user's subscription."""
        logger.info(f"Applying {amount*100}% discount to user {user_id} for {duration} days")
        return {"success": True, "action": "discount_applied", "amount": amount, "duration": duration}

    async def _send_in_app_notification(self, user_id: int, message: str) -> Dict[str, Any]:
        """Send in-app notification to user."""
        logger.info(f"Sending in-app notification '{message}' to user {user_id}")
        return {"success": True, "action": "notification_sent", "message": message}

    async def _highlight_features(self, user_id: int, features: List[str]) -> Dict[str, Any]:
        """Highlight specific features for user."""
        logger.info(f"Highlighting features {features} for user {user_id}")
        return {"success": True, "action": "features_highlighted", "features": features}

    async def _award_badge(self, user_id: int, badge_type: str) -> Dict[str, Any]:
        """Award badge to user."""
        logger.info(f"Awarding badge '{badge_type}' to user {user_id}")
        return {"success": True, "action": "badge_awarded", "badge_type": badge_type}

    async def _log_campaign_execution(self, campaign: CampaignExecution) -> None:
        """Log campaign execution for analytics."""
        logger.info(f"Campaign executed: {campaign.id} for user {campaign.user_id}")

    # Additional helper methods

    async def _get_customer_subscription_data(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get customer subscription data."""
        query = text("""
            SELECT 
                s.id as subscription_id,
                s.plan_id,
                p.name as plan_name,
                p.price_monthly,
                p.price_yearly,
                p.max_api_calls_per_month
            FROM user_subscriptions s
            JOIN subscription_plans p ON s.plan_id = p.id
            WHERE s.user_id = :user_id AND s.status = 'active'
            LIMIT 1
        """)
        
        result = await self.db.execute(query, {"user_id": user_id})
        row = result.fetchone()
        
        if not row:
            return None
        
        return {
            "subscription_id": row.subscription_id,
            "plan": {
                "id": row.plan_id,
                "name": row.plan_name,
                "price_monthly": row.price_monthly,
                "price_yearly": row.price_yearly,
                "max_api_calls": row.max_api_calls_per_month
            }
        }

    async def _get_upgrade_plans(self, current_plan_id: int) -> List[Dict[str, Any]]:
        """Get available upgrade plans."""
        query = text("""
            SELECT id, name, price_monthly, price_yearly, max_api_calls_per_month
            FROM subscription_plans
            WHERE id > :current_plan_id AND is_active = true
            ORDER BY price_monthly ASC
        """)
        
        result = await self.db.execute(query, {"current_plan_id": current_plan_id})
        
        return [
            {
                "id": row.id,
                "name": row.name,
                "price_monthly": row.price_monthly,
                "price_yearly": row.price_yearly,
                "max_api_calls": row.max_api_calls_per_month
            }
            for row in result.fetchall()
        ]

    async def _calculate_upgrade_confidence(
        self, 
        user_id: int, 
        current_plan: Dict[str, Any], 
        target_plan: Dict[str, Any],
        health_score
    ) -> float:
        """Calculate confidence score for upgrade recommendation."""
        
        confidence = 0.0
        
        # Usage-based confidence
        if health_score.api_calls_last_30_days > current_plan["max_api_calls"] * 0.8:
            confidence += 0.4
        
        # Health score confidence
        if health_score.overall_score > 70:
            confidence += 0.3
        
        # Engagement confidence
        if health_score.engagement_score > 60:
            confidence += 0.2
        
        # Payment reliability confidence
        if health_score.payment_score > 80:
            confidence += 0.1
        
        return min(1.0, confidence)

    async def _calculate_revenue_increase(
        self, 
        current_plan: Dict[str, Any], 
        target_plan: Dict[str, Any]
    ) -> float:
        """Calculate potential revenue increase from upgrade."""
        return target_plan["price_monthly"] - current_plan["price_monthly"]

    def _generate_upgrade_reasoning(
        self, 
        health_score, 
        current_plan: Dict[str, Any], 
        target_plan: Dict[str, Any]
    ) -> List[str]:
        """Generate reasoning for upgrade recommendation."""
        
        reasons = []
        
        if health_score.api_calls_last_30_days > current_plan["max_api_calls"] * 0.8:
            reasons.append(f"Usage is {health_score.api_calls_last_30_days} API calls, approaching plan limit")
        
        if health_score.overall_score > 80:
            reasons.append("Customer shows high engagement and satisfaction")
        
        if health_score.payment_score > 80:
            reasons.append("Customer has reliable payment history")
        
        reasons.append(f"Upgrade to {target_plan['name']} provides {target_plan['max_api_calls']} API calls")
        
        return reasons

    def _determine_upgrade_urgency(self, health_score, confidence: float) -> str:
        """Determine urgency level for upgrade recommendation."""
        
        if confidence > 0.8 and health_score.api_calls_last_30_days > 8000:
            return "high"
        elif confidence > 0.6:
            return "medium"
        else:
            return "low"

    def _generate_upgrade_actions(self, confidence: float) -> List[str]:
        """Generate suggested actions for upgrade campaign."""
        
        if confidence > 0.8:
            return [
                "Direct sales outreach",
                "Personalized upgrade proposal",
                "Limited-time upgrade incentive"
            ]
        elif confidence > 0.6:
            return [
                "Email upgrade recommendation",
                "In-app upgrade suggestion",
                "Feature comparison guide"
            ]
        else:
            return [
                "Educational content about higher plans",
                "Usage tracking and notifications"
            ]

    async def _calculate_retention_success_probability(self, health_score) -> float:
        """Calculate probability of successful retention."""
        
        # Simple model based on health score and risk factors
        base_probability = health_score.overall_score / 100
        
        # Adjust based on engagement
        if health_score.engagement_score > 60:
            base_probability += 0.2
        
        # Adjust based on payment history
        if health_score.payment_score > 80:
            base_probability += 0.1
        
        return min(1.0, base_probability)

    async def _milestone_already_celebrated(self, user_id: int, milestone_type: str) -> bool:
        """Check if milestone was already celebrated."""
        # Placeholder - would check celebration log in real implementation
        return False

    async def _mark_milestone_celebrated(self, user_id: int, milestone_type: str) -> None:
        """Mark milestone as celebrated."""
        # Placeholder - would log celebration in real implementation
        logger.info(f"Marked milestone '{milestone_type}' as celebrated for user {user_id}")

    async def _check_any_milestone_reached(self, user_id: int) -> bool:
        """Check if any milestone has been reached."""
        # Simplified check - would be more comprehensive in real implementation
        return False

    async def _get_campaign_performance(self) -> Dict[str, Any]:
        """Get campaign performance data for optimization."""
        # Placeholder - would query campaign execution logs
        return {
            "retention": {"success_rate": 0.65, "roi": 3.2},
            "upgrade": {"success_rate": 0.45, "roi": 5.1},
            "milestone": {"success_rate": 0.85, "roi": 1.8}
        }