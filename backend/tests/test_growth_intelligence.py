"""
Comprehensive tests for Growth Intelligence services.

Tests revenue analytics, customer health scoring, and growth automation functionality.
"""

import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

from sqlalchemy.orm import Session

from app.services.revenue_analytics import (
    RevenueAnalyticsService, 
    RevenueMetrics, 
    CustomerLifetimeValue,
    ChurnAnalysis,
    RevenueCohort
)
from app.services.customer_health import (
    CustomerHealthService, 
    CustomerHealthScore, 
    HealthStatus, 
    RiskLevel,
    EngagementMetrics,
    UsagePattern
)
from app.services.growth_automation import (
    GrowthAutomationService,
    UpgradeRecommendation,
    RetentionInsight,
    CampaignType,
    CampaignStatus
)


class TestRevenueAnalyticsService:
    """Test suite for Revenue Analytics Service."""

    @pytest.fixture
    def revenue_service(self, db_session):
        """Create revenue analytics service instance."""
        return RevenueAnalyticsService(db_session)

    @pytest.fixture
    def mock_db_execute(self):
        """Mock database execute method."""
        with patch('app.services.revenue_analytics.text') as mock_text:
            mock_result = MagicMock()
            mock_result.fetchall.return_value = []
            mock_result.scalar.return_value = 0
            mock_result.fetchone.return_value = None
            
            mock_execute = AsyncMock(return_value=mock_result)
            yield mock_execute, mock_result

    @pytest.mark.asyncio
    async def test_calculate_mrr_basic(self, revenue_service, mock_db_execute):
        """Test basic MRR calculation."""
        mock_execute, mock_result = mock_db_execute
        
        # Mock subscription data
        mock_result.fetchall.return_value = [
            MagicMock(billing_cycle="monthly", price_monthly=99.0, price_yearly=990.0, count=10),
            MagicMock(billing_cycle="yearly", price_monthly=199.0, price_yearly=1990.0, count=5)
        ]
        
        revenue_service.db.execute = mock_execute
        
        mrr = await revenue_service._calculate_mrr()
        
        # Monthly: 10 * 99 = 990, Yearly: 5 * (1990/12) = 829.17
        expected_mrr = 990.0 + (5 * 1990.0 / 12)
        assert abs(mrr - expected_mrr) < 0.01

    @pytest.mark.asyncio
    async def test_get_revenue_metrics_comprehensive(self, revenue_service, mock_db_execute):
        """Test comprehensive revenue metrics calculation."""
        mock_execute, mock_result = mock_db_execute
        revenue_service.db.execute = mock_execute
        
        # Mock MRR calculation
        with patch.object(revenue_service, '_calculate_mrr') as mock_mrr:
            mock_mrr.side_effect = [5000.0, 4800.0, 4600.0]  # Current, previous month, previous year
            
            with patch.object(revenue_service, '_calculate_churn_rate') as mock_churn:
                mock_churn.return_value = 5.5
                
                with patch.object(revenue_service, '_calculate_net_revenue_retention') as mock_nrr:
                    mock_nrr.return_value = 105.0
                    
                    with patch.object(revenue_service, '_get_active_customer_count') as mock_customers:
                        mock_customers.return_value = 100
                        
                        with patch.object(revenue_service, '_calculate_period_revenue') as mock_revenue:
                            mock_revenue.return_value = 15000.0
                            
                            metrics = await revenue_service.get_revenue_metrics()
                            
                            assert isinstance(metrics, RevenueMetrics)
                            assert metrics.mrr == 5000.0
                            assert metrics.arr == 60000.0  # MRR * 12
                            assert metrics.churn_rate == 5.5
                            assert metrics.customer_count == 100
                            assert metrics.avg_revenue_per_user == 50.0  # MRR / customers

    @pytest.mark.asyncio
    async def test_calculate_customer_lifetime_value(self, revenue_service, mock_db_execute):
        """Test CLV calculation."""
        mock_execute, mock_result = mock_db_execute
        revenue_service.db.execute = mock_execute
        
        # Mock subscription data for CLV calculation
        with patch.object(revenue_service, '_get_subscription_data') as mock_data:
            mock_data.return_value = [
                {"user_id": 1, "monthly_revenue": 100.0, "lifespan_months": 12.0},
                {"user_id": 2, "monthly_revenue": 150.0, "lifespan_months": 18.0},
                {"user_id": 3, "monthly_revenue": 200.0, "lifespan_months": 24.0}
            ]
            
            clv = await revenue_service.calculate_customer_lifetime_value()
            
            assert isinstance(clv, CustomerLifetimeValue)
            assert clv.avg_monthly_revenue == 150.0  # (100 + 150 + 200) / 3
            assert clv.avg_lifespan_months == 18.0   # (12 + 18 + 24) / 3
            assert clv.clv == 2700.0  # 150 * 18

    @pytest.mark.asyncio
    async def test_analyze_churn(self, revenue_service, mock_db_execute):
        """Test churn analysis functionality."""
        mock_execute, mock_result = mock_db_execute
        revenue_service.db.execute = mock_execute
        
        with patch.object(revenue_service, '_calculate_churn_rate') as mock_churn_rate:
            mock_churn_rate.return_value = 7.5
            
            with patch.object(revenue_service, '_get_churned_customers') as mock_churned:
                mock_churned.return_value = {"customers": [1, 2, 3], "revenue": 450.0}
                
                with patch.object(revenue_service, '_identify_at_risk_customers') as mock_at_risk:
                    mock_at_risk.return_value = [4, 5, 6, 7]
                    
                    with patch.object(revenue_service, '_calculate_churn_by_plan') as mock_plan_churn:
                        mock_plan_churn.return_value = {"Basic": 10.0, "Pro": 5.0, "Enterprise": 2.0}
                        
                        with patch.object(revenue_service, '_calculate_cohort_retention') as mock_cohort:
                            mock_cohort.return_value = {"2024-01": 85.0, "2024-02": 80.0}
                            
                            analysis = await revenue_service.analyze_churn()
                            
                            assert isinstance(analysis, ChurnAnalysis)
                            assert analysis.churn_rate == 7.5
                            assert analysis.churned_customers == 3
                            assert analysis.churned_revenue == 450.0
                            assert len(analysis.at_risk_customers) == 4

    @pytest.mark.asyncio
    async def test_generate_revenue_cohorts(self, revenue_service, mock_db_execute):
        """Test revenue cohort generation."""
        mock_execute, mock_result = mock_db_execute
        revenue_service.db.execute = mock_execute
        
        with patch.object(revenue_service, '_get_cohort_customers') as mock_customers:
            mock_customers.return_value = [1, 2, 3, 4, 5]  # 5 customers in cohort
            
            with patch.object(revenue_service, '_get_cohort_month_data') as mock_month_data:
                # Mock progressive revenue and retention decline
                mock_month_data.side_effect = [
                    ([1, 2, 3, 4, 5], 500.0),  # Month 0: all active, $500 revenue
                    ([1, 2, 3, 4], 400.0),     # Month 1: 4 active, $400 revenue
                    ([1, 2, 3], 300.0),        # Month 2: 3 active, $300 revenue
                ] + [([1, 2], 200.0)] * 9    # Months 3-11: 2 active, $200 revenue
                
                cohorts = await revenue_service.generate_revenue_cohorts(months_back=1)
                
                assert len(cohorts) == 1
                cohort = cohorts[0]
                assert isinstance(cohort, RevenueCohort)
                assert cohort.customer_count == 5
                assert cohort.cumulative_revenue > 0

    @pytest.mark.asyncio
    async def test_forecast_revenue(self, revenue_service, mock_db_execute):
        """Test revenue forecasting."""
        mock_execute, mock_result = mock_db_execute
        revenue_service.db.execute = mock_execute
        
        with patch.object(revenue_service, '_calculate_mrr') as mock_mrr:
            mock_mrr.return_value = 10000.0  # Current MRR
            
            with patch.object(revenue_service, '_calculate_historical_growth_rate') as mock_growth:
                mock_growth.return_value = 5.0  # 5% monthly growth
                
                forecast = await revenue_service.forecast_revenue(months_ahead=3)
                
                assert len(forecast) == 3
                # Check that forecast grows month over month
                forecast_values = list(forecast.values())
                assert forecast_values[0] > 10000.0  # Month 1 > current MRR
                assert forecast_values[1] > forecast_values[0]  # Month 2 > Month 1
                assert forecast_values[2] > forecast_values[1]  # Month 3 > Month 2


