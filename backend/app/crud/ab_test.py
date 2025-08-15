"""CRUD operations for A/B Testing with statistical analysis and user assignment."""
import hashlib
import math
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4

from sqlalchemy import and_, desc, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.crud.base import CRUDBase
from app.models.ab_test import AbTest, AbTestVariant, AbTestAssignment
from app.models.event import Event
from app.schemas.ab_test import (
    AbTestCreate, AbTestUpdate, AbTestVariantCreate, AbTestVariantUpdate,
    AbTestAssignmentRequest, AbTestConversionRequest, AbTestAnalyticsQuery,
    AbTestStatus, StatisticalMethod, VariantStatistics, AbTestStatisticalReport
)


class CRUDAbTest(CRUDBase[AbTest, AbTestCreate, AbTestUpdate]):
    """CRUD operations for A/B Tests with advanced analytics and statistical testing."""

    async def create_with_variants(
        self,
        db: AsyncSession,
        *,
        obj_in: AbTestCreate,
        created_by: Optional[int] = None,
    ) -> AbTest:
        """Create A/B test with variants in a single transaction."""
        # Create the test
        test_data = obj_in.model_dump(exclude={"variants"})
        test_data["created_by"] = created_by
        test_data["status"] = AbTestStatus.DRAFT
        
        db_test = AbTest(**test_data)
        db.add(db_test)
        await db.flush()  # Get the test ID
        
        # Create variants
        for variant_data in obj_in.variants:
            variant_dict = variant_data.model_dump()
            variant_dict["test_id"] = db_test.id
            db_variant = AbTestVariant(**variant_dict)
            db.add(db_variant)
        
        await db.commit()
        await db.refresh(db_test)
        return db_test

    async def get_by_test_key(
        self, 
        db: AsyncSession, 
        *, 
        test_key: str
    ) -> Optional[AbTest]:
        """Get A/B test by test key."""
        result = await db.execute(
            select(AbTest)
            .options(selectinload(AbTest.variants))
            .where(AbTest.test_key == test_key)
        )
        return result.scalar_one_or_none()

    async def get_active_tests(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> List[AbTest]:
        """Get all currently active A/B tests."""
        now = datetime.utcnow()
        query = (
            select(AbTest)
            .options(selectinload(AbTest.variants))
            .where(
                and_(
                    AbTest.status == AbTestStatus.ACTIVE,
                    or_(AbTest.start_date.is_(None), AbTest.start_date <= now),
                    or_(AbTest.end_date.is_(None), AbTest.end_date > now)
                )
            )
            .order_by(desc(AbTest.created_at))
            .offset(skip)
            .limit(limit)
        )
        
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_user_tests(
        self,
        db: AsyncSession,
        *,
        user_id: Optional[int] = None,
        session_id: Optional[str] = None,
        active_only: bool = True,
    ) -> List[Tuple[AbTest, AbTestVariant]]:
        """Get all tests a user is assigned to."""
        user_hash = self._generate_user_hash(user_id, session_id)
        
        query = (
            select(AbTest, AbTestVariant)
            .join(AbTestAssignment)
            .join(AbTestVariant)
            .where(AbTestAssignment.user_hash == user_hash)
        )
        
        if active_only:
            now = datetime.utcnow()
            query = query.where(
                and_(
                    AbTest.status == AbTestStatus.ACTIVE,
                    or_(AbTest.start_date.is_(None), AbTest.start_date <= now),
                    or_(AbTest.end_date.is_(None), AbTest.end_date > now)
                )
            )
            
        result = await db.execute(query)
        return list(result.all())

    async def assign_user_to_test(
        self,
        db: AsyncSession,
        *,
        request: AbTestAssignmentRequest,
        context: Optional[Dict[str, Any]] = None,
    ) -> Optional[Tuple[AbTest, AbTestVariant]]:
        """Assign user to A/B test variant using consistent hashing."""
        # Get the test
        test = await self.get_by_test_key(db, test_key=request.test_key)
        if not test or not test.is_active:
            return None
            
        # Check traffic allocation
        user_hash = self._generate_user_hash(request.user_id, request.session_id)
        if not self._should_include_in_test(user_hash, test.traffic_allocation):
            return None
            
        # Check existing assignment
        existing_assignment = await self._get_existing_assignment(
            db, test.id, request.user_id, request.session_id, user_hash
        )
        if existing_assignment:
            return test, existing_assignment.variant
            
        # Assign to variant using consistent hashing
        variant = self._assign_to_variant(test.variants, user_hash)
        if not variant:
            return None
            
        # Create assignment record
        assignment_data = {
            "test_id": test.id,
            "variant_id": variant.id,
            "user_id": request.user_id,
            "session_id": request.session_id,
            "user_hash": user_hash,
            "context": context or request.context,
        }
        
        db_assignment = AbTestAssignment(**assignment_data)
        db.add(db_assignment)
        await db.commit()
        
        return test, variant

    async def track_conversion(
        self,
        db: AsyncSession,
        *,
        request: AbTestConversionRequest,
    ) -> bool:
        """Track conversion for A/B test."""
        # Get test and assignment
        test = await self.get_by_test_key(db, test_key=request.test_key)
        if not test:
            return False
            
        user_hash = self._generate_user_hash(request.user_id, request.session_id)
        assignment = await self._get_existing_assignment(
            db, test.id, request.user_id, request.session_id, user_hash
        )
        
        if not assignment:
            return False
            
        # Update assignment with conversion
        if not assignment.converted and request.metric_name == test.primary_metric:
            assignment.mark_conversion(request.value)
            await db.commit()
            
            # Update variant metrics
            await self._update_variant_metrics(db, assignment.variant_id)
            
        return True

    async def get_test_analytics(
        self,
        db: AsyncSession,
        *,
        test_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Optional[AbTestStatisticalReport]:
        """Get comprehensive analytics for an A/B test."""
        test = await self.get(db, id=test_id)
        if not test:
            return None
            
        # Get assignment data
        query = select(AbTestAssignment).where(AbTestAssignment.test_id == test_id)
        
        if start_date:
            query = query.where(AbTestAssignment.assigned_at >= start_date)
        if end_date:
            query = query.where(AbTestAssignment.assigned_at <= end_date)
            
        result = await db.execute(query)
        assignments = list(result.scalars().all())
        
        # Calculate statistics for each variant
        variant_stats = []
        control_variant = None
        
        for variant in test.variants:
            variant_assignments = [a for a in assignments if a.variant_id == variant.id]
            participants = len(variant_assignments)
            conversions = sum(1 for a in variant_assignments if a.converted)
            conversion_rate = conversions / participants if participants > 0 else 0.0
            
            stats = VariantStatistics(
                variant_id=variant.id,
                variant_key=variant.variant_key,
                variant_name=variant.name,
                is_control=variant.is_control,
                participants=participants,
                conversions=conversions,
                conversion_rate=conversion_rate,
            )
            
            if variant.is_control:
                control_variant = stats
            else:
                variant_stats.append(stats)
                
        if not control_variant:
            return None
            
        # Calculate statistical significance
        for stats in variant_stats:
            p_value, ci = self._calculate_significance(control_variant, stats, test.confidence_level)
            stats.p_value = p_value
            stats.confidence_interval = ci
            if control_variant.conversion_rate > 0:
                stats.relative_improvement = (
                    (stats.conversion_rate - control_variant.conversion_rate) / 
                    control_variant.conversion_rate
                )
                
        # Determine overall significance
        is_significant = any(s.p_value and s.p_value < 0.05 for s in variant_stats)
        overall_p_value = min((s.p_value for s in variant_stats if s.p_value), default=None)
        
        # Generate insights and recommendations
        insights, recommended_action, winner_id, confidence = self._generate_insights(
            test, control_variant, variant_stats, is_significant
        )
        
        return AbTestStatisticalReport(
            test_id=test.id,
            test_key=test.test_key,
            test_name=test.name,
            analysis_date=datetime.utcnow(),
            statistical_method=StatisticalMethod.FREQUENTIST,
            confidence_level=test.confidence_level,
            minimum_detectable_effect=test.minimum_detectable_effect,
            total_participants=sum(len([a for a in assignments if a.variant_id == v.id]) for v in test.variants),
            test_duration_days=(datetime.utcnow() - test.start_date).days if test.start_date else None,
            is_statistically_significant=is_significant,
            overall_p_value=overall_p_value,
            control_variant=control_variant,
            treatment_variants=variant_stats,
            recommended_action=recommended_action,
            winner_variant_id=winner_id,
            confidence_in_result=confidence,
            insights=insights,
        )

    async def update_test_status(
        self,
        db: AsyncSession,
        *,
        test_id: int,
        status: AbTestStatus,
        winner_variant_id: Optional[int] = None,
    ) -> Optional[AbTest]:
        """Update test status and optionally declare winner."""
        test = await self.get(db, id=test_id)
        if not test:
            return None
            
        update_data = {"status": status}
        
        if status == AbTestStatus.COMPLETED and winner_variant_id:
            update_data["winner_variant_id"] = winner_variant_id
            
        if status == AbTestStatus.ACTIVE and not test.start_date:
            update_data["start_date"] = datetime.utcnow()
            
        for field, value in update_data.items():
            setattr(test, field, value)
            
        await db.commit()
        await db.refresh(test)
        return test

    async def get_test_performance_metrics(
        self,
        db: AsyncSession,
        *,
        test_ids: Optional[List[int]] = None,
        date_range_days: int = 30,
    ) -> Dict[str, Any]:
        """Get performance metrics across tests."""
        cutoff_date = datetime.utcnow() - timedelta(days=date_range_days)
        
        query = select(AbTest).where(AbTest.created_at >= cutoff_date)
        if test_ids:
            query = query.where(AbTest.id.in_(test_ids))
            
        result = await db.execute(query)
        tests = list(result.scalars().all())
        
        metrics = {
            "total_tests": len(tests),
            "active_tests": len([t for t in tests if t.status == AbTestStatus.ACTIVE]),
            "completed_tests": len([t for t in tests if t.status == AbTestStatus.COMPLETED]),
            "significant_tests": len([t for t in tests if t.is_statistically_significant]),
            "total_participants": 0,
            "average_conversion_rate": 0.0,
            "test_completion_rate": 0.0,
        }
        
        if tests:
            # Get participant counts
            test_ids_list = [t.id for t in tests]
            participants_query = (
                select(func.count(AbTestAssignment.id))
                .where(AbTestAssignment.test_id.in_(test_ids_list))
            )
            result = await db.execute(participants_query)
            metrics["total_participants"] = result.scalar() or 0
            
            # Calculate completion rate
            eligible_for_completion = len([
                t for t in tests 
                if t.status in [AbTestStatus.ACTIVE, AbTestStatus.COMPLETED, AbTestStatus.PAUSED]
            ])
            if eligible_for_completion > 0:
                metrics["test_completion_rate"] = metrics["completed_tests"] / eligible_for_completion
                
        return metrics

    # Private helper methods
    
    def _generate_user_hash(self, user_id: Optional[int], session_id: Optional[str]) -> str:
        """Generate consistent hash for user assignment."""
        identifier = str(user_id) if user_id else session_id or ""
        return hashlib.sha256(identifier.encode()).hexdigest()[:16]

    def _should_include_in_test(self, user_hash: str, traffic_allocation: float) -> bool:
        """Determine if user should be included based on traffic allocation."""
        hash_int = int(user_hash[:8], 16)
        threshold = int(0xFFFFFFFF * traffic_allocation)
        return hash_int <= threshold

    def _assign_to_variant(self, variants: List[AbTestVariant], user_hash: str) -> Optional[AbTestVariant]:
        """Assign user to variant using consistent hashing."""
        if not variants:
            return None
            
        # Sort variants by key for consistency
        sorted_variants = sorted(variants, key=lambda v: v.variant_key)
        
        # Calculate cumulative allocation thresholds
        cumulative_allocation = 0.0
        thresholds = []
        
        for variant in sorted_variants:
            cumulative_allocation += variant.traffic_allocation
            thresholds.append((cumulative_allocation, variant))
            
        # Use hash to determine assignment
        hash_int = int(user_hash[8:16], 16)
        hash_float = hash_int / 0xFFFFFFFF
        
        for threshold, variant in thresholds:
            if hash_float <= threshold:
                return variant
                
        # Fallback to last variant
        return sorted_variants[-1] if sorted_variants else None

    async def _get_existing_assignment(
        self,
        db: AsyncSession,
        test_id: int,
        user_id: Optional[int],
        session_id: Optional[str],
        user_hash: str,
    ) -> Optional[AbTestAssignment]:
        """Get existing assignment for user."""
        query = (
            select(AbTestAssignment)
            .options(selectinload(AbTestAssignment.variant))
            .where(
                and_(
                    AbTestAssignment.test_id == test_id,
                    AbTestAssignment.user_hash == user_hash
                )
            )
        )
        
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def _update_variant_metrics(self, db: AsyncSession, variant_id: int) -> None:
        """Update cached metrics for a variant."""
        # Count total assignments and conversions
        assignments_query = (
            select(
                func.count(AbTestAssignment.id).label("total_users"),
                func.sum(func.cast(AbTestAssignment.converted, int)).label("total_conversions")
            )
            .where(AbTestAssignment.variant_id == variant_id)
        )
        
        result = await db.execute(assignments_query)
        row = result.first()
        
        total_users = row.total_users or 0
        total_conversions = row.total_conversions or 0
        conversion_rate = total_conversions / total_users if total_users > 0 else 0.0
        
        # Update variant
        update_query = (
            update(AbTestVariant)
            .where(AbTestVariant.id == variant_id)
            .values(
                total_users=total_users,
                total_conversions=total_conversions,
                conversion_rate=conversion_rate
            )
        )
        
        await db.execute(update_query)
        await db.commit()

    def _calculate_significance(
        self,
        control: VariantStatistics,
        treatment: VariantStatistics,
        confidence_level: float,
    ) -> Tuple[Optional[float], Optional[Tuple[float, float]]]:
        """Calculate statistical significance using two-proportion z-test."""
        if control.participants < 100 or treatment.participants < 100:
            return None, None
            
        try:
            # Two-proportion z-test
            p1 = control.conversion_rate
            p2 = treatment.conversion_rate
            n1 = control.participants
            n2 = treatment.participants
            
            # Pooled proportion
            p_pool = (control.conversions + treatment.conversions) / (n1 + n2)
            
            # Standard error
            se = math.sqrt(p_pool * (1 - p_pool) * (1/n1 + 1/n2))
            
            if se == 0:
                return None, None
                
            # Z-score
            z = (p2 - p1) / se
            
            # P-value (two-tailed)
            p_value = 2 * (1 - self._normal_cdf(abs(z)))
            
            # Confidence interval for difference
            z_critical = self._inverse_normal_cdf((1 + confidence_level) / 2)
            se_diff = math.sqrt((p1 * (1 - p1) / n1) + (p2 * (1 - p2) / n2))
            
            diff = p2 - p1
            margin = z_critical * se_diff
            ci_lower = diff - margin
            ci_upper = diff + margin
            
            return p_value, (ci_lower, ci_upper)
            
        except (ZeroDivisionError, ValueError, OverflowError):
            return None, None

    def _normal_cdf(self, x: float) -> float:
        """Cumulative distribution function for standard normal distribution."""
        return (1.0 + math.erf(x / math.sqrt(2.0))) / 2.0

    def _inverse_normal_cdf(self, p: float) -> float:
        """Inverse CDF for standard normal (approximation)."""
        if p <= 0 or p >= 1:
            raise ValueError("p must be between 0 and 1")
            
        # Beasley-Springer-Moro approximation
        if p == 0.5:
            return 0.0
            
        if p > 0.5:
            sign = 1
            p = 1 - p
        else:
            sign = -1
            
        ln_p = math.log(p)
        
        c0 = 2.515517
        c1 = 0.802853
        c2 = 0.010328
        d1 = 1.432788
        d2 = 0.189269
        d3 = 0.001308
        
        t = math.sqrt(-2 * ln_p)
        numerator = c0 + c1 * t + c2 * t * t
        denominator = 1 + d1 * t + d2 * t * t + d3 * t * t * t
        
        return sign * (t - numerator / denominator)

    def _generate_insights(
        self,
        test: AbTest,
        control: VariantStatistics,
        treatments: List[VariantStatistics],
        is_significant: bool,
    ) -> Tuple[List[str], str, Optional[int], float]:
        """Generate insights and recommendations."""
        insights = []
        recommended_action = "continue"
        winner_id = None
        confidence = 0.5
        
        # Check sample size
        min_sample = test.minimum_sample_size
        all_variants = [control] + treatments
        insufficient_sample = any(v.participants < min_sample for v in all_variants)
        
        if insufficient_sample:
            insights.append(f"Sample size below minimum threshold ({min_sample} per variant)")
            recommended_action = "need_more_data"
            confidence = 0.3
            return insights, recommended_action, winner_id, confidence
            
        # Check for statistical significance
        if is_significant:
            best_treatment = max(treatments, key=lambda x: x.conversion_rate, default=None)
            
            if best_treatment and best_treatment.conversion_rate > control.conversion_rate:
                improvement = best_treatment.relative_improvement or 0
                insights.append(f"Variant {best_treatment.variant_key} shows {improvement:.1%} improvement")
                insights.append(f"Statistical significance achieved (p < 0.05)")
                recommended_action = "declare_winner"
                winner_id = best_treatment.variant_id
                confidence = 0.9
            else:
                insights.append("No treatment variant outperforms control")
                recommended_action = "stop_test"
                confidence = 0.8
        else:
            # Check for practical significance
            best_treatment = max(treatments, key=lambda x: x.conversion_rate, default=None)
            if best_treatment:
                improvement = best_treatment.relative_improvement or 0
                if improvement >= test.minimum_detectable_effect:
                    insights.append(f"Promising trend in {best_treatment.variant_key} (+{improvement:.1%})")
                    insights.append("Consider extending test duration for significance")
                    confidence = 0.6
                else:
                    insights.append("No meaningful difference detected between variants")
                    confidence = 0.7
                    
        return insights, recommended_action, winner_id, confidence


# Create instance
ab_test = CRUDAbTest(AbTest)