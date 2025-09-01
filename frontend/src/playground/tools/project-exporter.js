/**
 * Project Exporter
 *
 * Creates ZIP downloads with complete project structure and all dependencies.
 * The final step that transforms playground exploration into deployable applications.
 */

export class ProjectExporter {
  constructor() {
    this.supportedFormats = this.initializeSupportedFormats();
    this.exportTemplates = this.initializeExportTemplates();
  }

  /**
   * Export complete project as downloadable package
   */
  async exportProject(exportConfig) {
    this.validateExportConfig(exportConfig);

    try {
      // Prepare project structure
      const projectStructure = await this.prepareProjectStructure(exportConfig);

      // Generate all files
      const allFiles = await this.generateAllFiles(projectStructure, exportConfig);

      // Create package based on format
      const exportPackage = await this.createExportPackage(allFiles, exportConfig);

      // Generate download metadata
      const metadata = this.generateExportMetadata(exportConfig, allFiles);

      return {
        success: true,
        package: exportPackage,
        metadata,
        downloadInstructions: this.generateDownloadInstructions(exportConfig),
        nextSteps: this.generatePostDownloadSteps(exportConfig)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        troubleshooting: this.generateExportTroubleshooting(error)
      };
    }
  }

  /**
   * Prepare complete project structure
   */
  async prepareProjectStructure(exportConfig) {
    const structure = {
      name: exportConfig.projectName,
      type: exportConfig.projectType || 'fullstack',
      directories: [],
      files: [],
      dependencies: {},
      configuration: {}
    };

    // Frontend structure
    if (exportConfig.includeFrontend !== false) {
      structure.directories.push(
        'frontend',
        'frontend/src',
        'frontend/src/components',
        'frontend/src/pages',
        'frontend/src/services',
        'frontend/src/styles',
        'frontend/src/utils',
        'frontend/public'
      );
    }

    // Backend structure
    if (exportConfig.includeBackend) {
      const backendType = exportConfig.backend || 'fastapi';
      structure.directories.push(
        ...this.getBackendDirectories(backendType)
      );
    }

    // Database structure
    if (exportConfig.includeDatabase) {
      structure.directories.push(
        'database',
        'database/migrations',
        'database/seeds',
        'database/backups'
      );
    }

    // Documentation structure
    structure.directories.push(
      'docs',
      'docs/api',
      'docs/deployment',
      'docs/development'
    );

    // Configuration structure
    structure.directories.push(
      'config',
      'scripts',
      '.github',
      '.github/workflows'
    );

    return structure;
  }

  /**
   * Generate all project files
   */
  async generateAllFiles(structure, exportConfig) {
    const files = new Map();

    // Root files
    files.set('README.md', await this.generateProjectReadme(exportConfig));
    files.set('.gitignore', this.generateGitignore(exportConfig));
    files.set('LICENSE', this.generateLicense(exportConfig.license || 'MIT'));
    files.set('CHANGELOG.md', this.generateChangelog(exportConfig));

    // Frontend files
    if (exportConfig.includeFrontend !== false) {
      const frontendFiles = await this.generateFrontendFiles(exportConfig);
      frontendFiles.forEach((content, path) => {
        files.set(`frontend/${path}`, content);
      });
    }

    // Backend files
    if (exportConfig.includeBackend) {
      const backendFiles = await this.generateBackendFiles(exportConfig);
      backendFiles.forEach((content, path) => {
        files.set(`backend/${path}`, content);
      });
    }

    // Database files
    if (exportConfig.includeDatabase) {
      const databaseFiles = await this.generateDatabaseFiles(exportConfig);
      databaseFiles.forEach((content, path) => {
        files.set(`database/${path}`, content);
      });
    }

    // Configuration files
    const configFiles = await this.generateConfigurationFiles(exportConfig);
    configFiles.forEach((content, path) => {
      files.set(path, content);
    });

    // Documentation files
    const docFiles = await this.generateDocumentationFiles(exportConfig);
    docFiles.forEach((content, path) => {
      files.set(`docs/${path}`, content);
    });

    // Scripts and utilities
    const scriptFiles = this.generateScriptFiles(exportConfig);
    scriptFiles.forEach((content, path) => {
      files.set(`scripts/${path}`, content);
    });

    return files;
  }

