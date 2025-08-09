#!/usr/bin/env python3
"""
NeoForge CLI Tool - Enhanced Automation Toolkit
Auto-generates components, API endpoints, and integrations

Usage:
    python neoforge-cli.py create-component --name UserProfile --type molecule
    python neoforge-cli.py create-endpoint --name products --model Product
    python neoforge-cli.py add-integration --provider stripe --type payment
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime
from jinja2 import Environment, FileSystemLoader, Template


class NeoForgeCLI:
    """Enhanced automation toolkit for NeoForge development"""
    
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.templates_dir = self.project_root / "scripts" / "templates"
        self.ensure_templates_dir()
        
        # Initialize Jinja2 environment
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(self.templates_dir)),
            trim_blocks=True,
            lstrip_blocks=True
        )
    
    def ensure_templates_dir(self):
        """Ensure templates directory exists"""
        self.templates_dir.mkdir(parents=True, exist_ok=True)
    
    def create_component(self, name: str, component_type: str = "molecule", 
                        has_state: bool = False, has_events: bool = False):
        """Generate a complete Lit component with tests and stories"""
        print(f"🚀 Creating {component_type} component: {name}")
        
        # Convert name formats
        kebab_name = self.to_kebab_case(name)
        pascal_name = self.to_pascal_case(name)
        camel_name = self.to_camel_case(name)
        
        # Determine component directory
        component_dir = (
            self.project_root / "frontend" / "src" / "components" / 
            component_type + "s" / kebab_name
        )
        component_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate component files
        files_generated = []
        
        # Main component file
        component_content = self.generate_component_code(
            pascal_name, kebab_name, component_type, has_state, has_events
        )
        component_file = component_dir / f"{kebab_name}.js"
        component_file.write_text(component_content)
        files_generated.append(str(component_file))
        
        # Test file
        test_content = self.generate_component_test(pascal_name, kebab_name)
        test_file = component_dir / f"{kebab_name}.test.js"
        test_file.write_text(test_content)
        files_generated.append(str(test_file))
        
        # Stories file (for Storybook)
        stories_content = self.generate_component_stories(pascal_name, kebab_name)
        stories_file = component_dir / f"{kebab_name}.stories.js"
        stories_file.write_text(stories_content)
        files_generated.append(str(stories_file))
        
        # Update index.js exports
        self.update_component_exports(component_type, kebab_name, pascal_name)
        
        print(f"✅ Generated {len(files_generated)} files:")
        for file_path in files_generated:
            print(f"   📄 {file_path}")
        
        return files_generated
    
    def generate_component_code(self, pascal_name: str, kebab_name: str, 
                               component_type: str, has_state: bool, has_events: bool) -> str:
        """Generate the main component code"""
        template = Template('''import { html, css } from "lit";
import { baseStyles } from "../../styles/base.js";
import { BaseComponent } from "../../base-component.js";
{% if has_state %}
import { property, state } from "lit/decorators.js";
{% endif %}

/**
 * {{ pascal_name }} component
 * @element {{ kebab_name }}
 *
 * @prop {string} label - The label text
 * @prop {boolean} disabled - Whether the component is disabled
{% if has_state %}
 * @prop {string} variant - The variant style
{% endif %}
{% if has_events %}
 *
 * @fires {{ kebab_name }}-click - Fired when component is clicked
 * @fires {{ kebab_name }}-change - Fired when component value changes
{% endif %}
 */
export class {{ pascal_name }} extends BaseComponent {
  static get properties() {
    return {
      label: { type: String, reflect: true },
      disabled: { type: Boolean, reflect: true },
{% if has_state %}
      variant: { type: String, reflect: true },
{% endif %}
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: block;
          padding: var(--spacing-md);
        }

        :host([disabled]) {
          opacity: 0.5;
          pointer-events: none;
        }

        .{{ kebab_name }} {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm);
          border-radius: var(--radius-md);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          transition: all var(--transition-fast);
        }

        .{{ kebab_name }}:hover {
          border-color: var(--color-primary);
          box-shadow: var(--shadow-sm);
        }

{% if has_state %}
        .variant-primary {
          background: var(--color-primary);
          color: white;
        }

        .variant-secondary {
          background: var(--color-secondary);
          color: white;
        }
{% endif %}

        .label {
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-medium);
        }
      `,
    ];
  }

  constructor() {
    super();
    this.label = "";
    this.disabled = false;
{% if has_state %}
    this.variant = "default";
{% endif %}
  }

{% if has_events %}
  /**
   * Handle click event
   */
  _handleClick(e) {
    if (this.disabled) {
      e.preventDefault();
      return;
    }

    this.dispatchEvent(
      new CustomEvent("{{ kebab_name }}-click", {
        bubbles: true,
        composed: true,
        detail: { originalEvent: e },
      })
    );
  }
{% endif %}

  render() {
    return html`
      <div 
        class="{{ kebab_name }}{% if has_state %} variant-${this.variant}{% endif %}"
{% if has_events %}
        @click="${this._handleClick}"
{% endif %}
      >
        <span class="label">${this.label}</span>
        <slot></slot>
      </div>
    `;
  }
}

customElements.define("{{ kebab_name }}", {{ pascal_name }});
''')
        
        return template.render(
            pascal_name=pascal_name,
            kebab_name=kebab_name,
            component_type=component_type,
            has_state=has_state,
            has_events=has_events
        )
    
    def generate_component_test(self, pascal_name: str, kebab_name: str) -> str:
        """Generate component test file"""
        template = Template('''import { html, fixture, expect } from "@open-wc/testing";
import "../{{ kebab_name }}.js";

describe("{{ pascal_name }}", () => {
  it("renders with default properties", async () => {
    const el = await fixture(html`<{{ kebab_name }}></{{ kebab_name }}>`);
    
    expect(el).to.exist;
    expect(el.label).to.equal("");
    expect(el.disabled).to.be.false;
  });

  it("renders with custom label", async () => {
    const el = await fixture(
      html`<{{ kebab_name }} label="Test Label"></{{ kebab_name }}>`
    );
    
    expect(el.label).to.equal("Test Label");
    expect(el.shadowRoot.querySelector(".label").textContent).to.equal("Test Label");
  });

  it("applies disabled state correctly", async () => {
    const el = await fixture(
      html`<{{ kebab_name }} disabled></{{ kebab_name }}>`
    );
    
    expect(el.disabled).to.be.true;
    expect(el.hasAttribute("disabled")).to.be.true;
  });

  it("handles slotted content", async () => {
    const el = await fixture(
      html`<{{ kebab_name }}><span>Slotted Content</span></{{ kebab_name }}>`
    );
    
    const slottedContent = el.querySelector("span");
    expect(slottedContent.textContent).to.equal("Slotted Content");
  });

  it("dispatches custom events on click", async () => {
    const el = await fixture(html`<{{ kebab_name }}></{{ kebab_name }}>`);
    
    let eventFired = false;
    el.addEventListener("{{ kebab_name }}-click", () => {
      eventFired = true;
    });
    
    el.shadowRoot.querySelector(".{{ kebab_name }}").click();
    expect(eventFired).to.be.true;
  });

  it("prevents events when disabled", async () => {
    const el = await fixture(
      html`<{{ kebab_name }} disabled></{{ kebab_name }}>`
    );
    
    let eventFired = false;
    el.addEventListener("{{ kebab_name }}-click", () => {
      eventFired = true;
    });
    
    el.shadowRoot.querySelector(".{{ kebab_name }}").click();
    expect(eventFired).to.be.false;
  });
});
''')
        
        return template.render(
            pascal_name=pascal_name,
            kebab_name=kebab_name
        )
    
    def generate_component_stories(self, pascal_name: str, kebab_name: str) -> str:
        """Generate Storybook stories file"""
        template = Template('''import { html } from "lit";
import "../{{ kebab_name }}.js";

export default {
  title: "Components/{{ pascal_name }}",
  component: "{{ kebab_name }}",
  argTypes: {
    label: {
      control: { type: "text" },
      description: "The label text for the component",
    },
    disabled: {
      control: { type: "boolean" },
      description: "Whether the component is disabled",
    },
  },
};

const Template = (args) => html`
  <{{ kebab_name }}
    label="${args.label}"
    ?disabled="${args.disabled}"
  >
    ${args.slottedContent ? html`<span>${args.slottedContent}</span>` : ""}
  </{{ kebab_name }}>
`;

export const Default = Template.bind({});
Default.args = {
  label: "Default {{ pascal_name }}",
  disabled: false,
};

export const WithSlottedContent = Template.bind({});
WithSlottedContent.args = {
  label: "With Content",
  disabled: false,
  slottedContent: "Additional content",
};

export const Disabled = Template.bind({});
Disabled.args = {
  label: "Disabled {{ pascal_name }}",
  disabled: true,
};

export const Interactive = Template.bind({});
Interactive.args = {
  label: "Click Me",
  disabled: false,
};
Interactive.play = async ({ canvasElement }) => {
  const component = canvasElement.querySelector("{{ kebab_name }}");
  
  // Add event listener for demo
  component.addEventListener("{{ kebab_name }}-click", (e) => {
    console.log("{{ pascal_name }} clicked!", e.detail);
  });
};
''')
        
        return template.render(
            pascal_name=pascal_name,
            kebab_name=kebab_name
        )
    
    def create_endpoint(self, name: str, model_name: Optional[str] = None,
                       include_auth: bool = True, include_validation: bool = True):
        """Generate a complete CRUD API endpoint with validation and tests"""
        print(f"🚀 Creating CRUD endpoint: {name}")
        
        if not model_name:
            model_name = self.to_pascal_case(name.rstrip('s'))
        
        # Convert name formats
        plural_name = name.lower()
        singular_name = plural_name.rstrip('s')
        pascal_name = self.to_pascal_case(singular_name)
        snake_name = self.to_snake_case(singular_name)
        
        files_generated = []
        
        # Generate model file
        model_content = self.generate_model_code(pascal_name, snake_name)
        model_file = self.project_root / "backend" / "app" / "models" / f"{snake_name}.py"
        model_file.write_text(model_content)
        files_generated.append(str(model_file))
        
        # Generate schemas file
        schema_content = self.generate_schema_code(pascal_name, snake_name)
        schema_file = self.project_root / "backend" / "app" / "schemas" / f"{snake_name}.py"
        schema_file.write_text(schema_content)
        files_generated.append(str(schema_file))
        
        # Generate CRUD file
        crud_content = self.generate_crud_code(pascal_name, snake_name, plural_name)
        crud_file = self.project_root / "backend" / "app" / "crud" / f"{snake_name}.py"
        crud_file.write_text(crud_content)
        files_generated.append(str(crud_file))
        
        # Generate endpoint file
        endpoint_content = self.generate_endpoint_code(
            pascal_name, snake_name, plural_name, include_auth, include_validation
        )
        endpoint_file = (
            self.project_root / "backend" / "app" / "api" / "v1" / 
            "endpoints" / f"{plural_name}.py"
        )
        endpoint_file.parent.mkdir(parents=True, exist_ok=True)
        endpoint_file.write_text(endpoint_content)
        files_generated.append(str(endpoint_file))
        
        # Generate test file
        test_content = self.generate_endpoint_test(
            pascal_name, snake_name, plural_name, include_auth
        )
        test_file = (
            self.project_root / "backend" / "tests" / "api" / "v1" / 
            f"test_{plural_name}.py"
        )
        test_file.parent.mkdir(parents=True, exist_ok=True)
        test_file.write_text(test_content)
        files_generated.append(str(test_file))
        
        # Update router registration
        self.update_router_registration(plural_name)
        
        print(f"✅ Generated {len(files_generated)} files:")
        for file_path in files_generated:
            print(f"   📄 {file_path}")
        
        print(f"\n📝 Next steps:")
        print(f"   1. Add {pascal_name} to database imports")
        print(f"   2. Run: alembic revision --autogenerate -m 'Add {snake_name} model'")
        print(f"   3. Run: alembic upgrade head")
        print(f"   4. Test the endpoint: GET /api/v1/{plural_name}")
        
        return files_generated
    
    def generate_model_code(self, pascal_name: str, snake_name: str) -> str:
        """Generate SQLModel model code"""
        template = Template('''from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel


class {{ pascal_name }}Base(SQLModel):
    """Base {{ pascal_name }} model with common fields"""
    name: str = Field(max_length=255, description="Name of the {{ snake_name }}")
    description: Optional[str] = Field(default=None, max_length=1000, description="Description")
    is_active: bool = Field(default=True, description="Whether the {{ snake_name }} is active")


class {{ pascal_name }}Create({{ pascal_name }}Base):
    """Schema for creating a new {{ snake_name }}"""
    pass


class {{ pascal_name }}Update(SQLModel):
    """Schema for updating a {{ snake_name }}"""
    name: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    is_active: Optional[bool] = Field(default=None)


class {{ pascal_name }}Read({{ pascal_name }}Base):
    """Schema for reading a {{ snake_name }}"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None


