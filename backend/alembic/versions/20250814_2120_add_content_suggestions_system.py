"""add content suggestions system

Revision ID: 20250814_2120_add_content_suggestions_system
Revises: 20250814_1500_add_personalization_tables
Create Date: 2025-08-14 21:20:00
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20250814_2120_add_content_suggestions_system"
down_revision: Union[str, None] = "20250814_1500_add_personalization_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create content_items table
    op.create_table(
        "content_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("content_id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "content_type",
            sa.Enum(
                "ARTICLE",
                "BLOG_POST",
                "TUTORIAL",
                "DOCUMENTATION",
                "VIDEO",
                "COURSE",
                "TOOL",
                "RESOURCE",
                "NEWS",
                "ANNOUNCEMENT",
                name="contenttype",
            ),
            nullable=False,
        ),
        sa.Column(
            "category",
            sa.Enum(
                "TECHNICAL",
                "BUSINESS",
                "EDUCATIONAL",
                "ENTERTAINMENT",
                "NEWS",
                "PRODUCTIVITY",
                "HEALTH",
                "FINANCE",
                "LIFESTYLE",
                "MARKETING",
                name="contentcategory",
            ),
            nullable=False,
        ),
        sa.Column("url", sa.String(length=2048), nullable=True),
        sa.Column("author", sa.String(length=200), nullable=True),
        sa.Column("source", sa.String(length=200), nullable=True),
        sa.Column("published_at", sa.DateTime(), nullable=True),
        sa.Column("quality_score", sa.Float(), nullable=True),
        sa.Column("relevance_score", sa.Float(), nullable=True),
        sa.Column("engagement_prediction", sa.Float(), nullable=True),
        sa.Column("sentiment_score", sa.Float(), nullable=True),
        sa.Column("topics", sa.JSON(), nullable=True),
        sa.Column("ai_analysis", sa.JSON(), nullable=True),
        sa.Column("optimization_suggestions", sa.JSON(), nullable=True),
        sa.Column("view_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("click_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("share_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("engagement_rate", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
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
        sa.Column("analyzed_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_content_items_active_created",
        "content_items",
        ["is_active", "created_at"],
        unique=False,
    )
    op.create_index(
        "idx_content_items_analysis_gin",
        "content_items",
        ["ai_analysis"],
        unique=False,
        postgresql_using="gin",
    )
    op.create_index(
        "idx_content_items_engagement",
        "content_items",
        ["engagement_rate", "view_count"],
        unique=False,
    )
    op.create_index(
        "idx_content_items_published", "content_items", ["published_at"], unique=False
    )
    op.create_index(
        "idx_content_items_quality_relevance",
        "content_items",
        ["quality_score", "relevance_score"],
        unique=False,
    )
    op.create_index(
        "idx_content_items_search",
        "content_items",
        ["title", "description"],
        unique=False,
        postgresql_using="gin",
    )
    op.create_index(
        "idx_content_items_topics_gin",
        "content_items",
        ["topics"],
        unique=False,
        postgresql_using="gin",
    )
    op.create_index(
        "idx_content_items_type_category",
        "content_items",
        ["content_type", "category"],
        unique=False,
    )
    op.create_index(
        "ix_content_items_category", "content_items", ["category"], unique=False
    )
    op.create_index(
        "ix_content_items_content_id", "content_items", ["content_id"], unique=True
    )
    op.create_index(
        "ix_content_items_content_type", "content_items", ["content_type"], unique=False
    )
    op.create_index(
        "ix_content_items_is_active", "content_items", ["is_active"], unique=False
    )
    op.create_index("ix_content_items_title", "content_items", ["title"], unique=False)

    # Create content_suggestions table
    op.create_table(
        "content_suggestions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("suggestion_id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("content_id", sa.String(length=36), nullable=False),
        sa.Column(
            "suggestion_type",
            sa.Enum(
                "CONTENT_DISCOVERY",
                "NEXT_BEST_ACTION",
                "FEATURE_RECOMMENDATION",
                "CONTENT_OPTIMIZATION",
                "SEO_IMPROVEMENT",
                "ENGAGEMENT_BOOSTER",
                "TRENDING_CONTENT",
                "PERSONALIZED_FEED",
                name="suggestiontype",
            ),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("call_to_action", sa.String(length=100), nullable=True),
        sa.Column("confidence_score", sa.Float(), nullable=False),
        sa.Column("relevance_score", sa.Float(), nullable=False),
        sa.Column("priority_score", sa.Float(), nullable=False),
        sa.Column("personalization_score", sa.Float(), nullable=False),
        sa.Column("context", sa.JSON(), nullable=True),
        sa.Column("ai_reasoning", sa.JSON(), nullable=True),
        sa.Column("personalization_factors", sa.JSON(), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "PENDING",
                "ACTIVE",
                "SHOWN",
                "CLICKED",
                "DISMISSED",
                "EXPIRED",
                "ARCHIVED",
                name="contentsuggestionstatus",
            ),
            nullable=False,
            server_default="ACTIVE",
        ),
        sa.Column("impression_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("click_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("model_version", sa.String(length=50), nullable=False),
        sa.Column("algorithm", sa.String(length=50), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("first_shown_at", sa.DateTime(), nullable=True),
        sa.Column("last_shown_at", sa.DateTime(), nullable=True),
        sa.Column("clicked_at", sa.DateTime(), nullable=True),
        sa.Column("dismissed_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["content_id"], ["content_items.content_id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id",
            "content_id",
            "suggestion_type",
            name="uq_user_content_suggestion_type",
        ),
    )
    op.create_index(
        "idx_content_suggestions_content_user",
        "content_suggestions",
        ["content_id", "user_id"],
        unique=False,
    )
    op.create_index(
        "idx_content_suggestions_context_gin",
        "content_suggestions",
        ["context"],
        unique=False,
        postgresql_using="gin",
    )
    op.create_index(
        "idx_content_suggestions_engagement",
        "content_suggestions",
        ["impression_count", "click_count"],
        unique=False,
    )
    op.create_index(
        "idx_content_suggestions_factors_gin",
        "content_suggestions",
        ["personalization_factors"],
        unique=False,
        postgresql_using="gin",
    )
    op.create_index(
        "idx_content_suggestions_model",
        "content_suggestions",
        ["model_version", "algorithm"],
        unique=False,
    )
    op.create_index(
        "idx_content_suggestions_reasoning_gin",
        "content_suggestions",
        ["ai_reasoning"],
        unique=False,
        postgresql_using="gin",
    )
    op.create_index(
        "idx_content_suggestions_scores",
        "content_suggestions",
        ["confidence_score", "relevance_score", "priority_score"],
        unique=False,
    )
    op.create_index(
        "idx_content_suggestions_timing",
        "content_suggestions",
        ["created_at", "expires_at"],
        unique=False,
    )
    op.create_index(
        "idx_content_suggestions_user_status",
        "content_suggestions",
        ["user_id", "status"],
        unique=False,
    )
    op.create_index(
        "idx_content_suggestions_user_type_status",
        "content_suggestions",
        ["user_id", "suggestion_type", "status"],
        unique=False,
    )
    op.create_index(
        "ix_content_suggestions_expires_at",
        "content_suggestions",
        ["expires_at"],
        unique=False,
    )
    op.create_index(
        "ix_content_suggestions_status", "content_suggestions", ["status"], unique=False
    )
    op.create_index(
        "ix_content_suggestions_suggestion_id",
        "content_suggestions",
        ["suggestion_id"],
        unique=True,
    )
    op.create_index(
        "ix_content_suggestions_suggestion_type",
        "content_suggestions",
        ["suggestion_type"],
        unique=False,
    )
    op.create_index(
        "ix_content_suggestions_user_id",
        "content_suggestions",
        ["user_id"],
        unique=False,
    )

    # Create content_suggestion_feedback table
    op.create_table(
        "content_suggestion_feedback",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("suggestion_id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=True),
        sa.Column("feedback_type", sa.String(length=20), nullable=False),
        sa.Column("action_taken", sa.String(length=50), nullable=False),
        sa.Column("feedback_text", sa.Text(), nullable=True),
        sa.Column("context", sa.JSON(), nullable=True),
        sa.Column("session_data", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.ForeignKeyConstraint(
            ["suggestion_id"], ["content_suggestions.suggestion_id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "suggestion_id", "user_id", name="uq_content_suggestion_user_feedback"
        ),
    )
    op.create_index(
        "idx_content_feedback_context_gin",
        "content_suggestion_feedback",
        ["context"],
        unique=False,
        postgresql_using="gin",
    )
    op.create_index(
        "idx_content_feedback_created",
        "content_suggestion_feedback",
        ["created_at"],
        unique=False,
    )
    op.create_index(
        "idx_content_feedback_rating",
        "content_suggestion_feedback",
        ["rating"],
        unique=False,
    )
    op.create_index(
        "idx_content_feedback_session_gin",
        "content_suggestion_feedback",
        ["session_data"],
        unique=False,
        postgresql_using="gin",
    )
    op.create_index(
        "idx_content_feedback_suggestion_user",
        "content_suggestion_feedback",
        ["suggestion_id", "user_id"],
        unique=False,
    )
    op.create_index(
        "idx_content_feedback_type_action",
        "content_suggestion_feedback",
        ["feedback_type", "action_taken"],
        unique=False,
    )

    # Create content_analysis_jobs table
    op.create_table(
        "content_analysis_jobs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("job_id", sa.String(length=36), nullable=False),
        sa.Column("content_id", sa.String(length=36), nullable=False),
        sa.Column("job_type", sa.String(length=50), nullable=False),
        sa.Column(
            "status", sa.String(length=20), nullable=False, server_default="pending"
        ),
        sa.Column("progress", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("results", sa.JSON(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("ai_model_used", sa.String(length=100), nullable=True),
        sa.Column("processing_time_seconds", sa.Float(), nullable=True),
        sa.Column("tokens_used", sa.Integer(), nullable=True),
        sa.Column("cost_usd", sa.Float(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["content_id"], ["content_items.content_id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_content_analysis_jobs_content_type",
        "content_analysis_jobs",
        ["content_id", "job_type"],
        unique=False,
    )
    op.create_index(
        "idx_content_analysis_jobs_cost",
        "content_analysis_jobs",
        ["cost_usd"],
        unique=False,
    )
    op.create_index(
        "idx_content_analysis_jobs_created",
        "content_analysis_jobs",
        ["created_at"],
        unique=False,
    )
    op.create_index(
        "idx_content_analysis_jobs_processing_time",
        "content_analysis_jobs",
        ["processing_time_seconds"],
        unique=False,
    )
    op.create_index(
        "idx_content_analysis_jobs_results_gin",
        "content_analysis_jobs",
        ["results"],
        unique=False,
        postgresql_using="gin",
    )
    op.create_index(
        "idx_content_analysis_jobs_status",
        "content_analysis_jobs",
        ["status"],
        unique=False,
    )
    op.create_index(
        "ix_content_analysis_jobs_job_id",
        "content_analysis_jobs",
        ["job_id"],
        unique=True,
    )


def downgrade() -> None:
    # Drop content_analysis_jobs table
    op.drop_index("ix_content_analysis_jobs_job_id", table_name="content_analysis_jobs")
    op.drop_index(
        "idx_content_analysis_jobs_status", table_name="content_analysis_jobs"
    )
    op.drop_index(
        "idx_content_analysis_jobs_results_gin", table_name="content_analysis_jobs"
    )
    op.drop_index(
        "idx_content_analysis_jobs_processing_time", table_name="content_analysis_jobs"
    )
    op.drop_index(
        "idx_content_analysis_jobs_created", table_name="content_analysis_jobs"
    )
    op.drop_index("idx_content_analysis_jobs_cost", table_name="content_analysis_jobs")
    op.drop_index(
        "idx_content_analysis_jobs_content_type", table_name="content_analysis_jobs"
    )
    op.drop_table("content_analysis_jobs")

    # Drop content_suggestion_feedback table
    op.drop_index(
        "idx_content_feedback_type_action", table_name="content_suggestion_feedback"
    )
    op.drop_index(
        "idx_content_feedback_suggestion_user", table_name="content_suggestion_feedback"
    )
    op.drop_index(
        "idx_content_feedback_session_gin", table_name="content_suggestion_feedback"
    )
    op.drop_index(
        "idx_content_feedback_rating", table_name="content_suggestion_feedback"
    )
    op.drop_index(
        "idx_content_feedback_created", table_name="content_suggestion_feedback"
    )
    op.drop_index(
        "idx_content_feedback_context_gin", table_name="content_suggestion_feedback"
    )
    op.drop_table("content_suggestion_feedback")

    # Drop content_suggestions table
    op.drop_index("ix_content_suggestions_user_id", table_name="content_suggestions")
    op.drop_index(
        "ix_content_suggestions_suggestion_type", table_name="content_suggestions"
    )
    op.drop_index(
        "ix_content_suggestions_suggestion_id", table_name="content_suggestions"
    )
    op.drop_index("ix_content_suggestions_status", table_name="content_suggestions")
    op.drop_index("ix_content_suggestions_expires_at", table_name="content_suggestions")
    op.drop_index(
        "idx_content_suggestions_user_type_status", table_name="content_suggestions"
    )
    op.drop_index(
        "idx_content_suggestions_user_status", table_name="content_suggestions"
    )
    op.drop_index("idx_content_suggestions_timing", table_name="content_suggestions")
    op.drop_index("idx_content_suggestions_scores", table_name="content_suggestions")
    op.drop_index(
        "idx_content_suggestions_reasoning_gin", table_name="content_suggestions"
    )
    op.drop_index("idx_content_suggestions_model", table_name="content_suggestions")
    op.drop_index(
        "idx_content_suggestions_factors_gin", table_name="content_suggestions"
    )
    op.drop_index(
        "idx_content_suggestions_engagement", table_name="content_suggestions"
    )
    op.drop_index(
        "idx_content_suggestions_context_gin", table_name="content_suggestions"
    )
    op.drop_index(
        "idx_content_suggestions_content_user", table_name="content_suggestions"
    )
    op.drop_table("content_suggestions")

    # Drop content_items table
    op.drop_index("ix_content_items_title", table_name="content_items")
    op.drop_index("ix_content_items_is_active", table_name="content_items")
    op.drop_index("ix_content_items_content_type", table_name="content_items")
    op.drop_index("ix_content_items_content_id", table_name="content_items")
    op.drop_index("ix_content_items_category", table_name="content_items")
    op.drop_index("idx_content_items_type_category", table_name="content_items")
    op.drop_index("idx_content_items_topics_gin", table_name="content_items")
    op.drop_index("idx_content_items_search", table_name="content_items")
    op.drop_index("idx_content_items_quality_relevance", table_name="content_items")
    op.drop_index("idx_content_items_published", table_name="content_items")
    op.drop_index("idx_content_items_engagement", table_name="content_items")
    op.drop_index("idx_content_items_analysis_gin", table_name="content_items")
    op.drop_index("idx_content_items_active_created", table_name="content_items")
    op.drop_table("content_items")

    # Drop enums
    op.execute("DROP TYPE IF EXISTS contentsuggestionstatus")
    op.execute("DROP TYPE IF EXISTS suggestiontype")
    op.execute("DROP TYPE IF EXISTS contentcategory")
    op.execute("DROP TYPE IF EXISTS contenttype")
