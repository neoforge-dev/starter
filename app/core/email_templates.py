# NEW CODE: Insert TemplateError definition at the very top
class TemplateError(Exception):
    """Exception raised when there is an error in email template processing."""

    pass


from pathlib import Path

# NEW CODE: Insert get_template_env and render_template functions
from typing import Optional

import jinja2


def get_template_env(template_dir: Optional[Path] = None) -> jinja2.Environment:
    """Return a Jinja2 Environment for email templates."""
    if template_dir is None:
        template_dir = Path(__file__).parent / "email_templates"
    return jinja2.Environment(
        loader=jinja2.FileSystemLoader(str(template_dir)),
        autoescape=jinja2.select_autoescape(["html", "xml"]),
    )


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

# ... existing code ...