class {{ pascal_name }}({{ pascal_name }}Base, table=True):
    """{{ pascal_name }} database model"""
    __tablename__ = "{{ snake_name }}s"
    
    id: Optional[int] = Field(default=None, primary_key=True, description="Unique identifier")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(default=None, description="Last update timestamp")
    
    class Config:
        """Pydantic configuration"""
        from_attributes = True
        json_schema_extra = {
            "example": {
                "name": "Sample {{ pascal_name }}",
                "description": "A sample {{ snake_name }} description",
                "is_active": True,
            }
        }
''')
        
        return template.render(
            pascal_name=pascal_name,
            snake_name=snake_name
        )
    
    def generate_endpoint_code(self, pascal_name: str, snake_name: str, 
                              plural_name: str, include_auth: bool, include_validation: bool) -> str:
        """Generate FastAPI endpoint code"""
        template = Template('''from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session

from app.api.deps import get_db{% if include_auth %}, get_current_user{% endif %}
from app.crud.{{ snake_name }} import {{ snake_name }}_crud
from app.models.{{ snake_name }} import {{ pascal_name }}Create, {{ pascal_name }}Read, {{ pascal_name }}Update
{% if include_auth %}from app.models.user import User{% endif %}
{% if include_validation %}from app.core.security import validate_input_security{% endif %}

