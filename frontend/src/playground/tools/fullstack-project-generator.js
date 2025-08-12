/**
 * Full-Stack Project Generator
 * 
 * Generates complete project templates with backend integration, not just frontend.
 * Transforms playground components into production-ready full-stack applications.
 */

export class FullStackProjectGenerator {
  constructor() {
    this.templates = this.initializeTemplates();
    this.backendOptions = this.initializeBackendOptions();
    this.databaseOptions = this.initializeDatabaseOptions();
  }

  /**
   * Generate complete full-stack project
   */
  async generateFullStackProject(projectConfig) {
    this.validateProjectConfig(projectConfig);
    
    try {
      // Generate frontend application
      const frontend = await this.generateFrontend(projectConfig);
      
      // Generate backend API
      const backend = await this.generateBackend(projectConfig);
      
      // Generate database schema
      const database = await this.generateDatabase(projectConfig);
      
      // Generate deployment configuration
      const deployment = await this.generateDeploymentConfig(projectConfig);
      
      // Generate documentation
      const documentation = await this.generateDocumentation(projectConfig);
      
      return {
        success: true,
        projectName: projectConfig.name,
        template: projectConfig.template,
        structure: {
          frontend,
          backend,
          database,
          deployment,
          documentation
        },
        setupInstructions: this.generateSetupInstructions(projectConfig),
        estimatedSetupTime: this.calculateSetupTime(projectConfig)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        troubleshooting: this.generateTroubleshootingSteps(error)
      };
    }
  }

  /**
   * Generate frontend application with backend integration
   */
  async generateFrontend(projectConfig) {
    const files = [];
    
    // Enhanced index.html with API configuration
    files.push({
      path: 'frontend/index.html',
      content: this.generateEnhancedIndexHTML(projectConfig)
    });
    
    // Main app with API integration
    files.push({
      path: 'frontend/src/app.js',
      content: this.generateFullStackApp(projectConfig)
    });
    
    // API service layer
    files.push({
      path: 'frontend/src/services/api.js',
      content: this.generateAPIService(projectConfig)
    });
    
    // State management
    files.push({
      path: 'frontend/src/store/app-store.js',
      content: this.generateAppStore(projectConfig)
    });
    
    // Environment configuration
    files.push({
      path: 'frontend/src/config/environment.js',
      content: this.generateEnvironmentConfig()
    });
    
    // Component pages with API integration
    const pageFiles = this.generateAPIIntegratedPages(projectConfig);
    files.push(...pageFiles);
    
    return {
      files,
      buildSystem: 'vite',
      framework: 'lit',
      dependencies: this.generateFrontendDependencies(projectConfig)
    };
  }

  /**
   * Generate backend API
   */
  async generateBackend(projectConfig) {
    const backendType = projectConfig.backend || 'fastapi';
    const files = [];
    
    switch (backendType) {
      case 'fastapi':
        return await this.generateFastAPIBackend(projectConfig);
      case 'express':
        return await this.generateExpressBackend(projectConfig);
      case 'django':
        return await this.generateDjangoBackend(projectConfig);
      default:
        throw new Error(`Backend type ${backendType} not supported`);
    }
  }

  /**
   * Generate FastAPI backend
   */
  async generateFastAPIBackend(projectConfig) {
    const files = [];
    
    // Main application
    files.push({
      path: 'backend/main.py',
      content: this.generateFastAPIMain(projectConfig)
    });
    
    // API routes
    files.push({
      path: 'backend/app/api/v1/api.py',
      content: this.generateFastAPIRoutes(projectConfig)
    });
    
    // Database models
    files.push({
      path: 'backend/app/models/__init__.py',
      content: this.generateFastAPIModels(projectConfig)
    });
    
    // CRUD operations
    files.push({
      path: 'backend/app/crud/base.py',
      content: this.generateFastAPICRUD(projectConfig)
    });
    
    // Authentication
    if (projectConfig.features.includes('auth')) {
      files.push({
        path: 'backend/app/core/auth.py',
        content: this.generateFastAPIAuth()
      });
    }
    
    // Database configuration
    files.push({
      path: 'backend/app/core/database.py',
      content: this.generateFastAPIDatabase(projectConfig)
    });
    
    // Requirements
    files.push({
      path: 'backend/requirements.txt',
      content: this.generateFastAPIRequirements(projectConfig)
    });
    
    return {
      files,
      framework: 'fastapi',
      language: 'python',
      dependencies: this.getFastAPIDependencies(projectConfig)
    };
  }

