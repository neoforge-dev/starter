"""Pydantic schemas for A/B Testing API requests and responses."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from enum import Enum

from pydantic import BaseModel, Field, field_validator, model_validator


class AbTestStatus(str, Enum):
    """A/B Test status enumeration."""
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class StatisticalMethod(str, Enum):
    """Statistical significance testing methods."""
    FREQUENTIST = "frequentist"  # Traditional p-value testing
    BAYESIAN = "bayesian"       # Bayesian A/B testing
    SEQUENTIAL = "sequential"   # Sequential analysis


# Base schemas for A/B Test Variants
class AbTestVariantBase(BaseModel):
    """Base schema for A/B test variants."""
    variant_key: str = Field(..., min_length=1, max_length=50, description="Unique variant identifier")
    name: str = Field(..., min_length=1, max_length=200, description="Human-readable variant name")
    description: Optional[str] = Field(None, max_length=1000, description="Variant description")
    traffic_allocation: float = Field(..., ge=0.0, le=1.0, description="Traffic allocation (0.0-1.0)")
    is_control: bool = Field(False, description="Whether this is the control variant")
    configuration: Optional[Dict[str, Any]] = Field(None, description="Variant configuration")

    @field_validator('variant_key')
    @classmethod
    def validate_variant_key(cls, v):
        """Validate variant key format."""
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Variant key must contain only alphanumeric characters, hyphens, and underscores')
        return v.lower()


class AbTestVariantCreate(AbTestVariantBase):
    """Schema for creating A/B test variants."""
    pass


class AbTestVariantUpdate(BaseModel):
    """Schema for updating A/B test variants."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    traffic_allocation: Optional[float] = Field(None, ge=0.0, le=1.0)
    configuration: Optional[Dict[str, Any]] = None


class AbTestVariantResponse(AbTestVariantBase):
    """Schema for A/B test variant responses."""
    id: int
    test_id: int
    total_users: int = 0
    total_conversions: int = 0
    conversion_rate: float = 0.0
    confidence_interval_lower: Optional[float] = None
    confidence_interval_upper: Optional[float] = None
    p_value: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @property
    def conversion_rate_percentage(self) -> float:
        """Get conversion rate as percentage."""
        return self.conversion_rate * 100

    @property
    def statistical_significance(self) -> Optional[str]:
        """Get statistical significance level."""
        if self.p_value is None:
            return None
        if self.p_value < 0.01:
            return "high"
        elif self.p_value < 0.05:
            return "medium"
        elif self.p_value < 0.1:
            return "low"
        return "none"


# Base schemas for A/B Tests
class AbTestBase(BaseModel):
    """Base schema for A/B tests."""
    test_key: str = Field(..., min_length=1, max_length=100, description="Unique test identifier")
    name: str = Field(..., min_length=1, max_length=200, description="Human-readable test name")
    description: Optional[str] = Field(None, max_length=5000, description="Test description and hypothesis")
    traffic_allocation: float = Field(1.0, ge=0.0, le=1.0, description="Percentage of users to include")
    primary_metric: str = Field(..., min_length=1, max_length=100, description="Primary conversion metric")
    secondary_metrics: Optional[Dict[str, Any]] = Field(None, description="Additional metrics to track")
    confidence_level: float = Field(0.95, ge=0.8, le=0.99, description="Required confidence level")
    minimum_detectable_effect: float = Field(0.05, ge=0.01, le=0.5, description="Minimum effect size")
    minimum_sample_size: int = Field(1000, ge=100, le=1000000, description="Minimum sample size per variant")
    targeting_rules: Optional[Dict[str, Any]] = Field(None, description="User targeting rules")

    @field_validator('test_key')
    @classmethod
    def validate_test_key(cls, v):
        """Validate test key format."""
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Test key must contain only alphanumeric characters, hyphens, and underscores')
        return v.lower()

    @field_validator('primary_metric')
    @classmethod
    def validate_primary_metric(cls, v):
        """Validate primary metric format."""
        if not v.replace('_', '').replace('-', '').replace('.', '').isalnum():
            raise ValueError('Primary metric must be a valid event name')
        return v