  /**
   * Create export package in specified format
   */
  async createExportPackage(files, exportConfig) {
    const format = exportConfig.format || 'zip';

    switch (format) {
      case 'zip':
        return await this.createZipPackage(files, exportConfig);
      case 'tar':
        return await this.createTarPackage(files, exportConfig);
      case 'github-template':
        return await this.createGitHubTemplate(files, exportConfig);
      default:
        throw new Error(`Export format ${format} not supported`);
    }
  }

  /**
   * Create ZIP package
   */
  async createZipPackage(files, exportConfig) {
    // Check if JSZip is available, otherwise create a simple archive
    let zip;

    try {
      // Try to use JSZip if available
      if (typeof JSZip !== 'undefined') {
        zip = new JSZip();
      } else {
        // Fallback: create a simple tar-like structure
        return this.createSimpleArchive(files, exportConfig);
      }
    } catch (error) {
      console.warn('JSZip not available, using simple archive format');
      return this.createSimpleArchive(files, exportConfig);
    }

    // Add all files to ZIP
    files.forEach((content, path) => {
      zip.file(path, content);
    });

    // Generate ZIP blob
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    return {
      type: 'blob',
      data: zipBlob,
      filename: `${exportConfig.projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}.zip`,
      size: zipBlob.size,
      mimeType: 'application/zip'
    };
  }

  /**
   * Create simple archive as fallback when JSZip is not available
   */
  async createSimpleArchive(files, exportConfig) {
    // Create a simple text-based archive format
    let archiveContent = `# ${exportConfig.projectName} - Generated Application\n\n`;
    archiveContent += `Generated from NeoForge Playground\n`;
    archiveContent += `Template: ${exportConfig.template}\n`;
    archiveContent += `Generated: ${new Date().toISOString()}\n\n`;
    archiveContent += `## Files:\n\n`;

    files.forEach((content, path) => {
      archiveContent += `### File: ${path}\n`;
      archiveContent += '```\n';
      archiveContent += content;
      archiveContent += '\n```\n\n';
    });

    const blob = new Blob([archiveContent], { type: 'text/plain' });

    return {
      type: 'blob',
      data: blob,
      filename: `${exportConfig.projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}-export.txt`,
      size: blob.size,
      mimeType: 'text/plain'
    };
  }

  /**
   * Generate frontend files
   */
  async generateFrontendFiles(exportConfig) {
    const files = new Map();

    // Package.json
    files.set('package.json', JSON.stringify({
      name: exportConfig.projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      version: '1.0.0',
      type: 'module',
      description: exportConfig.description || 'Generated from NeoForge Playground',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
        lint: 'eslint src --ext .js',
        test: 'vitest'
      },
      dependencies: this.getFrontendDependencies(exportConfig),
      devDependencies: this.getFrontendDevDependencies(exportConfig)
    }, null, 2));

    // Vite configuration
    files.set('vite.config.js', this.generateViteConfig(exportConfig));

    // Index.html
    files.set('index.html', this.generateIndexHtml(exportConfig));

    // Main app file
    files.set('src/app.js', await this.generateMainApp(exportConfig));

    // Components
    if (exportConfig.components && exportConfig.components.length > 0) {
      const componentFiles = await this.generateComponentFiles(exportConfig.components);
      componentFiles.forEach((content, path) => {
        files.set(`src/components/${path}`, content);
      });
    }

    // Services
    files.set('src/services/api.js', this.generateApiService(exportConfig));

    // Styles
    files.set('src/styles/main.css', this.generateMainCSS(exportConfig));

    // Utils
    files.set('src/utils/helpers.js', this.generateUtilityHelpers());

