"""Main personalization engine for adaptive user experiences."""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import get_redis
from app.crud.personalization import (
    personalization_profile,
    personalization_rule,
    personalization_interaction,
)
from app.models.personalization import PersonalizationProfile, PersonalizationRule
from app.schemas.personalization import (
    PersonalizationConfig,
    PersonalizationRequest,
    PersonalizationInteractionCreate,
)
from .ml_models import PersonalizationMLModels
from .rule_evaluator import RuleEvaluator
from .user_profiler import UserProfiler
from .cache_manager import PersonalizationCacheManager

logger = logging.getLogger(__name__)


class PersonalizationEngine:
    """
    Main personalization engine that orchestrates user profiling,
    rule evaluation, ML predictions, and configuration generation.
    """

    def __init__(self):
        """Initialize personalization engine components."""
        self.ml_models = PersonalizationMLModels()
        self.rule_evaluator = RuleEvaluator()
        self.user_profiler = UserProfiler()
        self.cache_manager = PersonalizationCacheManager()
        
    async def get_personalized_config(
        self,
        db: AsyncSession,
        *,
        request: PersonalizationRequest
    ) -> PersonalizationConfig:
        """
        Generate complete personalized configuration for a user.
        
        This is the main entry point for personalization requests.
        """
        start_time = datetime.utcnow()
        
        try:
            # Check cache first
            cached_config = await self.cache_manager.get_user_config(
                user_id=request.user_id,
                context=request.context
            )
            
            if cached_config:
                logger.info(f"Returned cached config for user {request.user_id}")
                return cached_config
            
            # Get or create user profile
            profile = await self._ensure_user_profile(db, request.user_id)
            
            # Get applicable rules
            rules = await self._get_applicable_rules(
                db, profile, request
            )
            
            # Evaluate rules and generate configuration
            config = await self._generate_configuration(
                db, profile, rules, request
            )
            
            # Cache the configuration
            await self.cache_manager.cache_user_config(
                user_id=request.user_id,
                context=request.context,
                config=config,
                ttl_seconds=300  # 5 minutes cache
            )
            
            # Track performance
            response_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            await self._track_personalization_request(
                db, request, len(rules), response_time
            )
            
            logger.info(
                f"Generated personalization config for user {request.user_id} "
                f"with {len(rules)} rules in {response_time:.1f}ms"
            )
            
            return config
            
        except Exception as e:
            logger.error(
                f"Error generating personalization config for user {request.user_id}: {e}"
            )
            # Return default configuration on error
            return await self._get_default_config(request)

    async def update_user_profile(
        self,
        db: AsyncSession,
        *,
        user_id: int,
        interaction_data: Optional[Dict[str, Any]] = None,
        force_recompute: bool = False
    ) -> PersonalizationProfile:
        """
        Update user profile based on new interaction data or force recomputation.
        """
        try:
            # Get current profile
            profile = await personalization_profile.get_by_user_id(db, user_id=user_id)
            
            if not profile or force_recompute:
                # Create or fully recompute profile
                profile_data = await self.user_profiler.compute_full_profile(
                    db, user_id=user_id
                )
                profile = await personalization_profile.create_or_update_profile(
                    db, user_id=user_id, profile_data=profile_data
                )
            elif interaction_data:
                # Incremental update
                updated_data = await self.user_profiler.update_profile_incrementally(
                    profile, interaction_data
                )
                profile = await personalization_profile.create_or_update_profile(
                    db, user_id=user_id, profile_data=updated_data
                )
            
            # Update ML insights
            ml_insights = await self.ml_models.generate_user_insights(db, profile)
            if ml_insights:
                profile = await personalization_profile.update_ml_insights(
                    db,
                    user_id=user_id,
                    churn_risk=ml_insights.get("churn_risk"),
                    lifetime_value=ml_insights.get("lifetime_value"),
                    next_actions=ml_insights.get("next_actions")
                )
            
            # Invalidate cache
            await self.cache_manager.invalidate_user_cache(user_id)
            
            logger.info(f"Updated profile for user {user_id}")
            return profile
            
        except Exception as e:
            logger.error(f"Error updating profile for user {user_id}: {e}")
            raise

    async def track_interaction(
        self,
        db: AsyncSession,
        *,
        interaction: PersonalizationInteractionCreate
    ) -> None:
        """
        Track a personalization interaction and update relevant metrics.
        """
        try:
            # Create interaction record
            await personalization_interaction.create_interaction(
                db, obj_in=interaction
            )
            
            # Update rule performance asynchronously
            asyncio.create_task(
                self._update_rule_performance(db, interaction.rule_id)
            )
            
            # Trigger profile update if significant interaction
            if interaction.outcome in ["positive", "converted"]:
                asyncio.create_task(
                    self.update_user_profile(
                        db,
                        user_id=interaction.user_id,
                        interaction_data={
                            "interaction_type": interaction.interaction_type,
                            "outcome": interaction.outcome,
                            "context": interaction.context
                        }
                    )
                )
            
            logger.debug(
                f"Tracked interaction for user {interaction.user_id}, "
                f"rule {interaction.rule_id}, outcome: {interaction.outcome}"
            )
            
        except Exception as e:
            logger.error(f"Error tracking interaction: {e}")
            # Don't raise - tracking failures shouldn't break user experience

    async def optimize_rules(
        self,
        db: AsyncSession,
        *,
        rule_ids: Optional[List[str]] = None,
        segments: Optional[List[str]] = None,
        min_interactions: int = 100
    ) -> Dict[str, Any]:
        """
        Optimize personalization rules based on performance data.
        """
        try:
            # Get rules to optimize
            if rule_ids:
                rules = []
                for rule_id in rule_ids:
                    rule = await personalization_rule.get_by_field(
                        db, field="rule_id", value=rule_id
                    )
                    if rule:
                        rules.append(rule)
            else:
                rules = await personalization_rule.get_multi(db, limit=1000)
            
            optimization_results = {
                "optimized_rules": [],
                "recommendations": [],
                "performance_summary": {}
            }
            
            for rule in rules:
                # Skip if not enough data
                if rule.applications_count < min_interactions:
                    continue
                
                # Get rule performance
                performance = await personalization_rule.get_rule_performance_stats(
                    db, rule_id=rule.rule_id, days=30
                )
                
                # Generate optimization recommendations
                recommendations = await self.ml_models.generate_rule_optimization(
                    db, rule, performance
                )
                
                if recommendations:
                    optimization_results["optimized_rules"].append({
                        "rule_id": rule.rule_id,
                        "name": rule.name,
                        "current_performance": performance,
                        "recommendations": recommendations
                    })
            
            # Generate global recommendations
            global_recommendations = await self.ml_models.generate_global_recommendations(
                db, segments=segments
            )
            optimization_results["recommendations"] = global_recommendations
            
            logger.info(
                f"Optimized {len(optimization_results['optimized_rules'])} rules"
            )
            
            return optimization_results
            
        except Exception as e:
            logger.error(f"Error optimizing rules: {e}")
            raise

    async def get_user_insights(
        self,
        db: AsyncSession,
        *,
        user_id: int
    ) -> Dict[str, Any]:
        """
        Get comprehensive personalization insights for a user.
        """
        try:
            profile = await personalization_profile.get_by_user_id(db, user_id=user_id)
            if not profile:
                return {"error": "User profile not found"}
            
            # Get ML insights
            ml_insights = await self.ml_models.generate_user_insights(db, profile)
            
            # Get interaction history
            interactions = await personalization_interaction.get_user_interactions(
                db, user_id=user_id, days=30, limit=100
            )
            
            # Get applied rules
            active_rules = await personalization_rule.get_active_rules_for_user(
                db, user_id=user_id
            )
            
            # Compile insights
            insights = {
                "profile": {
                    "segment": profile.primary_segment,
                    "segment_confidence": profile.segment_confidence,
                    "features_adopted": profile.features_adopted,
                    "last_active_days": profile.last_active_days,
                    "churn_risk": profile.predicted_churn_risk,
                    "lifetime_value": profile.lifetime_value_score
                },
                "ml_insights": ml_insights,
                "recent_interactions": len(interactions),
                "active_rules": len(active_rules),
                "behavior_patterns": profile.usage_patterns or {},
                "personalization_effectiveness": await self._calculate_user_effectiveness(
                    db, user_id
                )
            }
            
            return insights
            
        except Exception as e:
            logger.error(f"Error getting insights for user {user_id}: {e}")
            raise

    # Private helper methods
    
    async def _ensure_user_profile(
        self, 
        db: AsyncSession, 
        user_id: int
    ) -> PersonalizationProfile:
        """Ensure user has a personalization profile."""
        profile = await personalization_profile.get_by_user_id(db, user_id=user_id)
        
        if not profile:
            # Create new profile
            profile_data = await self.user_profiler.compute_full_profile(
                db, user_id=user_id
            )
            profile = await personalization_profile.create_or_update_profile(
                db, user_id=user_id, profile_data=profile_data
            )
        
        return profile

    async def _get_applicable_rules(
        self,
        db: AsyncSession,
        profile: PersonalizationProfile,
        request: PersonalizationRequest
    ) -> List[PersonalizationRule]:
        """Get rules applicable to user and context."""
        rules = await personalization_rule.get_active_rules_for_user(
            db,
            user_id=profile.user_id,
            context=request.context,
            include_ab_tests=request.include_ab_tests
        )
        
        # Apply rule evaluator for advanced filtering
        applicable_rules = []
        for rule in rules[:request.max_rules]:
            if await self.rule_evaluator.evaluate_rule(db, rule, profile, request):
                applicable_rules.append(rule)
        
        return applicable_rules

    async def _generate_configuration(
        self,
        db: AsyncSession,
        profile: PersonalizationProfile,
        rules: List[PersonalizationRule],
        request: PersonalizationRequest
    ) -> PersonalizationConfig:
        """Generate personalized configuration from rules."""
        config_data = {
            "ui_adaptations": {},
            "content_filters": {},
            "feature_flags": {},
            "navigation_customizations": {},
            "active_rules": []
        }
        
        # Apply rules in priority order
        for rule in sorted(rules, key=lambda r: r.priority):
            rule_config = await self.rule_evaluator.apply_rule(
                db, rule, profile, request
            )
            
            # Merge configurations
            for key, value in rule_config.items():
                if key in config_data:
                    if isinstance(config_data[key], dict) and isinstance(value, dict):
                        config_data[key].update(value)
                    else:
                        config_data[key] = value
            
            # Track applied rule
            config_data["active_rules"].append({
                "rule_id": rule.rule_id,
                "name": rule.name,
                "type": rule.personalization_type,
                "priority": rule.priority
            })
        
        # Add ML-driven customizations
        ml_customizations = await self.ml_models.generate_personalized_ui(
            db, profile, request.context
        )
        if ml_customizations:
            for key, value in ml_customizations.items():
                if key in config_data and isinstance(config_data[key], dict):
                    config_data[key].update(value)
        
        return PersonalizationConfig(
            user_id=profile.user_id,
            segment=profile.primary_segment,
            generated_at=datetime.utcnow(),
            cache_expires_at=datetime.utcnow() + timedelta(minutes=5),
            **config_data
        )

    async def _get_default_config(
        self, 
        request: PersonalizationRequest
    ) -> PersonalizationConfig:
        """Get default configuration when personalization fails."""
        return PersonalizationConfig(
            user_id=request.user_id,
            segment="default",
            active_rules=[],
            ui_adaptations={},
            content_filters={},
            feature_flags={},
            navigation_customizations={},
            generated_at=datetime.utcnow(),
            cache_expires_at=datetime.utcnow() + timedelta(minutes=1)
        )

    async def _track_personalization_request(
        self,
        db: AsyncSession,
        request: PersonalizationRequest,
        rules_applied: int,
        response_time_ms: float
    ) -> None:
        """Track personalization request for analytics."""
        try:
            # This could be tracked in a separate analytics table
            # For now, we'll use the interaction table
            interaction = PersonalizationInteractionCreate(
                user_id=request.user_id,
                rule_id="system",  # Special rule ID for system requests
                context=request.context,
                interaction_type="config_request",
                personalization_data={
                    "rules_applied": rules_applied,
                    "max_rules": request.max_rules,
                    "include_ab_tests": request.include_ab_tests,
                    "device_type": request.device_type
                },
                response_time_ms=int(response_time_ms),
                device_type=request.device_type,
                session_id=request.session_id
            )
            
            await personalization_interaction.create_interaction(db, obj_in=interaction)
            
        except Exception as e:
            logger.warning(f"Failed to track personalization request: {e}")

    async def _update_rule_performance(
        self, 
        db: AsyncSession, 
        rule_id: str
    ) -> None:
        """Update rule performance metrics asynchronously."""
        try:
            performance = await personalization_rule.get_rule_performance_stats(
                db, rule_id=rule_id, days=7
            )
            
            await personalization_rule.update_rule_performance(
                db,
                rule_id=rule_id,
                applications_count=performance["total_interactions"],
                success_rate=performance["success_rate"],
                avg_improvement=performance["avg_engagement_score"]
            )
            
        except Exception as e:
            logger.warning(f"Failed to update rule performance for {rule_id}: {e}")

    async def _calculate_user_effectiveness(
        self, 
        db: AsyncSession, 
        user_id: int
    ) -> float:
        """Calculate personalization effectiveness for a user."""
        try:
            analytics = await personalization_interaction.get_interaction_analytics(
                db, user_id=user_id, days=30
            )
            
            # Simple effectiveness score based on positive outcomes
            return analytics.get("success_rate", 0.0)
            
        except Exception as e:
            logger.warning(f"Failed to calculate effectiveness for user {user_id}: {e}")
            return 0.0