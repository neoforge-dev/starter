"""
Revenue Analytics Service for NeoForge Growth Intelligence.

Provides comprehensive revenue tracking, MRR/ARR calculation, Customer Lifetime Value (CLV),
churn analysis, and revenue cohort insights for data-driven business optimization.
"""

import logging
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from collections import defaultdict

from sqlalchemy import text, func, and_, or_
from sqlalchemy.orm import Session

from app.models.subscription import (
    UserSubscription, 
    Payment, 
    SubscriptionPlan, 
    UsageRecord,
    SubscriptionEvent
)
from app.models.user import User
from app.crud.base import CRUDBase

logger = logging.getLogger(__name__)


@dataclass
class RevenueMetrics:
    """Container for key revenue metrics."""
    mrr: float
    arr: float
    month_over_month_growth: float
    year_over_year_growth: float
    churn_rate: float
    net_revenue_retention: float
    avg_revenue_per_user: float
    customer_count: int
    total_revenue: float


@dataclass
class CustomerLifetimeValue:
    """Customer Lifetime Value metrics."""
    clv: float
    avg_monthly_revenue: float
    avg_lifespan_months: float
    acquisition_cost: Optional[float] = None
    clv_to_cac_ratio: Optional[float] = None


@dataclass
class ChurnAnalysis:
    """Churn analysis results."""
    churn_rate: float
    churned_customers: int
    churned_revenue: float
    at_risk_customers: List[int]
    churn_by_plan: Dict[str, float]
    cohort_retention: Dict[str, float]


@dataclass
class RevenueCohort:
    """Revenue cohort analysis data."""
    cohort_month: str
    customer_count: int
    revenue_by_month: Dict[str, float]
    retention_by_month: Dict[str, float]
    cumulative_revenue: float
    avg_revenue_per_customer: float