  /**
   * Generate database schema and configuration
   */
  async generateDatabase(projectConfig) {
    const dbType = projectConfig.database || 'postgresql';
    const files = [];
    
    // Database schema
    files.push({
      path: 'database/schema.sql',
      content: this.generateDatabaseSchema(projectConfig, dbType)
    });
    
    // Migrations
    files.push({
      path: 'database/migrations/001_initial.sql',
      content: this.generateInitialMigration(projectConfig, dbType)
    });
    
    // Seeds
    files.push({
      path: 'database/seeds/demo_data.sql',
      content: this.generateDemoData(projectConfig, dbType)
    });
    
    // Database configuration
    files.push({
      path: 'database/config.json',
      content: this.generateDatabaseConfig(dbType)
    });
    
    return {
      files,
      type: dbType,
      migrations: true,
      seedData: true
    };
  }

  /**
   * Generate deployment configuration
   */
  async generateDeploymentConfig(projectConfig) {
    const files = [];
    
    // Docker configuration
    files.push({
      path: 'Dockerfile',
      content: this.generateDockerfile(projectConfig)
    });
    
    files.push({
      path: 'docker-compose.yml',
      content: this.generateDockerCompose(projectConfig)
    });
    
    // Kubernetes configuration
    if (projectConfig.deployment?.kubernetes) {
      files.push({
        path: 'k8s/deployment.yaml',
        content: this.generateKubernetesDeployment(projectConfig)
      });
      
      files.push({
        path: 'k8s/service.yaml',
        content: this.generateKubernetesService(projectConfig)
      });
    }
    
    // Vercel configuration
    files.push({
      path: 'vercel.json',
      content: this.generateVercelConfig(projectConfig)
    });
    
    // Railway configuration
    files.push({
      path: 'railway.toml',
      content: this.generateRailwayConfig(projectConfig)
    });
    
    // Environment files
    files.push({
      path: '.env.example',
      content: this.generateFullStackEnvExample(projectConfig)
    });
    
    return {
      files,
      platforms: ['vercel', 'railway', 'kubernetes', 'docker'],
      hasDatabase: true,
      hasBackend: true
    };
  }

  /**
   * Generate FastAPI main application
   */
  generateFastAPIMain(projectConfig) {
    const hasAuth = projectConfig.features.includes('auth');
    const hasCORS = true; // Always enable for frontend integration
    
    return `"""
${projectConfig.name} - Generated from NeoForge Playground
Full-stack application with FastAPI backend
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1 import api
from app.core.config import settings
from app.core.database import create_db_and_tables
${hasAuth ? 'from app.core.auth import get_current_user' : ''}

app = FastAPI(
    title="${projectConfig.name} API",
    description="Backend API for ${projectConfig.description}",
    version="1.0.0"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Frontend dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api.api_router, prefix="/api/v1")

# Serve frontend static files in production
app.mount("/static", StaticFiles(directory="../frontend/dist"), name="static")

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    create_db_and_tables()

@app.get("/")
async def root():
    """Root endpoint - health check"""
    return {
        "message": "Welcome to ${projectConfig.name} API",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy", "timestamp": "2024-01-01T00:00:00Z"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
`;
  }

  /**
   * Generate FastAPI routes based on selected components
   */
  generateFastAPIRoutes(projectConfig) {
    const hasTable = projectConfig.components.includes('neo-table');
    const hasForm = projectConfig.components.includes('neo-form-builder');
    const hasAuth = projectConfig.features.includes('auth');
    
    let routes = `"""
API routes for ${projectConfig.name}
Generated based on selected components: ${projectConfig.components.join(', ')}
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud.base import CRUDBase
from app.schemas import ItemBase, ItemCreate, ItemUpdate, Item
${hasAuth ? 'from app.core.auth import get_current_user' : ''}

api_router = APIRouter()

`;

    if (hasTable) {
      routes += this.generateTableAPIEndpoints(projectConfig);
    }
    
    if (hasForm) {
      routes += this.generateFormAPIEndpoints(projectConfig);
    }
    
    if (hasAuth) {
      routes += this.generateAuthAPIEndpoints();
    }
    
    return routes;
  }