class AbTestCreate(AbTestBase):
    """Schema for creating A/B tests."""
    start_date: Optional[datetime] = Field(None, description="Test start date")
    end_date: Optional[datetime] = Field(None, description="Test end date")
    variants: List[AbTestVariantCreate] = Field(..., min_items=2, max_items=10, description="Test variants")

    @model_validator(mode='after')
    def validate_test_dates(self):
        """Validate test date logic."""
        if self.start_date and self.end_date:
            if self.end_date <= self.start_date:
                raise ValueError('End date must be after start date')
                
        if self.start_date and self.start_date < datetime.utcnow():
            raise ValueError('Start date cannot be in the past')
            
        return self

    @model_validator(mode='after')
    def validate_variants(self):
        """Validate variant configuration."""
        if not self.variants:
            return self
            
        # Check for exactly one control variant
        control_count = sum(1 for v in self.variants if v.is_control)
        if control_count != 1:
            raise ValueError('Exactly one variant must be marked as control')
            
        # Check unique variant keys
        variant_keys = [v.variant_key for v in self.variants]
        if len(variant_keys) != len(set(variant_keys)):
            raise ValueError('Variant keys must be unique')
            
        # Check traffic allocation sums to 1.0 (with tolerance)
        total_allocation = sum(v.traffic_allocation for v in self.variants)
        if abs(total_allocation - 1.0) > 0.001:
            raise ValueError('Variant traffic allocations must sum to 1.0')
            
        return self


