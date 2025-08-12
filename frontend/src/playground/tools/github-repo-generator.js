/**
 * GitHub Repository Generator
 * 
 * Automates GitHub repository creation with initial commit and CI/CD workflows.
 * Provides the missing link between playground → deployed application.
 */

export class GitHubRepoGenerator {
  constructor() {
    this.githubApiBase = 'https://api.github.com';
    this.defaultWorkflows = this.initializeWorkflows();
  }

  /**
   * Create a new GitHub repository with the generated application
   */
  async createRepository(repoConfig) {
    this.validateRepoConfig(repoConfig);
    
    try {
      // Step 1: Create repository
      const repo = await this.createGitHubRepo(repoConfig);
      
      // Step 2: Initialize with files
      const initialCommit = await this.createInitialCommit(repo, repoConfig);
      
      // Step 3: Setup workflows
      const workflows = await this.setupWorkflows(repo, repoConfig);
      
      // Step 4: Configure repository settings
      const settings = await this.configureRepoSettings(repo, repoConfig);
      
      return {
        success: true,
        repository: {
          name: repo.name,
          fullName: repo.full_name,
          url: repo.html_url,
          cloneUrl: repo.clone_url,
          defaultBranch: repo.default_branch
        },
        initialCommit,
        workflows,
        settings,
        nextSteps: this.generateNextSteps(repo, repoConfig)
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
   * Validate repository configuration
   */
  validateRepoConfig(config) {
    const required = ['name', 'description', 'isPrivate', 'accessToken', 'generatedApp'];
    const missing = required.filter(field => !config[field] && config[field] !== false);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    // Validate repository name
    const nameRegex = /^[a-zA-Z0-9._-]+$/;
    if (!nameRegex.test(config.name)) {
      throw new Error('Repository name can only contain letters, numbers, dots, hyphens, and underscores');
    }

    if (config.name.length > 100) {
      throw new Error('Repository name must be 100 characters or less');
    }
  }

  /**
   * Create GitHub repository via API
   */
  async createGitHubRepo(config) {
    const response = await fetch(`${this.githubApiBase}/user/repos`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${config.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: config.name,
        description: config.description,
        private: config.isPrivate,
        has_issues: true,
        has_projects: false,
        has_wiki: false,
        auto_init: false, // We'll create our own initial commit
        allow_squash_merge: true,
        allow_merge_commit: false,
        allow_rebase_merge: false
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GitHub API Error: ${error.message}`);
    }

    return await response.json();
  }

  /**
   * Create initial commit with generated application files
   */
  async createInitialCommit(repo, config) {
    const files = await this.prepareFilesForCommit(config.generatedApp, config);
    
    // Create blobs for all files
    const blobs = await this.createBlobs(repo, config.accessToken, files);
    
    // Create tree
    const tree = await this.createTree(repo, config.accessToken, blobs);
    
    // Create commit
    const commit = await this.createCommit(repo, config.accessToken, tree, config);
    
    // Update main branch reference
    await this.updateBranchRef(repo, config.accessToken, commit.sha);
    
    return {
      sha: commit.sha,
      message: commit.message,
      filesCount: files.length,
      timestamp: commit.author.date
    };
  }

  /**
   * Prepare all files for Git commit
   */
  async prepareFilesForCommit(generatedApp, config) {
    const files = [];
    
    // Add generated application files
    generatedApp.files.forEach(file => {
      files.push({
        path: file.path,
        content: file.content,
        type: file.type
      });
    });
    
    // Add package.json
    files.push({
      path: 'package.json',
      content: this.generatePackageJson(generatedApp, config),
      type: 'config'
    });
    
    // Add README.md
    files.push({
      path: 'README.md',
      content: this.generateReadme(generatedApp, config),
      type: 'documentation'
    });
    
    // Add .gitignore
    files.push({
      path: '.gitignore',
      content: this.generateGitignore(),
      type: 'config'
    });
    
    // Add Vite config
    files.push({
      path: 'vite.config.js',
      content: this.generateViteConfig(generatedApp),
      type: 'config'
    });
    
    // Add environment files
    files.push({
      path: '.env.example',
      content: this.generateEnvExample(),
      type: 'config'
    });
    
    return files;
  }

  /**
   * Generate package.json with appropriate dependencies
   */
  generatePackageJson(generatedApp, config) {
    const dependencies = {
      'lit': '^3.0.0',
      '@lit/context': '^1.0.0'
    };
    
    const devDependencies = {
      'vite': '^5.0.0',
      '@vitejs/plugin-legacy': '^5.0.0',
      'terser': '^5.0.0'
    };
    
    // Add specific dependencies based on features
    if (generatedApp.buildConfig.features.includes('auth')) {
      dependencies['@auth0/auth0-spa-js'] = '^2.0.0';
    }
    
    if (generatedApp.buildConfig.features.includes('routing')) {
      dependencies['@vaadin/router'] = '^1.7.0';
    }

    return JSON.stringify({
      name: config.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      version: '1.0.0',
      type: 'module',
      description: config.description,
      main: 'src/app.js',
      scripts: {
        'dev': 'vite',
        'build': 'vite build',
        'preview': 'vite preview',
        'deploy': 'npm run build && npx vercel --prod',
        'deploy:netlify': 'npm run build && npx netlify deploy --prod --dir=dist'
      },
      keywords: ['neoforge', 'web-components', 'lit', config.template],
      author: '',
      license: 'MIT',
      dependencies,
      devDependencies
    }, null, 2);
  }

  /**
   * Generate README.md with setup instructions
   */
  generateReadme(generatedApp, config) {
    const setupTime = this.estimateSetupTime(generatedApp);
    const deploymentPlatforms = ['Vercel', 'Netlify', 'GitHub Pages'];
    
    return `# ${config.name}

${config.description}

**Generated from [NeoForge Playground](https://neoforge.dev/playground)**  
**Template:** ${generatedApp.template}  
**Setup Time:** ~${setupTime} minutes

## 🚀 Quick Start

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
\`\`\`

## 📦 What's Included

- **Web Components:** Modern, reusable components built with Lit
- **Build System:** Vite for fast development and optimized builds
- **Deployment Ready:** Configured for ${deploymentPlatforms.join(', ')}
${generatedApp.buildConfig.features.includes('routing') ? '- **Routing:** Client-side routing with dynamic imports' : ''}
${generatedApp.buildConfig.features.includes('responsive') ? '- **Responsive Design:** Mobile-first responsive layouts' : ''}
${generatedApp.buildConfig.features.includes('auth') ? '- **Authentication:** Ready for auth integration' : ''}

## 🧩 Components Used

${generatedApp.files.filter(f => f.type === 'components')[0] ? 
  config.components?.map(comp => `- \`${comp}\``).join('\n') || '- See src/components/index.js for full list' 
  : '- Components imported from NeoForge library'
}

## 🚀 Deploy Now

### Vercel
\`\`\`bash
npm run deploy
\`\`\`

### Netlify
\`\`\`bash
npm run deploy:netlify
\`\`\`

### Manual Build
\`\`\`bash
npm run build
# Upload ./dist folder to your hosting provider
\`\`\`

## 🛠 Development

This project uses:
- **Lit 3.0** - Fast, lightweight web components
- **Vite** - Next generation frontend tooling
- **Modern JavaScript** - ES2022+ features

## 📁 Project Structure

\`\`\`
${config.name}/
├── src/
│   ├── app.js          # Main application entry
│   ├── components/     # Component imports
${generatedApp.buildConfig.features.includes('routing') ? '│   ├── routes.js       # Routing configuration' : ''}
${generatedApp.buildConfig.features.includes('routing') ? '│   └── pages/          # Page components' : ''}
├── index.html          # HTML entry point
├── package.json        # Dependencies and scripts
├── vite.config.js      # Build configuration
└── README.md           # This file
\`\`\`

## 🎨 Customization

1. **Styles:** Modify CSS in component files
2. **Layout:** Update templates in src/pages/
3. **Components:** Add new components to src/components/
4. **Routing:** Extend routes in src/routes.js (if enabled)

## 📈 Performance

This application is optimized for:
- **Fast Loading:** Code splitting and lazy loading
- **Small Bundle:** Tree shaking removes unused code
- **Modern Browsers:** ES2022+ with legacy fallback

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

**Built with ❤️ using [NeoForge](https://neoforge.dev)**  
*From playground to production in minutes, not hours.*
`;
  }

  /**
   * Generate .gitignore file
   */
  generateGitignore() {
    return `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
.tmp/
.cache/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Editor files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
.nyc_output/

# Vercel
.vercel/

# Netlify
.netlify/
`;
  }

  /**
   * Generate Vite configuration
   */
  generateViteConfig(generatedApp) {
    const features = generatedApp.buildConfig.features || [];
    const hasLegacySupport = features.includes('responsive');
    
    return `import { defineConfig } from 'vite';
${hasLegacySupport ? "import legacy from '@vitejs/plugin-legacy';" : ''}

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['lit', '@lit/context']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  plugins: [${hasLegacySupport ? `
    legacy({
      targets: ['defaults', 'not IE 11']
    })` : ''}
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});
`;
  }

  /**
   * Generate .env.example file
   */
  generateEnvExample() {
    return `# Environment Configuration
# Copy this file to .env and update values

# Application
VITE_APP_NAME="Your App Name"
VITE_API_URL="https://api.example.com"

# Authentication (if enabled)
# VITE_AUTH0_DOMAIN="your-domain.auth0.com"
# VITE_AUTH0_CLIENT_ID="your-client-id"

# Analytics (optional)
# VITE_GA_TRACKING_ID="GA-XXXXXXXXX"

# Development
VITE_DEBUG=false
`;
  }

  /**
   * Setup CI/CD workflows
   */
  async setupWorkflows(repo, config) {
    const workflows = [];
    
    // Create .github/workflows directory
    const workflowFiles = [
      {
        path: '.github/workflows/deploy.yml',
        content: this.generateDeployWorkflow(config)
      },
      {
        path: '.github/workflows/ci.yml',
        content: this.generateCIWorkflow()
      }
    ];
    
    for (const workflow of workflowFiles) {
      const result = await this.createWorkflowFile(repo, config.accessToken, workflow);
      workflows.push(result);
    }
    
    return workflows;
  }

  /**
   * Generate deployment workflow
   */
  generateDeployWorkflow(config) {
    return `name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.ORG_ID }}
          vercel-project-id: \${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
`;
  }

  /**
   * Generate CI workflow
   */
  generateCIWorkflow() {
    return `name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Check bundle size
        run: |
          BUNDLE_SIZE=\$(du -sh dist | cut -f1)
          echo "Bundle size: \$BUNDLE_SIZE"
          echo "bundle-size=\$BUNDLE_SIZE" >> \$GITHUB_OUTPUT

  lighthouse:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Lighthouse CI
        run: |
          npm install -g @lhci/cli@0.12.x
          lhci autorun --upload.target=temporary-public-storage
`;
  }

  /**
   * Helper methods for GitHub API operations
   */
  async createBlobs(repo, accessToken, files) {
    const blobs = [];
    
    for (const file of files) {
      const response = await fetch(`${this.githubApiBase}/repos/${repo.full_name}/git/blobs`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: btoa(unescape(encodeURIComponent(file.content))),
          encoding: 'base64'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create blob for ${file.path}`);
      }
      
      const blob = await response.json();
      blobs.push({
        path: file.path,
        sha: blob.sha,
        mode: '100644',
        type: 'blob'
      });
    }
    
    return blobs;
  }

  async createTree(repo, accessToken, blobs) {
    const response = await fetch(`${this.githubApiBase}/repos/${repo.full_name}/git/trees`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tree: blobs
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create tree');
    }
    
    return await response.json();
  }

  async createCommit(repo, accessToken, tree, config) {
    const response = await fetch(`${this.githubApiBase}/repos/${repo.full_name}/git/commits`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `🚀 Initial commit: ${config.name}\n\nGenerated from NeoForge Playground\nTemplate: ${config.template}\nComponents: ${config.components?.join(', ') || 'N/A'}`,
        tree: tree.sha,
        author: {
          name: 'NeoForge Playground',
          email: 'playground@neoforge.dev',
          date: new Date().toISOString()
        }
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create commit');
    }
    
    return await response.json();
  }

  async updateBranchRef(repo, accessToken, commitSha) {
    const response = await fetch(`${this.githubApiBase}/repos/${repo.full_name}/git/refs/heads/main`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'refs/heads/main',
        sha: commitSha
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update main branch reference');
    }
    
    return await response.json();
  }

  async createWorkflowFile(repo, accessToken, workflow) {
    const response = await fetch(`${this.githubApiBase}/repos/${repo.full_name}/contents/${workflow.path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Add ${workflow.path} workflow`,
        content: btoa(unescape(encodeURIComponent(workflow.content)))
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create workflow: ${workflow.path}`);
    }
    
    return {
      path: workflow.path,
      created: true
    };
  }

  /**
   * Configure repository settings
   */
  async configureRepoSettings(repo, config) {
    // Enable pages if requested
    if (config.enablePages) {
      await this.enableGitHubPages(repo, config.accessToken);
    }
    
    // Add topics/tags
    await this.addRepositoryTopics(repo, config.accessToken, [
      'neoforge',
      'web-components',
      'lit',
      config.template,
      'playground-generated'
    ]);
    
    return {
      pagesEnabled: config.enablePages,
      topicsAdded: true
    };
  }

  async enableGitHubPages(repo, accessToken) {
    const response = await fetch(`${this.githubApiBase}/repos/${repo.full_name}/pages`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: {
          branch: 'main',
          path: '/'
        }
      })
    });
    
    return response.ok;
  }

  async addRepositoryTopics(repo, accessToken, topics) {
    const response = await fetch(`${this.githubApiBase}/repos/${repo.full_name}/topics`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.mercy-preview+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        names: topics
      })
    });
    
