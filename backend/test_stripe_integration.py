#!/usr/bin/env python3
"""
Simple test script to verify Stripe integration works.
This will help us debug the configuration issues.
"""

import os
import sys
from pathlib import Path

# Add the app directory to the Python path
app_dir = Path(__file__).parent / "app"
sys.path.insert(0, str(app_dir))

try:
    # Test basic imports
    print("Testing basic imports...")

    # Test settings import
    from app.core.config import get_settings
    print("✓ Settings import successful")

    # Test Stripe import
    import stripe
    print("✓ Stripe import successful")

    # Test settings with Stripe configuration
    settings = get_settings()
    print(f"✓ Settings loaded: {settings.app_name}")

    # Check if Stripe key is configured
    if hasattr(settings, 'stripe_secret_key') and settings.stripe_secret_key:
        print("✓ Stripe secret key configured")
        stripe.api_key = settings.stripe_secret_key.get_secret_value()
    else:
        print("⚠ Stripe secret key not configured (this is expected in development)")

    print("\n🎉 All basic imports successful!")

except ImportError as e:
    print(f"❌ Import error: {e}")
    print("This might be due to missing dependencies.")
    print("Try installing dependencies with: pip install -r requirements.txt")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()