class TestCustomerHealthService:
    """Test suite for Customer Health Service."""

    @pytest.fixture
    def health_service(self, db_session):
        """Create customer health service instance."""
        return CustomerHealthService(db_session)

    @pytest.fixture
    def mock_customer_data(self):
        """Mock customer data."""
        return {
            "user_id": 1,
            "email": "test@example.com",
            "user_created_at": datetime.utcnow() - timedelta(days=365),
            "subscription_id": 1,
            "status": "active",
            "subscription_created_at": datetime.utcnow() - timedelta(days=90),
            "plan_id": 1,
            "plan_name": "Pro Plan"
        }

    @pytest.mark.asyncio
    async def test_calculate_health_score_comprehensive(self, health_service, mock_customer_data):
        """Test comprehensive health score calculation."""
        
        with patch.object(health_service, '_get_customer_data') as mock_get_customer:
            mock_get_customer.return_value = mock_customer_data
            
            with patch.object(health_service, '_calculate_usage_score') as mock_usage:
                mock_usage.return_value = 75.0
                
                with patch.object(health_service, '_calculate_engagement_score') as mock_engagement:
                    mock_engagement.return_value = 80.0
                    
                    with patch.object(health_service, '_calculate_payment_score') as mock_payment:
                        mock_payment.return_value = 90.0
                        
                        with patch.object(health_service, '_calculate_support_score') as mock_support:
                            mock_support.return_value = 85.0
                            
                            with patch.object(health_service, '_get_key_metrics') as mock_metrics:
                                mock_metrics.return_value = {
                                    "days_since_last_login": 2,
                                    "api_calls_last_30_days": 5000,
                                    "payment_issues_count": 0,
                                    "support_tickets_count": 1,
                                    "last_activity_at": datetime.utcnow() - timedelta(days=2)
                                }
                                
                                with patch.object(health_service, '_calculate_churn_probability') as mock_churn:
                                    mock_churn.return_value = 0.15
                                    
                                    health_score = await health_service.calculate_health_score(1)
                                    
                                    assert isinstance(health_score, CustomerHealthScore)
                                    assert health_score.user_id == 1
                                    assert 70 <= health_score.overall_score <= 90  # Weighted average
                                    assert health_score.health_status in [HealthStatus.GOOD, HealthStatus.EXCELLENT]
                                    assert health_score.risk_level == RiskLevel.LOW
                                    assert health_score.churn_probability == 0.15

    @pytest.mark.asyncio
    async def test_get_at_risk_customers(self, health_service):
        """Test at-risk customer identification."""
        
        with patch.object(health_service, '_get_active_customers') as mock_active:
            mock_active.return_value = [1, 2, 3, 4, 5]
            
            # Mock health scores with varying risk levels
            mock_health_scores = [
                MagicMock(
                    user_id=1, 
                    churn_probability=0.8, 
                    risk_level=RiskLevel.CRITICAL,
                    overall_score=30.0
                ),
                MagicMock(
                    user_id=2, 
                    churn_probability=0.75, 
                    risk_level=RiskLevel.HIGH,
                    overall_score=40.0
                ),
                MagicMock(
                    user_id=3, 
                    churn_probability=0.6, 
                    risk_level=RiskLevel.MEDIUM,
                    overall_score=65.0
                ),
                # Users 4 and 5 would be low risk, so not included
            ]
            
            with patch.object(health_service, 'calculate_health_score') as mock_calculate:
                mock_calculate.side_effect = mock_health_scores + [
                    Exception("Low risk user"),  # User 4 fails (simulating low risk)
                    Exception("Low risk user")   # User 5 fails (simulating low risk)
                ]
                
                at_risk = await health_service.get_at_risk_customers(risk_threshold=70.0, limit=10)
                
                assert len(at_risk) == 3
                assert at_risk[0].user_id == 1  # Highest risk first
                assert at_risk[0].churn_probability == 0.8

    @pytest.mark.asyncio
    async def test_analyze_engagement_patterns(self, health_service):
        """Test engagement pattern analysis."""
        
        with patch.object(health_service, '_calculate_login_frequency') as mock_login:
            mock_login.return_value = 5.5  # 5.5 logins per week
            
            with patch.object(health_service, '_calculate_feature_adoption') as mock_features:
                mock_features.return_value = 65.0  # 65% feature adoption
                
                with patch.object(health_service, '_calculate_api_usage_trend') as mock_api_trend:
                    mock_api_trend.return_value = 15.0  # 15% growth trend
                    
                    with patch.object(health_service, '_calculate_avg_session_duration') as mock_session:
                        mock_session.return_value = 12.5  # 12.5 minutes average
                        
                        with patch.object(health_service, '_calculate_page_views_per_session') as mock_pages:
                            mock_pages.return_value = 8.0  # 8 pages per session
                            
                            with patch.object(health_service, '_calculate_time_to_value') as mock_ttv:
                                mock_ttv.return_value = 3.5  # 3.5 days to value
                                
                                engagement = await health_service.analyze_engagement_patterns(1)
                                
                                assert isinstance(engagement, EngagementMetrics)
                                assert engagement.login_frequency == 5.5
                                assert engagement.feature_adoption_rate == 65.0
                                assert engagement.api_usage_trend == 15.0

    @pytest.mark.asyncio
    async def test_analyze_usage_patterns(self, health_service):
        """Test usage pattern analysis."""
        
        with patch.object(health_service, '_get_usage_metrics') as mock_usage_metrics:
            mock_usage_metrics.return_value = {
                "api_calls": [1000, 1100, 1200, 1300],
                "storage": [50, 55, 60, 58],
                "projects": [5, 6, 7, 8]
            }
            
            with patch.object(health_service, '_analyze_metric_pattern') as mock_pattern:
                mock_pattern.side_effect = [
                    UsagePattern(
                        metric_type="api_calls",
                        current_usage=1300.0,
                        average_usage=1150.0,
                        trend_direction="increasing",
                        usage_percentile=75.0,
                        seasonal_adjustment=1.0
                    ),
                    UsagePattern(
                        metric_type="storage",
                        current_usage=58.0,
                        average_usage=55.75,
                        trend_direction="stable",
                        usage_percentile=60.0,
                        seasonal_adjustment=1.0
                    ),
                    UsagePattern(
                        metric_type="projects",
                        current_usage=8.0,
                        average_usage=6.5,
                        trend_direction="increasing",
                        usage_percentile=80.0,
                        seasonal_adjustment=1.0
                    )
                ]
                
                patterns = await health_service.analyze_usage_patterns(1)
                
                assert len(patterns) == 3
                assert patterns[0].metric_type == "api_calls"
                assert patterns[0].trend_direction == "increasing"
                assert patterns[1].metric_type == "storage"
                assert patterns[2].metric_type == "projects"

    @pytest.mark.asyncio
    async def test_health_status_determination(self, health_service):
        """Test health status determination logic."""
        
        # Test excellent status
        assert health_service._determine_health_status(95.0) == HealthStatus.EXCELLENT
        
        # Test good status
        assert health_service._determine_health_status(80.0) == HealthStatus.GOOD
        
        # Test fair status
        assert health_service._determine_health_status(65.0) == HealthStatus.FAIR
        
        # Test poor status
        assert health_service._determine_health_status(45.0) == HealthStatus.POOR
        
        # Test critical status
        assert health_service._determine_health_status(25.0) == HealthStatus.CRITICAL

    @pytest.mark.asyncio
    async def test_risk_level_determination(self, health_service, mock_customer_data):
        """Test risk level determination logic."""
        
        # Test low risk
        assert health_service._determine_risk_level(85.0, mock_customer_data) == RiskLevel.LOW
        
        # Test medium risk
        assert health_service._determine_risk_level(65.0, mock_customer_data) == RiskLevel.MEDIUM
        
        # Test high risk
        assert health_service._determine_risk_level(45.0, mock_customer_data) == RiskLevel.HIGH
        
        # Test critical risk
        assert health_service._determine_risk_level(25.0, mock_customer_data) == RiskLevel.CRITICAL


