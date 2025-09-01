/**
 * One-Click Deployment Integration
 *
 * Direct deployment to Vercel/Netlify/GitHub Pages from the playground.
 * The missing piece that transforms demo into deployable applications.
 */

export class OneClickDeployment {
  constructor() {
    this.platforms = this.initializePlatforms();
    this.deploymentStatus = new Map();
  }

  /**
   * Deploy application to selected platform
   */
  async deployApplication(deploymentConfig) {
    this.validateDeploymentConfig(deploymentConfig);

    const platform = this.platforms[deploymentConfig.platform];
    if (!platform) {
      throw new Error(`Unsupported platform: ${deploymentConfig.platform}`);
    }

    try {
      // Start deployment tracking
      const deploymentId = this.generateDeploymentId();
      this.trackDeploymentStart(deploymentId, deploymentConfig);

      // Platform-specific deployment
      const result = await this.deployToPlatform(deploymentConfig, platform, deploymentId);

      // Update deployment status
      this.trackDeploymentSuccess(deploymentId, result);

      return {
        success: true,
        deploymentId,
        platform: deploymentConfig.platform,
        url: result.url,
        deploymentUrl: result.deploymentUrl,
        status: 'deployed',
        timestamp: new Date().toISOString(),
        buildTime: result.buildTime,
        nextSteps: this.generatePostDeploymentSteps(result, deploymentConfig)
      };
    } catch (error) {
      this.trackDeploymentError(deploymentId, error);
      return {
        success: false,
        error: error.message,
        platform: deploymentConfig.platform,
        troubleshooting: this.generateTroubleshootingGuide(error, deploymentConfig.platform)
      };
    }
  }

  /**
   * Deploy to specific platform
   */
  async deployToPlatform(config, platform, deploymentId) {
    switch (config.platform) {
      case 'vercel':
        return await this.deployToVercel(config, deploymentId);
      case 'netlify':
        return await this.deployToNetlify(config, deploymentId);
      case 'github-pages':
        return await this.deployToGitHubPages(config, deploymentId);
      case 'firebase':
        return await this.deployToFirebase(config, deploymentId);
      default:
        throw new Error(`Platform ${config.platform} not implemented`);
    }
  }

  /**
   * Deploy to Vercel
   */
  async deployToVercel(config, deploymentId) {
    const startTime = Date.now();

    // Create deployment configuration
    const vercelConfig = {
      name: config.appName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      files: await this.prepareFilesForVercel(config),
      builds: [
        {
          src: 'package.json',
          use: '@vercel/static-build',
          config: { distDir: 'dist' }
        }
      ],
      routes: [
        {
          src: '/(.*)',
          dest: '/index.html'
        }
      ],
      env: config.environmentVariables || {},
      public: config.isPublic !== false
    };

    // Deploy using Vercel API
    const deployment = await this.callVercelAPI(vercelConfig, config.tokens?.vercel);

    // Monitor deployment progress
    const finalStatus = await this.monitorVercelDeployment(deployment.id, config.tokens?.vercel);

    return {
      url: `https://${deployment.url}`,
      deploymentUrl: `https://vercel.com/${config.vercelTeam || 'user'}/${deployment.name}`,
      buildTime: Date.now() - startTime,
      deploymentId: deployment.id,
      platform: 'vercel'
    };
  }

  /**
   * Deploy to Netlify
   */
  async deployToNetlify(config, deploymentId) {
    const startTime = Date.now();

    // Create site configuration
    const netlifyConfig = {
      name: config.appName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      build_settings: {
        cmd: 'npm run build',
        dir: 'dist'
      },
      env: config.environmentVariables || {},
      processing_settings: {
        css: { bundle: true, minify: true },
        js: { bundle: true, minify: true },
        images: { compress: true }
      }
    };

    // Create site
    const site = await this.createNetlifySite(netlifyConfig, config.tokens?.netlify);

    // Deploy files
    const deployment = await this.deployToNetlifySite(site.id, config, config.tokens?.netlify);

    // Monitor deployment
    const finalStatus = await this.monitorNetlifyDeployment(deployment.id, config.tokens?.netlify);

    return {
      url: finalStatus.deploy_url,
      deploymentUrl: `https://app.netlify.com/sites/${site.name}/deploys`,
      buildTime: Date.now() - startTime,
      deploymentId: deployment.id,
      platform: 'netlify'
    };
  }

