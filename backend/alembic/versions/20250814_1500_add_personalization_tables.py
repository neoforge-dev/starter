"""Add personalization tables

Revision ID: 20250814_1500_add_personalization_tables
Revises: 20250814_1400_add_recommendation_system_tables
Create Date: 2025-08-14 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20250814_1500_add_personalization_tables"
down_revision = "20250814_1400_add_recommendation_system_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create personalization tables."""
    
    # Create personalization_profiles table
    op.create_table(
        "personalization_profiles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("primary_segment", sa.String(length=50), nullable=False),
        sa.Column("secondary_segments", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("segment_confidence", sa.Float(), nullable=False),
        sa.Column("usage_patterns", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("feature_usage", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("navigation_patterns", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("device_preferences", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("total_sessions", sa.Integer(), nullable=False),
        sa.Column("avg_session_duration", sa.Float(), nullable=True),
        sa.Column("features_adopted", sa.Integer(), nullable=False),
        sa.Column("last_active_days", sa.Integer(), nullable=False),
        sa.Column("ui_preferences", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("content_preferences", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("notification_preferences", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("predicted_churn_risk", sa.Float(), nullable=True),
        sa.Column("lifetime_value_score", sa.Float(), nullable=True),
        sa.Column("next_likely_actions", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("last_analyzed_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
        comment="User personalization profiles for adaptive experiences"
    )
    
    # Create indexes for personalization_profiles
    op.create_index("idx_personalization_profile_segment", "personalization_profiles", ["primary_segment"])
    op.create_index("idx_personalization_profile_confidence", "personalization_profiles", ["segment_confidence"])
    op.create_index("idx_personalization_profile_updated", "personalization_profiles", ["updated_at"])
    op.create_index("idx_personalization_profile_churn", "personalization_profiles", ["predicted_churn_risk"])
    op.create_index("idx_personalization_profile_value", "personalization_profiles", ["lifetime_value_score"])
    op.create_index("idx_personalization_profile_usage_gin", "personalization_profiles", ["usage_patterns"], postgresql_using="gin")
    op.create_index("idx_personalization_profile_features_gin", "personalization_profiles", ["feature_usage"], postgresql_using="gin")
    op.create_index("idx_personalization_profile_ui_gin", "personalization_profiles", ["ui_preferences"], postgresql_using="gin")
    
    # Create personalization_rules table
    op.create_table(
        "personalization_rules",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("rule_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("target_segments", postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column("target_contexts", postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column("conditions", postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column("personalization_type", sa.String(length=50), nullable=False),
        sa.Column("configuration", postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column("priority", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("is_ab_test", sa.Boolean(), nullable=False),
        sa.Column("ab_test_id", sa.String(length=36), nullable=True),
        sa.Column("applications_count", sa.Integer(), nullable=False),
        sa.Column("success_rate", sa.Float(), nullable=True),
        sa.Column("avg_improvement", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("starts_at", sa.DateTime(), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("rule_id"),
        comment="Dynamic personalization rules for adaptive experiences"
    )
    
    # Create indexes for personalization_rules
    op.create_index("idx_personalization_rule_rule_id", "personalization_rules", ["rule_id"], unique=True)
    op.create_index("idx_personalization_rule_segments_gin", "personalization_rules", ["target_segments"], postgresql_using="gin")
    op.create_index("idx_personalization_rule_contexts_gin", "personalization_rules", ["target_contexts"], postgresql_using="gin")
    op.create_index("idx_personalization_rule_type_active", "personalization_rules", ["personalization_type", "is_active"])
    op.create_index("idx_personalization_rule_priority_active", "personalization_rules", ["priority", "is_active"])
    op.create_index("idx_personalization_rule_ab_test", "personalization_rules", ["is_ab_test", "ab_test_id"])
    op.create_index("idx_personalization_rule_performance", "personalization_rules", ["success_rate", "applications_count"])
    op.create_index("idx_personalization_rule_timing", "personalization_rules", ["starts_at", "expires_at"])
    op.create_index("idx_personalization_rule_conditions_gin", "personalization_rules", ["conditions"], postgresql_using="gin")
    op.create_index("idx_personalization_rule_config_gin", "personalization_rules", ["configuration"], postgresql_using="gin")
    
    # Create personalization_interactions table
    op.create_table(
        "personalization_interactions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("interaction_id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("rule_id", sa.String(length=36), nullable=False),
        sa.Column("context", sa.String(length=50), nullable=False),
        sa.Column("interaction_type", sa.String(length=50), nullable=False),
        sa.Column("personalization_data", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("user_action", sa.String(length=100), nullable=True),
        sa.Column("outcome", sa.String(length=50), nullable=True),
        sa.Column("response_time_ms", sa.Integer(), nullable=True),
        sa.Column("engagement_score", sa.Float(), nullable=True),
        sa.Column("session_id", sa.String(length=100), nullable=True),
        sa.Column("device_type", sa.String(length=20), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["rule_id"], ["personalization_rules.rule_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("interaction_id"),
        comment="User interactions with personalized experiences"
    )
    
    # Create indexes for personalization_interactions
    op.create_index("idx_personalization_interaction_interaction_id", "personalization_interactions", ["interaction_id"], unique=True)
    op.create_index("idx_personalization_interaction_user_rule", "personalization_interactions", ["user_id", "rule_id"])
    op.create_index("idx_personalization_interaction_context_type", "personalization_interactions", ["context", "interaction_type"])
    op.create_index("idx_personalization_interaction_outcome", "personalization_interactions", ["outcome"])
    op.create_index("idx_personalization_interaction_session", "personalization_interactions", ["session_id"])
    op.create_index("idx_personalization_interaction_created", "personalization_interactions", ["created_at"])
    op.create_index("idx_personalization_interaction_performance", "personalization_interactions", ["response_time_ms", "engagement_score"])
    op.create_index("idx_personalization_interaction_data_gin", "personalization_interactions", ["personalization_data"], postgresql_using="gin")
    
    # Create user_personalization_rules association table
    op.create_table(
        "user_personalization_rules",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("rule_id", sa.String(length=36), nullable=False),
        sa.Column("assigned_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("override_configuration", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["personalization_profiles.user_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["rule_id"], ["personalization_rules.rule_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "rule_id"),
        comment="Association between users and personalization rules"
    )
    
    # Create indexes for user_personalization_rules
    op.create_index("idx_user_personalization_rules_user", "user_personalization_rules", ["user_id"])
    op.create_index("idx_user_personalization_rules_rule", "user_personalization_rules", ["rule_id"])
    op.create_index("idx_user_personalization_rules_active", "user_personalization_rules", ["is_active"])
    op.create_index("idx_user_personalization_rules_assigned", "user_personalization_rules", ["assigned_at"])
    
    # Create personalization_segment_analysis table
    op.create_table(
        "personalization_segment_analysis",
        sa.Column("analysis_id", sa.String(length=36), nullable=False),
        sa.Column("segment", sa.String(length=50), nullable=False),
        sa.Column("analysis_period", sa.String(length=20), nullable=False),
        sa.Column("total_users", sa.Integer(), nullable=False),
        sa.Column("active_users", sa.Integer(), nullable=False),
        sa.Column("avg_session_duration", sa.Float(), nullable=True),
        sa.Column("conversion_rate", sa.Float(), nullable=True),
        sa.Column("personalization_effectiveness", sa.Float(), nullable=True),
        sa.Column("top_performing_rules", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("improvement_opportunities", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("period_start", sa.DateTime(), nullable=False),
        sa.Column("period_end", sa.DateTime(), nullable=False),
        sa.Column("computed_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("analysis_id"),
        comment="Aggregate analytics for personalization segments"
    )
    
    # Create indexes for personalization_segment_analysis
    op.create_index("idx_personalization_segment_analysis_segment_period", "personalization_segment_analysis", ["segment", "analysis_period"])
    op.create_index("idx_personalization_segment_analysis_period", "personalization_segment_analysis", ["period_start", "period_end"])
    op.create_index("idx_personalization_segment_analysis_effectiveness", "personalization_segment_analysis", ["personalization_effectiveness"])
    op.create_index("idx_personalization_segment_analysis_computed", "personalization_segment_analysis", ["computed_at"])
    op.create_index("idx_personalization_segment_analysis_rules_gin", "personalization_segment_analysis", ["top_performing_rules"], postgresql_using="gin")
    op.create_index("idx_personalization_segment_analysis_opportunities_gin", "personalization_segment_analysis", ["improvement_opportunities"], postgresql_using="gin")


def downgrade() -> None:
    """Drop personalization tables."""
    
    # Drop tables in reverse order of creation
    op.drop_table("personalization_segment_analysis")
    op.drop_table("user_personalization_rules")
    op.drop_table("personalization_interactions")
    op.drop_table("personalization_rules")
    op.drop_table("personalization_profiles")