    return files;
  }

  /**
   * Generate backend files
   */
  async generateBackendFiles(exportConfig) {
    const backendType = exportConfig.backend || 'fastapi';

    switch (backendType) {
      case 'fastapi':
        return await this.generateFastAPIFiles(exportConfig);
      case 'express':
        return await this.generateExpressFiles(exportConfig);
      default:
        throw new Error(`Backend type ${backendType} not supported`);
    }
  }

  /**
   * Generate FastAPI backend files
   */
  async generateFastAPIFiles(exportConfig) {
    const files = new Map();

    // Requirements.txt
    files.set('requirements.txt', [
      'fastapi==0.104.1',
      'uvicorn==0.24.0',
      'sqlalchemy==2.0.23',
      'alembic==1.12.1',
      'pydantic==2.5.0',
      'python-jose==3.3.0',
      'passlib==1.7.4',
      'python-multipart==0.0.6',
      exportConfig.database === 'postgresql' ? 'psycopg2-binary==2.9.9' : '',
      exportConfig.database === 'mysql' ? 'pymysql==1.1.0' : '',
      exportConfig.features?.includes('redis') ? 'redis==5.0.1' : '',
      exportConfig.features?.includes('email') ? 'fastapi-mail==1.4.1' : '',
    ].filter(Boolean).join('\n'));

    // Main application
    files.set('main.py', this.generateFastAPIMain(exportConfig));

    // API routes
    files.set('app/api/v1/api.py', this.generateFastAPIRoutes(exportConfig));

    // Models
    files.set('app/models/__init__.py', '');
    files.set('app/models/base.py', this.generateFastAPIModels(exportConfig));

    // Database configuration
    files.set('app/core/database.py', this.generateFastAPIDatabase(exportConfig));

    // Authentication
    if (exportConfig.features?.includes('auth')) {
      files.set('app/core/auth.py', this.generateFastAPIAuth());
    }

    return files;
  }

  /**
   * Generate documentation files
   */
  async generateDocumentationFiles(exportConfig) {
    const files = new Map();

    // API documentation
    files.set('api/README.md', this.generateAPIDocumentation(exportConfig));

    // Development guide
    files.set('development/SETUP.md', this.generateDevelopmentSetup(exportConfig));

    // Deployment guide
    files.set('deployment/README.md', this.generateDeploymentGuide(exportConfig));

    // Architecture documentation
    files.set('ARCHITECTURE.md', this.generateArchitectureDoc(exportConfig));

    // Contributing guide
    files.set('CONTRIBUTING.md', this.generateContributingGuide(exportConfig));

    return files;
  }

  /**
   * Generate script files
   */
  generateScriptFiles(exportConfig) {
    const files = new Map();

    // Setup script
    files.set('setup.sh', this.generateSetupScript(exportConfig));

    // Development startup script
    files.set('dev.sh', this.generateDevScript(exportConfig));

    // Build script
    files.set('build.sh', this.generateBuildScript(exportConfig));

    // Database management script
    if (exportConfig.includeDatabase) {
      files.set('database.sh', this.generateDatabaseScript(exportConfig));
    }

    return files;
  }

  /**
   * Generate project README
   */
  async generateProjectReadme(exportConfig) {
    const setupTime = this.estimateSetupTime(exportConfig);

    return `# ${exportConfig.projectName}

${exportConfig.description || 'Generated from NeoForge Playground'}

**🚀 Generated from [NeoForge Playground](https://neoforge.dev/playground)**
**Template:** ${exportConfig.template}
**Generated:** ${new Date().toISOString().split('T')[0]}
**Estimated Setup Time:** ${setupTime} minutes

## 📋 Project Overview

This is a ${exportConfig.projectType || 'full-stack'} application featuring:

${exportConfig.features?.map(feature => `- ✅ ${this.formatFeatureName(feature)}`).join('\n') || '- Modern web components'}

## 🏗 Architecture

${exportConfig.includeFrontend !== false ? '### Frontend\n- **Framework:** Lit Web Components\n- **Build Tool:** Vite\n- **Styling:** CSS with design tokens\n\n' : ''}
${exportConfig.includeBackend ? `### Backend\n- **Framework:** ${exportConfig.backend || 'FastAPI'}\n- **Database:** ${exportConfig.database || 'PostgreSQL'}\n- **API:** RESTful with OpenAPI documentation\n\n` : ''}
${exportConfig.includeDatabase ? `### Database\n- **Type:** ${exportConfig.database || 'PostgreSQL'}\n- **Migrations:** Automated with version control\n- **Seeding:** Demo data included\n\n` : ''}

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
${exportConfig.includeBackend ? `- Python 3.9+ (for backend)` : ''}
${exportConfig.includeDatabase ? `- ${exportConfig.database || 'PostgreSQL'} (for database)` : ''}
- Git

### Installation

1. **Clone and setup:**
   \`\`\`bash
   # If downloaded as ZIP, extract first
   cd ${exportConfig.projectName.toLowerCase()}

   # Make scripts executable
   chmod +x scripts/*.sh

   # Run setup script
   ./scripts/setup.sh
   \`\`\`

2. **Start development:**
   \`\`\`bash
   ./scripts/dev.sh
   \`\`\`

3. **Open your browser:**
   - Frontend: http://localhost:3000
   ${exportConfig.includeBackend ? '- Backend API: http://localhost:8000/docs' : ''}

## 📁 Project Structure

\`\`\`
${exportConfig.projectName}/
├── README.md                 # This file
├── LICENSE                   # Project license
├── CHANGELOG.md             # Version history
│
${exportConfig.includeFrontend !== false ? `├── frontend/                 # Frontend application
│   ├── src/
│   │   ├── components/      # Web components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── styles/         # CSS styles
│   ├── public/             # Static assets
│   ├── package.json        # Frontend dependencies
│   └── vite.config.js      # Build configuration
│` : ''}
${exportConfig.includeBackend ? `├── backend/                  # Backend API
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── core/          # Core functionality
│   │   └── models/        # Database models
│   ├── main.py            # Application entry
│   └── requirements.txt   # Python dependencies
│` : ''}
${exportConfig.includeDatabase ? `├── database/                 # Database files
│   ├── migrations/        # Schema migrations
│   ├── seeds/            # Sample data
│   └── backups/          # Backup scripts
│` : ''}
├── docs/                    # Documentation
├── scripts/                 # Utility scripts
├── config/                  # Configuration files
└── .github/                # GitHub workflows
\`\`\`

## 🛠 Development

### Available Scripts

${exportConfig.includeFrontend !== false ? `- \`npm run dev\` - Start frontend development server
- \`npm run build\` - Build frontend for production
- \`npm run preview\` - Preview production build
` : ''}
${exportConfig.includeBackend ? `- \`./scripts/dev.sh\` - Start full development environment
- \`./scripts/build.sh\` - Build for production
` : ''}
- \`./scripts/setup.sh\` - Initial project setup
${exportConfig.includeDatabase ? '- `./scripts/database.sh` - Database management' : ''}

### Development Workflow

1. Make changes to your code
2. Changes auto-reload in development mode
3. Test your changes
4. Commit and push to your repository

## 🚀 Deployment

### Quick Deploy Options

#### Vercel (Recommended for frontend + serverless)
\`\`\`bash
npm install -g vercel
vercel --prod
\`\`\`

#### Netlify (Frontend static hosting)
\`\`\`bash
npm install -g netlify-cli
netlify deploy --prod --dir=frontend/dist
\`\`\`

${exportConfig.includeBackend ? `#### Railway (Full-stack hosting)
\`\`\`bash
npm install -g @railway/cli
railway login
railway link
railway up
\`\`\`

#### Docker (Self-hosted)
\`\`\`bash
docker-compose up -d
\`\`\`
` : ''}