  /**
   * Generate table API endpoints
   */
  generateTableAPIEndpoints(projectConfig) {
    return `
# Table data endpoints
@api_router.get("/items/", response_model=List[Item])
async def read_items(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """Get paginated list of items for table component"""
    items = db.query(Item).offset(skip).limit(limit).all()
    return items

@api_router.get("/items/{item_id}", response_model=Item)
async def read_item(item_id: int, db: Session = Depends(get_db)):
    """Get single item by ID"""
    item = db.query(Item).filter(Item.id == item_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@api_router.post("/items/", response_model=Item)
async def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    """Create new item"""
    return CRUDBase.create(db=db, obj_in=item)

@api_router.put("/items/{item_id}", response_model=Item)
async def update_item(
    item_id: int, 
    item: ItemUpdate, 
    db: Session = Depends(get_db)
):
    """Update existing item"""
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return CRUDBase.update(db=db, db_obj=db_item, obj_in=item)

@api_router.delete("/items/{item_id}")
async def delete_item(item_id: int, db: Session = Depends(get_db)):
    """Delete item"""
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    CRUDBase.remove(db=db, db_obj=db_item)
    return {"message": "Item deleted successfully"}
`;
  }

  /**
   * Generate API service for frontend
   */
  generateAPIService(projectConfig) {
    const hasAuth = projectConfig.features.includes('auth');
    
    return `/**
 * API Service for ${projectConfig.name}
 * Handles all backend communication
 */

class APIService {
    constructor() {
        this.baseURL = this.getAPIBaseURL();
        this.token = localStorage.getItem('authToken');
    }

    getAPIBaseURL() {
        // Auto-detect API URL based on environment
        if (import.meta.env.MODE === 'development') {
            return 'http://localhost:8000/api/v1';
        }
        return '/api/v1';
    }

    async request(endpoint, options = {}) {
        const url = \`\${this.baseURL}\${endpoint}\`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ${hasAuth ? "'Authorization': this.token ? `Bearer ${this.token}` : ''," : ''}
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(\`HTTP error! status: \${response.status}\`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // CRUD operations for table data
    async getItems(page = 0, limit = 10) {
        return this.request(\`/items/?skip=\${page * limit}&limit=\${limit}\`);
    }

    async getItem(id) {
        return this.request(\`/items/\${id}\`);
    }

    async createItem(data) {
        return this.request('/items/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateItem(id, data) {
        return this.request(\`/items/\${id}\`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteItem(id) {
        return this.request(\`/items/\${id}\`, {
            method: 'DELETE',
        });
    }

    ${hasAuth ? this.generateAuthMethods() : ''}

    // Health check
    async healthCheck() {
        return this.request('/health');
    }
}

export const apiService = new APIService();
`;
  }

  /**
   * Generate authentication methods
   */
  generateAuthMethods() {
    return `
    // Authentication methods
    async login(credentials) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
        
        if (response.access_token) {
            this.token = response.access_token;
            localStorage.setItem('authToken', this.token);
        }
        
        return response;
    }

    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async logout() {
        this.token = null;
        localStorage.removeItem('authToken');
        return this.request('/auth/logout', {
            method: 'POST',
        });
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    isAuthenticated() {
        return !!this.token;
    }`;
  }

  /**
   * Generate Docker configuration
   */
  generateDockerfile(projectConfig) {
    const backendType = projectConfig.backend || 'fastapi';
    
    if (backendType === 'fastapi') {
      return `# Multi-stage build for ${projectConfig.name}
FROM node:18-alpine as frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .
RUN npm run build

# Python backend
FROM python:3.11-slim

WORKDIR /app

# Install backend dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose port
EXPOSE 8000

# Start command
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
`;
    }
    
    return `# Docker configuration for ${projectConfig.name}`;
  }

  /**
   * Generate docker-compose configuration
   */
  generateDockerCompose(projectConfig) {
    const dbType = projectConfig.database || 'postgresql';
    
    return `version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/${projectConfig.name.toLowerCase()}
    depends_on:
      - db
    volumes:
      - ./backend:/app/backend
    restart: unless-stopped

  db:
    image: ${dbType === 'postgresql' ? 'postgres:15' : 'mysql:8'}
    environment:
      ${dbType === 'postgresql' ? `
      - POSTGRES_DB=${projectConfig.name.toLowerCase()}
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password` : `
      - MYSQL_DATABASE=${projectConfig.name.toLowerCase()}
      - MYSQL_USER=user
      - MYSQL_PASSWORD=password
      - MYSQL_ROOT_PASSWORD=rootpassword`}
    ports:
      - "${dbType === 'postgresql' ? '5432:5432' : '3306:3306'}"
    volumes:
      - ${dbType}_data:/var/lib/${dbType === 'postgresql' ? 'postgresql' : 'mysql'}/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/001-schema.sql
      - ./database/seeds:/docker-entrypoint-initdb.d/seeds
    restart: unless-stopped

volumes:
  ${dbType}_data:
`;
  }