    return response.ok;
  }

  /**
   * Generate next steps for the user
   */
  generateNextSteps(repo, config) {
    return [
      {
        step: 1,
        title: 'Clone your repository',
        command: `git clone ${repo.clone_url}`,
        description: 'Download your new repository to start developing'
      },
      {
        step: 2,
        title: 'Install dependencies',
        command: 'npm install',
        description: 'Install all required packages'
      },
      {
        step: 3,
        title: 'Start development server',
        command: 'npm run dev',
        description: 'Launch the development server on localhost:3000'
      },
      {
        step: 4,
        title: 'Deploy to production',
        command: 'npm run deploy',
        description: 'Deploy your app to Vercel (requires setup)'
      }
    ];
  }

  /**
   * Generate troubleshooting steps for common errors
   */
  generateTroubleshootingSteps(error) {
    const troubleshooting = {
      'Bad credentials': [
        'Check that your GitHub token is valid',
        'Ensure token has repo creation permissions',
        'Try generating a new personal access token'
      ],
      'Repository name already exists': [
        'Choose a different repository name',
        'Check your GitHub account for existing repos',
        'Add a suffix like -v2 or -new'
      ],
      'API rate limit exceeded': [
        'Wait for rate limit to reset (usually 1 hour)',
        'Use authenticated requests with personal token',
        'Consider GitHub Pro for higher limits'
      ],
      'default': [
        'Check your internet connection',
        'Verify GitHub service status',
        'Try again in a few minutes'
      ]
    };

    const errorMessage = error.message || error.toString();
    
    for (const [key, steps] of Object.entries(troubleshooting)) {
      if (errorMessage.includes(key)) {
        return steps;
      }
    }
    
    return troubleshooting.default;
  }

  /**
   * Estimate setup time based on app complexity
   */
  estimateSetupTime(generatedApp) {
    let baseTime = 5; // Base 5 minutes
    
    const features = generatedApp.buildConfig.features || [];
    const fileCount = generatedApp.files.length;
    
    // Add time based on features
    if (features.includes('routing')) baseTime += 2;
    if (features.includes('auth')) baseTime += 5;
    if (features.includes('responsive')) baseTime += 1;
    
    // Add time based on file complexity
    if (fileCount > 10) baseTime += 2;
    if (fileCount > 20) baseTime += 3;
    
    return Math.min(baseTime, 15); // Cap at 15 minutes
  }

  /**
   * Initialize default workflows
   */
  initializeWorkflows() {
    return {
      deploy: 'vercel-deploy',
      ci: 'continuous-integration',
      lighthouse: 'performance-audit'
    };
  }
}