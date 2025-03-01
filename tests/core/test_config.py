import pytest
from app.core.config import Settings
from pydantic import ValidationError
import os

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
        monkeypatch.setenv("APP_NAME", "TestConfig")  # Prevent default app name

    def test_valid_settings(self):
        """Test valid settings configuration."""
        settings = Settings(
            secret_key="a"*32,  # Valid length
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
            Settings(secret_key="short")
        assert "at least 32 characters" in str(excinfo.value)

    def test_empty_cors_origins_in_testing(self):
        """Test empty CORS origins in testing environment."""
        settings = Settings(
            environment="development",
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
        settings = Settings()
        assert settings.app_name == "NeoForge"
        assert settings.environment == "development"
        assert settings.debug is False

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
        valid_key = "a" * 32
        settings = Settings(secret_key=valid_key)
        assert settings.secret_key.get_secret_value() == valid_key

        # Invalid case
        with pytest.raises(ValidationError) as excinfo:
            Settings(secret_key="short")
        assert "at least 32 characters" in str(excinfo.value)

    @pytest.mark.parametrize("input_val,expected", [
        ('["http://valid.com"]', ["http://valid.com"]),
        (["http://direct.list"], ["http://direct.list"]),
        ("invalid_json", ValueError("CORS_ORIGINS must be a valid JSON string")),
        ("not_a_list", ValueError("CORS_ORIGINS must be a list")),
    ])
    def test_cors_origins_validation(self, input_val, expected):
        if isinstance(expected, Exception):
            with pytest.raises(type(expected)) as excinfo:
                Settings(cors_origins=input_val)
            assert expected.args[0] in str(excinfo.value)
        else:
            settings = Settings(cors_origins=input_val)
            assert settings.cors_origins == expected

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

        # Mismatch
        with pytest.raises(ValidationError):
            Settings(smtp_user="user", smtp_password=None)

    def test_environment_variable_priority(self, monkeypatch):
        monkeypatch.setenv("SECRET_KEY", "env_var_value")
        settings = Settings(secret_key="direct_value")
        assert settings.secret_key.get_secret_value() == "direct_value"

    def test_test_environment_auto_correction(self):
        settings = Settings(environment="test", debug=True, cors_origins=["http://should.be.cleared"])
        assert settings.environment == "test"
        assert settings.debug is False
        assert settings.cors_origins == []

    def test_debug_defaults():
        settings = Settings()  # Should use default debug=False
        assert settings.debug is False

    def test_debug_override():
        settings = Settings(debug=True)
        assert settings.debug is True

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

        # Mismatch
        with pytest.raises(ValidationError):
            Settings(smtp_user="user", smtp_password=None)

    def test_environment_variable_priority(self, monkeypatch):
        monkeypatch.setenv("SECRET_KEY", "env_var_value")
        settings = Settings(secret_key="direct_value")
        assert settings.secret_key.get_secret_value() == "direct_value"

    def test_test_environment_auto_correction(self):
        settings = Settings(environment="test", debug=True, cors_origins=["http://should.be.cleared"])
        assert settings.environment == "test"
        assert settings.debug is False
        assert settings.cors_origins == []

    def test_field_validation_order():
        with pytest.raises(ValidationError) as excinfo:
            Settings(
                secret_key="short",
                environment="invalid",
                smtp_user="alone"
            )
        errors = excinfo.value.errors()
        assert len(errors) == 3  # Expect 3 validation failures

    def test_valid_settings():
        """Test valid settings with direct parameters"""
        settings = Settings(
            secret_key="x"*32,
            debug=False,
            environment="development",
            cors_origins=["http://localhost:3000"],
            smtp_user=None,
            smtp_password=None
        )
        assert settings.debug is False
        assert settings.environment == "development"
        assert settings.cors_origins == ["http://localhost:3000"]

    def test_debug_coercion():
        """Test all debug value permutations"""
        assert Settings(debug="false").debug is False
        assert Settings(debug="0").debug is False
        assert Settings(debug=0).debug is False
        assert Settings(debug="true").debug is True
        assert Settings(debug=True).debug is True

    def test_smtp_validation():
        """Test SMTP credential validation"""
        # Valid cases
        Settings(smtp_user="user", smtp_password="pass")
        Settings(smtp_user=None, smtp_password=None)
        
        # Invalid case
        with pytest.raises(ValidationError) as excinfo:
            Settings(smtp_user="user", smtp_password=None)
        assert "SMTP requires both" in str(excinfo.value) 