class RevenueAnalyticsService:
    """Service for comprehensive revenue analytics and business intelligence."""

    def __init__(self, db: Session):
        self.db = db
        self.subscription_crud = CRUDBase(UserSubscription)
        self.payment_crud = CRUDBase(Payment)
        self.plan_crud = CRUDBase(SubscriptionPlan)
        self.usage_crud = CRUDBase(UsageRecord)

    async def get_revenue_metrics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> RevenueMetrics:
        """Calculate comprehensive revenue metrics for a given period."""
        
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date.replace(day=1) - timedelta(days=1)
            start_date = start_date.replace(day=1)

        # Calculate MRR (Monthly Recurring Revenue)
        mrr = await self._calculate_mrr(end_date)
        
        # Calculate ARR (Annual Recurring Revenue)
        arr = mrr * 12
        
        # Calculate growth rates
        previous_month = start_date - timedelta(days=1)
        previous_month = previous_month.replace(day=1)
        previous_mrr = await self._calculate_mrr(previous_month)
        month_over_month_growth = ((mrr - previous_mrr) / previous_mrr * 100) if previous_mrr > 0 else 0

        previous_year = end_date.replace(year=end_date.year - 1)
        previous_year_mrr = await self._calculate_mrr(previous_year)
        year_over_year_growth = ((mrr - previous_year_mrr) / previous_year_mrr * 100) if previous_year_mrr > 0 else 0

        # Calculate churn rate
        churn_rate = await self._calculate_churn_rate(start_date, end_date)
        
        # Calculate Net Revenue Retention
        net_revenue_retention = await self._calculate_net_revenue_retention(start_date, end_date)
        
        # Calculate customer metrics
        customer_count = await self._get_active_customer_count(end_date)
        avg_revenue_per_user = mrr / customer_count if customer_count > 0 else 0
        
        # Calculate total revenue for period
        total_revenue = await self._calculate_period_revenue(start_date, end_date)

        return RevenueMetrics(
            mrr=mrr,
            arr=arr,
            month_over_month_growth=month_over_month_growth,
            year_over_year_growth=year_over_year_growth,
            churn_rate=churn_rate,
            net_revenue_retention=net_revenue_retention,
            avg_revenue_per_user=avg_revenue_per_user,
            customer_count=customer_count,
            total_revenue=total_revenue
        )

    async def calculate_customer_lifetime_value(
        self,
        user_id: Optional[int] = None,
        plan_id: Optional[int] = None,
        cohort_month: Optional[str] = None
    ) -> CustomerLifetimeValue:
        """Calculate Customer Lifetime Value (CLV) for specific segments."""
        
        # Build filters for customer segmentation
        filters = {}
        if user_id:
            filters["user_id"] = user_id
        if plan_id:
            filters["plan_id"] = plan_id
            
        # Get subscription data
        subscriptions = await self._get_subscription_data(filters, cohort_month)
        
        if not subscriptions:
            return CustomerLifetimeValue(clv=0, avg_monthly_revenue=0, avg_lifespan_months=0)

        # Calculate average monthly revenue per customer
        total_revenue = sum(sub["monthly_revenue"] for sub in subscriptions)
        avg_monthly_revenue = total_revenue / len(subscriptions)

        # Calculate average customer lifespan
        total_lifespan = sum(sub["lifespan_months"] for sub in subscriptions)
        avg_lifespan_months = total_lifespan / len(subscriptions)

        # Calculate CLV = Average Monthly Revenue × Average Lifespan
        clv = avg_monthly_revenue * avg_lifespan_months

        return CustomerLifetimeValue(
            clv=clv,
            avg_monthly_revenue=avg_monthly_revenue,
            avg_lifespan_months=avg_lifespan_months
        )

    async def analyze_churn(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> ChurnAnalysis:
        """Perform comprehensive churn analysis."""
        
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date.replace(day=1) - timedelta(days=30)

        # Calculate overall churn rate
        churn_rate = await self._calculate_churn_rate(start_date, end_date)
        
        # Get churned customers and revenue
        churned_data = await self._get_churned_customers(start_date, end_date)
        churned_customers = len(churned_data["customers"])
        churned_revenue = churned_data["revenue"]
        
        # Identify at-risk customers
        at_risk_customers = await self._identify_at_risk_customers()
        
        # Calculate churn by plan
        churn_by_plan = await self._calculate_churn_by_plan(start_date, end_date)
        
        # Calculate cohort retention
        cohort_retention = await self._calculate_cohort_retention()

        return ChurnAnalysis(
            churn_rate=churn_rate,
            churned_customers=churned_customers,
            churned_revenue=churned_revenue,
            at_risk_customers=at_risk_customers,
            churn_by_plan=churn_by_plan,
            cohort_retention=cohort_retention
        )

    async def generate_revenue_cohorts(
        self,
        months_back: int = 12
    ) -> List[RevenueCohort]:
        """Generate revenue cohort analysis for customer segments."""
        
        cohorts = []
        end_date = datetime.utcnow()
        
        for i in range(months_back):
            cohort_date = end_date - timedelta(days=30 * i)
            cohort_month = cohort_date.strftime("%Y-%m")
            
            # Get customers who started in this cohort month
            cohort_customers = await self._get_cohort_customers(cohort_date)
            
            if not cohort_customers:
                continue
                
            # Calculate revenue and retention for each subsequent month
            revenue_by_month = {}
            retention_by_month = {}
            
            for month in range(12):  # Track for 12 months
                month_date = cohort_date + timedelta(days=30 * month)
                month_key = month_date.strftime("%Y-%m")
                
                active_customers, revenue = await self._get_cohort_month_data(
                    cohort_customers, month_date
                )
                
                revenue_by_month[month_key] = revenue
                retention_by_month[month_key] = (
                    len(active_customers) / len(cohort_customers) * 100
                    if cohort_customers else 0
                )
            
            cumulative_revenue = sum(revenue_by_month.values())
            avg_revenue_per_customer = cumulative_revenue / len(cohort_customers)
            
            cohorts.append(RevenueCohort(
                cohort_month=cohort_month,
                customer_count=len(cohort_customers),
                revenue_by_month=revenue_by_month,
                retention_by_month=retention_by_month,
                cumulative_revenue=cumulative_revenue,
                avg_revenue_per_customer=avg_revenue_per_customer
            ))
        
        return sorted(cohorts, key=lambda x: x.cohort_month, reverse=True)

    async def forecast_revenue(
        self,
        months_ahead: int = 12,
        growth_rate: Optional[float] = None
    ) -> Dict[str, float]:
        """Forecast future revenue based on current trends."""
        
        current_mrr = await self._calculate_mrr()
        
        # Calculate growth rate from historical data if not provided
        if growth_rate is None:
            growth_rate = await self._calculate_historical_growth_rate()
        
        # Generate forecasts
        forecasts = {}
        current_date = datetime.utcnow()
        
        for month in range(1, months_ahead + 1):
            future_date = current_date + timedelta(days=30 * month)
            month_key = future_date.strftime("%Y-%m")
            
            # Apply compound growth
            forecasted_mrr = current_mrr * ((1 + growth_rate / 100) ** month)
            forecasts[month_key] = forecasted_mrr
        
        return forecasts

    # Private helper methods

    async def _calculate_mrr(self, date: Optional[datetime] = None) -> float:
        """Calculate Monthly Recurring Revenue for a specific date."""
        
        if not date:
            date = datetime.utcnow()
        
        # Get active subscriptions at the specified date
        query = text("""
            SELECT s.billing_cycle, p.price_monthly, p.price_yearly, COUNT(*) as count
            FROM user_subscriptions s
            JOIN subscription_plans p ON s.plan_id = p.id
            WHERE s.status = 'active'
            AND s.created_at <= :date
            AND (s.canceled_at IS NULL OR s.canceled_at > :date)
            GROUP BY s.billing_cycle, p.price_monthly, p.price_yearly
        """)
        
        result = await self.db.execute(query, {"date": date})
        rows = result.fetchall()
        
        total_mrr = 0
        for row in rows:
            if row.billing_cycle == "yearly":
                monthly_revenue = row.price_yearly / 12
            else:
                monthly_revenue = row.price_monthly
            
            total_mrr += monthly_revenue * row.count
        
        return float(total_mrr)

    async def _calculate_churn_rate(
        self, 
        start_date: datetime, 
        end_date: datetime
    ) -> float:
        """Calculate churn rate for a specific period."""
        
        # Get customers at the start of the period
        start_customers_query = text("""
            SELECT COUNT(DISTINCT user_id) as count
            FROM user_subscriptions
            WHERE status = 'active'
            AND created_at <= :start_date
            AND (canceled_at IS NULL OR canceled_at > :start_date)
        """)
        
        start_result = await self.db.execute(start_customers_query, {"start_date": start_date})
        start_customers = start_result.scalar() or 0
        
        # Get customers who churned during the period
        churned_query = text("""
            SELECT COUNT(DISTINCT user_id) as count
            FROM user_subscriptions
            WHERE status IN ('canceled', 'past_due')
            AND canceled_at BETWEEN :start_date AND :end_date
        """)
        
        churned_result = await self.db.execute(churned_query, {
            "start_date": start_date,
            "end_date": end_date
        })
        churned_customers = churned_result.scalar() or 0
        
        return (churned_customers / start_customers * 100) if start_customers > 0 else 0

    async def _calculate_net_revenue_retention(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> float:
        """Calculate Net Revenue Retention (NRR)."""
        
        # Get revenue from existing customers at start of period
        start_revenue_query = text("""
            SELECT COALESCE(SUM(
                CASE 
                    WHEN s.billing_cycle = 'yearly' THEN p.price_yearly / 12
                    ELSE p.price_monthly
                END
            ), 0) as revenue
            FROM user_subscriptions s
            JOIN subscription_plans p ON s.plan_id = p.id
            WHERE s.status = 'active'
            AND s.created_at <= :start_date
            AND (s.canceled_at IS NULL OR s.canceled_at > :start_date)
        """)
        
        start_result = await self.db.execute(start_revenue_query, {"start_date": start_date})
        start_revenue = float(start_result.scalar() or 0)
        
        # Get revenue from the same customers at end of period
        end_revenue_query = text("""
            SELECT COALESCE(SUM(
                CASE 
                    WHEN s.billing_cycle = 'yearly' THEN p.price_yearly / 12
                    ELSE p.price_monthly
                END
            ), 0) as revenue
            FROM user_subscriptions s
            JOIN subscription_plans p ON s.plan_id = p.id
            WHERE s.status = 'active'
            AND s.created_at <= :start_date
            AND s.user_id IN (
                SELECT DISTINCT user_id 
                FROM user_subscriptions 
                WHERE created_at <= :start_date
                AND (canceled_at IS NULL OR canceled_at > :start_date)
            )
        """)
        
        end_result = await self.db.execute(end_revenue_query, {"start_date": start_date})
        end_revenue = float(end_result.scalar() or 0)
        
        return (end_revenue / start_revenue * 100) if start_revenue > 0 else 0

    async def _get_active_customer_count(self, date: Optional[datetime] = None) -> int:
        """Get count of active customers at a specific date."""
        
        if not date:
            date = datetime.utcnow()
        
        query = text("""
            SELECT COUNT(DISTINCT user_id) as count
            FROM user_subscriptions
            WHERE status = 'active'
            AND created_at <= :date
            AND (canceled_at IS NULL OR canceled_at > :date)
        """)
        
        result = await self.db.execute(query, {"date": date})
        return result.scalar() or 0

    async def _calculate_period_revenue(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> float:
        """Calculate total revenue for a specific period."""
        
        query = text("""
            SELECT COALESCE(SUM(amount), 0) as total
            FROM payments
            WHERE status = 'succeeded'
            AND processed_at BETWEEN :start_date AND :end_date
        """)
        
        result = await self.db.execute(query, {
            "start_date": start_date,
            "end_date": end_date
        })
        
        return float(result.scalar() or 0)

    async def _get_subscription_data(
        self,
        filters: Dict[str, Any],
        cohort_month: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get subscription data for CLV calculation."""
        
        base_query = """
            SELECT 
                s.user_id,
                s.created_at,
                s.canceled_at,
                CASE 
                    WHEN s.billing_cycle = 'yearly' THEN p.price_yearly / 12
                    ELSE p.price_monthly
                END as monthly_revenue,
                CASE 
                    WHEN s.canceled_at IS NOT NULL THEN 
                        EXTRACT(EPOCH FROM (s.canceled_at - s.created_at)) / (30.44 * 24 * 3600)
                    ELSE 
                        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - s.created_at)) / (30.44 * 24 * 3600)
                END as lifespan_months
            FROM user_subscriptions s
            JOIN subscription_plans p ON s.plan_id = p.id
            WHERE 1=1
        """
        
        query_params = {}
        
        # Add filters
        if "user_id" in filters:
            base_query += " AND s.user_id = :user_id"
            query_params["user_id"] = filters["user_id"]
            
        if "plan_id" in filters:
            base_query += " AND s.plan_id = :plan_id"
            query_params["plan_id"] = filters["plan_id"]
            
        if cohort_month:
            base_query += " AND DATE_TRUNC('month', s.created_at) = :cohort_month"
            query_params["cohort_month"] = datetime.strptime(cohort_month, "%Y-%m")
        
        result = await self.db.execute(text(base_query), query_params)
        rows = result.fetchall()
        
        return [
            {
                "user_id": row.user_id,
                "monthly_revenue": float(row.monthly_revenue),
                "lifespan_months": max(1, float(row.lifespan_months))  # Minimum 1 month
            }
            for row in rows
        ]

    async def _get_churned_customers(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Get churned customers and revenue for a period."""
        
        query = text("""
            SELECT 
                s.user_id,
                CASE 
                    WHEN s.billing_cycle = 'yearly' THEN p.price_yearly / 12
                    ELSE p.price_monthly
                END as monthly_revenue
            FROM user_subscriptions s
            JOIN subscription_plans p ON s.plan_id = p.id
            WHERE s.status IN ('canceled', 'past_due')
            AND s.canceled_at BETWEEN :start_date AND :end_date
        """)
        
        result = await self.db.execute(query, {
            "start_date": start_date,
            "end_date": end_date
        })
        rows = result.fetchall()
        
        customers = [row.user_id for row in rows]
        revenue = sum(float(row.monthly_revenue) for row in rows)
        
        return {"customers": customers, "revenue": revenue}

    async def _identify_at_risk_customers(self) -> List[int]:
        """Identify customers at risk of churning based on usage patterns."""
        
        # Look for customers with declining usage or payment issues
        query = text("""
            SELECT DISTINCT s.user_id
            FROM user_subscriptions s
            WHERE s.status = 'active'
            AND (
                -- Payment issues
                EXISTS (
                    SELECT 1 FROM payments p 
                    WHERE p.subscription_id = s.id 
                    AND p.status = 'failed'
                    AND p.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
                )
                -- Or low usage (if usage tracking is available)
                OR s.user_id IN (
                    SELECT u.user_id 
                    FROM usage_records u 
                    WHERE u.subscription_id = s.id
                    AND u.period_start > CURRENT_TIMESTAMP - INTERVAL '30 days'
                    GROUP BY u.user_id
                    HAVING AVG(u.quantity) < (
                        SELECT AVG(quantity) * 0.5 
                        FROM usage_records 
                        WHERE metric_type = u.metric_type
                    )
                )
            )
        """)
        
        result = await self.db.execute(query)
        return [row.user_id for row in result.fetchall()]

    async def _calculate_churn_by_plan(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, float]:
        """Calculate churn rate by subscription plan."""
        
        query = text("""
            SELECT 
                p.name as plan_name,
                COUNT(*) FILTER (WHERE s.canceled_at BETWEEN :start_date AND :end_date) as churned,
                COUNT(*) as total
            FROM user_subscriptions s
            JOIN subscription_plans p ON s.plan_id = p.id
            WHERE s.created_at <= :start_date
            GROUP BY p.name
        """)
        
        result = await self.db.execute(query, {
            "start_date": start_date,
            "end_date": end_date
        })
        
        churn_by_plan = {}
        for row in result.fetchall():
            churn_rate = (row.churned / row.total * 100) if row.total > 0 else 0
            churn_by_plan[row.plan_name] = churn_rate
        
        return churn_by_plan

    async def _calculate_cohort_retention(self) -> Dict[str, float]:
        """Calculate retention rates by customer cohort."""
        
        query = text("""
            SELECT 
                DATE_TRUNC('month', s.created_at) as cohort_month,
                COUNT(*) as total_customers,
                COUNT(*) FILTER (WHERE s.status = 'active') as active_customers
            FROM user_subscriptions s
            WHERE s.created_at >= CURRENT_TIMESTAMP - INTERVAL '12 months'
            GROUP BY DATE_TRUNC('month', s.created_at)
            ORDER BY cohort_month
        """)
        
        result = await self.db.execute(query)
        
        retention_by_cohort = {}
        for row in result.fetchall():
            cohort_key = row.cohort_month.strftime("%Y-%m")
            retention_rate = (row.active_customers / row.total_customers * 100) if row.total_customers > 0 else 0
            retention_by_cohort[cohort_key] = retention_rate
        
        return retention_by_cohort

    async def _get_cohort_customers(self, cohort_date: datetime) -> List[int]:
        """Get customer IDs for a specific cohort month."""
        
        start_of_month = cohort_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_of_month = (start_of_month + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
        
        query = text("""
            SELECT DISTINCT user_id
            FROM user_subscriptions
            WHERE created_at BETWEEN :start_date AND :end_date
        """)
        
        result = await self.db.execute(query, {
            "start_date": start_of_month,
            "end_date": end_of_month
        })
        
        return [row.user_id for row in result.fetchall()]

    async def _get_cohort_month_data(
        self,
        cohort_customers: List[int],
        month_date: datetime
    ) -> Tuple[List[int], float]:
        """Get active customers and revenue for a cohort in a specific month."""
        
        if not cohort_customers:
            return [], 0.0
        
        query = text("""
            SELECT 
                s.user_id,
                CASE 
                    WHEN s.billing_cycle = 'yearly' THEN p.price_yearly / 12
                    ELSE p.price_monthly
                END as monthly_revenue
            FROM user_subscriptions s
            JOIN subscription_plans p ON s.plan_id = p.id
            WHERE s.user_id = ANY(:customer_ids)
            AND s.status = 'active'
            AND s.created_at <= :month_date
            AND (s.canceled_at IS NULL OR s.canceled_at > :month_date)
        """)
        
        result = await self.db.execute(query, {
            "customer_ids": cohort_customers,
            "month_date": month_date
        })
        
        rows = result.fetchall()
        active_customers = [row.user_id for row in rows]
        total_revenue = sum(float(row.monthly_revenue) for row in rows)
        
        return active_customers, total_revenue

    async def _calculate_historical_growth_rate(self, months_back: int = 6) -> float:
        """Calculate historical MRR growth rate for forecasting."""
        
        growth_rates = []
        current_date = datetime.utcnow()
        
        for i in range(1, months_back + 1):
            current_month = current_date - timedelta(days=30 * (i - 1))
            previous_month = current_date - timedelta(days=30 * i)
            
            current_mrr = await self._calculate_mrr(current_month)
            previous_mrr = await self._calculate_mrr(previous_month)
            
            if previous_mrr > 0:
                growth_rate = (current_mrr - previous_mrr) / previous_mrr * 100
                growth_rates.append(growth_rate)
        
        # Return average growth rate
        return sum(growth_rates) / len(growth_rates) if growth_rates else 0