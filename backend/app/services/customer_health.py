"""
Customer Health Scoring Service for NeoForge Growth Intelligence.

Provides comprehensive customer health assessment, usage-based scoring algorithms,
engagement tracking, and churn risk identification for proactive customer success.
"""

import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from collections import defaultdict

from sqlalchemy import text, func, and_, or_
from sqlalchemy.orm import Session

from app.models.subscription import UserSubscription, Payment, UsageRecord
from app.models.event import Event
from app.models.user import User
from app.crud.base import CRUDBase

logger = logging.getLogger(__name__)


class HealthStatus(Enum):
    """Customer health status categories."""
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"
    CRITICAL = "critical"


class RiskLevel(Enum):
    """Customer churn risk levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class CustomerHealthScore:
    """Comprehensive customer health metrics."""
    user_id: int
    overall_score: float  # 0-100
    health_status: HealthStatus
    risk_level: RiskLevel
    
    # Component scores
    usage_score: float
    engagement_score: float
    payment_score: float
    support_score: float
    
    # Key metrics
    days_since_last_login: int
    api_calls_last_30_days: int
    payment_issues_count: int
    support_tickets_count: int
    
    # Predictions
    churn_probability: float
    predicted_action_date: Optional[datetime]
    recommended_actions: List[str]
    
    # Timestamps
    calculated_at: datetime
    last_activity_at: Optional[datetime]


@dataclass
class EngagementMetrics:
    """Customer engagement tracking."""
    login_frequency: float
    feature_adoption_rate: float
    api_usage_trend: float
    session_duration_avg: float
    page_views_per_session: float
    time_to_value: Optional[float]


@dataclass
class UsagePattern:
    """Customer usage pattern analysis."""
    metric_type: str
    current_usage: float
    average_usage: float
    trend_direction: str  # increasing, decreasing, stable
    usage_percentile: float
    seasonal_adjustment: float


class CustomerHealthService:
    """Service for comprehensive customer health assessment and scoring."""

    def __init__(self, db: Session):
        self.db = db
        self.subscription_crud = CRUDBase(UserSubscription)
        self.usage_crud = CRUDBase(UsageRecord)
        self.event_crud = CRUDBase(Event)

    async def calculate_health_score(self, user_id: int) -> CustomerHealthScore:
        """Calculate comprehensive health score for a customer."""
        
        # Get customer data
        customer_data = await self._get_customer_data(user_id)
        if not customer_data:
            raise ValueError(f"Customer {user_id} not found")
        
        # Calculate component scores
        usage_score = await self._calculate_usage_score(user_id)
        engagement_score = await self._calculate_engagement_score(user_id)
        payment_score = await self._calculate_payment_score(user_id)
        support_score = await self._calculate_support_score(user_id)
        
        # Calculate weighted overall score
        weights = {
            "usage": 0.35,
            "engagement": 0.30,
            "payment": 0.25,
            "support": 0.10
        }
        
        overall_score = (
            usage_score * weights["usage"] +
            engagement_score * weights["engagement"] +
            payment_score * weights["payment"] +
            support_score * weights["support"]
        )
        
        # Determine health status and risk level
        health_status = self._determine_health_status(overall_score)
        risk_level = self._determine_risk_level(overall_score, customer_data)
        
        # Get key metrics
        metrics = await self._get_key_metrics(user_id)
        
        # Calculate churn probability
        churn_probability = await self._calculate_churn_probability(user_id, overall_score)
        
        # Predict action date
        predicted_action_date = await self._predict_action_date(user_id, churn_probability)
        
        # Generate recommendations
        recommended_actions = self._generate_recommendations(
            overall_score, usage_score, engagement_score, payment_score, support_score, metrics
        )
        
        return CustomerHealthScore(
            user_id=user_id,
            overall_score=overall_score,
            health_status=health_status,
            risk_level=risk_level,
            usage_score=usage_score,
            engagement_score=engagement_score,
            payment_score=payment_score,
            support_score=support_score,
            days_since_last_login=metrics["days_since_last_login"],
            api_calls_last_30_days=metrics["api_calls_last_30_days"],
            payment_issues_count=metrics["payment_issues_count"],
            support_tickets_count=metrics["support_tickets_count"],
            churn_probability=churn_probability,
            predicted_action_date=predicted_action_date,
            recommended_actions=recommended_actions,
            calculated_at=datetime.utcnow(),
            last_activity_at=metrics.get("last_activity_at")
        )

    async def get_at_risk_customers(
        self,
        risk_threshold: float = 70.0,
        limit: int = 100
    ) -> List[CustomerHealthScore]:
        """Get customers at risk of churning."""
        
        # Get all active customers
        active_customers = await self._get_active_customers(limit * 2)  # Get more to filter
        
        at_risk_customers = []
        
        for user_id in active_customers:
            try:
                health_score = await self.calculate_health_score(user_id)
                
                if (health_score.churn_probability >= risk_threshold or 
                    health_score.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]):
                    at_risk_customers.append(health_score)
                    
                if len(at_risk_customers) >= limit:
                    break
                    
            except Exception as e:
                logger.warning(f"Failed to calculate health score for user {user_id}: {e}")
                continue
        
        # Sort by churn probability descending
        return sorted(at_risk_customers, key=lambda x: x.churn_probability, reverse=True)

    async def analyze_engagement_patterns(self, user_id: int) -> EngagementMetrics:
        """Analyze customer engagement patterns."""
        
        # Calculate login frequency (logins per week)
        login_frequency = await self._calculate_login_frequency(user_id)
        
        # Calculate feature adoption rate
        feature_adoption_rate = await self._calculate_feature_adoption(user_id)
        
        # Calculate API usage trend
        api_usage_trend = await self._calculate_api_usage_trend(user_id)
        
        # Calculate session metrics
        session_duration_avg = await self._calculate_avg_session_duration(user_id)
        page_views_per_session = await self._calculate_page_views_per_session(user_id)
        
        # Calculate time to value (time to first meaningful action)
        time_to_value = await self._calculate_time_to_value(user_id)
        
        return EngagementMetrics(
            login_frequency=login_frequency,
            feature_adoption_rate=feature_adoption_rate,
            api_usage_trend=api_usage_trend,
            session_duration_avg=session_duration_avg,
            page_views_per_session=page_views_per_session,
            time_to_value=time_to_value
        )

    async def analyze_usage_patterns(self, user_id: int) -> List[UsagePattern]:
        """Analyze customer usage patterns across different metrics."""
        
        patterns = []
        
        # Get usage data for the last 90 days
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=90)
        
        # Get all usage metrics for this customer
        usage_metrics = await self._get_usage_metrics(user_id, start_date, end_date)
        
        for metric_type in usage_metrics.keys():
            pattern = await self._analyze_metric_pattern(user_id, metric_type, usage_metrics[metric_type])
            patterns.append(pattern)
        
        return patterns

    async def get_health_trends(
        self,
        user_id: int,
        days_back: int = 90
    ) -> Dict[str, List[Tuple[datetime, float]]]:
        """Get health score trends over time."""
        
        trends = {
            "overall_score": [],
            "usage_score": [],
            "engagement_score": [],
            "payment_score": [],
            "support_score": []
        }
        
        end_date = datetime.utcnow()
        
        # Calculate weekly snapshots
        for weeks_back in range(0, days_back // 7):
            snapshot_date = end_date - timedelta(weeks=weeks_back)
            
            try:
                # Calculate scores for this point in time
                usage_score = await self._calculate_usage_score(user_id, snapshot_date)
                engagement_score = await self._calculate_engagement_score(user_id, snapshot_date)
                payment_score = await self._calculate_payment_score(user_id, snapshot_date)
                support_score = await self._calculate_support_score(user_id, snapshot_date)
                
                weights = {"usage": 0.35, "engagement": 0.30, "payment": 0.25, "support": 0.10}
                overall_score = (
                    usage_score * weights["usage"] +
                    engagement_score * weights["engagement"] +
                    payment_score * weights["payment"] +
                    support_score * weights["support"]
                )
                
                trends["overall_score"].append((snapshot_date, overall_score))
                trends["usage_score"].append((snapshot_date, usage_score))
                trends["engagement_score"].append((snapshot_date, engagement_score))
                trends["payment_score"].append((snapshot_date, payment_score))
                trends["support_score"].append((snapshot_date, support_score))
                
            except Exception as e:
                logger.warning(f"Failed to calculate trend for {snapshot_date}: {e}")
                continue
        
        # Reverse to get chronological order
        for key in trends:
            trends[key].reverse()
        
        return trends

    # Private helper methods

    async def _get_customer_data(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get basic customer data."""
        
        query = text("""
            SELECT 
                u.id,
                u.email,
                u.created_at as user_created_at,
                s.id as subscription_id,
                s.status,
                s.created_at as subscription_created_at,
                s.plan_id,
                p.name as plan_name
            FROM users u
            LEFT JOIN user_subscriptions s ON u.id = s.user_id AND s.status = 'active'
            LEFT JOIN subscription_plans p ON s.plan_id = p.id
            WHERE u.id = :user_id
        """)
        
        result = await self.db.execute(query, {"user_id": user_id})
        row = result.fetchone()
        
        if not row:
            return None
        
        return {
            "user_id": row.id,
            "email": row.email,
            "user_created_at": row.user_created_at,
            "subscription_id": row.subscription_id,
            "status": row.status,
            "subscription_created_at": row.subscription_created_at,
            "plan_id": row.plan_id,
            "plan_name": row.plan_name
        }

    async def _calculate_usage_score(
        self, 
        user_id: int, 
        reference_date: Optional[datetime] = None
    ) -> float:
        """Calculate usage score based on API calls and feature usage."""
        
        if not reference_date:
            reference_date = datetime.utcnow()
        
        # Get usage in the last 30 days before reference date
        start_date = reference_date - timedelta(days=30)
        
        usage_query = text("""
            SELECT 
                metric_type,
                SUM(quantity) as total_usage
            FROM usage_records
            WHERE user_id = :user_id
            AND period_start >= :start_date
            AND period_end <= :reference_date
            GROUP BY metric_type
        """)
        
        result = await self.db.execute(usage_query, {
            "user_id": user_id,
            "start_date": start_date,
            "reference_date": reference_date
        })
        
        usage_data = {row.metric_type: row.total_usage for row in result.fetchall()}
        
        # Calculate score based on usage patterns
        score = 0.0
        weights = {
            "api_calls": 0.4,
            "storage": 0.2,
            "projects": 0.2,
            "features": 0.2
        }
        
        # Get baseline usage for comparison
        baselines = await self._get_usage_baselines()
        
        for metric_type, weight in weights.items():
            usage = usage_data.get(metric_type, 0)
            baseline = baselines.get(metric_type, 1)
            
            # Score based on usage relative to baseline
            metric_score = min(100, (usage / baseline) * 100) if baseline > 0 else 0
            score += metric_score * weight
        
        return min(100.0, max(0.0, score))

    async def _calculate_engagement_score(
        self, 
        user_id: int, 
        reference_date: Optional[datetime] = None
    ) -> float:
        """Calculate engagement score based on user activity."""
        
        if not reference_date:
            reference_date = datetime.utcnow()
        
        start_date = reference_date - timedelta(days=30)
        
        # Get engagement events
        engagement_query = text("""
            SELECT 
                event_type,
                event_name,
                COUNT(*) as event_count,
                COUNT(DISTINCT DATE(timestamp)) as active_days
            FROM events
            WHERE user_id = :user_id
            AND timestamp >= :start_date
            AND timestamp <= :reference_date
            AND event_type IN ('interaction', 'business')
            GROUP BY event_type, event_name
        """)
        
        result = await self.db.execute(engagement_query, {
            "user_id": user_id,
            "start_date": start_date,
            "reference_date": reference_date
        })
        
        engagement_data = result.fetchall()
        
        # Calculate engagement metrics
        total_events = sum(row.event_count for row in engagement_data)
        total_active_days = len(set(row.active_days for row in engagement_data))
        
        # Base score on activity frequency and consistency
        frequency_score = min(100, (total_events / 100) * 100)  # 100 events = full score
        consistency_score = min(100, (total_active_days / 30) * 100)  # Daily activity = full score
        
        # Weighted combination
        score = (frequency_score * 0.6) + (consistency_score * 0.4)
        
        return min(100.0, max(0.0, score))

    async def _calculate_payment_score(
        self, 
        user_id: int, 
        reference_date: Optional[datetime] = None
    ) -> float:
        """Calculate payment health score."""
        
        if not reference_date:
            reference_date = datetime.utcnow()
        
        start_date = reference_date - timedelta(days=90)  # Look back 90 days for payment history
        
        payment_query = text("""
            SELECT 
                status,
                COUNT(*) as payment_count
            FROM payments
            WHERE user_id = :user_id
            AND created_at >= :start_date
            AND created_at <= :reference_date
            GROUP BY status
        """)
        
        result = await self.db.execute(payment_query, {
            "user_id": user_id,
            "start_date": start_date,
            "reference_date": reference_date
        })
        
        payment_data = {row.status: row.payment_count for row in result.fetchall()}
        
        total_payments = sum(payment_data.values())
        
        if total_payments == 0:
            return 50.0  # Neutral score for new customers
        
        # Calculate score based on payment success rate
        successful_payments = payment_data.get("succeeded", 0)
        failed_payments = payment_data.get("failed", 0)
        
        success_rate = successful_payments / total_payments
        
        # Penalty for failed payments
        failure_penalty = min(50, failed_payments * 10)  # -10 points per failure, max -50
        
        score = (success_rate * 100) - failure_penalty
        
        return min(100.0, max(0.0, score))

    async def _calculate_support_score(
        self, 
        user_id: int, 
        reference_date: Optional[datetime] = None
    ) -> float:
        """Calculate support interaction score."""
        
        if not reference_date:
            reference_date = datetime.utcnow()
        
        start_date = reference_date - timedelta(days=90)
        
        # For now, assume no support tickets means good health
        # In a real implementation, you'd query support ticket data
        
        # Placeholder scoring - high score if no recent support issues
        return 85.0

    async def _get_key_metrics(self, user_id: int) -> Dict[str, Any]:
        """Get key metrics for customer health assessment."""
        
        # Days since last login
        last_login_query = text("""
            SELECT MAX(timestamp) as last_login
            FROM events
            WHERE user_id = :user_id
            AND event_name = 'user_login'
        """)
        
        result = await self.db.execute(last_login_query, {"user_id": user_id})
        last_login = result.scalar()
        
        days_since_last_login = (
            (datetime.utcnow() - last_login).days if last_login else 999
        )
        
        # API calls in last 30 days
        api_calls_query = text("""
            SELECT COALESCE(SUM(quantity), 0) as api_calls
            FROM usage_records
            WHERE user_id = :user_id
            AND metric_type = 'api_calls'
            AND period_start >= :start_date
        """)
        
        start_date = datetime.utcnow() - timedelta(days=30)
        result = await self.db.execute(api_calls_query, {
            "user_id": user_id,
            "start_date": start_date
        })
        api_calls_last_30_days = int(result.scalar() or 0)
        
        # Payment issues count
        payment_issues_query = text("""
            SELECT COUNT(*) as issues
            FROM payments
            WHERE user_id = :user_id
            AND status = 'failed'
            AND created_at >= :start_date
        """)
        
        result = await self.db.execute(payment_issues_query, {
            "user_id": user_id,
            "start_date": start_date
        })
        payment_issues_count = int(result.scalar() or 0)
        
        return {
            "days_since_last_login": days_since_last_login,
            "api_calls_last_30_days": api_calls_last_30_days,
            "payment_issues_count": payment_issues_count,
            "support_tickets_count": 0,  # Placeholder
            "last_activity_at": last_login
        }

    async def _calculate_churn_probability(self, user_id: int, overall_score: float) -> float:
        """Calculate probability of customer churning."""
        
        # Simple model based on health score and other factors
        base_probability = max(0, (100 - overall_score) / 100)
        
        # Adjust based on customer tenure
        customer_data = await self._get_customer_data(user_id)
        if customer_data and customer_data["subscription_created_at"]:
            days_subscribed = (datetime.utcnow() - customer_data["subscription_created_at"]).days
            tenure_factor = min(1.0, days_subscribed / 365)  # Normalize to 1 year
            base_probability *= (1 - tenure_factor * 0.3)  # Reduce churn risk for longer tenures
        
        return min(1.0, max(0.0, base_probability))

    async def _predict_action_date(
        self, 
        user_id: int, 
        churn_probability: float
    ) -> Optional[datetime]:
        """Predict when customer might take action (churn or upgrade)."""
        
        if churn_probability < 0.3:
            return None  # Low risk, no predicted action
        
        # Simple prediction based on churn probability
        days_until_action = int((1 - churn_probability) * 90)  # 0-90 days
        
        return datetime.utcnow() + timedelta(days=days_until_action)

    def _determine_health_status(self, overall_score: float) -> HealthStatus:
        """Determine health status from overall score."""
        
        if overall_score >= 90:
            return HealthStatus.EXCELLENT
        elif overall_score >= 75:
            return HealthStatus.GOOD
        elif overall_score >= 60:
            return HealthStatus.FAIR
        elif overall_score >= 40:
            return HealthStatus.POOR
        else:
            return HealthStatus.CRITICAL

    def _determine_risk_level(self, overall_score: float, customer_data: Dict[str, Any]) -> RiskLevel:
        """Determine churn risk level."""
        
        if overall_score >= 80:
            return RiskLevel.LOW
        elif overall_score >= 60:
            return RiskLevel.MEDIUM
        elif overall_score >= 40:
            return RiskLevel.HIGH
        else:
            return RiskLevel.CRITICAL

    def _generate_recommendations(
        self,
        overall_score: float,
        usage_score: float,
        engagement_score: float,
        payment_score: float,
        support_score: float,
        metrics: Dict[str, Any]
    ) -> List[str]:
        """Generate actionable recommendations based on health scores."""
        
        recommendations = []
        
        # Usage-based recommendations
        if usage_score < 50:
            recommendations.append("Provide onboarding assistance to increase feature adoption")
            recommendations.append("Share relevant tutorials and best practices")
        
        # Engagement-based recommendations
        if engagement_score < 50:
            if metrics["days_since_last_login"] > 7:
                recommendations.append("Send re-engagement email campaign")
            recommendations.append("Offer personalized product demo or training")
        
        # Payment-based recommendations
        if payment_score < 70:
            if metrics["payment_issues_count"] > 0:
                recommendations.append("Proactively reach out about payment issues")
                recommendations.append("Offer payment method update assistance")
        
        # Overall health recommendations
        if overall_score < 60:
            recommendations.append("Schedule customer success check-in call")
            recommendations.append("Consider offering limited-time upgrade incentive")
        
        if overall_score < 40:
            recommendations.append("URGENT: Immediate intervention required")
            recommendations.append("Assign dedicated customer success manager")
        
        return recommendations

    async def _get_active_customers(self, limit: int) -> List[int]:
        """Get list of active customer user IDs."""
        
        query = text("""
            SELECT DISTINCT user_id
            FROM user_subscriptions
            WHERE status = 'active'
            ORDER BY created_at DESC
            LIMIT :limit
        """)
        
        result = await self.db.execute(query, {"limit": limit})
        return [row.user_id for row in result.fetchall()]

    async def _get_usage_baselines(self) -> Dict[str, float]:
        """Get usage baselines for scoring calculations."""
        
        query = text("""
            SELECT 
                metric_type,
                AVG(quantity) as avg_usage,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY quantity) as median_usage
            FROM usage_records
            WHERE period_start >= :start_date
            GROUP BY metric_type
        """)
        
        start_date = datetime.utcnow() - timedelta(days=90)
        result = await self.db.execute(query, {"start_date": start_date})
        
        return {row.metric_type: float(row.median_usage or 0) for row in result.fetchall()}

    async def _calculate_login_frequency(self, user_id: int) -> float:
        """Calculate login frequency (logins per week)."""
        
        query = text("""
            SELECT COUNT(*) as login_count
            FROM events
            WHERE user_id = :user_id
            AND event_name = 'user_login'
            AND timestamp >= :start_date
        """)
        
        start_date = datetime.utcnow() - timedelta(days=30)
        result = await self.db.execute(query, {
            "user_id": user_id,
            "start_date": start_date
        })
        
        login_count = result.scalar() or 0
        return login_count / 4.0  # Convert to weekly average

    async def _calculate_feature_adoption(self, user_id: int) -> float:
        """Calculate feature adoption rate."""
        
        # Count unique features/events used
        query = text("""
            SELECT COUNT(DISTINCT event_name) as unique_features
            FROM events
            WHERE user_id = :user_id
            AND timestamp >= :start_date
            AND event_type = 'interaction'
        """)
        
        start_date = datetime.utcnow() - timedelta(days=30)
        result = await self.db.execute(query, {
            "user_id": user_id,
            "start_date": start_date
        })
        
        unique_features = result.scalar() or 0
        
        # Assume 20 total features available
        total_features = 20
        return min(100.0, (unique_features / total_features) * 100)

    async def _calculate_api_usage_trend(self, user_id: int) -> float:
        """Calculate API usage trend (growth rate)."""
        
        # Compare recent 2 weeks vs previous 2 weeks
        current_start = datetime.utcnow() - timedelta(days=14)
        previous_start = datetime.utcnow() - timedelta(days=28)
        previous_end = datetime.utcnow() - timedelta(days=14)
        
        current_usage_query = text("""
            SELECT COALESCE(SUM(quantity), 0) as usage
            FROM usage_records
            WHERE user_id = :user_id
            AND metric_type = 'api_calls'
            AND period_start >= :start_date
        """)
        
        current_result = await self.db.execute(current_usage_query, {
            "user_id": user_id,
            "start_date": current_start
        })
        current_usage = float(current_result.scalar() or 0)
        
        previous_result = await self.db.execute(text("""
            SELECT COALESCE(SUM(quantity), 0) as usage
            FROM usage_records
            WHERE user_id = :user_id
            AND metric_type = 'api_calls'
            AND period_start >= :start_date
            AND period_end <= :end_date
        """), {
            "user_id": user_id,
            "start_date": previous_start,
            "end_date": previous_end
        })
        previous_usage = float(previous_result.scalar() or 0)
        
        if previous_usage == 0:
            return 0.0 if current_usage == 0 else 100.0
        
        growth_rate = ((current_usage - previous_usage) / previous_usage) * 100
        return growth_rate

    async def _calculate_avg_session_duration(self, user_id: int) -> float:
        """Calculate average session duration in minutes."""
        
        # Placeholder - would need session tracking
        return 15.0  # Default 15 minutes

    async def _calculate_page_views_per_session(self, user_id: int) -> float:
        """Calculate average page views per session."""
        
        # Placeholder - would need session tracking
        return 5.0  # Default 5 pages per session

    async def _calculate_time_to_value(self, user_id: int) -> Optional[float]:
        """Calculate time to first meaningful action in days."""
        
        customer_data = await self._get_customer_data(user_id)
        if not customer_data or not customer_data["subscription_created_at"]:
            return None
        
        # Find first business event after subscription
        query = text("""
            SELECT MIN(timestamp) as first_value_event
            FROM events
            WHERE user_id = :user_id
            AND event_type = 'business'
            AND timestamp >= :subscription_start
        """)
        
        result = await self.db.execute(query, {
            "user_id": user_id,
            "subscription_start": customer_data["subscription_created_at"]
        })
        
        first_value_event = result.scalar()
        if not first_value_event:
            return None
        
        time_diff = first_value_event - customer_data["subscription_created_at"]
        return time_diff.total_seconds() / (24 * 3600)  # Convert to days

    async def _get_usage_metrics(
        self,
        user_id: int,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, List[float]]:
        """Get usage metrics for pattern analysis."""
        
        query = text("""
            SELECT 
                metric_type,
                quantity,
                period_start
            FROM usage_records
            WHERE user_id = :user_id
            AND period_start >= :start_date
            AND period_end <= :end_date
            ORDER BY metric_type, period_start
        """)
        
        result = await self.db.execute(query, {
            "user_id": user_id,
            "start_date": start_date,
            "end_date": end_date
        })
        
        metrics = defaultdict(list)
        for row in result.fetchall():
            metrics[row.metric_type].append(float(row.quantity))
        
        return dict(metrics)

    async def _analyze_metric_pattern(
        self,
        user_id: int,
        metric_type: str,
        values: List[float]
    ) -> UsagePattern:
        """Analyze usage pattern for a specific metric."""
        
        if not values:
            return UsagePattern(
                metric_type=metric_type,
                current_usage=0.0,
                average_usage=0.0,
                trend_direction="stable",
                usage_percentile=0.0,
                seasonal_adjustment=1.0
            )
        
        current_usage = values[-1] if values else 0.0
        average_usage = sum(values) / len(values) if values else 0.0
        
        # Determine trend
        if len(values) >= 2:
            recent_avg = sum(values[-3:]) / min(3, len(values))
            earlier_avg = sum(values[:3]) / min(3, len(values))
            
            if recent_avg > earlier_avg * 1.1:
                trend_direction = "increasing"
            elif recent_avg < earlier_avg * 0.9:
                trend_direction = "decreasing"
            else:
                trend_direction = "stable"
        else:
            trend_direction = "stable"
        
        # Calculate percentile compared to all users
        usage_percentile = await self._calculate_usage_percentile(metric_type, current_usage)
        
        return UsagePattern(
            metric_type=metric_type,
            current_usage=current_usage,
            average_usage=average_usage,
            trend_direction=trend_direction,
            usage_percentile=usage_percentile,
            seasonal_adjustment=1.0  # Placeholder
        )

    async def _calculate_usage_percentile(self, metric_type: str, usage_value: float) -> float:
        """Calculate usage percentile compared to all users."""
        
        query = text("""
            SELECT 
                COUNT(*) FILTER (WHERE quantity <= :usage_value) * 100.0 / COUNT(*) as percentile
            FROM usage_records
            WHERE metric_type = :metric_type
            AND period_start >= :start_date
        """)
        
        start_date = datetime.utcnow() - timedelta(days=30)
        result = await self.db.execute(query, {
            "metric_type": metric_type,
            "usage_value": usage_value,
            "start_date": start_date
        })
        
        return float(result.scalar() or 50.0)  # Default to 50th percentile