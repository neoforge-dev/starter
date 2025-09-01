"""Add recommendation system tables.

Revision ID: 20250814_1400_add_recommendation_system_tables
Revises: 20250814_1300_add_ab_testing_tables
Create Date: 2025-08-14 14:00:00.000000

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20250814_1400_add_recommendation_system_tables"
down_revision = "20250814_1300_add_ab_testing_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create recommendation system tables."""

    # Create recommendations table
    op.create_table(
        "recommendations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("recommendation_id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("confidence_score", sa.Float(), nullable=False),
        sa.Column("priority_score", sa.Float(), nullable=False),
        sa.Column("relevance_score", sa.Float(), nullable=False),
        sa.Column("context", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "rec_metadata", postgresql.JSON(astext_type=sa.Text()), nullable=True
        ),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column(
            "impressions", sa.Integer(), nullable=False, server_default=sa.text("0")
        ),
        sa.Column("clicks", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("shown_at", sa.DateTime(), nullable=True),
        sa.Column("clicked_at", sa.DateTime(), nullable=True),
        sa.Column("dismissed_at", sa.DateTime(), nullable=True),
        sa.Column("model_version", sa.String(50), nullable=False),
        sa.Column("algorithm", sa.String(50), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("recommendation_id"),
        sa.UniqueConstraint(
            "user_id", "type", "recommendation_id", name="uq_user_type_recommendation"
        ),
    )

    # Create indexes for recommendations table
    op.create_index(
        "idx_recommendations_user_status", "recommendations", ["user_id", "status"]
    )
    op.create_index(
        "idx_recommendations_user_type_status",
        "recommendations",
        ["user_id", "type", "status"],
    )
    op.create_index(
        "idx_recommendations_priority_confidence",
        "recommendations",
        ["priority_score", "confidence_score"],
    )
    op.create_index(
        "idx_recommendations_created_expires",
        "recommendations",
        ["created_at", "expires_at"],
    )
    op.create_index(
        "idx_recommendations_performance",
        "recommendations",
        ["type", "status", "created_at"],
    )
    op.create_index(
        "idx_recommendations_context_gin",
        "recommendations",
        ["context"],
        postgresql_using="gin",
    )
    op.create_index(
        "idx_recommendations_metadata_gin",
        "recommendations",
        ["rec_metadata"],
        postgresql_using="gin",
    )
    op.create_index(
        "ix_recommendations_recommendation_id", "recommendations", ["recommendation_id"]
    )
    op.create_index("ix_recommendations_user_id", "recommendations", ["user_id"])
    op.create_index("ix_recommendations_type", "recommendations", ["type"])
    op.create_index("ix_recommendations_status", "recommendations", ["status"])
    op.create_index(
        "ix_recommendations_confidence_score", "recommendations", ["confidence_score"]
    )
    op.create_index(
        "ix_recommendations_priority_score", "recommendations", ["priority_score"]
    )
    op.create_index(
        "ix_recommendations_relevance_score", "recommendations", ["relevance_score"]
    )
    op.create_index("ix_recommendations_expires_at", "recommendations", ["expires_at"])

    # Create user_preferences table
    op.create_table(
        "user_preferences",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column(
            "feature_interests", postgresql.JSON(astext_type=sa.Text()), nullable=True
        ),
        sa.Column(
            "content_preferences", postgresql.JSON(astext_type=sa.Text()), nullable=True
        ),
        sa.Column(
            "ui_preferences", postgresql.JSON(astext_type=sa.Text()), nullable=True
        ),
        sa.Column(
            "behavioral_patterns", postgresql.JSON(astext_type=sa.Text()), nullable=True
        ),
        sa.Column("avg_session_duration", sa.Float(), nullable=True),
        sa.Column(
            "weekly_active_days",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "feature_adoption_rate",
            sa.Float(),
            nullable=False,
            server_default=sa.text("0.0"),
        ),
        sa.Column(
            "notification_preferences",
            postgresql.JSON(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.Column(
            "max_daily_recommendations",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("5"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("last_analyzed_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )

    # Create indexes for user_preferences table
    op.create_index("idx_user_preferences_updated", "user_preferences", ["updated_at"])
    op.create_index(
        "idx_user_preferences_analyzed", "user_preferences", ["last_analyzed_at"]
    )
    op.create_index(
        "idx_user_preferences_adoption", "user_preferences", ["feature_adoption_rate"]
    )
    op.create_index(
        "idx_user_preferences_features_gin",
        "user_preferences",
        ["feature_interests"],
        postgresql_using="gin",
    )
    op.create_index(
        "idx_user_preferences_content_gin",
        "user_preferences",
        ["content_preferences"],
        postgresql_using="gin",
    )
    op.create_index(
        "idx_user_preferences_behavior_gin",
        "user_preferences",
        ["behavioral_patterns"],
        postgresql_using="gin",
    )
    op.create_index("ix_user_preferences_user_id", "user_preferences", ["user_id"])

    # Create recommendation_feedback table
    op.create_table(
        "recommendation_feedback",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("recommendation_id", sa.String(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=True),
        sa.Column("feedback_type", sa.String(), nullable=False),
        sa.Column("action_taken", sa.String(), nullable=False),
        sa.Column("feedback_text", sa.Text(), nullable=True),
        sa.Column("context", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.ForeignKeyConstraint(
            ["recommendation_id"],
            ["recommendations.recommendation_id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "recommendation_id", "user_id", name="uq_recommendation_user_feedback"
        ),
    )

    # Create indexes for recommendation_feedback table
    op.create_index(
        "idx_recommendation_feedback_rec_user",
        "recommendation_feedback",
        ["recommendation_id", "user_id"],
    )
    op.create_index(
        "idx_recommendation_feedback_type_action",
        "recommendation_feedback",
        ["feedback_type", "action_taken"],
    )
    op.create_index(
        "idx_recommendation_feedback_rating", "recommendation_feedback", ["rating"]
    )
    op.create_index(
        "idx_recommendation_feedback_created", "recommendation_feedback", ["created_at"]
    )
    op.create_index(
        "idx_recommendation_feedback_context_gin",
        "recommendation_feedback",
        ["context"],
        postgresql_using="gin",
    )
    op.create_index(
        "ix_recommendation_feedback_recommendation_id",
        "recommendation_feedback",
        ["recommendation_id"],
    )
    op.create_index(
        "ix_recommendation_feedback_user_id", "recommendation_feedback", ["user_id"]
    )

    # Create similar_users table
    op.create_table(
        "similar_users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("similar_user_id", sa.Integer(), nullable=False),
        sa.Column("similarity_score", sa.Float(), nullable=False),
        sa.Column("algorithm", sa.String(50), nullable=False),
        sa.Column("behavioral_similarity", sa.Float(), nullable=True),
        sa.Column("preference_similarity", sa.Float(), nullable=True),
        sa.Column("demographic_similarity", sa.Float(), nullable=True),
        sa.Column(
            "common_features", postgresql.JSON(astext_type=sa.Text()), nullable=True
        ),
        sa.Column(
            "computed_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["similar_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "similar_user_id", name="uq_user_similar_pair"),
    )

    # Create indexes for similar_users table
    op.create_index(
        "idx_similar_users_user_score", "similar_users", ["user_id", "similarity_score"]
    )
    op.create_index(
        "idx_similar_users_similarity_expires",
        "similar_users",
        ["similar_user_id", "expires_at"],
    )
    op.create_index(
        "idx_similar_users_score_computed",
        "similar_users",
        ["similarity_score", "computed_at"],
    )
    op.create_index("idx_similar_users_algorithm", "similar_users", ["algorithm"])
    op.create_index("idx_similar_users_expires", "similar_users", ["expires_at"])
    op.create_index(
        "idx_similar_users_features_gin",
        "similar_users",
        ["common_features"],
        postgresql_using="gin",
    )
    op.create_index("ix_similar_users_user_id", "similar_users", ["user_id"])
    op.create_index(
        "ix_similar_users_similar_user_id", "similar_users", ["similar_user_id"]
    )
    op.create_index(
        "ix_similar_users_similarity_score", "similar_users", ["similarity_score"]
    )


def downgrade() -> None:
    """Drop recommendation system tables."""

    # Drop tables in reverse order (due to foreign key constraints)
    op.drop_table("similar_users")
    op.drop_table("recommendation_feedback")
    op.drop_table("user_preferences")
    op.drop_table("recommendations")