router = APIRouter()


@router.get("/", response_model=List[{{ pascal_name }}Read])
async def get_{{ plural_name }}(
    *,
    db: Session = Depends(get_db),
{% if include_auth %}
    current_user: User = Depends(get_current_user),
{% endif %}
    skip: int = Query(0, ge=0, description="Number of {{ plural_name }} to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of {{ plural_name }} to return"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
) -> List[{{ pascal_name }}Read]:
    """
    Retrieve {{ plural_name }}.
    
    Returns a list of {{ plural_name }} with pagination support.
    """
    {{ plural_name }} = await {{ snake_name }}_crud.get_multi(
        db=db, skip=skip, limit=limit, is_active=is_active
    )
    return {{ plural_name }}


@router.get("/{{{ snake_name }}_id}", response_model={{ pascal_name }}Read)
async def get_{{ snake_name }}(
    *,
    db: Session = Depends(get_db),
{% if include_auth %}
    current_user: User = Depends(get_current_user),
{% endif %}
    {{ snake_name }}_id: int,
) -> {{ pascal_name }}Read:
    """
    Get a specific {{ snake_name }} by ID.
    """
    {{ snake_name }} = await {{ snake_name }}_crud.get(db=db, id={{ snake_name }}_id)
    if not {{ snake_name }}:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="{{ pascal_name }} not found"
        )
    return {{ snake_name }}