  /**
   * Deploy to GitHub Pages
   */
  async deployToGitHubPages(config, deploymentId) {
    const startTime = Date.now();

    if (!config.repository) {
      throw new Error('GitHub repository required for GitHub Pages deployment');
    }

    // Create GitHub Actions workflow for Pages
    const workflow = this.generateGitHubPagesWorkflow(config);

    // Commit workflow file to repository
    await this.commitWorkflowToRepo(config.repository, workflow, config.tokens?.github);

    // Trigger workflow
    const workflowRun = await this.triggerGitHubWorkflow(config.repository, config.tokens?.github);

    // Monitor workflow execution
    const result = await this.monitorGitHubWorkflow(workflowRun.id, config.repository, config.tokens?.github);

    const repoName = config.repository.split('/')[1];
    const username = config.repository.split('/')[0];

    return {
      url: `https://${username}.github.io/${repoName}/`,
      deploymentUrl: `https://github.com/${config.repository}/actions`,
      buildTime: Date.now() - startTime,
      deploymentId: workflowRun.id,
      platform: 'github-pages'
    };
  }

  /**
   * Deploy to Firebase Hosting
   */
  async deployToFirebase(config, deploymentId) {
    const startTime = Date.now();

    // Create Firebase project configuration
    const firebaseConfig = {
      hosting: {
        public: 'dist',
        ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
        rewrites: [
          {
            source: '**',
            destination: '/index.html'
          }
        ],
        headers: [
          {
            source: '**/*.@(js|css)',
            headers: [
              {
                key: 'Cache-Control',
                value: 'max-age=31536000'
              }
            ]
          }
        ]
      }
    };

    // Deploy using Firebase CLI API
    const deployment = await this.deployToFirebaseHosting(config, firebaseConfig);

    return {
      url: `https://${config.firebaseProjectId}.web.app/`,
      deploymentUrl: `https://console.firebase.google.com/project/${config.firebaseProjectId}/hosting/main`,
      buildTime: Date.now() - startTime,
      deploymentId: deployment.version,
      platform: 'firebase'
    };
  }

  /**
   * Prepare files for deployment platforms
   */
  async prepareFilesForVercel(config) {
    const files = {};

    // Add generated application files
    config.generatedApp.files.forEach(file => {
      files[file.path] = { file: file.content };
    });

    // Add platform-specific files
    files['vercel.json'] = {
      file: JSON.stringify({
        version: 2,
        builds: [
          {
            src: 'package.json',
            use: '@vercel/static-build',
            config: { distDir: 'dist' }
          }
        ],
        routes: [
          { src: '/(.*)', dest: '/index.html' }
        ],
        env: config.environmentVariables || {}
      }, null, 2)
    };

    return files;
  }

  /**
   * Call Vercel API
   */
  async callVercelAPI(deploymentConfig, token) {
    if (!token) {
      // Redirect to Vercel OAuth flow
      return this.initiateVercelOAuth(deploymentConfig);
    }

    const response = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deploymentConfig)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Vercel deployment failed: ${error.message}`);
    }

    return await response.json();
  }

  /**
   * Initiate Vercel OAuth flow
   */
  initiateVercelOAuth(deploymentConfig) {
    const params = new URLSearchParams({
      client_id: 'neoforge-playground',
      redirect_uri: window.location.origin + '/auth/vercel/callback',
      response_type: 'code',
      scope: 'deployments:write',
      state: btoa(JSON.stringify({
        platform: 'vercel',
        config: deploymentConfig,
        timestamp: Date.now()
      }))
    });

    const oauthUrl = `https://vercel.com/oauth/authorize?${params.toString()}`;