class TestGrowthAutomationService:
    """Test suite for Growth Automation Service."""

    @pytest.fixture
    def growth_service(self, db_session):
        """Create growth automation service instance."""
        return GrowthAutomationService(db_session)

    @pytest.fixture
    def mock_health_service(self):
        """Mock health service."""
        return MagicMock()

    @pytest.fixture
    def mock_revenue_service(self):
        """Mock revenue service."""
        return MagicMock()

    @pytest.mark.asyncio
    async def test_identify_upgrade_opportunities(self, growth_service):
        """Test upgrade opportunity identification."""
        
        with patch.object(growth_service, '_get_active_customers') as mock_active:
            mock_active.return_value = [1, 2, 3]
            
            # Mock upgrade recommendations
            mock_recommendations = [
                UpgradeRecommendation(
                    user_id=1,
                    current_plan_id=1,
                    recommended_plan_id=2,
                    confidence_score=0.85,
                    potential_revenue_increase=50.0,
                    reasoning=["High usage", "Good payment history"],
                    urgency="high",
                    suggested_actions=["Direct sales outreach"]
                ),
                UpgradeRecommendation(
                    user_id=2,
                    current_plan_id=1,
                    recommended_plan_id=2,
                    confidence_score=0.75,
                    potential_revenue_increase=30.0,
                    reasoning=["Moderate usage growth"],
                    urgency="medium",
                    suggested_actions=["Email recommendation"]
                ),
                None  # User 3 has no upgrade opportunity
            ]
            
            with patch.object(growth_service, '_analyze_upgrade_opportunity') as mock_analyze:
                mock_analyze.side_effect = mock_recommendations
                
                opportunities = await growth_service.identify_upgrade_opportunities(min_confidence=0.7)
                
                assert len(opportunities) == 2
                assert opportunities[0].user_id == 1  # Highest revenue increase first
                assert opportunities[0].potential_revenue_increase == 50.0
                assert opportunities[1].user_id == 2

    @pytest.mark.asyncio
    async def test_generate_retention_insights(self, growth_service):
        """Test retention insight generation."""
        
        # Mock at-risk customers from health service
        mock_at_risk_customers = [
            MagicMock(
                user_id=1,
                overall_score=45.0,
                risk_level=RiskLevel.HIGH,
                churn_probability=0.7,
                usage_score=30.0,
                engagement_score=40.0,
                payment_score=60.0
            ),
            MagicMock(
                user_id=2,
                overall_score=35.0,
                risk_level=RiskLevel.CRITICAL,
                churn_probability=0.85,
                usage_score=25.0,
                engagement_score=30.0,
                payment_score=50.0
            )
        ]
        
        with patch.object(growth_service.health_service, 'get_at_risk_customers') as mock_at_risk:
            mock_at_risk.return_value = mock_at_risk_customers
            
            with patch.object(growth_service, '_generate_retention_insight') as mock_generate:
                mock_generate.side_effect = [
                    RetentionInsight(
                        user_id=1,
                        churn_risk=0.7,
                        retention_actions=["Provide onboarding", "Technical consultation"],
                        success_probability=0.6,
                        estimated_clv_at_risk=1500.0,
                        recommended_timeline="within_7_days"
                    ),
                    RetentionInsight(
                        user_id=2,
                        churn_risk=0.85,
                        retention_actions=["Immediate intervention", "Assign CSM"],
                        success_probability=0.4,
                        estimated_clv_at_risk=2000.0,
                        recommended_timeline="immediate"
                    )
                ]
                
                insights = await growth_service.generate_retention_insights(risk_threshold=0.6)
                
                assert len(insights) == 2
                assert insights[0].user_id == 1
                assert insights[0].success_probability == 0.6
                assert insights[1].user_id == 2
                assert insights[1].recommended_timeline == "immediate"

    @pytest.mark.asyncio
    async def test_run_automation_cycle(self, growth_service):
        """Test complete automation cycle execution."""
        
        with patch.object(growth_service, '_get_active_customers') as mock_active:
            mock_active.return_value = [1, 2, 3]
            
            with patch.object(growth_service, '_evaluate_campaign_rules') as mock_evaluate:
                # Mock campaign executions for different users
                mock_evaluate.side_effect = [
                    [MagicMock(rule_id="retention_1", campaign_type=CampaignType.RETENTION)],
                    [MagicMock(rule_id="upgrade_1", campaign_type=CampaignType.UPGRADE)],
                    []  # No campaigns for user 3
                ]
                
                with patch.object(growth_service, '_is_in_cooldown') as mock_cooldown:
                    mock_cooldown.return_value = False  # No cooldown
                    
                    with patch.object(growth_service, '_execute_campaign') as mock_execute:
                        mock_execute.return_value = {"success": True}
                        
                        results = await growth_service.run_automation_cycle()
                        
                        assert results["campaigns_triggered"] == 2
                        assert results["campaigns_executed"] == 2
                        assert results["retention_actions"] == 1
                        assert results["upgrade_opportunities"] == 1
                        assert len(results["errors"]) == 0

    @pytest.mark.asyncio
    async def test_trigger_milestone_celebrations(self, growth_service):
        """Test milestone celebration triggering."""
        
        with patch.object(growth_service, '_get_active_customers') as mock_active:
            mock_active.return_value = [1, 2, 3]
            
            # Mock milestone checks
            milestone_checks = {
                (1, "first_api_call"): True,
                (1, "power_user"): False,
                (2, "first_api_call"): False,
                (2, "one_month_subscriber"): True,
                (3, "first_api_call"): False,
            }
            
            with patch.object(growth_service, '_check_milestone_achievement') as mock_check:
                mock_check.side_effect = lambda user_id, milestone: milestone_checks.get(
                    (user_id, milestone["type"]), False
                )
                
                with patch.object(growth_service, '_trigger_milestone_celebration') as mock_trigger:
                    mock_trigger.side_effect = [
                        {"user_id": 1, "milestone_type": "first_api_call"},
                        {"user_id": 2, "milestone_type": "one_month_subscriber"}
                    ]
                    
                    celebrations = await growth_service.trigger_milestone_celebrations()
                    
                    assert len(celebrations) == 2
                    assert celebrations[0]["user_id"] == 1
                    assert celebrations[1]["user_id"] == 2

    @pytest.mark.asyncio
    async def test_optimize_campaign_performance(self, growth_service):
        """Test campaign performance optimization."""
        
        mock_performance_data = {
            "retention": {"success_rate": 0.75, "roi": 4.2},
            "upgrade": {"success_rate": 0.45, "roi": 6.1},
            "milestone": {"success_rate": 0.85, "roi": 1.5},
            "win_back": {"success_rate": 0.25, "roi": 0.8}
        }
        
        with patch.object(growth_service, '_get_campaign_performance') as mock_performance:
            mock_performance.return_value = mock_performance_data
            
            optimization = await growth_service.optimize_campaign_performance()
            
            assert len(optimization["top_performing_campaigns"]) > 0
            assert len(optimization["underperforming_campaigns"]) > 0
            
            # Check that high performing campaigns are identified
            top_campaigns = [c["type"] for c in optimization["top_performing_campaigns"]]
            assert "retention" in top_campaigns  # 75% success, 4.2 ROI
            assert "upgrade" in top_campaigns    # 45% success but 6.1 ROI
            
            # Check that underperforming campaigns are identified
            underperforming = [c["type"] for c in optimization["underperforming_campaigns"]]
            assert "win_back" in underperforming  # 25% success, 0.8 ROI

    @pytest.mark.asyncio
    async def test_campaign_rule_evaluation(self, growth_service):
        """Test campaign rule evaluation logic."""
        
        # Mock health score
        mock_health_score = MagicMock(
            overall_score=45.0,
            api_calls_last_30_days=8500,
            days_since_last_login=5,
            payment_issues_count=1
        )
        
        # Test different rule conditions
        from app.services.growth_automation import CampaignRule, TriggerCondition
        
        # Health score drop rule
        health_rule = CampaignRule(
            id="test_health",
            name="Test Health Rule",
            campaign_type=CampaignType.RETENTION,
            trigger_condition=TriggerCondition.HEALTH_SCORE_DROP,
            conditions={"health_score_threshold": 60},
            actions=[],
            priority=1,
            is_active=True
        )
        
        result = await growth_service._check_rule_conditions(1, health_rule, mock_health_score)
        assert result is True  # 45 < 60
        
        # Usage threshold rule
        usage_rule = CampaignRule(
            id="test_usage",
            name="Test Usage Rule", 
            campaign_type=CampaignType.UPGRADE,
            trigger_condition=TriggerCondition.USAGE_THRESHOLD,
            conditions={"api_calls_threshold": 8000},
            actions=[],
            priority=1,
            is_active=True
        )
        
        result = await growth_service._check_rule_conditions(1, usage_rule, mock_health_score)
        assert result is True  # 8500 >= 8000


