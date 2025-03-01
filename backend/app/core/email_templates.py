"""Email template validation and management."""
from typing import Dict, Any, Optional, List
from pathlib import Path
from pydantic import BaseModel, Field, validator
import jinja2
from jinja2.meta import find_undeclared_variables

from app.core.config import settings

# NEW CODE: Insert TemplateError definition at the very top
class TemplateError(Exception):
    """Exception raised when there is an error in email template processing."""
    pass

# NEW CODE: Insert get_template_env function
def get_template_env(template_dir: Optional[Path] = None) -> jinja2.Environment:
    """Return a Jinja2 Environment for email templates."""
    if template_dir is None:
        template_dir = Path(__file__).parent / "email_templates"
    return jinja2.Environment(
        loader=jinja2.FileSystemLoader(str(template_dir)),
        autoescape=jinja2.select_autoescape(['html', 'xml'])
    )

# NEW CODE: Insert render_template function
def render_template(template_name: str, data: dict) -> str:
    """Render a template with the given data."""
    env = get_template_env()
    try:
        template = env.get_template(template_name)
    except jinja2.TemplateNotFound:
        raise TemplateError(f"Template {template_name} not found")
    try:
        return template.render(**data)
    except jinja2.TemplateError as e:
        raise TemplateError(f"Error rendering template {template_name}: {e}")

# Set module exports
__all__ = ["TemplateError", "get_template_env", "render_template"]

class TemplateSchema(BaseModel):
    """Schema for email template parameters."""
    name: str = Field(..., description="Template name")
    description: str = Field(..., description="Template description")
    required_params: List[str] = Field(default_factory=list, description="Required template parameters")
    optional_params: List[str] = Field(default_factory=list, description="Optional template parameters")
    example_data: Dict[str, Any] = Field(default_factory=dict, description="Example data for testing")


class TemplateValidator:
    """Email template validator."""
    
    def __init__(self, template_dir: Optional[Path] = None):
        """Initialize validator with template directory."""
        self.template_dir = template_dir or Path(__file__).parent.parent / "email_templates"
        self.env = jinja2.Environment(
            loader=jinja2.FileSystemLoader(str(self.template_dir)),
            autoescape=jinja2.select_autoescape(['html', 'xml'])
        )
        self._schemas: Dict[str, TemplateSchema] = {}
        self._load_schemas()
    
    def _load_schemas(self) -> None:
        """Load template schemas from JSON files."""
        schema_dir = self.template_dir / "schemas"
        if not schema_dir.exists():
            schema_dir.mkdir(parents=True)
        
        for schema_file in schema_dir.glob("*.json"):
            try:
                schema = TemplateSchema.parse_file(schema_file)
                self._schemas[schema.name] = schema
            except Exception as e:
                raise ValueError(f"Invalid schema file {schema_file}: {e}")
    
    def get_template_variables(self, template_name: str) -> set[str]:
        """Get all variables used in a template."""
        try:
            # Get template source
            template_source = self.env.loader.get_source(self.env, f"{template_name}.html")[0]
            # Parse template
            ast = self.env.parse(template_source)
            # Find all variables
            return find_undeclared_variables(ast)
        except jinja2.TemplateNotFound:
            raise ValueError(f"Template {template_name} not found")
        except jinja2.TemplateSyntaxError as e:
            raise ValueError(f"Error parsing template {template_name}: {e}")
    
    def validate_template_data(self, template_name: str, data: Dict[str, Any]) -> None:
        """Validate template data against schema."""
        # Get schema
        schema = self._schemas.get(template_name)
        if not schema:
            # If no schema exists, create one from template
            variables = self.get_template_variables(template_name)
            schema = TemplateSchema(
                name=template_name,
                description=f"Auto-generated schema for {template_name}",
                required_params=list(variables),
                optional_params=[],
                example_data={}
            )
            self._schemas[template_name] = schema
        
        # Check for unknown parameters first
        unknown_params = [
            param for param in data.keys()
            if param not in schema.required_params + schema.optional_params
        ]
        if unknown_params:
            raise ValueError(
                f"Unknown parameters for template {template_name}: {unknown_params}"
            )
        
        # Then check required parameters
        missing_params = [
            param for param in schema.required_params
            if param not in data
        ]
        if missing_params:
            raise ValueError(
                f"Missing required parameters for template {template_name}: {missing_params}"
            )
    
    def render_template(self, template_name: str, data: Dict[str, Any]) -> str:
        """Validate and render template."""
        # Validate data
        self.validate_template_data(template_name, data)
        
        # Render template
        try:
            template = self.env.get_template(f"{template_name}.html")
            return template.render(**data)
        except jinja2.TemplateError as e:
            raise ValueError(f"Error rendering template {template_name}: {e}")
    
    def get_all_templates(self) -> List[TemplateSchema]:
        """Get all available templates with their schemas."""
        return list(self._schemas.values())
    
    def create_schema(self, template_name: str) -> TemplateSchema:
        """Create schema for template from its variables."""
        variables = self.get_template_variables(template_name)
        schema = TemplateSchema(
            name=template_name,
            description=f"Auto-generated schema for {template_name}",
            required_params=list(variables),
            optional_params=[],
            example_data={}
        )
        
        # Save schema
        schema_path = self.template_dir / "schemas" / f"{template_name}.json"
        schema_path.write_text(schema.model_dump_json(indent=2))
        
        self._schemas[template_name] = schema
        return schema 