    return {
      requiresAuth: true,
      authUrl: oauthUrl,
      instructions: [
        'Click "Authorize with Vercel" to continue',
        'Grant deployment permissions to NeoForge',
        'You\'ll be redirected back to complete deployment'
      ]
    };
  }

  /**
   * Monitor Vercel deployment progress
   */
  async monitorVercelDeployment(deploymentId, token, maxWaitTime = 300000) {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const response = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const deployment = await response.json();

        if (deployment.readyState === 'READY') {
          return deployment;
        } else if (deployment.readyState === 'ERROR') {
          throw new Error(`Deployment failed: ${deployment.error?.message || 'Unknown error'}`);
        }
      }

      // Wait 5 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    throw new Error('Deployment timeout - please check Vercel dashboard');
  }

  /**
   * Create Netlify site
   */
  async createNetlifySite(config, token) {
    const response = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Netlify site creation failed: ${error.message}`);
    }

    return await response.json();
  }

  /**
   * Generate GitHub Pages workflow
   */
  generateGitHubPagesWorkflow(config) {
    return `name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
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

      - name: Setup Pages
        uses: actions/configure-pages@v3

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
`;
  }

  /**
   * Validate deployment configuration
   */
  validateDeploymentConfig(config) {
    const required = ['platform', 'appName', 'generatedApp'];
    const missing = required.filter(field => !config[field]);

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    if (!this.platforms[config.platform]) {
      throw new Error(`Unsupported platform: ${config.platform}`);
    }

    // Platform-specific validation
    switch (config.platform) {
      case 'github-pages':
        if (!config.repository) {
          throw new Error('GitHub repository required for GitHub Pages deployment');
        }
        break;
      case 'firebase':
        if (!config.firebaseProjectId) {
          throw new Error('Firebase project ID required for Firebase deployment');
        }
        break;
    }
  }

  /**
   * Generate deployment ID
   */
  generateDeploymentId() {
    return `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track deployment lifecycle
   */
  trackDeploymentStart(deploymentId, config) {
    this.deploymentStatus.set(deploymentId, {
      status: 'starting',
      platform: config.platform,
      appName: config.appName,
      startTime: Date.now()
    });
  }

  trackDeploymentSuccess(deploymentId, result) {
    const existing = this.deploymentStatus.get(deploymentId);
    this.deploymentStatus.set(deploymentId, {
      ...existing,
      status: 'success',
      endTime: Date.now(),
      result
    });
  }

  trackDeploymentError(deploymentId, error) {
    const existing = this.deploymentStatus.get(deploymentId);
    this.deploymentStatus.set(deploymentId, {
      ...existing,
      status: 'error',
      endTime: Date.now(),
      error: error.message
    });
  }

  /**
   * Get deployment status
   */
  getDeploymentStatus(deploymentId) {
    return this.deploymentStatus.get(deploymentId);
  }

  /**
   * Generate post-deployment steps
   */
  generatePostDeploymentSteps(result, config) {
    const steps = [
      {
        title: 'Visit your deployed app',
        action: `Open ${result.url}`,
        description: 'Your application is live and accessible'
      },
      {
        title: 'Monitor deployment',
        action: `Check ${result.deploymentUrl}`,
        description: 'View deployment logs and metrics'
      }
    ];

    if (config.platform === 'vercel') {
      steps.push({
        title: 'Add custom domain',
        action: 'Configure domain in Vercel dashboard',
        description: 'Connect your custom domain for production use'
      });
    }

    if (config.platform === 'netlify') {
      steps.push({
        title: 'Setup form handling',
        action: 'Configure Netlify Forms if needed',
        description: 'Enable form submissions for contact forms'
      });
    }

    return steps;
  }

  /**
   * Generate troubleshooting guide
   */
  generateTroubleshootingGuide(error, platform) {
    const commonSolutions = {
      'vercel': [
        'Verify your Vercel token has deployment permissions',
        'Check build logs in Vercel dashboard',
        'Ensure package.json has correct build script',
        'Verify all dependencies are listed in package.json'
      ],
      'netlify': [
        'Check build command and publish directory settings',
        'Verify environment variables are set correctly',
        'Review build logs for specific errors',
        'Ensure build folder contains index.html'
      ],
      'github-pages': [
        'Verify GitHub Pages is enabled in repository settings',
        'Check Actions tab for workflow execution status',
        'Ensure repository is public (for free GitHub accounts)',
        'Verify workflow file is in .github/workflows/ directory'
      ],
      'firebase': [
        'Verify Firebase project ID is correct',
        'Check Firebase Hosting is enabled for the project',
        'Ensure Firebase CLI token has hosting permissions',
        'Review Firebase console for deployment logs'
      ]
    };

    const errorSpecific = {
      'authentication': [
        'Regenerate API token/key',
        'Check token permissions and scopes',
        'Try logging out and back in'
      ],
      'build': [
        'Check for Node.js version compatibility',
        'Verify all dependencies install correctly',
        'Review build script in package.json'
      ],
      'network': [
        'Check internet connection stability',
        'Try deployment again in a few minutes',
        'Verify service status pages for outages'
      ]
    };

    // Determine error category
    const errorMessage = error.message.toLowerCase();
    let category = 'general';

    if (errorMessage.includes('auth') || errorMessage.includes('token') || errorMessage.includes('permission')) {
      category = 'authentication';
    } else if (errorMessage.includes('build') || errorMessage.includes('compile')) {
      category = 'build';
    } else if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('connection')) {
      category = 'network';
    }

    return {
      platform: commonSolutions[platform] || [],
      category: errorSpecific[category] || [],
      general: [
        'Try refreshing the page and attempting deployment again',
        'Check platform status pages for ongoing issues',
        'Contact platform support if issue persists'
      ]
    };
  }

  /**
   * Initialize supported platforms
   */
  initializePlatforms() {
    return {
      'vercel': {
        name: 'Vercel',
        description: 'Zero-configuration deployment platform',
        features: ['Automatic HTTPS', 'Global CDN', 'Serverless Functions'],
        requirements: ['Vercel account', 'Deployment token'],
        estimatedTime: '2-3 minutes'
      },
      'netlify': {
        name: 'Netlify',
        description: 'All-in-one platform for web development',
        features: ['Form handling', 'Split testing', 'Analytics'],
        requirements: ['Netlify account', 'API token'],
        estimatedTime: '3-4 minutes'
      },
      'github-pages': {
        name: 'GitHub Pages',
        description: 'Static site hosting from GitHub repository',
        features: ['Custom domains', 'HTTPS', 'Jekyll support'],
        requirements: ['GitHub repository', 'GitHub token'],
        estimatedTime: '5-7 minutes'
      },
      'firebase': {
        name: 'Firebase Hosting',
        description: 'Google Firebase static hosting',
        features: ['Global CDN', 'Custom domains', 'SSL certificates'],
        requirements: ['Firebase project', 'Firebase token'],
        estimatedTime: '4-5 minutes'
      }
    };
  }

  /**
   * Get available platforms
   */
  getAvailablePlatforms() {
    return Object.entries(this.platforms).map(([key, platform]) => ({
      id: key,
      ...platform
    }));
  }

  /**
   * Estimate deployment time
   */
  estimateDeploymentTime(platform, appComplexity = 'medium') {
    const baseTime = {
      'vercel': 2,
      'netlify': 3,
      'github-pages': 5,
      'firebase': 4
    };

    const complexityMultiplier = {
      'simple': 1,
      'medium': 1.2,
      'complex': 1.5
    };

    return Math.ceil((baseTime[platform] || 3) * (complexityMultiplier[appComplexity] || 1));
  }
}
