"""
Business Intelligence Analytics API for NeoForge Growth Intelligence.

Provides comprehensive revenue analytics, customer health scoring, growth automation insights,
and data-driven business optimization endpoints for bootstrapped founders.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.revenue_analytics import RevenueAnalyticsService
from app.services.customer_health import CustomerHealthService
from app.services.growth_automation import GrowthAutomationService
from app.services.growth_integration import GrowthIntegrationService

router = APIRouter()


@router.get("/analytics/revenue/metrics")
async def get_revenue_metrics(
    start_date: Optional[datetime] = Query(None, description="Start date for metrics calculation"),
    end_date: Optional[datetime] = Query(None, description="End date for metrics calculation"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get comprehensive revenue metrics including MRR, ARR, churn rate, and growth."""
    
    try:
        revenue_service = RevenueAnalyticsService(db)
        metrics = await revenue_service.get_revenue_metrics(start_date, end_date)
        
        return {
            "status": "success",
            "data": {
                "mrr": metrics.mrr,
                "arr": metrics.arr,
                "month_over_month_growth": metrics.month_over_month_growth,
                "year_over_year_growth": metrics.year_over_year_growth,
                "churn_rate": metrics.churn_rate,
                "net_revenue_retention": metrics.net_revenue_retention,
                "avg_revenue_per_user": metrics.avg_revenue_per_user,
                "customer_count": metrics.customer_count,
                "total_revenue": metrics.total_revenue
            },
            "period": {
                "start_date": start_date.isoformat() if start_date else None,
                "end_date": end_date.isoformat() if end_date else None
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate revenue metrics: {str(e)}")


@router.get("/analytics/revenue/clv")
async def get_customer_lifetime_value(
    user_id: Optional[int] = Query(None, description="Specific user ID for CLV calculation"),
    plan_id: Optional[int] = Query(None, description="Plan ID for segmented CLV"),
    cohort_month: Optional[str] = Query(None, description="Cohort month (YYYY-MM) for CLV calculation"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Calculate Customer Lifetime Value (CLV) for segments or individual customers."""
    
    try:
        revenue_service = RevenueAnalyticsService(db)
        clv_data = await revenue_service.calculate_customer_lifetime_value(
            user_id=user_id,
            plan_id=plan_id,
            cohort_month=cohort_month
        )
        
        return {
            "status": "success",
            "data": {
                "clv": clv_data.clv,
                "avg_monthly_revenue": clv_data.avg_monthly_revenue,
                "avg_lifespan_months": clv_data.avg_lifespan_months,
                "acquisition_cost": clv_data.acquisition_cost,
                "clv_to_cac_ratio": clv_data.clv_to_cac_ratio
            },
            "filters": {
                "user_id": user_id,
                "plan_id": plan_id,
                "cohort_month": cohort_month
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate CLV: {str(e)}")


@router.get("/analytics/churn/analysis")
async def get_churn_analysis(
    start_date: Optional[datetime] = Query(None, description="Start date for churn analysis"),
    end_date: Optional[datetime] = Query(None, description="End date for churn analysis"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get comprehensive churn analysis including risk identification and cohort retention."""
    
    try:
        revenue_service = RevenueAnalyticsService(db)
        churn_analysis = await revenue_service.analyze_churn(start_date, end_date)
        
        return {
            "status": "success",
            "data": {
                "churn_rate": churn_analysis.churn_rate,
                "churned_customers": churn_analysis.churned_customers,
                "churned_revenue": churn_analysis.churned_revenue,
                "at_risk_customers": churn_analysis.at_risk_customers,
                "churn_by_plan": churn_analysis.churn_by_plan,
                "cohort_retention": churn_analysis.cohort_retention
            },
            "period": {
                "start_date": start_date.isoformat() if start_date else None,
                "end_date": end_date.isoformat() if end_date else None
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze churn: {str(e)}")


@router.get("/analytics/revenue/cohorts")
async def get_revenue_cohorts(
    months_back: int = Query(12, description="Number of months to analyze"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get revenue cohort analysis for customer segments."""
    
    try:
        revenue_service = RevenueAnalyticsService(db)
        cohorts = await revenue_service.generate_revenue_cohorts(months_back)
        
        cohort_data = []
        for cohort in cohorts:
            cohort_data.append({
                "cohort_month": cohort.cohort_month,
                "customer_count": cohort.customer_count,
                "revenue_by_month": cohort.revenue_by_month,
                "retention_by_month": cohort.retention_by_month,
                "cumulative_revenue": cohort.cumulative_revenue,
                "avg_revenue_per_customer": cohort.avg_revenue_per_customer
            })
        
        return {
            "status": "success",
            "data": cohort_data,
            "parameters": {
                "months_back": months_back
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate cohort analysis: {str(e)}")


@router.get("/analytics/revenue/forecast")
async def get_revenue_forecast(
    months_ahead: int = Query(12, description="Number of months to forecast"),
    growth_rate: Optional[float] = Query(None, description="Custom growth rate for forecasting"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get revenue forecasting based on current trends."""
    
    try:
        revenue_service = RevenueAnalyticsService(db)
        forecast = await revenue_service.forecast_revenue(months_ahead, growth_rate)
        
        return {
            "status": "success",
            "data": forecast,
            "parameters": {
                "months_ahead": months_ahead,
                "growth_rate": growth_rate
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate revenue forecast: {str(e)}")


@router.get("/analytics/customers/{user_id}/health")
async def get_customer_health_score(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get comprehensive health score for a specific customer."""
    
    try:
        health_service = CustomerHealthService(db)
        health_score = await health_service.calculate_health_score(user_id)
        
        return {
            "status": "success",
            "data": {
                "user_id": health_score.user_id,
                "overall_score": health_score.overall_score,
                "health_status": health_score.health_status.value,
                "risk_level": health_score.risk_level.value,
                "component_scores": {
                    "usage_score": health_score.usage_score,
                    "engagement_score": health_score.engagement_score,
                    "payment_score": health_score.payment_score,
                    "support_score": health_score.support_score
                },
                "key_metrics": {
                    "days_since_last_login": health_score.days_since_last_login,
                    "api_calls_last_30_days": health_score.api_calls_last_30_days,
                    "payment_issues_count": health_score.payment_issues_count,
                    "support_tickets_count": health_score.support_tickets_count
                },
                "predictions": {
                    "churn_probability": health_score.churn_probability,
                    "predicted_action_date": health_score.predicted_action_date.isoformat() if health_score.predicted_action_date else None
                },
                "recommended_actions": health_score.recommended_actions,
                "calculated_at": health_score.calculated_at.isoformat(),
                "last_activity_at": health_score.last_activity_at.isoformat() if health_score.last_activity_at else None
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate health score: {str(e)}")


@router.get("/analytics/customers/at-risk")
async def get_at_risk_customers(
    risk_threshold: float = Query(70.0, description="Risk threshold percentage (0-100)"),
    limit: int = Query(100, description="Maximum number of customers to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get customers at risk of churning with health scores and recommendations."""
    
    try:
        health_service = CustomerHealthService(db)
        at_risk_customers = await health_service.get_at_risk_customers(risk_threshold, limit)
        
        customers_data = []
        for customer in at_risk_customers:
            customers_data.append({
                "user_id": customer.user_id,
                "overall_score": customer.overall_score,
                "health_status": customer.health_status.value,
                "risk_level": customer.risk_level.value,
                "churn_probability": customer.churn_probability,
                "predicted_action_date": customer.predicted_action_date.isoformat() if customer.predicted_action_date else None,
                "recommended_actions": customer.recommended_actions,
                "key_metrics": {
                    "days_since_last_login": customer.days_since_last_login,
                    "api_calls_last_30_days": customer.api_calls_last_30_days,
                    "payment_issues_count": customer.payment_issues_count
                }
            })
        
        return {
            "status": "success",
            "data": customers_data,
            "parameters": {
                "risk_threshold": risk_threshold,
                "limit": limit,
                "total_found": len(customers_data)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get at-risk customers: {str(e)}")


@router.get("/analytics/customers/{user_id}/engagement")
async def get_customer_engagement(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get detailed engagement analysis for a specific customer."""
    
    try:
        health_service = CustomerHealthService(db)
        engagement_metrics = await health_service.analyze_engagement_patterns(user_id)
        
        return {
            "status": "success",
            "data": {
                "user_id": user_id,
                "login_frequency": engagement_metrics.login_frequency,
                "feature_adoption_rate": engagement_metrics.feature_adoption_rate,
                "api_usage_trend": engagement_metrics.api_usage_trend,
                "session_duration_avg": engagement_metrics.session_duration_avg,
                "page_views_per_session": engagement_metrics.page_views_per_session,
                "time_to_value": engagement_metrics.time_to_value
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze engagement: {str(e)}")


@router.get("/analytics/customers/{user_id}/usage-patterns")
async def get_customer_usage_patterns(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get usage pattern analysis for a specific customer."""
    
    try:
        health_service = CustomerHealthService(db)
        usage_patterns = await health_service.analyze_usage_patterns(user_id)
        
        patterns_data = []
        for pattern in usage_patterns:
            patterns_data.append({
                "metric_type": pattern.metric_type,
                "current_usage": pattern.current_usage,
                "average_usage": pattern.average_usage,
                "trend_direction": pattern.trend_direction,
                "usage_percentile": pattern.usage_percentile,
                "seasonal_adjustment": pattern.seasonal_adjustment
            })
        
        return {
            "status": "success",
            "data": {
                "user_id": user_id,
                "patterns": patterns_data
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze usage patterns: {str(e)}")


@router.get("/analytics/customers/{user_id}/health-trends")
async def get_customer_health_trends(
    user_id: int,
    days_back: int = Query(90, description="Number of days to analyze"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get health score trends over time for a specific customer."""
    
    try:
        health_service = CustomerHealthService(db)
        trends = await health_service.get_health_trends(user_id, days_back)
        
        # Convert datetime objects to ISO strings for JSON serialization
        trends_data = {}
        for score_type, trend_points in trends.items():
            trends_data[score_type] = [
                {"date": point[0].isoformat(), "score": point[1]}
                for point in trend_points
            ]
        
        return {
            "status": "success",
            "data": {
                "user_id": user_id,
                "trends": trends_data
            },
            "parameters": {
                "days_back": days_back
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get health trends: {str(e)}")


@router.get("/analytics/growth/upgrade-opportunities")
async def get_upgrade_opportunities(
    min_confidence: float = Query(0.7, description="Minimum confidence score for recommendations"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get customers ready for plan upgrades with recommendations."""
    
    try:
        growth_service = GrowthAutomationService(db)
        opportunities = await growth_service.identify_upgrade_opportunities(min_confidence)
        
        opportunities_data = []
        for opportunity in opportunities:
            opportunities_data.append({
                "user_id": opportunity.user_id,
                "current_plan_id": opportunity.current_plan_id,
                "recommended_plan_id": opportunity.recommended_plan_id,
                "confidence_score": opportunity.confidence_score,
                "potential_revenue_increase": opportunity.potential_revenue_increase,
                "reasoning": opportunity.reasoning,
                "urgency": opportunity.urgency,
                "suggested_actions": opportunity.suggested_actions
            })
        
        return {
            "status": "success",
            "data": opportunities_data,
            "parameters": {
                "min_confidence": min_confidence,
                "total_opportunities": len(opportunities_data)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to identify upgrade opportunities: {str(e)}")


@router.get("/analytics/growth/retention-insights")
async def get_retention_insights(
    risk_threshold: float = Query(0.6, description="Risk threshold for retention analysis"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get retention insights for at-risk customers."""
    
    try:
        growth_service = GrowthAutomationService(db)
        insights = await growth_service.generate_retention_insights(risk_threshold)
        
        insights_data = []
        for insight in insights:
            insights_data.append({
                "user_id": insight.user_id,
                "churn_risk": insight.churn_risk,
                "retention_actions": insight.retention_actions,
                "success_probability": insight.success_probability,
                "estimated_clv_at_risk": insight.estimated_clv_at_risk,
                "recommended_timeline": insight.recommended_timeline
            })
        
        return {
            "status": "success",
            "data": insights_data,
            "parameters": {
                "risk_threshold": risk_threshold,
                "total_insights": len(insights_data)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate retention insights: {str(e)}")


@router.post("/analytics/growth/run-automation")
async def run_growth_automation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Run automated growth campaigns and return execution results."""
    
    try:
        growth_service = GrowthAutomationService(db)
        results = await growth_service.run_automation_cycle()
        
        return {
            "status": "success",
            "data": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to run automation cycle: {str(e)}")


@router.get("/analytics/growth/milestone-celebrations")
async def trigger_milestone_celebrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Trigger milestone celebration campaigns for qualifying customers."""
    
    try:
        growth_service = GrowthAutomationService(db)
        celebrations = await growth_service.trigger_milestone_celebrations()
        
        return {
            "status": "success",
            "data": celebrations,
            "total_celebrations": len(celebrations)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to trigger milestone celebrations: {str(e)}")


@router.get("/analytics/growth/campaign-performance")
async def get_campaign_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get campaign performance analysis and optimization recommendations."""
    
    try:
        growth_service = GrowthAutomationService(db)
        performance = await growth_service.optimize_campaign_performance()
        
        return {
            "status": "success",
            "data": performance
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze campaign performance: {str(e)}")


@router.get("/analytics/dashboard")
async def get_analytics_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get comprehensive analytics dashboard data for business overview."""
    
    try:
        # Initialize services
        revenue_service = RevenueAnalyticsService(db)
        health_service = CustomerHealthService(db)
        growth_service = GrowthAutomationService(db)
        
        # Get key metrics
        revenue_metrics = await revenue_service.get_revenue_metrics()
        at_risk_customers = await health_service.get_at_risk_customers(limit=10)
        upgrade_opportunities = await growth_service.identify_upgrade_opportunities(min_confidence=0.7)
        
        # Calculate summary statistics
        total_at_risk = len(at_risk_customers)
        total_upgrade_opportunities = len(upgrade_opportunities)
        potential_upgrade_revenue = sum(opp.potential_revenue_increase for opp in upgrade_opportunities)
        
        return {
            "status": "success",
            "data": {
                "revenue_metrics": {
                    "mrr": revenue_metrics.mrr,
                    "arr": revenue_metrics.arr,
                    "month_over_month_growth": revenue_metrics.month_over_month_growth,
                    "churn_rate": revenue_metrics.churn_rate,
                    "customer_count": revenue_metrics.customer_count,
                    "avg_revenue_per_user": revenue_metrics.avg_revenue_per_user
                },
                "customer_health": {
                    "at_risk_count": total_at_risk,
                    "critical_risk_count": len([c for c in at_risk_customers if c.risk_level.value == "critical"]),
                    "avg_health_score": sum(c.overall_score for c in at_risk_customers) / max(1, total_at_risk)
                },
                "growth_opportunities": {
                    "upgrade_opportunities_count": total_upgrade_opportunities,
                    "potential_monthly_revenue": potential_upgrade_revenue,
                    "high_confidence_upgrades": len([o for o in upgrade_opportunities if o.confidence_score > 0.8])
                },
                "top_at_risk_customers": [
                    {
                        "user_id": customer.user_id,
                        "overall_score": customer.overall_score,
                        "churn_probability": customer.churn_probability,
                        "risk_level": customer.risk_level.value
                    }
                    for customer in at_risk_customers[:5]
                ],
                "top_upgrade_opportunities": [
                    {
                        "user_id": opp.user_id,
                        "confidence_score": opp.confidence_score,
                        "potential_revenue_increase": opp.potential_revenue_increase,
                        "urgency": opp.urgency
                    }
                    for opp in upgrade_opportunities[:5]
                ]
            },
            "generated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate dashboard data: {str(e)}")


# Legacy endpoints for backward compatibility
@router.get("/analytics")
async def get_legacy_analytics() -> Dict[str, Any]:
    """Legacy analytics endpoint for backward compatibility."""
    return {
        "message": "Analytics system upgraded to growth intelligence platform",
        "endpoints": {
            "revenue_metrics": "/analytics/revenue/metrics",
            "customer_health": "/analytics/customers/{user_id}/health",
            "at_risk_customers": "/analytics/customers/at-risk",
            "upgrade_opportunities": "/analytics/growth/upgrade-opportunities",
            "dashboard": "/analytics/dashboard"
        }
    }


@router.post("/analytics/events")
async def track_event(
    event: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    """Track analytics event (enhanced for growth intelligence)."""
    
    try:
        integration_service = GrowthIntegrationService(db)
        
        # Determine event type and route to appropriate handler
        event_type = event.get("event_type", "activity")
        
        if event_type == "subscription":
            result = await integration_service.handle_subscription_event(event)
        elif event_type == "usage":
            result = await integration_service.handle_usage_event(event)
        else:
            result = await integration_service.handle_user_activity_event(event)
        
        return {
            "status": "ok", 
            "message": "Event tracked and processed successfully",
            "integration_result": result
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Event tracking failed: {str(e)}"
        }


@router.post("/analytics/integration/sync-health-scores")
async def sync_customer_health_scores(
    batch_size: int = Query(100, description="Batch size for processing"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Sync customer health scores for all active customers."""
    
    try:
        integration_service = GrowthIntegrationService(db)
        result = await integration_service.sync_customer_health_scores(batch_size)
        
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to sync health scores: {str(e)}")


@router.get("/analytics/integration/insights-report")
async def get_growth_insights_report(
    days_back: int = Query(30, description="Number of days to analyze"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Generate comprehensive growth insights report."""
    
    try:
        integration_service = GrowthIntegrationService(db)
        report = await integration_service.generate_growth_insights_report(days_back)
        
        return {
            "status": "success",
            "data": report
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate insights report: {str(e)}")


@router.post("/analytics/webhooks/subscription")
async def handle_subscription_webhook(
    webhook_data: Dict[str, Any],
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Handle subscription webhook events for growth intelligence integration."""
    
    try:
        integration_service = GrowthIntegrationService(db)
        result = await integration_service.handle_subscription_event(webhook_data)
        
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
