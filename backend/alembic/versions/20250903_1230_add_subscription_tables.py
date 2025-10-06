"""Add subscription tables and seed initial plans

Revision ID: subscription_001
Revises: 20250815_1600_add_multi_tenant_architecture
Create Date: 2025-09-03 12:30:00.000000

"""
from typing import Sequence, Union
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy import text
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "subscription_001"
down_revision: Union[str, None] = "20250815_1600_mt_arch"

def upgrade() -> None:
    """Add subscription tables and seed initial plans."""
    
    # Create subscription_plans table
    op.create_table('subscription_plans',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('stripe_price_id', sa.String(length=100), nullable=False),
    sa.Column('price_monthly', sa.Float(), nullable=False),
    sa.Column('price_yearly', sa.Float(), nullable=False),
    sa.Column('currency', sa.String(length=3), nullable=True),
    sa.Column('max_projects', sa.Integer(), nullable=True),
    sa.Column('max_users_per_project', sa.Integer(), nullable=True),
    sa.Column('max_storage_gb', sa.Integer(), nullable=True),
    sa.Column('max_api_calls_per_month', sa.Integer(), nullable=True),
    sa.Column('features', postgresql.JSON(astext_type=sa.Text()), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('is_popular', sa.Boolean(), nullable=True),
    sa.Column('trial_days', sa.Integer(), nullable=True),
    sa.Column('sort_order', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_subscription_plans_id'), 'subscription_plans', ['id'], unique=False)
    op.create_index(op.f('ix_subscription_plans_stripe_price_id'), 'subscription_plans', ['stripe_price_id'], unique=True)

    # Create user_subscriptions table
    op.create_table('user_subscriptions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('plan_id', sa.Integer(), nullable=False),
    sa.Column('stripe_subscription_id', sa.String(length=100), nullable=True),
    sa.Column('stripe_customer_id', sa.String(length=100), nullable=True),
    sa.Column('status', sa.String(length=50), nullable=True),
    sa.Column('current_period_start', sa.DateTime(timezone=True), nullable=True),
    sa.Column('current_period_end', sa.DateTime(timezone=True), nullable=True),
    sa.Column('billing_cycle', sa.String(length=20), nullable=True),
    sa.Column('auto_renew', sa.Boolean(), nullable=True),
    sa.Column('trial_start', sa.DateTime(timezone=True), nullable=True),
    sa.Column('trial_end', sa.DateTime(timezone=True), nullable=True),
    sa.Column('cancel_at_period_end', sa.Boolean(), nullable=True),
    sa.Column('canceled_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['plan_id'], ['subscription_plans.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_subscriptions_id'), 'user_subscriptions', ['id'], unique=False)
    op.create_index(op.f('ix_user_subscriptions_user_id'), 'user_subscriptions', ['user_id'], unique=False)
    op.create_index(op.f('ix_user_subscriptions_stripe_subscription_id'), 'user_subscriptions', ['stripe_subscription_id'], unique=True)

    # Create payments table
    op.create_table('payments',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('subscription_id', sa.Integer(), nullable=True),
    sa.Column('stripe_payment_intent_id', sa.String(length=100), nullable=True),
    sa.Column('stripe_invoice_id', sa.String(length=100), nullable=True),
    sa.Column('amount', sa.Float(), nullable=False),
    sa.Column('currency', sa.String(length=3), nullable=True),
    sa.Column('status', sa.String(length=50), nullable=True),
    sa.Column('payment_method', sa.String(length=50), nullable=True),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['subscription_id'], ['user_subscriptions.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_payments_id'), 'payments', ['id'], unique=False)
    op.create_index(op.f('ix_payments_user_id'), 'payments', ['user_id'], unique=False)

    # Create usage_records table
    op.create_table('usage_records',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('subscription_id', sa.Integer(), nullable=True),
    sa.Column('metric_name', sa.String(length=100), nullable=False),
    sa.Column('quantity', sa.Integer(), nullable=False),
    sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['subscription_id'], ['user_subscriptions.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_usage_records_id'), 'usage_records', ['id'], unique=False)
    op.create_index(op.f('ix_usage_records_user_id'), 'usage_records', ['user_id'], unique=False)

    # Seed subscription plans with data from MOCK_PLANS
    plans_data = [
        {
            'name': 'Starter',
            'description': 'Perfect for individual developers',
            'stripe_price_id': 'price_starter_monthly',
            'price_monthly': 9.99,
            'price_yearly': 99.99,
            'currency': 'USD',
            'max_projects': 5,
            'max_users_per_project': 1,
            'max_storage_gb': 5,
            'max_api_calls_per_month': 10000,
            'features': '["Basic analytics", "Community support", "5GB storage"]',
            'is_active': True,
            'is_popular': False,
            'trial_days': 14,
            'sort_order': 1
        },
        {
            'name': 'Pro',
            'description': 'For growing teams and projects',
            'stripe_price_id': 'price_pro_monthly',
            'price_monthly': 29.99,
            'price_yearly': 299.99,
            'currency': 'USD',
            'max_projects': 25,
            'max_users_per_project': 10,
            'max_storage_gb': 50,
            'max_api_calls_per_month': 100000,
            'features': '["Advanced analytics", "Priority support", "50GB storage", "Custom integrations"]',
            'is_active': True,
            'is_popular': True,
            'trial_days': 14,
            'sort_order': 2
        },
        {
            'name': 'Enterprise',
            'description': 'For large organizations',
            'stripe_price_id': 'price_enterprise_monthly',
            'price_monthly': 99.99,
            'price_yearly': 999.99,
            'currency': 'USD',
            'max_projects': -1,
            'max_users_per_project': -1,
            'max_storage_gb': 500,
            'max_api_calls_per_month': -1,
            'features': '["Enterprise analytics", "Dedicated support", "500GB storage", "Custom integrations", "SLA guarantee"]',
            'is_active': True,
            'is_popular': False,
            'trial_days': 30,
            'sort_order': 3
        }
    ]

    # Insert seed data
    for plan in plans_data:
        op.execute(f"""
            INSERT INTO subscription_plans 
            (name, description, stripe_price_id, price_monthly, price_yearly, currency, 
             max_projects, max_users_per_project, max_storage_gb, max_api_calls_per_month,
             features, is_active, is_popular, trial_days, sort_order)
            VALUES 
            ('{plan['name']}', '{plan['description']}', '{plan['stripe_price_id']}', 
             {plan['price_monthly']}, {plan['price_yearly']}, '{plan['currency']}',
             {plan['max_projects']}, {plan['max_users_per_project']}, {plan['max_storage_gb']}, 
             {plan['max_api_calls_per_month']}, '{plan['features']}', 
             {plan['is_active']}, {plan['is_popular']}, {plan['trial_days']}, {plan['sort_order']})
        """)


def downgrade() -> None:
    """Remove subscription tables."""
    op.drop_table('usage_records')
    op.drop_table('payments')
    op.drop_table('user_subscriptions')
    op.drop_table('subscription_plans')