/**
 * Deployment Examples
 * 
 * Provides production deployment configurations and guides.
 * Critical for the playground → production journey.
 */

export class DeploymentExamples {
  constructor() {
    this.platforms = this.initializePlatforms();
  }

  /**
   * Get deployment guides for different platforms
   */
  getGuides() {
    return [
      {
        platform: 'vercel',
        type: 'static',
        description: 'Deploy to Vercel with zero configuration',
        difficulty: 'easy',
        configFiles: this.getVercelConfig(),
        buildCommands: {
          install: 'npm ci',
          build: 'npm run build',
          output: 'dist'
        },
        steps: this.getVercelSteps()
      },
      {
        platform: 'netlify',
        type: 'static', 
        description: 'Deploy to Netlify with drag-and-drop or Git',
        difficulty: 'easy',
        configFiles: this.getNetlifyConfig(),
        buildCommands: {
          install: 'npm ci',
          build: 'npm run build',
          output: 'dist'
        },
        steps: this.getNetlifySteps()
      },
      {
        platform: 'github-pages',
        type: 'static',
        description: 'Deploy to GitHub Pages with GitHub Actions',
        difficulty: 'medium',
        configFiles: this.getGitHubPagesConfig(),
        buildCommands: {
          install: 'npm ci', 
          build: 'npm run build',
          output: 'dist'
        },
        steps: this.getGitHubPagesSteps()
      },
      {
        platform: 'docker',
        type: 'containerized',
        description: 'Containerized deployment with Nginx',
        difficulty: 'medium',
        configFiles: this.getDockerConfig(),
        buildCommands: {
          build: 'docker build -t my-app .',
          run: 'docker run -p 80:80 my-app'
        },
        steps: this.getDockerSteps()
      }
    ];
  }

  /**
   * Vercel configuration
   */
  getVercelConfig() {
    return {
      'vercel.json': {
        content: JSON.stringify({
          "builds": [
            {
              "src": "package.json",
              "use": "@vercel/static-build",
              "config": {
                "distDir": "dist"
              }
            }
          ],
          "routes": [
            {
              "src": "/(.*)",
              "dest": "/index.html"
            }
          ]
        }, null, 2),
        description: 'Vercel deployment configuration'
      },
      'package.json': {
        content: `{
  "scripts": {
    "build": "vite build",
    "vercel-build": "npm run build"
  }
}`,
        description: 'Add vercel-build script to package.json'
      }
    };
  }

  getVercelSteps() {
    return [
      {
        step: 1,
        title: 'Install Vercel CLI',
        command: 'npm i -g vercel',
        description: 'Install the Vercel command line interface'
      },
      {
        step: 2,
        title: 'Login to Vercel',
        command: 'vercel login',
        description: 'Authenticate with your Vercel account'
      },
      {
        step: 3,
        title: 'Deploy',
        command: 'vercel --prod',
        description: 'Deploy to production'
      }
    ];
  }

  /**
   * Netlify configuration
   */
  getNetlifyConfig() {
    return {
      'netlify.toml': {
        content: `[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200`,
        description: 'Netlify build configuration'
      },
      '_redirects': {
        content: '/*    /index.html   200',
        description: 'SPA redirect rules (alternative to netlify.toml)'
      }
    };
  }

  getNetlifySteps() {
    return [
      {
        step: 1,
        title: 'Connect Repository',
        description: 'Connect your Git repository to Netlify'
      },
      {
        step: 2,
        title: 'Configure Build',
        description: 'Set build command: npm run build, publish directory: dist'
      },
      {
        step: 3,
        title: 'Deploy',
        description: 'Deploy automatically on Git push'
      }
    ];
  }

