"""Validate Alembic migration chain integrity."""
import sys
from pathlib import Path

# Migration chain mapping based on grep output
MIGRATIONS = {
    # revision_id -> (filename, down_revision)
    "10dde5a7dde1": ("20250216_1538_10dde5a7dde1_initial.py", None),
    "abcd1234": ("20250809_2022_abcd1234_add_password_reset_token_table.py", "10dde5a7dde1"),
    "ef123456": ("20250809_2030_email_verification_fields.py", "abcd1234"),
    "20250812_add_proj_support_comm_idemp": ("20250812_1548_add_project_support_community_idempotency.py", "ef123456"),
    "20250814_add_cursor_pagination_indices": ("20250814_1045_add_cursor_pagination_indices.py", "20250812_add_proj_support_comm_idemp"),
    "20250814_add_event_tracking_table": ("20250814_1200_add_event_tracking_table.py", "20250814_add_cursor_pagination_indices"),
    "20250814_add_ab_testing_tables": ("20250814_1300_add_ab_testing_tables.py", "20250814_add_event_tracking_table"),
    "20250814_1400_add_recommendation_system_tables": ("20250814_1400_add_recommendation_system_tables.py", "20250814_add_ab_testing_tables"),
    "20250814_1500_add_personalization_tables": ("20250814_1500_add_personalization_tables.py", "20250814_1400_add_recommendation_system_tables"),
    "20250814_2120_add_content_suggestions_system": ("20250814_2120_add_content_suggestions_system.py", "20250814_1500_add_personalization_tables"),
    "20250815_1600_mt_arch": ("20250815_1600_add_multi_tenant_architecture.py", "20250814_2120_add_content_suggestions_system"),
    "subscription_001": ("20250903_1230_add_subscription_tables.py", "20250815_1600_mt_arch"),
    "20250916_1200_ai_workflow": ("20250916_1200_add_ai_workflow_models.py", "subscription_001"),
    "20250919_1400_growth_analytics": ("20250919_1400_add_growth_analytics_tables.py", "20250916_1200_ai_workflow"),
    "20250919_1500_add_saml_sso_models": ("20250919_1500_add_saml_sso_models.py", "20250919_1400_growth_analytics"),
}


def validate_migration_chain():
    """Validate that migration chain has no issues."""
    print(f"Total migrations found: {len(MIGRATIONS)}")
    print("=" * 80)

    errors = []
    warnings = []

    # Check for orphaned migrations
    all_down_revisions = {down_rev for _, down_rev in MIGRATIONS.values() if down_rev is not None}
    all_revision_ids = set(MIGRATIONS.keys())

    # Find orphaned down_revisions (referenced but not defined)
    orphaned = all_down_revisions - all_revision_ids
    if orphaned:
        for orphan in orphaned:
            errors.append(f"❌ Referenced revision '{orphan}' does not exist")
            # Find which migration references it
            for rev_id, (filename, down_rev) in MIGRATIONS.items():
                if down_rev == orphan:
                    errors.append(f"   Referenced by: {filename} (revision: {rev_id})")

    # Build the chain from root
    root_migrations = [rev_id for rev_id, (_, down_rev) in MIGRATIONS.items() if down_rev is None]

    if len(root_migrations) == 0:
        errors.append("❌ No root migration found (migration with down_revision=None)")
    elif len(root_migrations) > 1:
        errors.append(f"❌ Multiple root migrations found: {root_migrations}")
    else:
        print(f"✅ Root migration: {root_migrations[0]}")

    # Build forward chain
    print("\n📋 Migration Chain:")
    print("-" * 80)

    visited = set()
    current = root_migrations[0] if root_migrations else None
    chain_length = 0

    while current:
        if current in visited:
            errors.append(f"❌ Circular dependency detected at: {current}")
            break

        visited.add(current)
        filename, down_rev = MIGRATIONS[current]
        chain_length += 1

        # Find next migration
        next_migrations = [rev_id for rev_id, (_, down_rev_id) in MIGRATIONS.items() if down_rev_id == current]

        print(f"{chain_length:2d}. {current:45s} <- {filename}")

        if len(next_migrations) > 1:
            errors.append(f"❌ Multiple migrations depend on {current}: {next_migrations}")
            break
        elif len(next_migrations) == 0:
            # This is the head
            print(f"\n✅ Migration head: {current}")
            break
        else:
            current = next_migrations[0]

    # Check for unvisited migrations (branching)
    unvisited = all_revision_ids - visited
    if unvisited:
        warnings.append(f"⚠️  Unvisited migrations (possible branch): {unvisited}")

    print("\n" + "=" * 80)
    print("VALIDATION RESULTS:")
    print("=" * 80)

    if errors:
        print("\n❌ ERRORS FOUND:")
        for error in errors:
            print(f"  {error}")

    if warnings:
        print("\n⚠️  WARNINGS:")
        for warning in warnings:
            print(f"  {warning}")

    if not errors and not warnings:
        print("✅ Migration chain validation PASSED")
        print(f"✅ Total migrations in chain: {chain_length}")
        return True
    else:
        print(f"\n❌ Migration chain validation FAILED")
        print(f"   Errors: {len(errors)}")
        print(f"   Warnings: {len(warnings)}")
        return False


if __name__ == "__main__":
    success = validate_migration_chain()
    sys.exit(0 if success else 1)