class AbTestUpdate(BaseModel):
    """Schema for updating A/B tests."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    status: Optional[AbTestStatus] = None
    traffic_allocation: Optional[float] = Field(None, ge=0.0, le=1.0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    targeting_rules: Optional[Dict[str, Any]] = None
    confidence_level: Optional[float] = Field(None, ge=0.8, le=0.99)
    minimum_detectable_effect: Optional[float] = Field(None, ge=0.01, le=0.5)
    minimum_sample_size: Optional[int] = Field(None, ge=100, le=1000000)

    @model_validator(mode='after')
    def validate_test_dates(self):
        """Validate test date logic."""
        if self.start_date and self.end_date:
            if self.end_date <= self.start_date:
                raise ValueError('End date must be after start date')
                
        return self


class AbTestResponse(AbTestBase):
    """Schema for A/B test responses."""
    id: int
    status: AbTestStatus
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_statistically_significant: bool = False
    significance_reached_at: Optional[datetime] = None
    winner_variant_id: Optional[int] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    variants: List[AbTestVariantResponse] = []

    class Config:
        from_attributes = True

    @property
    def is_active(self) -> bool:
        """Check if test is currently active."""
        if self.status != AbTestStatus.ACTIVE:
            return False
            
        now = datetime.utcnow()
        
        if self.start_date and now < self.start_date:
            return False
            
        if self.end_date and now > self.end_date:
            return False
            
        return True

    @property
    def total_participants(self) -> int:
        """Get total test participants."""
        return sum(variant.total_users for variant in self.variants)

    @property
    def total_conversions(self) -> int:
        """Get total conversions."""
        return sum(variant.total_conversions for variant in self.variants)

    @property
    def overall_conversion_rate(self) -> float:
        """Get overall conversion rate."""
        total_users = self.total_participants
        if total_users == 0:
            return 0.0
        return self.total_conversions / total_users

    @property
    def control_variant(self) -> Optional[AbTestVariantResponse]:
        """Get the control variant."""
        for variant in self.variants:
            if variant.is_control:
                return variant
        return None

    @property
    def treatment_variants(self) -> List[AbTestVariantResponse]:
        """Get all treatment (non-control) variants."""
        return [variant for variant in self.variants if not variant.is_control]


# Assignment schemas
class AbTestAssignmentRequest(BaseModel):
    """Schema for requesting A/B test assignment."""
    test_key: str = Field(..., description="Test key to get assignment for")
    user_id: Optional[int] = Field(None, description="User ID (if authenticated)")
    session_id: Optional[str] = Field(None, description="Session ID (for anonymous users)")
    context: Optional[Dict[str, Any]] = Field(None, description="Assignment context")

    @model_validator(mode='after')
    def validate_user_identification(self):
        """Ensure either user_id or session_id is provided."""
        if not self.user_id and not self.session_id:
            raise ValueError('Either user_id or session_id must be provided')
            
        return self


class AbTestAssignmentResponse(BaseModel):
    """Schema for A/B test assignment response."""
    test_id: int
    test_key: str
    variant_id: int
    variant_key: str
    variant_configuration: Optional[Dict[str, Any]] = None
    assigned_at: datetime
    is_control: bool
    
    class Config:
        from_attributes = True


class AbTestConversionRequest(BaseModel):
    """Schema for tracking A/B test conversions."""
    test_key: str = Field(..., description="Test key")
    user_id: Optional[int] = Field(None, description="User ID (if authenticated)")
    session_id: Optional[str] = Field(None, description="Session ID (for anonymous users)")
    metric_name: str = Field(..., description="Conversion metric name")
    value: Optional[float] = Field(None, description="Conversion value")
    properties: Optional[Dict[str, Any]] = Field(None, description="Additional properties")

    @model_validator(mode='after')
    def validate_user_identification(self):
        """Ensure either user_id or session_id is provided."""
        if not self.user_id and not self.session_id:
            raise ValueError('Either user_id or session_id must be provided')
            
        return self


# Analytics schemas
class AbTestAnalyticsQuery(BaseModel):
    """Schema for A/B test analytics queries."""
    test_ids: Optional[List[int]] = Field(None, description="Specific test IDs to analyze")
    test_keys: Optional[List[str]] = Field(None, description="Specific test keys to analyze")
    status_filter: Optional[List[AbTestStatus]] = Field(None, description="Filter by test status")
    start_date: Optional[datetime] = Field(None, description="Analysis start date")
    end_date: Optional[datetime] = Field(None, description="Analysis end date")
    include_segments: bool = Field(False, description="Include segment-based analysis")
    statistical_method: StatisticalMethod = Field(StatisticalMethod.FREQUENTIST, description="Statistical method")


class AbTestAnalyticsResponse(BaseModel):
    """Schema for A/B test analytics response."""
    test_id: int
    test_key: str
    test_name: str
    status: AbTestStatus
    total_participants: int
    total_conversions: int
    overall_conversion_rate: float
    is_statistically_significant: bool
    confidence_level: float
    variants: List[AbTestVariantResponse]
    insights: List[str] = Field(default_factory=list, description="Automated insights")
    recommendations: List[str] = Field(default_factory=list, description="Recommendations")
    
    class Config:
        from_attributes = True


class AbTestListResponse(BaseModel):
    """Schema for paginated A/B test list responses."""
    tests: List[AbTestResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

    class Config:
        from_attributes = True


# Bulk operations
class AbTestBulkStatusUpdate(BaseModel):
    """Schema for bulk status updates."""
    test_ids: List[int] = Field(..., min_items=1, description="Test IDs to update")
    status: AbTestStatus = Field(..., description="New status")
    reason: Optional[str] = Field(None, description="Reason for status change")


class AbTestBulkDeleteRequest(BaseModel):
    """Schema for bulk delete requests."""
    test_ids: List[int] = Field(..., min_items=1, description="Test IDs to delete")
    confirm: bool = Field(..., description="Confirmation of deletion")
    archive_instead: bool = Field(False, description="Archive instead of delete")


# Statistics schemas
class VariantStatistics(BaseModel):
    """Detailed statistics for a variant."""
    variant_id: int
    variant_key: str
    variant_name: str
    is_control: bool
    participants: int
    conversions: int
    conversion_rate: float
    confidence_interval: Optional[tuple[float, float]] = None
    p_value: Optional[float] = None
    statistical_power: Optional[float] = None
    effect_size: Optional[float] = None
    relative_improvement: Optional[float] = None  # vs control


class AbTestStatisticalReport(BaseModel):
    """Comprehensive statistical report for an A/B test."""
    test_id: int
    test_key: str
    test_name: str
    analysis_date: datetime
    statistical_method: StatisticalMethod
    confidence_level: float
    minimum_detectable_effect: float
    
    # Overall test metrics
    total_participants: int
    test_duration_days: Optional[int] = None
    is_statistically_significant: bool
    overall_p_value: Optional[float] = None
    
    # Variant statistics
    control_variant: VariantStatistics
    treatment_variants: List[VariantStatistics]
    
    # Recommendations
    recommended_action: str  # "continue", "declare_winner", "stop_test", "need_more_data"
    winner_variant_id: Optional[int] = None
    confidence_in_result: float  # 0.0 to 1.0
    insights: List[str]
    
    class Config:
        from_attributes = True