class TestIntegrationScenarios:
    """Integration tests for multiple services working together."""

    @pytest.fixture
    def all_services(self, db_session):
        """Create all services."""
        return {
            "revenue": RevenueAnalyticsService(db_session),
            "health": CustomerHealthService(db_session),
            "growth": GrowthAutomationService(db_session)
        }

    @pytest.mark.asyncio
    async def test_end_to_end_growth_intelligence_flow(self, all_services):
        """Test end-to-end growth intelligence workflow."""
        
        revenue_service = all_services["revenue"]
        health_service = all_services["health"]
        growth_service = all_services["growth"]
        
        # Mock the complete flow
        with patch.object(revenue_service, 'get_revenue_metrics') as mock_revenue:
            mock_revenue.return_value = MagicMock(
                mrr=15000.0,
                churn_rate=8.5,
                customer_count=150
            )
            
            with patch.object(health_service, 'get_at_risk_customers') as mock_at_risk:
                mock_at_risk.return_value = [
                    MagicMock(user_id=1, churn_probability=0.8),
                    MagicMock(user_id=2, churn_probability=0.75)
                ]
                
                with patch.object(growth_service, 'identify_upgrade_opportunities') as mock_upgrade:
                    mock_upgrade.return_value = [
                        MagicMock(user_id=3, potential_revenue_increase=100.0),
                        MagicMock(user_id=4, potential_revenue_increase=75.0)
                    ]
                    
                    # Simulate dashboard data generation
                    revenue_metrics = await revenue_service.get_revenue_metrics()
                    at_risk_customers = await health_service.get_at_risk_customers()
                    upgrade_opportunities = await growth_service.identify_upgrade_opportunities()
                    
                    # Verify integration
                    assert revenue_metrics.mrr == 15000.0
                    assert len(at_risk_customers) == 2
                    assert len(upgrade_opportunities) == 2
                    
                    # Calculate potential business impact
                    total_churn_risk = sum(c.churn_probability for c in at_risk_customers)
                    total_upgrade_potential = sum(o.potential_revenue_increase for o in upgrade_opportunities)
                    
                    assert total_churn_risk == 1.55  # 0.8 + 0.75
                    assert total_upgrade_potential == 175.0  # 100 + 75

    @pytest.mark.asyncio
    async def test_customer_journey_tracking(self, all_services):
        """Test tracking customer journey through different stages."""
        
        health_service = all_services["health"]
        growth_service = all_services["growth"]
        
        # Simulate customer progression: new -> at-risk -> retained -> upgrade
        
        # Stage 1: New customer with good health
        with patch.object(health_service, 'calculate_health_score') as mock_health_1:
            mock_health_1.return_value = MagicMock(
                user_id=1,
                overall_score=85.0,
                health_status=HealthStatus.GOOD,
                risk_level=RiskLevel.LOW
            )
            
            health_score_1 = await health_service.calculate_health_score(1)
            assert health_score_1.risk_level == RiskLevel.LOW
        
        # Stage 2: Customer becomes at-risk
        with patch.object(health_service, 'calculate_health_score') as mock_health_2:
            mock_health_2.return_value = MagicMock(
                user_id=1,
                overall_score=45.0,
                health_status=HealthStatus.POOR,
                risk_level=RiskLevel.HIGH
            )
            
            health_score_2 = await health_service.calculate_health_score(1)
            assert health_score_2.risk_level == RiskLevel.HIGH
            
            # Trigger retention campaign
            with patch.object(growth_service, 'generate_retention_insights') as mock_retention:
                mock_retention.return_value = [
                    MagicMock(
                        user_id=1,
                        retention_actions=["Provide support", "Offer training"]
                    )
                ]
                
                insights = await growth_service.generate_retention_insights()
                assert len(insights) == 1
                assert insights[0].user_id == 1
        
        # Stage 3: Customer retained and becomes upgrade candidate
        with patch.object(health_service, 'calculate_health_score') as mock_health_3:
            mock_health_3.return_value = MagicMock(
                user_id=1,
                overall_score=80.0,
                health_status=HealthStatus.GOOD,
                risk_level=RiskLevel.LOW,
                api_calls_last_30_days=9000  # High usage indicating upgrade readiness
            )
            
            health_score_3 = await health_service.calculate_health_score(1)
            assert health_score_3.overall_score == 80.0
            
            # Identify upgrade opportunity
            with patch.object(growth_service, 'identify_upgrade_opportunities') as mock_upgrade:
                mock_upgrade.return_value = [
                    MagicMock(
                        user_id=1,
                        confidence_score=0.85,
                        potential_revenue_increase=50.0
                    )
                ]
                
                opportunities = await growth_service.identify_upgrade_opportunities()
                assert len(opportunities) == 1
                assert opportunities[0].confidence_score == 0.85


if __name__ == "__main__":
    pytest.main([__file__, "-v"])