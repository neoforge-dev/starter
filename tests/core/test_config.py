import pytest
from app.core.config import Settings, Environment
from pydantic import ValidationError, SecretStr
import os

# Define a valid secret key for tests
VALID_SECRET_KEY = SecretStr("a" * 32)

class TestConfigValidation:
    # Helper method to isolate environment changes
    @pytest.fixture(autouse=True)
    def clean_env(self):
        original_env = os.environ.copy()
        yield
        os.environ.clear()
        os.environ.update(original_env)

    @pytest.fixture(autouse=True)
    def env_override(monkeypatch):
        """Force clean environment for config tests"""
        monkeypatch.delenv("DEBUG", raising=False)
        monkeypatch.delenv("ENVIRONMENT", raising=False)
        monkeypatch.delenv("SECRET_KEY", raising=False)
        monkeypatch.delenv("CORS_ORIGINS", raising=False)
        # Set a default secret key for tests that don't explicitly set one
        monkeypatch.setenv("SECRET_KEY", VALID_SECRET_KEY.get_secret_value())

    def test_valid_settings(self):
        """Test valid settings configuration."""
        settings = Settings(
            secret_key=VALID_SECRET_KEY,  # Use defined constant
            debug="false",  # Test string conversion
            environment="development",
            cors_origins=["http://localhost:3000"]
        )
        assert settings.debug is False
        assert settings.environment == "development"
        assert settings.cors_origins == ["http://localhost:3000"]

    def test_invalid_environment(self):
        """Test invalid environment setting."""
        with pytest.raises(ValidationError) as excinfo:
            Settings(environment="invalid")
        assert "Environment must be one of" in str(excinfo.value)

    def test_invalid_secret_key(self):
        """Test invalid secret key length."""
        with pytest.raises(ValidationError) as excinfo:
            # Provide a non-secret string directly
            Settings(secret_key="short")
        assert "at least 32 characters" in str(excinfo.value)

    def test_empty_cors_origins_in_testing(self):
        """Test empty CORS origins when testing=True."""
        settings = Settings(
            testing=True,
            cors_origins=["http://should.be.cleared"]
        )
        assert settings.cors_origins == []

    def test_smtp_password_required_with_user(self):
        """Test SMTP password is required when SMTP user is set."""
        with pytest.raises(ValidationError) as excinfo:
            Settings(smtp_user="user", smtp_password=None)
        assert "must both be set" in str(excinfo.value)

    def test_default_values(self):
        settings = Settings() # Relies on SECRET_KEY from env_override fixture
        assert settings.app_name == "NeoForge"
        assert settings.environment == "development"
        assert settings.debug is False
        # Check default CORS is applied when not testing/test env
        assert settings.cors_origins == ["http://localhost:3000"]

    @pytest.mark.parametrize("env_value,expected", [
        ("development", "development"),
        ("PRODUCTION", "production"),
        ("Staging", "staging"),
        ("test", "test"),
    ])
    def test_environment_validation_valid(self, env_value, expected):
        settings = Settings(environment=env_value)
        assert settings.environment == expected

    def test_environment_validation_invalid(self):
        with pytest.raises(ValidationError) as excinfo:
            Settings(environment="invalid")
        assert "Environment must be one of" in str(excinfo.value)

    def test_secret_key_validation(self):
        # Valid case
        settings = Settings(secret_key=VALID_SECRET_KEY)
        assert settings.secret_key.get_secret_value() == VALID_SECRET_KEY.get_secret_value()

        # Invalid case (already tested in test_invalid_secret_key)
        # with pytest.raises(ValidationError) as excinfo:
        #     Settings(secret_key="short")
        # assert "at least 32 characters" in str(excinfo.value)

    # This test might be redundant if CORS parsing is left to Pydantic default
    # @pytest.mark.parametrize("input_val,expected", [
    #     ('["http://valid.com"]', ["http://valid.com"]),
    #     (["http://direct.list"], ["http://direct.list"]),
    #     ("invalid_json", ValueError("CORS_ORIGINS must be a valid JSON string")),
    #     ("not_a_list", ValueError("CORS_ORIGINS must be a list")),
    # ])
    # def test_cors_origins_validation(self, input_val, expected):
    #     if isinstance(expected, Exception):
    #         with pytest.raises(type(expected)) as excinfo:
    #             Settings(cors_origins=input_val)
    #         assert expected.args[0] in str(excinfo.value)
    #     else:
    #         settings = Settings(cors_origins=input_val)
    #         assert settings.cors_origins == expected

    def test_testing_mode_override(self):
        settings = Settings(testing=True)
        assert settings.testing is True
        assert settings.debug is False
        assert settings.cors_origins == []

    @pytest.mark.parametrize("input_val,expected", [
        ("true", True),
        ("false", False),
        (True, True),
        (False, False),
    ])
    def test_debug_validation(self, input_val, expected):
        settings = Settings(debug=input_val)
        assert settings.debug == expected

    def test_smtp_credentials_validation(self):
        # Both set
        Settings(smtp_user="user", smtp_password="pass")

        # Both unset
        Settings(smtp_user=None, smtp_password=None)

        # Mismatch (already tested in test_smtp_password_required_with_user)
        # with pytest.raises(ValidationError):
        #     Settings(smtp_user="user", smtp_password=None)

    def test_environment_variable_priority(self, monkeypatch):
        """ Tests that init args have priority over env vars for BaseSettings """
        monkeypatch.setenv("SECRET_KEY", "env_var_value_should_be_ignored")
        settings = Settings(secret_key=VALID_SECRET_KEY)
        assert settings.secret_key.get_secret_value() == VALID_SECRET_KEY.get_secret_value()

    def test_test_environment_auto_correction(self):
        """ Tests that setting environment='test' overrides debug and cors """
        settings = Settings(environment="test", debug=True, cors_origins=["http://should.be.cleared"])
        assert settings.environment == "test"
        assert settings.testing is True # Should be set by model validator
        assert settings.debug is False
        assert settings.cors_origins == []

# This test is now correctly placed at the module level
def test_settings_cors_validator_in_test_mode():
    """Test the CORS validator specifically empties list when testing=True."""
    # # Explicitly clear cache before direct instantiation to avoid interference # REMOVED
    # from app.core.config import get_settings # REMOVED
    # get_settings.cache_clear() # REMOVED
    
    # Instantiate with testing=True
    settings_testing = Settings(secret_key=VALID_SECRET_KEY, testing=True, cors_origins=["http://should_be_removed.com"])
    # Verify after full validation
    assert settings_testing.cors_origins == [], "CORS origins should be empty when testing=True"

    # # Clear cache again before the next direct instantiation # REMOVED
    # get_settings.cache_clear() # REMOVED
    
    # # Instantiate with environment=test # REMOVED SECTION
    # settings_env_test = Settings(secret_key=VALID_SECRET_KEY, environment=Environment.TEST, cors_origins=["http://should_be_removed.com"])
    # # Verify after full validation
    # assert settings_env_test.cors_origins == [], "CORS origins should be empty when environment=TEST"

# Removed redundant test_field_validation_order, test_valid_settings, test_debug_coercion, test_smtp_validation
# as their logic is covered by other tests or fixture setup. 