  /**
   * GitHub Pages configuration
   */
  getGitHubPagesConfig() {
    return {
      '.github/workflows/deploy.yml': {
        content: `name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
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
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      if: github.ref == 'refs/heads/main'
      with:
        github_token: \${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist`,
        description: 'GitHub Actions workflow for automated deployment'
      },
      'vite.config.js': {
        content: `import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/your-repo-name/' : '/',
  build: {
    outDir: 'dist'
  }
})`,
        description: 'Vite config with correct base path for GitHub Pages'
      }
    };
  }

  getGitHubPagesSteps() {
    return [
      {
        step: 1,
        title: 'Enable GitHub Pages',
        description: 'Go to repository Settings > Pages, select "GitHub Actions" as source'
      },
      {
        step: 2,
        title: 'Add Workflow File',
        description: 'Create .github/workflows/deploy.yml with the provided configuration'
      },
      {
        step: 3,
        title: 'Update Base Path',
        description: 'Set correct base path in vite.config.js for your repository'
      },
      {
        step: 4,
        title: 'Push to Deploy',
        description: 'Push to main branch to trigger automatic deployment'
      }
    ];
  }

  /**
   * Docker configuration
   */
  getDockerConfig() {
    return {
      'Dockerfile': {
        content: `# Build stage
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]`,
        description: 'Multi-stage Dockerfile for optimized production image'
      },
      'nginx.conf': {
        content: `events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;
        
        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        # Cache static assets
        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}`,
        description: 'Nginx configuration for SPA with caching'
      },
      '.dockerignore': {
        content: `node_modules
dist
.git
.gitignore
README.md
Dockerfile
.dockerignore`,
        description: 'Docker ignore file to reduce image size'
      }
    };
  }

  getDockerSteps() {
    return [
      {
        step: 1,
        title: 'Create Dockerfile',
        description: 'Add Dockerfile and nginx.conf to your project root'
      },
      {
        step: 2,
        title: 'Build Image',
        command: 'docker build -t my-neoforge-app .',
        description: 'Build the Docker image'
      },
      {
        step: 3,
        title: 'Run Container',
        command: 'docker run -p 8080:80 my-neoforge-app',
        description: 'Run the container locally'
      },
      {
        step: 4,
        title: 'Deploy to Production',
        description: 'Push to container registry and deploy to your hosting platform'
      }
    ];
  }

  /**
   * Get platform-specific optimization tips
   */
  getOptimizationTips(platform) {
    const tips = {
      vercel: [
        'Use Vercel Edge Functions for API routes',
        'Enable automatic optimization in Vercel dashboard',
        'Configure custom domains for better performance'
      ],
      netlify: [
        'Use Netlify Forms for contact forms',
        'Enable Asset Optimization in build settings',
        'Set up branch deploys for staging'
      ],
      'github-pages': [
        'Optimize images before deployment',
        'Use GitHub Codespaces for development',
        'Set up custom domains with HTTPS'
      ],
      docker: [
        'Use multi-stage builds to reduce image size',
        'Configure health checks for containers',
        'Use environment variables for configuration'
      ]
    };

    return tips[platform] || [];
  }

  /**
   * Get security considerations for each platform
   */
  getSecurityConsiderations(platform) {
    const security = {
      vercel: [
        'Configure environment variables in Vercel dashboard',
        'Use Vercel Authentication for protected routes',
        'Enable security headers'
      ],
      netlify: [
        'Set up Netlify Identity for authentication',
        'Use environment variables for sensitive data',
        'Configure security headers'
      ],
      'github-pages': [
        'Never commit secrets to repository',
        'Use GitHub Secrets for deployment keys',
        'Configure custom domains with HTTPS'
      ],
      docker: [
        'Run containers as non-root user',
        'Scan images for vulnerabilities',
        'Use secrets management in production'
      ]
    };

    return security[platform] || [];
  }

  initializePlatforms() {
    return {
      static: ['vercel', 'netlify', 'github-pages'],
      containerized: ['docker', 'kubernetes'],
      serverless: ['vercel', 'netlify-functions'],
      traditional: ['apache', 'nginx']
    };
  }
}