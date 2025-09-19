"""add growth analytics tables

Revision ID: 20250919_1400_growth_analytics
Revises: 20250916_1200_add_ai_workflow_models
Create Date: 2025-09-19 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20250919_1400_growth_analytics'
down_revision = '20250916_1200_add_ai_workflow_models'
branch_labels = None
depends_on = None


def upgrade():
    """Create tables for growth analytics and campaign tracking."""
    
    # Create customer health scores table
    op.create_table('customer_health_scores',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('overall_score', sa.Float(), nullable=False),
        sa.Column('health_status', sa.String(20), nullable=False),
        sa.Column('risk_level', sa.String(20), nullable=False),
        sa.Column('usage_score', sa.Float(), nullable=False),
        sa.Column('engagement_score', sa.Float(), nullable=False),
        sa.Column('payment_score', sa.Float(), nullable=False),
        sa.Column('support_score', sa.Float(), nullable=False),
        sa.Column('churn_probability', sa.Float(), nullable=False),
        sa.Column('predicted_action_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('recommended_actions', postgresql.JSONB(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(), nullable=True),
        sa.Column('calculated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_customer_health_scores_user_id', 'customer_health_scores', ['user_id'])
    op.create_index('idx_customer_health_scores_calculated_at', 'customer_health_scores', ['calculated_at'])
    op.create_index('idx_customer_health_scores_risk_level', 'customer_health_scores', ['risk_level'])
    op.create_index('idx_customer_health_scores_churn_prob', 'customer_health_scores', ['churn_probability'])

    # Create campaign rules table
    op.create_table('campaign_rules',
        sa.Column('id', sa.String(100), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('campaign_type', sa.String(50), nullable=False),
        sa.Column('trigger_condition', sa.String(50), nullable=False),
        sa.Column('conditions', postgresql.JSONB(), nullable=True),
        sa.Column('actions', postgresql.JSONB(), nullable=True),
        sa.Column('priority', sa.Integer(), default=1, nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True, nullable=False),
        sa.Column('cooldown_hours', sa.Integer(), default=72, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_campaign_rules_type', 'campaign_rules', ['campaign_type'])
    op.create_index('idx_campaign_rules_trigger', 'campaign_rules', ['trigger_condition'])
    op.create_index('idx_campaign_rules_active', 'campaign_rules', ['is_active'])

    # Create campaign executions table
    op.create_table('campaign_executions',
        sa.Column('id', sa.String(255), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('rule_id', sa.String(100), nullable=False),
        sa.Column('campaign_type', sa.String(50), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('triggered_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('executed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('metadata', postgresql.JSONB(), nullable=True),
        sa.Column('results', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['rule_id'], ['campaign_rules.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_campaign_executions_user_id', 'campaign_executions', ['user_id'])
    op.create_index('idx_campaign_executions_rule_id', 'campaign_executions', ['rule_id'])
    op.create_index('idx_campaign_executions_type', 'campaign_executions', ['campaign_type'])
    op.create_index('idx_campaign_executions_status', 'campaign_executions', ['status'])
    op.create_index('idx_campaign_executions_triggered_at', 'campaign_executions', ['triggered_at'])

    # Create upgrade recommendations table
    op.create_table('upgrade_recommendations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('current_plan_id', sa.Integer(), nullable=False),
        sa.Column('recommended_plan_id', sa.Integer(), nullable=False),
        sa.Column('confidence_score', sa.Float(), nullable=False),
        sa.Column('potential_revenue_increase', sa.Float(), nullable=False),
        sa.Column('reasoning', postgresql.JSONB(), nullable=True),
        sa.Column('urgency', sa.String(20), nullable=False),
        sa.Column('suggested_actions', postgresql.JSONB(), nullable=True),
        sa.Column('status', sa.String(20), default='pending', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['current_plan_id'], ['subscription_plans.id'], ),
        sa.ForeignKeyConstraint(['recommended_plan_id'], ['subscription_plans.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_upgrade_recommendations_user_id', 'upgrade_recommendations', ['user_id'])
    op.create_index('idx_upgrade_recommendations_confidence', 'upgrade_recommendations', ['confidence_score'])
    op.create_index('idx_upgrade_recommendations_urgency', 'upgrade_recommendations', ['urgency'])
    op.create_index('idx_upgrade_recommendations_status', 'upgrade_recommendations', ['status'])

    # Create milestone celebrations table
    op.create_table('milestone_celebrations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('milestone_type', sa.String(50), nullable=False),
        sa.Column('threshold_value', sa.Float(), nullable=False),
        sa.Column('actual_value', sa.Float(), nullable=False),
        sa.Column('celebrated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('campaign_execution_id', sa.String(255), nullable=True),
        sa.Column('metadata', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['campaign_execution_id'], ['campaign_executions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_milestone_celebrations_user_id', 'milestone_celebrations', ['user_id'])
    op.create_index('idx_milestone_celebrations_type', 'milestone_celebrations', ['milestone_type'])
    op.create_index('idx_milestone_celebrations_celebrated_at', 'milestone_celebrations', ['celebrated_at'])
    # Ensure unique celebrations per milestone type per user
    op.create_index('idx_milestone_celebrations_unique', 'milestone_celebrations', ['user_id', 'milestone_type'], unique=True)

    # Create revenue cohorts table for historical tracking
    op.create_table('revenue_cohorts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('cohort_month', sa.String(7), nullable=False),  # YYYY-MM format
        sa.Column('customer_count', sa.Integer(), nullable=False),
        sa.Column('revenue_by_month', postgresql.JSONB(), nullable=True),
        sa.Column('retention_by_month', postgresql.JSONB(), nullable=True),
        sa.Column('cumulative_revenue', sa.Float(), nullable=False),
        sa.Column('avg_revenue_per_customer', sa.Float(), nullable=False),
        sa.Column('calculated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_revenue_cohorts_month', 'revenue_cohorts', ['cohort_month'])
    op.create_index('idx_revenue_cohorts_calculated_at', 'revenue_cohorts', ['calculated_at'])
    # Ensure unique cohort per month
    op.create_index('idx_revenue_cohorts_unique', 'revenue_cohorts', ['cohort_month'], unique=True)

    # Create growth metrics snapshots table for trend analysis
    op.create_table('growth_metrics_snapshots',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('snapshot_date', sa.Date(), nullable=False),
        sa.Column('mrr', sa.Float(), nullable=False),
        sa.Column('arr', sa.Float(), nullable=False),
        sa.Column('customer_count', sa.Integer(), nullable=False),
        sa.Column('churn_rate', sa.Float(), nullable=False),
        sa.Column('net_revenue_retention', sa.Float(), nullable=False),
        sa.Column('avg_revenue_per_user', sa.Float(), nullable=False),
        sa.Column('month_over_month_growth', sa.Float(), nullable=False),
        sa.Column('year_over_year_growth', sa.Float(), nullable=False),
        sa.Column('at_risk_customers_count', sa.Integer(), default=0, nullable=False),
        sa.Column('upgrade_opportunities_count', sa.Integer(), default=0, nullable=False),
        sa.Column('metadata', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_growth_metrics_snapshots_date', 'growth_metrics_snapshots', ['snapshot_date'])
    # Ensure unique snapshot per date
    op.create_index('idx_growth_metrics_snapshots_unique', 'growth_metrics_snapshots', ['snapshot_date'], unique=True)

    # Create campaign performance metrics table
    op.create_table('campaign_performance_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('campaign_type', sa.String(50), nullable=False),
        sa.Column('rule_id', sa.String(100), nullable=False),
        sa.Column('period_start', sa.DateTime(timezone=True), nullable=False),
        sa.Column('period_end', sa.DateTime(timezone=True), nullable=False),
        sa.Column('executions_count', sa.Integer(), default=0, nullable=False),
        sa.Column('successful_executions', sa.Integer(), default=0, nullable=False),
        sa.Column('success_rate', sa.Float(), default=0.0, nullable=False),
        sa.Column('conversion_count', sa.Integer(), default=0, nullable=False),
        sa.Column('conversion_rate', sa.Float(), default=0.0, nullable=False),
        sa.Column('revenue_impact', sa.Float(), default=0.0, nullable=False),
        sa.Column('cost', sa.Float(), default=0.0, nullable=False),
        sa.Column('roi', sa.Float(), default=0.0, nullable=False),
        sa.Column('metadata', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['rule_id'], ['campaign_rules.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_campaign_performance_type', 'campaign_performance_metrics', ['campaign_type'])
    op.create_index('idx_campaign_performance_rule_id', 'campaign_performance_metrics', ['rule_id'])
    op.create_index('idx_campaign_performance_period', 'campaign_performance_metrics', ['period_start', 'period_end'])
    op.create_index('idx_campaign_performance_success_rate', 'campaign_performance_metrics', ['success_rate'])
    op.create_index('idx_campaign_performance_roi', 'campaign_performance_metrics', ['roi'])

    # Add triggers for updated_at columns
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    # Create triggers for all tables with updated_at columns
    tables_with_updated_at = [
        'customer_health_scores',
        'campaign_rules', 
        'campaign_executions',
        'upgrade_recommendations',
        'revenue_cohorts',
        'campaign_performance_metrics'
    ]
    
    for table in tables_with_updated_at:
        op.execute(f"""
            CREATE TRIGGER update_{table}_updated_at
            BEFORE UPDATE ON {table}
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        """)


def downgrade():
    """Drop growth analytics tables."""
    
    # Drop triggers first
    tables_with_updated_at = [
        'customer_health_scores',
        'campaign_rules', 
        'campaign_executions',
        'upgrade_recommendations',
        'revenue_cohorts',
        'campaign_performance_metrics'
    ]
    
    for table in tables_with_updated_at:
        op.execute(f"DROP TRIGGER IF EXISTS update_{table}_updated_at ON {table};")
    
    # Drop the function
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column();")
    
    # Drop tables in reverse order (due to foreign key dependencies)
    op.drop_table('campaign_performance_metrics')
    op.drop_table('growth_metrics_snapshots')
    op.drop_table('revenue_cohorts')
    op.drop_table('milestone_celebrations')
    op.drop_table('upgrade_recommendations')
    op.drop_table('campaign_executions')
    op.drop_table('campaign_rules')
    op.drop_table('customer_health_scores')