/**
 * Application Template Generator
 * 
 * Generates working applications using playground components.
 * Addresses the critical gap: playground → production apps.
 */

export class AppTemplateGenerator {
  constructor() {
    this.templates = this.initializeTemplates();
  }

  /**
   * Get available application templates
   * Focus on real-world applications developers actually build
   */
  getAvailableTemplates() {
    return [
      {
        name: 'dashboard-app',
        description: 'Admin dashboard with tables and forms',
        components: ['neo-table', 'neo-form-builder', 'neo-button', 'neo-card', 'neo-modal'],
        features: ['routing', 'responsive', 'data-management'],
        complexity: 'intermediate'
      },
      {
        name: 'marketing-site',
        description: 'Marketing website with landing pages',
        components: ['neo-button', 'neo-card', 'hero', 'testimonials', 'faq-accordion'],
        features: ['responsive', 'seo', 'performance'],
        complexity: 'beginner'
      },
      {
        name: 'saas-app',
        description: 'SaaS application with auth and billing',
        components: ['neo-form-builder', 'neo-table', 'neo-data-grid', 'neo-button', 'neo-modal'],
        features: ['routing', 'auth', 'responsive', 'forms'],
        complexity: 'advanced'
      },
      {
        name: 'minimal-app',
        description: 'Minimal starting point with essential components',
        components: ['neo-button', 'neo-card', 'neo-form'],
        features: ['responsive'],
        complexity: 'beginner'
      }
    ];
  }

  /**
   * Generate a working application from template
   */
  async generateApp(appConfig) {
    const template = this.templates[appConfig.template];
    if (!template) {
      throw new Error(`Template ${appConfig.template} not found`);
    }

    const generatedFiles = await this.generateFiles(appConfig, template);
    const dependencies = this.generateDependencies(appConfig);
    const buildConfig = this.generateBuildConfig(appConfig);

    return {
      files: generatedFiles,
      dependencies,
      buildConfig,
      name: appConfig.name,
      template: appConfig.template
    };
  }

  /**
   * Generate application files
   */
  async generateFiles(appConfig, template) {
    const files = [];

    // Entry HTML file
    files.push({
      path: 'index.html',
      type: 'entry',
      content: this.generateIndexHTML(appConfig)
    });

    // Main application file
    files.push({
      path: 'src/app.js',
      type: 'main',
      content: this.generateMainApp(appConfig)
    });

    // Routing configuration
    const features = appConfig.features || [];
    if (features.includes('routing')) {
      files.push({
        path: 'src/routes.js',
        type: 'routing',
        content: this.generateRoutes(appConfig)
      });
    }

    // Component imports
    files.push({
      path: 'src/components/index.js',
      type: 'components',
      content: this.generateComponentImports(appConfig)
    });

    // Page components based on template
    const pageFiles = this.generatePages(appConfig, template);
    files.push(...pageFiles);

    return files;
  }

  /**
   * Generate index.html
   */
  generateIndexHTML(appConfig) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appConfig.name}</title>
    <style>
        body { 
            margin: 0; 
            font-family: system-ui, -apple-system, sans-serif; 
        }
        .app-container { 
            min-height: 100vh; 
            display: flex; 
            flex-direction: column; 
        }
    </style>
</head>
<body>
    <div id="app" class="app-container">
        <!-- App content will be rendered here -->
    </div>
    <script type="module" src="./src/app.js"></script>
</body>
</html>`;
  }

  /**
   * Generate main app.js
   */
  generateMainApp(appConfig) {
    const features = appConfig.features || [];
    const hasRouting = features.includes('routing');
    const routingImport = hasRouting ? "import { router } from './routes.js';" : '';
    const initMethod = hasRouting ? 'this.setupRouting();' : 'this.render();';
    
    let classBody = '';
    if (hasRouting) {
      classBody = this.generateRoutingMethods();
    } else {
      classBody = this.generateSimpleRenderMethods(appConfig);
    }

    return `/**
 * ${appConfig.name} - Generated from NeoForge Playground
 * Template: ${appConfig.template}
 */

// Import components
import './components/index.js';
${routingImport}

class App {
    constructor() {
        this.container = document.getElementById('app');
        this.init();
    }