  /**
   * Generate comprehensive setup instructions
   */
  generateSetupInstructions(projectConfig) {
    return {
      quickStart: [
        {
          step: 1,
          title: 'Clone and Setup',
          commands: [
            `git clone <repository-url> ${projectConfig.name}`,
            `cd ${projectConfig.name}`,
            'cp .env.example .env'
          ],
          description: 'Get the project and configure environment'
        },
        {
          step: 2,
          title: 'Database Setup',
          commands: [
            'docker-compose up -d db',
            'docker-compose exec db psql -U postgres -c "CREATE DATABASE app;"'
          ],
          description: 'Start database and create schema'
        },
        {
          step: 3,
          title: 'Backend Setup',
          commands: [
            'cd backend',
            'pip install -r requirements.txt',
            'python -m uvicorn main:app --reload'
          ],
          description: 'Install dependencies and start API server'
        },
        {
          step: 4,
          title: 'Frontend Setup',
          commands: [
            'cd frontend',
            'npm install',
            'npm run dev'
          ],
          description: 'Install frontend dependencies and start dev server'
        }
      ],
      production: [
        {
          step: 1,
          title: 'Docker Production',
          commands: [
            'docker-compose up -d'
          ],
          description: 'Deploy full stack with Docker'
        },
        {
          step: 2,
          title: 'Railway Deployment',
          commands: [
            'railway login',
            'railway link',
            'railway up'
          ],
          description: 'Deploy to Railway platform'
        }
      ]
    };
  }

  /**
   * Calculate estimated setup time
   */
  calculateSetupTime(projectConfig) {
    let baseTime = 10; // Base 10 minutes
    
    // Add time based on features
    if (projectConfig.features.includes('auth')) baseTime += 5;
    if (projectConfig.features.includes('database')) baseTime += 3;
    if (projectConfig.backend !== 'none') baseTime += 5;
    
    // Add time based on complexity
    const componentCount = projectConfig.components?.length || 0;
    if (componentCount > 5) baseTime += 3;
    if (componentCount > 10) baseTime += 5;
    
    return Math.min(baseTime, 30); // Cap at 30 minutes
  }

  /**
   * Validate project configuration
   */
  validateProjectConfig(config) {
    const required = ['name', 'template', 'components'];
    const missing = required.filter(field => !config[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    if (!this.templates[config.template]) {
      throw new Error(`Template ${config.template} not found`);
    }
  }

  /**
   * Initialize supported templates
   */
  initializeTemplates() {
    return {
      'dashboard-app': {
        backend: 'fastapi',
        database: 'postgresql',
        features: ['auth', 'crud', 'real-time'],
        complexity: 'intermediate'
      },
      'saas-app': {
        backend: 'fastapi',
        database: 'postgresql',
        features: ['auth', 'billing', 'analytics'],
        complexity: 'advanced'
      },
      'marketing-site': {
        backend: 'fastapi',
        database: 'sqlite',
        features: ['cms', 'analytics'],
        complexity: 'beginner'
      },
      'minimal-app': {
        backend: 'fastapi',
        database: 'sqlite',
        features: ['basic'],
        complexity: 'beginner'
      }
    };
  }

  /**
   * Initialize backend options
   */
  initializeBackendOptions() {
    return {
      'fastapi': {
        name: 'FastAPI',
        language: 'Python',
        features: ['async', 'automatic-docs', 'type-hints'],
        setupTime: 5
      },
      'express': {
        name: 'Express.js',
        language: 'JavaScript',
        features: ['middleware', 'routing', 'json-api'],
        setupTime: 3
      },
      'django': {
        name: 'Django',
        language: 'Python',
        features: ['orm', 'admin-panel', 'auth'],
        setupTime: 8
      }
    };
  }

  /**
   * Initialize database options
   */
  initializeDatabaseOptions() {
    return {
      'postgresql': {
        name: 'PostgreSQL',
        type: 'relational',
        features: ['acid', 'json', 'full-text-search'],
        setupTime: 2
      },
      'mysql': {
        name: 'MySQL',
        type: 'relational',
        features: ['acid', 'replication', 'clustering'],
        setupTime: 2
      },
      'sqlite': {
        name: 'SQLite',
        type: 'relational',
        features: ['embedded', 'zero-config', 'file-based'],
        setupTime: 0
      },
      'mongodb': {
        name: 'MongoDB',
        type: 'document',
        features: ['flexible-schema', 'aggregation', 'sharding'],
        setupTime: 3
      }
    };
  }
}