### Environment Variables

Copy \`.env.example\` to \`.env\` and configure:

${exportConfig.includeBackend ? `- \`DATABASE_URL\` - Database connection string
- \`SECRET_KEY\` - Application secret key
` : ''}
${exportConfig.features?.includes('auth') ? `- \`JWT_SECRET\` - JWT signing secret
` : ''}
- Add other environment-specific variables as needed

See \`docs/deployment/\` for detailed deployment guides.

## 🧪 Testing

${exportConfig.includeFrontend !== false ? `### Frontend Tests
\`\`\`bash
cd frontend
npm run test
\`\`\`
` : ''}
${exportConfig.includeBackend ? `### Backend Tests
\`\`\`bash
cd backend
pytest
\`\`\`
` : ''}

## 📚 Documentation

- [API Documentation](docs/api/) - Backend API reference
- [Development Setup](docs/development/) - Detailed development guide
- [Deployment Guide](docs/deployment/) - Production deployment instructions
- [Architecture Overview](docs/ARCHITECTURE.md) - System architecture

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (\`git commit -m 'Add amazing feature'\`)
6. Push to your branch (\`git push origin feature/amazing-feature\`)
7. Open a Pull Request

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the ${exportConfig.license || 'MIT'} License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[NeoForge](https://neoforge.dev)** - Playground to production in minutes
- **[Lit](https://lit.dev)** - Simple, fast, web components
- **[Vite](https://vitejs.dev)** - Next generation frontend tooling
${exportConfig.includeBackend ? `- **[FastAPI](https://fastapi.tiangolo.com)** - Modern, fast web framework for building APIs` : ''}

---

**Built with ❤️ using [NeoForge Playground](https://neoforge.dev/playground)**
*From component exploration to production deployment in ${setupTime} minutes.*

## 🆘 Support

If you encounter any issues:

1. Check the [documentation](docs/)
2. Search [existing issues](../../issues)
3. Create a [new issue](../../issues/new) if needed

For questions about NeoForge Playground, visit [neoforge.dev](https://neoforge.dev).
`;
  }

  /**
   * Trigger file download
   */
  async triggerDownload(exportPackage) {
    const url = URL.createObjectURL(exportPackage.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = exportPackage.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Utility methods
   */
  formatFeatureName(feature) {
    const featureMap = {
      'auth': 'Authentication & Authorization',
      'database': 'Database Integration',
      'routing': 'Client-side Routing',
      'responsive': 'Responsive Design',
      'pwa': 'Progressive Web App',
      'analytics': 'Analytics Integration',
      'billing': 'Payment Integration',
      'email': 'Email Service',
      'redis': 'Caching with Redis'
    };
    return featureMap[feature] || feature.charAt(0).toUpperCase() + feature.slice(1);
  }

  estimateSetupTime(exportConfig) {
    let time = 5; // Base time

    if (exportConfig.includeBackend) time += 5;
    if (exportConfig.includeDatabase) time += 3;
    if (exportConfig.features?.includes('auth')) time += 2;
    if (exportConfig.projectType === 'fullstack') time += 2;

    return Math.min(time, 20); // Cap at 20 minutes
  }

  getBackendDirectories(backendType) {
    if (backendType === 'fastapi') {
      return [
        'backend',
        'backend/app',
        'backend/app/api',
        'backend/app/api/v1',
        'backend/app/core',
        'backend/app/models',
        'backend/app/crud',
        'backend/tests'
      ];
    }
    return ['backend'];
  }

  getFrontendDependencies(exportConfig) {
    const deps = {
      'lit': '^3.0.0',
      '@lit/context': '^1.0.0'
    };

    if (exportConfig.features?.includes('routing')) {
      deps['@vaadin/router'] = '^1.7.0';
    }

    return deps;
  }

  getFrontendDevDependencies(exportConfig) {
    return {
      'vite': '^5.0.0',
      'vitest': '^1.0.0',
      'eslint': '^8.0.0',
      '@vitejs/plugin-legacy': '^5.0.0'
    };
  }

  validateExportConfig(config) {
    if (!config.projectName) {
      throw new Error('Project name is required');
    }

    if (config.projectName.length > 100) {
      throw new Error('Project name too long (max 100 characters)');
    }
  }

  generateExportMetadata(exportConfig, allFiles) {
    return {
      projectName: exportConfig.projectName,
      template: exportConfig.template,
      exportedAt: new Date().toISOString(),
      fileCount: allFiles.size,
      totalSize: this.calculateTotalSize(allFiles),
      features: exportConfig.features || [],
      structure: {
        frontend: exportConfig.includeFrontend !== false,
        backend: exportConfig.includeBackend || false,
        database: exportConfig.includeDatabase || false
      },
      estimatedSetupTime: this.estimateSetupTime(exportConfig)
    };
  }

  generateDownloadInstructions(exportConfig) {
    return [
      {
        step: 1,
        title: 'Extract the ZIP file',
        description: `Extract ${exportConfig.projectName}.zip to your desired location`
      },
      {
        step: 2,
        title: 'Open terminal in project directory',
        description: `Navigate to the extracted ${exportConfig.projectName} folder`
      },
      {
        step: 3,
        title: 'Run setup script',
        description: 'Execute ./scripts/setup.sh to install dependencies'
      },
      {
        step: 4,
        title: 'Start development',
        description: 'Run ./scripts/dev.sh to start the development server'
      }
    ];
  }

  generatePostDownloadSteps(exportConfig) {
    const steps = [
      'Extract the downloaded ZIP file',
      'Read the README.md file for complete setup instructions',
      'Run the setup script to install all dependencies',
      'Configure environment variables if needed',
      'Start the development server'
    ];

    if (exportConfig.includeDatabase) {
      steps.splice(4, 0, 'Set up the database connection');
    }

    return steps;
  }

  calculateTotalSize(allFiles) {
    let totalSize = 0;
    allFiles.forEach(content => {
      totalSize += new Blob([content]).size;
    });
    return this.formatFileSize(totalSize);
  }

  formatFileSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  initializeSupportedFormats() {
    return {
      zip: {
        name: 'ZIP Archive',
        extension: '.zip',
        mimeType: 'application/zip'
      },
      tar: {
        name: 'TAR Archive',
        extension: '.tar.gz',
        mimeType: 'application/gzip'
      },
      'github-template': {
        name: 'GitHub Template Repository',
        extension: null,
        mimeType: null
      }
    };
  }

  initializeExportTemplates() {
    return {
      minimal: ['README.md', 'package.json', 'src/'],
      standard: ['README.md', 'package.json', 'src/', 'docs/', 'scripts/'],
      complete: ['*'] // All files
    };
  }
}
