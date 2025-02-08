"""Test email template validation."""
import pytest
from pathlib import Path
import json

from app.core.email_templates import TemplateValidator, TemplateSchema


@pytest.fixture
def template_dir(tmp_path: Path) -> Path:
    """Create temporary template directory."""
    templates_dir = tmp_path / "email_templates"
    templates_dir.mkdir()
    
    # Create test template
    test_template = templates_dir / "test_template.html"
    test_template.write_text("""
        <h1>Hello {{ name }}!</h1>
        <p>Welcome to {{ company }}.</p>
        {% if role %}
        <p>Your role is: {{ role }}</p>
        {% endif %}
    """)
    
    # Create schemas directory
    schema_dir = templates_dir / "schemas"
    schema_dir.mkdir()
    
    return templates_dir


@pytest.fixture
def validator(template_dir: Path) -> TemplateValidator:
    """Create template validator."""
    return TemplateValidator(template_dir)


def test_get_template_variables(validator: TemplateValidator):
    """Test extracting variables from template."""
    variables = validator.get_template_variables("test_template")
    assert variables == {"name", "company", "role"}


def test_validate_template_data_missing_params(validator: TemplateValidator):
    """Test validation with missing parameters."""
    with pytest.raises(ValueError) as exc:
        validator.validate_template_data("test_template", {"name": "John"})
    assert "Missing required parameters" in str(exc.value)
    assert "company" in str(exc.value)


def test_validate_template_data_unknown_params(validator: TemplateValidator):
    """Test validation with unknown parameters."""
    with pytest.raises(ValueError) as exc:
        validator.validate_template_data(
            "test_template",
            {
                "name": "John",
                "company": "ACME",
                "unknown": "value"
            }
        )
    assert "Unknown parameters" in str(exc.value)
    assert "unknown" in str(exc.value)


def test_validate_template_data_success(validator: TemplateValidator):
    """Test successful template validation."""
    # Should not raise any exceptions
    validator.validate_template_data(
        "test_template",
        {
            "name": "John",
            "company": "ACME",
            "role": "Admin"
        }
    )


def test_render_template(validator: TemplateValidator):
    """Test template rendering."""
    html = validator.render_template(
        "test_template",
        {
            "name": "John",
            "company": "ACME",
            "role": "Admin"
        }
    )
    assert "Hello John!" in html
    assert "Welcome to ACME" in html
    assert "Your role is: Admin" in html


def test_create_schema(validator: TemplateValidator, template_dir: Path):
    """Test schema creation."""
    schema = validator.create_schema("test_template")
    
    assert schema.name == "test_template"
    assert "name" in schema.required_params
    assert "company" in schema.required_params
    assert "role" in schema.required_params
    
    # Check schema was saved
    schema_file = template_dir / "schemas" / "test_template.json"
    assert schema_file.exists()
    
    # Check saved schema is valid
    saved_schema = TemplateSchema.parse_file(schema_file)
    assert saved_schema.required_params == schema.required_params


def test_template_not_found(validator: TemplateValidator):
    """Test handling of non-existent template."""
    with pytest.raises(ValueError) as exc:
        validator.get_template_variables("nonexistent")
    assert "Template nonexistent not found" in str(exc.value)


def test_invalid_template_syntax(template_dir: Path):
    """Test handling of template with invalid syntax."""
    # Create invalid template
    invalid_template = template_dir / "invalid_template.html"
    invalid_template.write_text("""
        <h1>{{ unclosed tag</h1>
    """)
    
    validator = TemplateValidator(template_dir)
    
    with pytest.raises(ValueError) as exc:
        validator.get_template_variables("invalid_template")
    assert "Error" in str(exc.value) 