    init() {
        ${initMethod}
    }

${classBody}
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});`;
  }

  /**
   * Generate routing methods for App class
   */
  generateRoutingMethods() {
    return `    setupRouting() {
        router.init(this.container);
        
        // Handle navigation
        window.addEventListener('popstate', () => {
            router.navigate(window.location.pathname);
        });
        
        // Initial route
        router.navigate(window.location.pathname || '/');
    }`;
  }

  /**
   * Generate simple render methods for non-routing apps
   */
  generateSimpleRenderMethods(appConfig) {
    const componentsList = appConfig.components.map(comp => 
      `                    <${comp} style="margin: 1rem 0;"></${comp}>`
    ).join('\n');

    return `    render() {
        this.container.innerHTML = \`
            <header style="padding: 1rem; background: #f5f5f5; border-bottom: 1px solid #ddd;">
                <h1>${appConfig.name}</h1>
            </header>
            <main style="flex: 1; padding: 2rem;">
                <div style="max-width: 800px; margin: 0 auto;">
                    <h2>Welcome to your ${appConfig.template}</h2>
                    <p>Built with NeoForge Web Components</p>
${componentsList}
                </div>
            </main>
        \`;
    }`;
  }

  /**
   * Generate routes.js for routing-enabled apps
   */
  generateRoutes(appConfig) {
    return `/**
 * Routing configuration for ${appConfig.name}
 */

export const router = {
    routes: {
        '/': () => import('./pages/home.js'),
        '/dashboard': () => import('./pages/dashboard.js'),
        '/about': () => import('./pages/about.js')
    },

    currentRoute: null,
    container: null,

    init(container) {
        this.container = container;
    },

    async navigate(path) {
        if (this.routes[path]) {
            try {
                const module = await this.routes[path]();
                const page = new module.default();
                this.render(page);
                this.currentRoute = path;
            } catch (error) {
                console.error('Route loading failed:', error);
                this.render404();
            }
        } else {
            this.render404();
        }
    },

    render(page) {
        this.container.innerHTML = '';
        this.container.appendChild(page.render());
    },

    render404() {
        this.container.innerHTML = \`
            <div style="text-align: center; padding: 4rem;">
                <h1>404 - Page Not Found</h1>
                <p>The page you're looking for doesn't exist.</p>
                <neo-button onclick="router.navigate('/')">Go Home</neo-button>
            </div>
        \`;
    }
};`;
  }

  /**
   * Generate component imports
   */
  generateComponentImports(appConfig) {
    const components = appConfig.components || [];
    const imports = components.map(component => {
      // Map component names to import paths
      const importMap = {
        'neo-button': "import '../../../components/atoms/button/button.js';",
        'neo-card': "import '../../../components/molecules/card/card.js';",
        'neo-table': "import '../../../components/organisms/neo-table.js';",
        'neo-form-builder': "import '../../../components/organisms/neo-form-builder.js';",
        'neo-data-grid': "import '../../../components/organisms/neo-data-grid.js';",
        'neo-modal': "import '../../../components/molecules/modal/modal.js';",
        'neo-form': "import '../../../components/organisms/form.js';",
        'hero': "import '../../../components/marketing/hero.js';",
        'testimonials': "import '../../../components/marketing/testimonials.js';",
        'faq-accordion': "import '../../../components/marketing/faq-accordion.js';"
      };
      
      return importMap[component] || `// ${component} - add import path`;
    });

    return `/**
 * Component imports for ${appConfig.name}
 * All NeoForge components used in this application
 */

${imports.join('\n')}

// Additional component setup can go here
console.log('Components loaded for ${appConfig.name}');`;
  }

  /**
   * Generate page files for routing-enabled apps
   */
  generatePages(appConfig, template) {
    const features = appConfig.features || [];
    if (!features.includes('routing')) {
      return [];
    }

    const pages = [];

    // Home page
    pages.push({
      path: 'src/pages/home.js',
      type: 'page',
      content: this.generateHomePage(appConfig)
    });

    // Dashboard page (for dashboard apps)
    if (appConfig.template === 'dashboard-app') {
      pages.push({
        path: 'src/pages/dashboard.js',
        type: 'page',
        content: this.generateDashboardPage(appConfig)
      });
    }

    return pages;
  }

  /**
   * Generate home page
   */
  generateHomePage(appConfig) {
    const cardSection = appConfig.components.includes('neo-card') ? `
                <neo-card style="padding: 1.5rem;">
                    <h3>Feature 1</h3>
                    <p>Describe your first feature here.</p>
                    <neo-button variant="primary">Learn More</neo-button>
                </neo-card>
                
                <neo-card style="padding: 1.5rem;">
                    <h3>Feature 2</h3>
                    <p>Describe your second feature here.</p>
                    <neo-button variant="secondary">Get Started</neo-button>
                </neo-card>` : '';

    const dashboardSection = appConfig.template === 'dashboard-app' ? `
            <section style="margin-top: 3rem; text-align: center;">
                <neo-button variant="primary" onclick="router.navigate('/dashboard')">
                    Go to Dashboard
                </neo-button>
            </section>` : '';

    return `/**
 * Home page for ${appConfig.name}
 */

export default class HomePage {
    render() {
        const page = document.createElement('div');
        page.style.cssText = 'max-width: 1200px; margin: 0 auto; padding: 2rem;';
        
        page.innerHTML = \`
            <header style="text-align: center; margin-bottom: 3rem;">
                <h1>${appConfig.name}</h1>
                <p>Built with NeoForge Web Components</p>
            </header>
            
            <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">${cardSection}
            </section>
            ${dashboardSection}
        \`;
        
        return page;
    }
}`;
  }

  /**
   * Generate dashboard page
   */
  generateDashboardPage(appConfig) {
    const tableSection = appConfig.components.includes('neo-table') ? `
            <section style="margin-bottom: 2rem;">
                <h2>Data Table</h2>
                <neo-table 
                    data='[{"id":1,"name":"John Doe","email":"john@example.com"},{"id":2,"name":"Jane Smith","email":"jane@example.com"}]'
                    columns='[{"key":"name","label":"Name"},{"key":"email","label":"Email"}]'
                    pageable="true">
                </neo-table>
            </section>` : '';

    const formSection = appConfig.components.includes('neo-form-builder') ? `
            <section>
                <h2>Quick Form</h2>
                <neo-form-builder 
                    fields='[{"type":"text","name":"title","label":"Title"},{"type":"email","name":"email","label":"Email"}]'>
                </neo-form-builder>
            </section>` : '';

    return `/**
 * Dashboard page for ${appConfig.name}
 */

export default class DashboardPage {
    render() {
        const page = document.createElement('div');
        page.style.cssText = 'max-width: 1400px; margin: 0 auto; padding: 2rem;';
        
        page.innerHTML = \`
            <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h1>Dashboard</h1>
                <neo-button onclick="router.navigate('/')">← Back to Home</neo-button>
            </header>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                <neo-card style="padding: 1.5rem;">
                    <h3>Quick Stats</h3>
                    <p>Overview of your data</p>
                </neo-card>
                
                <neo-card style="padding: 1.5rem;">
                    <h3>Recent Activity</h3>
                    <p>Latest updates and changes</p>
                </neo-card>
            </div>
            ${tableSection}
            ${formSection}
        \`;
        
        return page;
    }
}`;
  }

  /**
   * Generate dependencies array
   */
  generateDependencies(appConfig) {
    const deps = ['@neoforge/web-components'];
    const features = appConfig.features || [];
    
    if (features.includes('routing')) {
      // For simple routing, we're not adding external deps
      // Using vanilla JS routing implementation
    }
    
    return deps;
  }

  /**
   * Generate build configuration
   */
  generateBuildConfig(appConfig) {
    const features = appConfig.features || [];
    return {
      bundler: 'vite',
      entry: 'src/app.js',
      outDir: 'dist',
      features: features,
      optimization: {
        minify: true,
        treeshaking: true,
        codesplitting: features.includes('routing')
      }
    };
  }

  /**
   * Initialize templates mapping
   */
  initializeTemplates() {
    return {
      'dashboard-app': {
        pages: ['home', 'dashboard'],
        layout: 'sidebar',
        dataComponents: true
      },
      'marketing-site': {
        pages: ['home', 'about', 'contact'],
        layout: 'header-footer',
        staticContent: true
      },
      'saas-app': {
        pages: ['home', 'dashboard', 'billing', 'settings'],
        layout: 'app-shell',
        authRequired: true
      },
      'minimal-app': {
        pages: ['home'],
        layout: 'simple',
        minimal: true
      }
    };
  }
}