@router.post("/", response_model={{ pascal_name }}Read, status_code=status.HTTP_201_CREATED)
async def create_{{ snake_name }}(
    *,
    db: Session = Depends(get_db),
{% if include_auth %}
    current_user: User = Depends(get_current_user),
{% endif %}
    {{ snake_name }}_in: {{ pascal_name }}Create,
) -> {{ pascal_name }}Read:
    """
    Create a new {{ snake_name }}.
    """
{% if include_validation %}
    # Security validation
    security_threats = validate_input_security({{ snake_name }}_in.name)
    if security_threats:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Security validation failed: {', '.join(security_threats)}"
        )
    
    if {{ snake_name }}_in.description:
        desc_threats = validate_input_security({{ snake_name }}_in.description)
        if desc_threats:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Description security validation failed: {', '.join(desc_threats)}"
            )
{% endif %}
    
    {{ snake_name }} = await {{ snake_name }}_crud.create(db=db, obj_in={{ snake_name }}_in)
    return {{ snake_name }}


@router.put("/{{{ snake_name }}_id}", response_model={{ pascal_name }}Read)
async def update_{{ snake_name }}(
    *,
    db: Session = Depends(get_db),
{% if include_auth %}
    current_user: User = Depends(get_current_user),
{% endif %}
    {{ snake_name }}_id: int,
    {{ snake_name }}_in: {{ pascal_name }}Update,
) -> {{ pascal_name }}Read:
    """
    Update a {{ snake_name }}.
    """
    {{ snake_name }} = await {{ snake_name }}_crud.get(db=db, id={{ snake_name }}_id)
    if not {{ snake_name }}:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="{{ pascal_name }} not found"
        )
    
{% if include_validation %}
    # Security validation for updated fields
    if {{ snake_name }}_in.name:
        security_threats = validate_input_security({{ snake_name }}_in.name)
        if security_threats:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Security validation failed: {', '.join(security_threats)}"
            )
    
    if {{ snake_name }}_in.description:
        desc_threats = validate_input_security({{ snake_name }}_in.description)
        if desc_threats:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Description security validation failed: {', '.join(desc_threats)}"
            )
{% endif %}
    
    {{ snake_name }} = await {{ snake_name }}_crud.update(
        db=db, db_obj={{ snake_name }}, obj_in={{ snake_name }}_in
    )
    return {{ snake_name }}


@router.delete("/{{{ snake_name }}_id}")
async def delete_{{ snake_name }}(
    *,
    db: Session = Depends(get_db),
{% if include_auth %}
    current_user: User = Depends(get_current_user),
{% endif %}
    {{ snake_name }}_id: int,
) -> dict:
    """
    Delete a {{ snake_name }}.
    """
    {{ snake_name }} = await {{ snake_name }}_crud.get(db=db, id={{ snake_name }}_id)
    if not {{ snake_name }}:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="{{ pascal_name }} not found"
        )
    
    await {{ snake_name }}_crud.remove(db=db, id={{ snake_name }}_id)
    return {"message": "{{ pascal_name }} deleted successfully"}
