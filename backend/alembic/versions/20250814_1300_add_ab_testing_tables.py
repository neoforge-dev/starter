"""Add A/B testing tables for experiment management and analytics

Revision ID: 20250814_add_ab_testing_tables
Revises: 20250814_add_event_tracking_table
Create Date: 2025-08-14 13:00:00

This migration creates the A/B testing system for conversion optimization:
- AbTest table for experiment management with statistical configuration
- AbTestVariant table for managing different test versions with traffic allocation
- AbTestAssignment table for user assignment tracking with consistent hashing
- Comprehensive indexing strategy for high-performance variant assignment and analytics
- Statistical significance tracking with confidence intervals and p-values

Key Features:
- Supports thousands of concurrent tests with millisecond assignment response times
- Consistent user assignment using deterministic hashing for stable experiences
- Multi-variant testing (A/B/C/D...) with flexible traffic allocation
- Real-time statistical analysis with automated significance detection
- Integration with event tracking for conversion measurement
- Progressive rollout capabilities with targeting rules and segmentation
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20250814_add_ab_testing_tables"
down_revision: Union[str, None] = "20250814_add_event_tracking_table"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create A/B testing tables with comprehensive indexing."""

    # Create ab_tests table
    op.create_table(
        "ab_tests",
        # Primary key and timestamps (inherited from Base)
        sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        # Test identification and metadata
        sa.Column(
            "test_key",
            sa.String(100),
            nullable=False,
            unique=True,
            index=True,
            comment="Unique test identifier for code integration",
        ),
        sa.Column(
            "name", sa.String(200), nullable=False, comment="Human-readable test name"
        ),
        sa.Column(
            "description",
            sa.Text(),
            nullable=True,
            comment="Detailed test description and hypothesis",
        ),
        # Test configuration
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            index=True,
            server_default="draft",
            comment="Test status: draft, active, paused, completed, archived",
        ),
        sa.Column(
            "traffic_allocation",
            sa.Float(),
            nullable=False,
            server_default="1.0",
            comment="Percentage of users to include in test (0.0-1.0)",
        ),
        # Test lifecycle dates
        sa.Column(
            "start_date",
            sa.DateTime(),
            nullable=True,
            comment="Test start date and time",
        ),
        sa.Column(
            "end_date", sa.DateTime(), nullable=True, comment="Test end date and time"
        ),
        # Success metrics configuration
        sa.Column(
            "primary_metric",
            sa.String(100),
            nullable=False,
            comment="Primary conversion metric to optimize (event_name)",
        ),
        sa.Column(
            "secondary_metrics",
            postgresql.JSON(),
            nullable=True,
            comment="Additional metrics to track (event names and configurations)",
        ),
        # Statistical configuration
        sa.Column(
            "confidence_level",
            sa.Float(),
            nullable=False,
            server_default="0.95",
            comment="Required confidence level for statistical significance (0.8-0.99)",
        ),
        sa.Column(
            "minimum_detectable_effect",
            sa.Float(),
            nullable=False,
            server_default="0.05",
            comment="Minimum effect size to detect (5% = 0.05)",
        ),
        sa.Column(
            "minimum_sample_size",
            sa.Integer(),
            nullable=False,
            server_default="1000",
            comment="Minimum sample size per variant before considering results",
        ),
        # Targeting and segmentation
        sa.Column(
            "targeting_rules",
            postgresql.JSON(),
            nullable=True,
            comment="User targeting rules (geography, attributes, segments)",
        ),
        # Test results and statistics
        sa.Column(
            "is_statistically_significant",
            sa.Boolean(),
            nullable=False,
            server_default="false",
            comment="Whether test has reached statistical significance",
        ),
        sa.Column(
            "significance_reached_at",
            sa.DateTime(),
            nullable=True,
            comment="When statistical significance was first reached",
        ),
        sa.Column(
            "winner_variant_id",
            sa.Integer(),
            nullable=True,
            comment="ID of winning variant (if test is concluded)",
        ),
        # Metadata
        sa.Column(
            "created_by",
            sa.Integer(),
            nullable=True,
            comment="User who created the test",
        ),
        # Foreign key constraints
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
    )

    # Create ab_test_variants table
    op.create_table(
        "ab_test_variants",
        # Primary key and timestamps (inherited from Base)
        sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        # Variant identification
        sa.Column(
            "test_id",
            sa.Integer(),
            nullable=False,
            comment="Reference to parent A/B test",
        ),
        sa.Column(
            "variant_key",
            sa.String(50),
            nullable=False,
            comment="Variant identifier (control, variant_a, variant_b, etc.)",
        ),
        sa.Column(
            "name",
            sa.String(200),
            nullable=False,
            comment="Human-readable variant name",
        ),
        sa.Column(
            "description",
            sa.Text(),
            nullable=True,
            comment="Variant description and changes",
        ),
        # Traffic allocation
        sa.Column(
            "traffic_allocation",
            sa.Float(),
            nullable=False,
            comment="Percentage of test traffic allocated to this variant (0.0-1.0)",
        ),
        # Variant configuration
        sa.Column(
            "is_control",
            sa.Boolean(),
            nullable=False,
            server_default="false",
            comment="Whether this is the control/baseline variant",
        ),
        # Variant content and settings
        sa.Column(
            "configuration",
            postgresql.JSON(),
            nullable=True,
            comment="Variant-specific configuration and content",
        ),
        # Performance metrics (calculated fields)
        sa.Column(
            "total_users",
            sa.Integer(),
            nullable=False,
            server_default="0",
            comment="Total users assigned to this variant",
        ),
        sa.Column(
            "total_conversions",
            sa.Integer(),
            nullable=False,
            server_default="0",
            comment="Total conversions for primary metric",
        ),
        sa.Column(
            "conversion_rate",
            sa.Float(),
            nullable=False,
            server_default="0.0",
            comment="Calculated conversion rate (conversions/users)",
        ),
        # Statistical metrics
        sa.Column(
            "confidence_interval_lower",
            sa.Float(),
            nullable=True,
            comment="Lower bound of confidence interval",
        ),
        sa.Column(
            "confidence_interval_upper",
            sa.Float(),
            nullable=True,
            comment="Upper bound of confidence interval",
        ),
        sa.Column(
            "p_value",
            sa.Float(),
            nullable=True,
            comment="P-value compared to control variant",
        ),
        # Foreign key constraints
        sa.ForeignKeyConstraint(["test_id"], ["ab_tests.id"], ondelete="CASCADE"),
    )

    # Create ab_test_assignments table
    op.create_table(
        "ab_test_assignments",
        # Primary key and timestamps (inherited from Base)
        sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        # Assignment identification
        sa.Column(
            "test_id", sa.Integer(), nullable=False, comment="Reference to A/B test"
        ),
        sa.Column(
            "variant_id",
            sa.Integer(),
            nullable=False,
            comment="Reference to assigned variant",
        ),
        # User identification (supports both authenticated and anonymous users)
        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=True,
            comment="Authenticated user ID (if logged in)",
        ),
        sa.Column(
            "session_id",
            sa.String(64),
            nullable=True,
            index=True,
            comment="Session ID for anonymous users",
        ),
        sa.Column(
            "user_hash",
            sa.String(64),
            nullable=False,
            index=True,
            comment="Consistent hash for user assignment (based on ID or session)",
        ),
        # Assignment metadata
        sa.Column(
            "assigned_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
            comment="When user was assigned to variant",
        ),
        # Conversion tracking
        sa.Column(
            "converted",
            sa.Boolean(),
            nullable=False,
            server_default="false",
            comment="Whether user converted on primary metric",
        ),
        sa.Column(
            "converted_at",
            sa.DateTime(),
            nullable=True,
            comment="When conversion occurred",
        ),
        sa.Column(
            "conversion_value",
            sa.Float(),
            nullable=True,
            comment="Monetary or numeric value of conversion",
        ),
        # Additional tracking
        sa.Column(
            "first_exposure_at",
            sa.DateTime(),
            nullable=True,
            comment="When user first saw the variant",
        ),
        sa.Column(
            "last_seen_at",
            sa.DateTime(),
            nullable=True,
            comment="Last time user interacted with test",
        ),
        # Context and targeting
        sa.Column(
            "context",
            postgresql.JSON(),
            nullable=True,
            comment="Assignment context (user agent, location, etc.)",
        ),
        # Foreign key constraints
        sa.ForeignKeyConstraint(["test_id"], ["ab_tests.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["variant_id"], ["ab_test_variants.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
    )

    # Add foreign key constraint for winner_variant_id (after ab_test_variants table exists)
    op.create_foreign_key(
        "fk_ab_tests_winner_variant_id",
        "ab_tests",
        "ab_test_variants",
        ["winner_variant_id"],
        ["id"],
        ondelete="SET NULL",
    )

    # Create indexes for ab_tests table
    op.create_index(
        "idx_ab_tests_status_dates", "ab_tests", ["status", "start_date", "end_date"]
    )
    op.create_index(
        "idx_ab_tests_active",
        "ab_tests",
        ["status", "start_date", "end_date"],
        postgresql_where=sa.text("status = 'active'"),
    )
    op.create_index("idx_ab_tests_creator", "ab_tests", ["created_by", "created_at"])
    op.create_index(
        "idx_ab_tests_significance",
        "ab_tests",
        ["is_statistically_significant", "status"],
    )

    # Create indexes for ab_test_variants table
    op.create_index(
        "idx_ab_test_variants_test_key", "ab_test_variants", ["test_id", "variant_key"]
    )
    op.create_index(
        "idx_ab_test_variants_performance",
        "ab_test_variants",
        ["test_id", "conversion_rate"],
    )
    op.create_unique_index(
        "uq_ab_test_variants_test_key", "ab_test_variants", ["test_id", "variant_key"]
    )

    # Create indexes for ab_test_assignments table

    # Unique assignment constraints
    op.create_unique_index(
        "uq_ab_test_assignments_user",
        "ab_test_assignments",
        ["test_id", "user_id"],
        postgresql_where=sa.text("user_id IS NOT NULL"),
    )
    op.create_unique_index(
        "uq_ab_test_assignments_session",
        "ab_test_assignments",
        ["test_id", "session_id"],
        postgresql_where=sa.text("session_id IS NOT NULL"),
    )
    op.create_unique_index(
        "uq_ab_test_assignments_hash", "ab_test_assignments", ["test_id", "user_hash"]
    )

    # Performance indexes
    op.create_index(
        "idx_ab_test_assignments_test_variant",
        "ab_test_assignments",
        ["test_id", "variant_id"],
    )
    op.create_index(
        "idx_ab_test_assignments_conversion",
        "ab_test_assignments",
        ["test_id", "converted", "converted_at"],
    )
    op.create_index(
        "idx_ab_test_assignments_user_hash",
        "ab_test_assignments",
        ["user_hash", "test_id"],
    )
    op.create_index(
        "idx_ab_test_assignments_session",
        "ab_test_assignments",
        ["session_id", "test_id"],
    )


def downgrade() -> None:
    """Drop A/B testing tables and all associated indexes."""

    # Drop foreign key constraint first
    op.drop_constraint("fk_ab_tests_winner_variant_id", "ab_tests", type_="foreignkey")

    # Drop indexes for ab_test_assignments table
    indexes_to_drop_assignments = [
        "uq_ab_test_assignments_user",
        "uq_ab_test_assignments_session",
        "uq_ab_test_assignments_hash",
        "idx_ab_test_assignments_test_variant",
        "idx_ab_test_assignments_conversion",
        "idx_ab_test_assignments_user_hash",
        "idx_ab_test_assignments_session",
    ]

    for index_name in indexes_to_drop_assignments:
        try:
            op.drop_index(index_name, table_name="ab_test_assignments")
        except Exception:
            pass

    # Drop indexes for ab_test_variants table
    indexes_to_drop_variants = [
        "idx_ab_test_variants_test_key",
        "idx_ab_test_variants_performance",
        "uq_ab_test_variants_test_key",
    ]

    for index_name in indexes_to_drop_variants:
        try:
            op.drop_index(index_name, table_name="ab_test_variants")
        except Exception:
            pass

    # Drop indexes for ab_tests table
    indexes_to_drop_tests = [
        "idx_ab_tests_status_dates",
        "idx_ab_tests_active",
        "idx_ab_tests_creator",
        "idx_ab_tests_significance",
    ]

    for index_name in indexes_to_drop_tests:
        try:
            op.drop_index(index_name, table_name="ab_tests")
        except Exception:
            pass

    # Drop the tables (in reverse order due to foreign key dependencies)
    op.drop_table("ab_test_assignments")
    op.drop_table("ab_test_variants")
    op.drop_table("ab_tests")