''')
        
        return template.render(
            pascal_name=pascal_name,
            snake_name=snake_name,
            plural_name=plural_name,
            include_auth=include_auth,
            include_validation=include_validation
        )
    
    def generate_schema_code(self, pascal_name: str, snake_name: str) -> str:
        """Generate Pydantic schema code (moved to models for simplicity)"""
        return f'# Schemas moved to models/{snake_name}.py for better organization\n'
    
    def generate_crud_code(self, pascal_name: str, snake_name: str, plural_name: str) -> str:
        """Generate CRUD operations code"""
        template = Template('''from typing import List, Optional
from sqlmodel import Session, select
from app.crud.base import CRUDBase
from app.models.{{ snake_name }} import {{ pascal_name }}, {{ pascal_name }}Create, {{ pascal_name }}Update


class CRUD{{ pascal_name }}(CRUDBase[{{ pascal_name }}, {{ pascal_name }}Create, {{ pascal_name }}Update]):
    """CRUD operations for {{ pascal_name }}"""
    
    async def get_multi(
        self, 
        db: Session, 
        *,
        skip: int = 0, 
        limit: int = 100,
        is_active: Optional[bool] = None
    ) -> List[{{ pascal_name }}]:
        """Get multiple {{ plural_name }} with optional filtering"""
        query = select({{ pascal_name }})
        
        if is_active is not None:
            query = query.where({{ pascal_name }}.is_active == is_active)
        
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_by_name(self, db: Session, *, name: str) -> Optional[{{ pascal_name }}]:
        """Get {{ snake_name }} by name"""
        query = select({{ pascal_name }}).where({{ pascal_name }}.name == name)
        result = await db.execute(query)
        return result.scalar_one_or_none()


{{ snake_name }}_crud = CRUD{{ pascal_name }}({{ pascal_name }})
''')
        
        return template.render(
            pascal_name=pascal_name,
            snake_name=snake_name,
            plural_name=plural_name
        )
    
    def generate_endpoint_test(self, pascal_name: str, snake_name: str, 
                              plural_name: str, include_auth: bool) -> str:
        """Generate comprehensive endpoint tests"""
        template = Template('''import pytest
from httpx import AsyncClient
from sqlmodel import Session

from app.core.config import settings
{% if include_auth %}from app.tests.utils.utils import create_random_user, user_authentication_headers{% endif %}


class Test{{ pascal_name }}Endpoints:
    """Test suite for {{ pascal_name }} CRUD endpoints"""
    
    @pytest.fixture
    async def {{ snake_name }}_data(self):
        """Test {{ snake_name }} data"""
        return {
            "name": "Test {{ pascal_name }}",
            "description": "A test {{ snake_name }} for testing purposes",
            "is_active": True
        }
    
    {% if include_auth %}
    @pytest.fixture
    async def auth_headers(self, db: Session):
        """Authentication headers for tests"""
        user = await create_random_user(db)
        return await user_authentication_headers(user.email)
    {% endif %}
    
    async def test_create_{{ snake_name }}(
        self, 
        client: AsyncClient, 
        db: Session,
        {{ snake_name }}_data: dict
        {% if include_auth %}, auth_headers: dict{% endif %}
    ):
        """Test creating a new {{ snake_name }}"""
        response = await client.post(
            f"{settings.API_V1_STR}/{{ plural_name }}/",
            json={{ snake_name }}_data,
            {% if include_auth %}headers=auth_headers{% endif %}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == {{ snake_name }}_data["name"]
        assert data["description"] == {{ snake_name }}_data["description"]
        assert data["is_active"] == {{ snake_name }}_data["is_active"]
        assert "id" in data
        assert "created_at" in data
    
    async def test_get_{{ plural_name }}(
        self, 
        client: AsyncClient, 
        db: Session
        {% if include_auth %}, auth_headers: dict{% endif %}
    ):
        """Test getting list of {{ plural_name }}"""
        response = await client.get(
            f"{settings.API_V1_STR}/{{ plural_name }}/",
            {% if include_auth %}headers=auth_headers{% endif %}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    async def test_get_{{ snake_name }}_by_id(
        self, 
        client: AsyncClient, 
        db: Session,
        {{ snake_name }}_data: dict
        {% if include_auth %}, auth_headers: dict{% endif %}
    ):
        """Test getting specific {{ snake_name }} by ID"""
        # First create a {{ snake_name }}
        create_response = await client.post(
            f"{settings.API_V1_STR}/{{ plural_name }}/",
            json={{ snake_name }}_data,
            {% if include_auth %}headers=auth_headers{% endif %}
        )
        created_{{ snake_name }} = create_response.json()
        
        # Then get it by ID
        response = await client.get(
            f"{settings.API_V1_STR}/{{ plural_name }}/{created_{{ snake_name }}['id']}",
            {% if include_auth %}headers=auth_headers{% endif %}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == created_{{ snake_name }}["id"]
        assert data["name"] == {{ snake_name }}_data["name"]
    
    async def test_update_{{ snake_name }}(
        self, 
        client: AsyncClient, 
        db: Session,
        {{ snake_name }}_data: dict
        {% if include_auth %}, auth_headers: dict{% endif %}
    ):
        """Test updating a {{ snake_name }}"""
        # First create a {{ snake_name }}
        create_response = await client.post(
            f"{settings.API_V1_STR}/{{ plural_name }}/",
            json={{ snake_name }}_data,
            {% if include_auth %}headers=auth_headers{% endif %}
        )
        created_{{ snake_name }} = create_response.json()
        
        # Update data
        update_data = {
            "name": "Updated {{ pascal_name }}",
            "description": "Updated description"
        }
        
        response = await client.put(
            f"{settings.API_V1_STR}/{{ plural_name }}/{created_{{ snake_name }}['id']}",
            json=update_data,
            {% if include_auth %}headers=auth_headers{% endif %}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["description"] == update_data["description"]
    
    async def test_delete_{{ snake_name }}(
        self, 
        client: AsyncClient, 
        db: Session,
        {{ snake_name }}_data: dict
        {% if include_auth %}, auth_headers: dict{% endif %}
    ):
        """Test deleting a {{ snake_name }}"""
        # First create a {{ snake_name }}
        create_response = await client.post(
            f"{settings.API_V1_STR}/{{ plural_name }}/",
            json={{ snake_name }}_data,
            {% if include_auth %}headers=auth_headers{% endif %}
        )
        created_{{ snake_name }} = create_response.json()
        
        # Delete it
        response = await client.delete(
            f"{settings.API_V1_STR}/{{ plural_name }}/{created_{{ snake_name }}['id']}",
            {% if include_auth %}headers=auth_headers{% endif %}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        
        # Verify it's deleted
        get_response = await client.get(
            f"{settings.API_V1_STR}/{{ plural_name }}/{created_{{ snake_name }}['id']}",
            {% if include_auth %}headers=auth_headers{% endif %}
        )
        assert get_response.status_code == 404
    
    async def test_{{ snake_name }}_not_found(
        self, 
        client: AsyncClient
        {% if include_auth %}, auth_headers: dict{% endif %}
    ):
        """Test handling non-existent {{ snake_name }}"""
        response = await client.get(
            f"{settings.API_V1_STR}/{{ plural_name }}/999999",
            {% if include_auth %}headers=auth_headers{% endif %}
        )
        assert response.status_code == 404
        
    async def test_create_{{ snake_name }}_security_validation(
        self, 
        client: AsyncClient,
        db: Session
        {% if include_auth %}, auth_headers: dict{% endif %}
    ):
        """Test security validation on create"""
        malicious_data = {
            "name": "'; DROP TABLE users; --",
            "description": "<script>alert('xss')</script>",
            "is_active": True
        }
        
        response = await client.post(
            f"{settings.API_V1_STR}/{{ plural_name }}/",
            json=malicious_data,
            {% if include_auth %}headers=auth_headers{% endif %}
        )
        
        assert response.status_code == 400
        assert "security validation failed" in response.json()["detail"].lower()
''')
        
        return template.render(
            pascal_name=pascal_name,
            snake_name=snake_name,
            plural_name=plural_name,
            include_auth=include_auth
        )
    
    def add_integration(self, provider: str, integration_type: str):
        """Generate integration setup for common services"""
        print(f"🚀 Adding {provider} integration for {integration_type}")
        
        integration_templates = {
            "auth0": self.generate_auth0_integration,
            "stripe": self.generate_stripe_integration,
            "sendgrid": self.generate_sendgrid_integration,
            "sentry": self.generate_sentry_integration,
        }
        
        if provider not in integration_templates:
            print(f"❌ Unknown provider: {provider}")
            print(f"Available providers: {', '.join(integration_templates.keys())}")
            return []
        
        return integration_templates[provider](integration_type)
    
    def generate_auth0_integration(self, integration_type: str) -> List[str]:
        """Generate Auth0 authentication integration"""
        files_generated = []
        
        auth0_service = '''"""
Auth0 authentication service integration
"""
from typing import Dict, Any, Optional
from app.core.config import settings
import httpx


class Auth0Service:
    """Auth0 authentication service"""
    
    def __init__(self):
        self.domain = settings.AUTH0_DOMAIN
        self.client_id = settings.AUTH0_CLIENT_ID
        self.client_secret = settings.AUTH0_CLIENT_SECRET
        
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get user info from Auth0"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://{self.domain}/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            response.raise_for_status()
            return response.json()
    
    async def exchange_code_for_token(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange authorization code for tokens"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://{self.domain}/oauth/token",
                json={
                    "grant_type": "authorization_code",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "redirect_uri": redirect_uri
                }
            )
            response.raise_for_status()
            return response.json()

auth0_service = Auth0Service()
'''
        
        service_file = self.project_root / "backend" / "app" / "services" / "auth0_service.py"
        service_file.parent.mkdir(parents=True, exist_ok=True)
        service_file.write_text(auth0_service)
        files_generated.append(str(service_file))
        
        return files_generated
    
    def generate_sendgrid_integration(self, integration_type: str) -> List[str]:
        """Generate SendGrid email integration"""
        files_generated = []
        
        sendgrid_service = '''"""
SendGrid email service integration
"""
from typing import List, Optional
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from app.core.config import settings


class SendGridService:
    """SendGrid email service"""
    
    def __init__(self):
        self.client = SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
        self.from_email = settings.SENDGRID_FROM_EMAIL
    
    async def send_email(
        self,
        to_emails: List[str],
        subject: str,
        html_content: str,
        plain_text_content: Optional[str] = None
    ) -> bool:
        """Send email using SendGrid"""
        try:
            message = Mail(
                from_email=self.from_email,
                to_emails=to_emails,
                subject=subject,
                html_content=html_content,
                plain_text_content=plain_text_content
            )
            
            response = self.client.send(message)
            return response.status_code == 202
            
        except Exception as e:
            print(f"Email sending failed: {str(e)}")
            return False

sendgrid_service = SendGridService()
'''
        
        service_file = self.project_root / "backend" / "app" / "services" / "sendgrid_service.py"
        service_file.parent.mkdir(parents=True, exist_ok=True)
        service_file.write_text(sendgrid_service)
        files_generated.append(str(service_file))
        
        return files_generated
    
    def generate_sentry_integration(self, integration_type: str) -> List[str]:
        """Generate Sentry monitoring integration"""
        files_generated = []
        
        sentry_setup = '''"""
Sentry monitoring setup
"""
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from app.core.config import settings


def init_sentry():
    """Initialize Sentry monitoring"""
    if settings.SENTRY_DSN:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            integrations=[
                FastApiIntegration(auto_enabling=True),
                SqlalchemyIntegration(),
            ],
            traces_sample_rate=0.1,
            environment=settings.ENVIRONMENT,
        )
'''
        
        setup_file = self.project_root / "backend" / "app" / "core" / "sentry.py"
        setup_file.write_text(sentry_setup)
        files_generated.append(str(setup_file))
        
        return files_generated

    def generate_stripe_integration(self, integration_type: str) -> List[str]:
        """Generate Stripe payment integration"""
        files_generated = []
        
        # Create Stripe service
        stripe_service = '''"""
Stripe payment service integration
"""
import stripe
from typing import Dict, Any, Optional
from app.core.config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeService:
    """Stripe payment service"""
    
    @staticmethod
    async def create_payment_intent(
        amount: int,
        currency: str = "usd",
        metadata: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Create a payment intent"""
        try:
            intent = stripe.PaymentIntent.create(
                amount=amount,
                currency=currency,
                metadata=metadata or {},
            )
            return {
                "client_secret": intent.client_secret,
                "id": intent.id,
                "status": intent.status,
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
    
    @staticmethod
    async def create_customer(email: str, name: str) -> Dict[str, Any]:
        """Create a Stripe customer"""
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
            )
            return {
                "id": customer.id,
                "email": customer.email,
                "name": customer.name,
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")

stripe_service = StripeService()
'''
        
        service_file = self.project_root / "backend" / "app" / "services" / "stripe_service.py"
        service_file.parent.mkdir(parents=True, exist_ok=True)
        service_file.write_text(stripe_service)
        files_generated.append(str(service_file))
        
        # Create payment endpoint
        payment_endpoint = '''"""
Payment endpoints using Stripe
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.services.stripe_service import stripe_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


class PaymentIntentCreate(BaseModel):
    amount: int
    currency: str = "usd"
    description: str = ""


class PaymentIntentResponse(BaseModel):
    client_secret: str
    payment_intent_id: str


@router.post("/payment-intent", response_model=PaymentIntentResponse)
async def create_payment_intent(
    payment_data: PaymentIntentCreate,
    current_user: User = Depends(get_current_user)
) -> PaymentIntentResponse:
    """Create a Stripe payment intent"""
    try:
        result = await stripe_service.create_payment_intent(
            amount=payment_data.amount,
            currency=payment_data.currency,
            metadata={
                "user_id": str(current_user.id),
                "description": payment_data.description,
            }
        )
        return PaymentIntentResponse(
            client_secret=result["client_secret"],
            payment_intent_id=result["id"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
'''
        
        endpoint_file = self.project_root / "backend" / "app" / "api" / "v1" / "endpoints" / "payments.py"
        endpoint_file.write_text(payment_endpoint)
        files_generated.append(str(endpoint_file))
        
        # Add environment variables documentation
        env_docs = '''
# Add these to your .env file:
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Add to requirements (already included in pyproject.toml):
# stripe>=7.0.0
'''
        
        env_file = self.project_root / "STRIPE_SETUP.md"
        env_file.write_text(f"# Stripe Integration Setup\n\n{env_docs}")
        files_generated.append(str(env_file))
        
        print(f"✅ Generated Stripe integration files:")
        for file_path in files_generated:
            print(f"   📄 {file_path}")
        print(f"\n📝 Next steps:")
        print(f"   1. Add Stripe keys to your .env file")
        print(f"   2. Add payments router to main API")
        print(f"   3. Test with: POST /api/v1/payments/payment-intent")
        
        return files_generated
    
    # Utility methods for name conversion
    def to_kebab_case(self, name: str) -> str:
        """Convert to kebab-case"""
        return name.replace('_', '-').replace(' ', '-').lower()
    
    def to_pascal_case(self, name: str) -> str:
        """Convert to PascalCase"""
        return ''.join(word.capitalize() for word in name.replace('-', '_').split('_'))
    
    def to_camel_case(self, name: str) -> str:
        """Convert to camelCase"""
        words = name.replace('-', '_').split('_')
        return words[0].lower() + ''.join(word.capitalize() for word in words[1:])
    
    def to_snake_case(self, name: str) -> str:
        """Convert to snake_case"""
        return name.replace('-', '_').lower()
    
    def update_component_exports(self, component_type: str, kebab_name: str, pascal_name: str):
        """Update component index.js exports"""
        index_file = (
            self.project_root / "frontend" / "src" / "components" / 
            f"{component_type}s" / "index.js"
        )
        
        export_line = f'export {{ {pascal_name} }} from "./{kebab_name}/{kebab_name}.js";\n'
        
        if index_file.exists():
            content = index_file.read_text()
            if export_line not in content:
                index_file.write_text(content + export_line)
        else:
            index_file.write_text(export_line)
    
    def update_router_registration(self, plural_name: str):
        """Update API router registration"""
        # This would update the main API router to include the new endpoint
        print(f"📝 Manual step: Add {plural_name} router to app/api/v1/api.py")


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(description="NeoForge CLI - Enhanced Automation Toolkit")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Component generator
    component_parser = subparsers.add_parser("create-component", help="Generate a Lit component")
    component_parser.add_argument("--name", required=True, help="Component name (PascalCase)")
    component_parser.add_argument(
        "--type", 
        choices=["atom", "molecule", "organism"], 
        default="molecule",
        help="Component type (default: molecule)"
    )
    component_parser.add_argument("--state", action="store_true", help="Include state management")
    component_parser.add_argument("--events", action="store_true", help="Include event handling")
    
    # API endpoint generator
    endpoint_parser = subparsers.add_parser("create-endpoint", help="Generate CRUD API endpoint")
    endpoint_parser.add_argument("--name", required=True, help="Endpoint name (plural, e.g., 'products')")
    endpoint_parser.add_argument("--model", help="Model name (default: derived from endpoint name)")
    endpoint_parser.add_argument("--no-auth", action="store_true", help="Skip authentication")
    endpoint_parser.add_argument("--no-validation", action="store_true", help="Skip security validation")
    
    # Integration generator
    integration_parser = subparsers.add_parser("add-integration", help="Add service integration")
    integration_parser.add_argument(
        "--provider", 
        required=True,
        choices=["auth0", "stripe", "sendgrid", "sentry"],
        help="Integration provider"
    )
    integration_parser.add_argument(
        "--type", 
        required=True,
        choices=["auth", "payment", "email", "monitoring"],
        help="Integration type"
    )
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    cli = NeoForgeCLI()
    
    try:
        if args.command == "create-component":
            cli.create_component(
                name=args.name,
                component_type=args.type,
                has_state=args.state,
                has_events=args.events
            )
        elif args.command == "create-endpoint":
            cli.create_endpoint(
                name=args.name,
                model_name=args.model,
                include_auth=not args.no_auth,
                include_validation=not args.no_validation
            )
        elif args.command == "add-integration":
            cli.add_integration(
                provider=args.provider,
                integration_type=args.type
            )
        
        print(f"\n🎉 {args.command} completed successfully!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()