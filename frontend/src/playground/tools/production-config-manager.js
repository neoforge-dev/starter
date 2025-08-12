/**
 * Production Configuration Manager
 * 
 * Manages environment variables, database setup, deployment configs, and security settings.
 * Ensures generated applications are production-ready with proper configurations.
 */

export class ProductionConfigManager {
  constructor() {
    this.configTemplates = this.initializeConfigTemplates();
    this.securityPresets = this.initializeSecurityPresets();
    this.environmentProfiles = this.initializeEnvironmentProfiles();
  }

  /**
   * Generate complete production configuration
   */
  async generateProductionConfig(configRequest) {
    this.validateConfigRequest(configRequest);
    
    try {
      // Generate environment configurations
      const environments = await this.generateEnvironmentConfigs(configRequest);
      
      // Generate database configurations
      const database = await this.generateDatabaseConfig(configRequest);
      
      // Generate security configurations
      const security = await this.generateSecurityConfig(configRequest);
      
      // Generate monitoring and logging configs
      const monitoring = await this.generateMonitoringConfig(configRequest);
      
      // Generate deployment-specific configs
      const deployment = await this.generateDeploymentConfigs(configRequest);
      
      return {
        success: true,
        configurations: {
          environments,
          database,
          security,
          monitoring,
          deployment
        },
        setupGuide: this.generateSetupGuide(configRequest),
        securityChecklist: this.generateSecurityChecklist(configRequest)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        suggestions: this.generateConfigSuggestions(error, configRequest)
      };
    }
  }

  /**
   * Generate environment configurations for different stages
   */
  async generateEnvironmentConfigs(configRequest) {
    const environments = ['development', 'staging', 'production'];
    const configs = {};
    
    for (const env of environments) {
      configs[env] = await this.generateEnvironmentConfig(configRequest, env);
    }
    
    return configs;
  }

  /**
   * Generate environment-specific configuration
   */
  async generateEnvironmentConfig(configRequest, environment) {
    const template = this.configTemplates[configRequest.template] || this.configTemplates.default;
    const isProduction = environment === 'production';
    
    const config = {
      // Application settings
      APP_NAME: configRequest.appName,
      APP_ENV: environment,
      APP_DEBUG: !isProduction,
      APP_URL: this.generateAppURL(configRequest, environment),
      
      // Database settings
      ...this.generateDatabaseEnvVars(configRequest, environment),
      
      // Security settings
      ...this.generateSecurityEnvVars(configRequest, environment),
      
      // API settings
      API_VERSION: 'v1',
      API_PREFIX: '/api/v1',
      API_DOCS_URL: isProduction ? null : '/docs',
      
      // CORS settings
      CORS_ORIGINS: this.generateCORSOrigins(configRequest, environment),
      CORS_CREDENTIALS: true,
      
      // Logging settings
      LOG_LEVEL: isProduction ? 'WARNING' : 'DEBUG',
      LOG_FORMAT: 'json',
      
      // Cache settings
      REDIS_URL: this.generateRedisURL(environment),
      CACHE_TTL: isProduction ? 3600 : 300,
      
      // Email settings (if needed)
      ...(configRequest.features.includes('email') && this.generateEmailEnvVars(environment)),
      
      // Payment settings (if needed)
      ...(configRequest.features.includes('billing') && this.generatePaymentEnvVars(environment)),
      
      // Analytics settings
      ...(configRequest.features.includes('analytics') && this.generateAnalyticsEnvVars(environment)),
      
      // Platform-specific settings
      ...this.generatePlatformEnvVars(configRequest, environment)
    };

    return {
      file: `.env.${environment}`,
      content: this.formatEnvFile(config),
      sensitive: this.identifySensitiveVars(config)
    };
  }

  /**
   * Generate database configuration
   */
  async generateDatabaseConfig(configRequest) {
    const dbType = configRequest.database || 'postgresql';
    const configs = {};
    
    // Database connection configuration
    configs.connection = {
      file: 'database/config.json',
      content: JSON.stringify({
        development: {
          dialect: dbType,
          host: 'localhost',
          port: this.getDefaultPort(dbType),
          database: `${configRequest.appName.toLowerCase()}_dev`,
          username: 'developer',
          password: 'dev_password',
          logging: true,
          pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
          }
        },
        staging: {
          dialect: dbType,
          host: '${DB_HOST}',
          port: '${DB_PORT}',
          database: '${DB_NAME}',
          username: '${DB_USER}',
          password: '${DB_PASSWORD}',
          logging: false,
          ssl: true,
          pool: {
            max: 10,
            min: 2,
            acquire: 30000,
            idle: 10000
          }
        },
        production: {
          dialect: dbType,
          host: '${DB_HOST}',
          port: '${DB_PORT}',
          database: '${DB_NAME}',
          username: '${DB_USER}',
          password: '${DB_PASSWORD}',
          logging: false,
          ssl: {
            require: true,
            rejectUnauthorized: false
          },
          pool: {
            max: 20,
            min: 5,
            acquire: 30000,
            idle: 10000
          }
        }
      }, null, 2)
    };
    
    // Migration configuration
    configs.migrations = {
      file: 'database/migrate.config.js',
      content: this.generateMigrationConfig(dbType)
    };
    
    // Database initialization script
    configs.initialization = {
      file: 'database/init.sql',
      content: this.generateDatabaseInitScript(configRequest, dbType)
    };
    
    // Backup configuration
    configs.backup = {
      file: 'database/backup.sh',
      content: this.generateBackupScript(dbType),
      executable: true
    };
    
    return configs;
  }

  /**
   * Generate security configuration
   */
  async generateSecurityConfig(configRequest) {
    const securityPreset = this.securityPresets[configRequest.securityLevel || 'standard'];
    const configs = {};
    
    // Security headers configuration
    configs.headers = {
      file: 'config/security-headers.json',
      content: JSON.stringify({
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Content-Security-Policy": this.generateCSPPolicy(configRequest),
        "Permissions-Policy": "geolocation=(), camera=(), microphone=()"
      }, null, 2)
    };
    
    // Rate limiting configuration
    configs.rateLimiting = {
      file: 'config/rate-limits.json',
      content: JSON.stringify({
        global: {
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 1000, // requests per window
          message: "Too many requests from this IP"
        },
        auth: {
          windowMs: 15 * 60 * 1000,
          max: 5, // login attempts
          skipSuccessfulRequests: true
        },
        api: {
          windowMs: 60 * 1000, // 1 minute
          max: 60, // API calls per minute
          standardHeaders: true,
          legacyHeaders: false
        }
      }, null, 2)
    };
    
    // JWT configuration
    if (configRequest.features.includes('auth')) {
      configs.jwt = {
        file: 'config/jwt.json',
        content: JSON.stringify({
          algorithm: 'HS256',
          expiresIn: '24h',
          refreshTokenExpiresIn: '7d',
          issuer: configRequest.appName,
          audience: configRequest.appUrl || 'localhost'
        }, null, 2)
      };
    }
    
    // CORS configuration
    configs.cors = {
      file: 'config/cors.json',
      content: JSON.stringify({
        development: {
          origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"],
          credentials: true,
          methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
          allowedHeaders: ["Content-Type", "Authorization"]
        },
        production: {
          origin: configRequest.productionDomains || ["https://yourdomain.com"],
          credentials: true,
          methods: ["GET", "POST", "PUT", "DELETE"],
          allowedHeaders: ["Content-Type", "Authorization"],
          optionsSuccessStatus: 200
        }
      }, null, 2)
    };
    
    return configs;
  }

  /**
   * Generate monitoring and logging configuration
   */
  async generateMonitoringConfig(configRequest) {
    const configs = {};
    
    // Logging configuration
    configs.logging = {
      file: 'config/logging.json',
      content: JSON.stringify({
        version: 1,
        disable_existing_loggers: false,
        formatters: {
          standard: {
            format: '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
          },
          json: {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            format: '%(asctime)s %(name)s %(levelname)s %(message)s'
          }
        },
        handlers: {
          console: {
            level: 'DEBUG',
            class: 'logging.StreamHandler',
            formatter: 'standard'
          },
          file: {
            level: 'INFO',
            class: 'logging.handlers.RotatingFileHandler',
            filename: 'logs/app.log',
            maxBytes: 10485760, // 10MB
            backupCount: 5,
            formatter: 'json'
          }
        },
        loggers: {
          '': {
            handlers: ['console', 'file'],
            level: 'INFO',
            propagate: false
          }
        }
      }, null, 2)
    };
    
    // Health check configuration
    configs.healthCheck = {
      file: 'config/health-checks.json',
      content: JSON.stringify({
        checks: [
          {
            name: 'database',
            type: 'database',
            timeout: 5000
          },
          {
            name: 'redis',
            type: 'redis',
            timeout: 3000
          },
          {
            name: 'disk_space',
            type: 'disk',
            threshold: 0.8
          },
          {
            name: 'memory',
            type: 'memory',
            threshold: 0.9
          }
        ],
        intervals: {
          startup: 0,
          liveness: 30000,
          readiness: 10000
        }
      }, null, 2)
    };
    
    // Metrics configuration
    configs.metrics = {
      file: 'config/metrics.json',
      content: JSON.stringify({
        prometheus: {
          enabled: true,
          port: 9090,
          path: '/metrics'
        },
        custom_metrics: [
          'request_duration_seconds',
          'requests_total',
          'database_query_duration_seconds',
          'active_users_gauge'
        ],
        collection_interval: 15
      }, null, 2)
    };
    
    return configs;
  }

  /**
   * Generate deployment-specific configurations
   */
  async generateDeploymentConfigs(configRequest) {
    const configs = {};
    
    // Vercel configuration
    configs.vercel = {
      file: 'vercel.json',
      content: JSON.stringify({
        version: 2,
        env: this.generateVercelEnvConfig(configRequest),
        builds: [
          {
            src: 'backend/main.py',
            use: '@vercel/python'
          },
          {
            src: 'frontend/package.json',
            use: '@vercel/static-build',
            config: {
              distDir: 'dist'
            }
          }
        ],
        routes: [
          {
            src: '/api/(.*)',
            dest: '/backend/main.py'
          },
          {
            src: '/(.*)',
            dest: '/frontend/dist/index.html'
          }
        ],
        functions: {
          'backend/main.py': {
            runtime: 'python3.9'
          }
        }
      }, null, 2)
    };
    
    // Railway configuration
    configs.railway = {
      file: 'railway.toml',
      content: this.generateRailwayConfig(configRequest)
    };
    
    // Render configuration
    configs.render = {
      file: 'render.yaml',
      content: this.generateRenderConfig(configRequest)
    };
    
    // GitHub Actions workflow
    configs.githubActions = {
      file: '.github/workflows/deploy.yml',
      content: this.generateGitHubActionsWorkflow(configRequest)
    };
    
    return configs;
  }

  /**
   * Generate CSP policy based on app features
   */
  generateCSPPolicy(configRequest) {
    let policy = "default-src 'self'; ";
    
    // Script sources
    policy += "script-src 'self' 'unsafe-inline'; ";
    
    // Style sources
    policy += "style-src 'self' 'unsafe-inline' fonts.googleapis.com; ";
    
    // Font sources
    policy += "font-src 'self' fonts.gstatic.com; ";
    
    // Image sources
    policy += "img-src 'self' data: https:; ";
    
    // Connect sources (API endpoints)
    if (configRequest.apiDomains) {
      policy += `connect-src 'self' ${configRequest.apiDomains.join(' ')}; `;
    } else {
      policy += "connect-src 'self'; ";
    }
    
    // Frame sources
    policy += "frame-src 'none'; ";
    
    // Object sources
    policy += "object-src 'none'; ";
    
    // Base URI
    policy += "base-uri 'self'; ";
    
    return policy.trim();
  }

  /**
   * Generate database environment variables
   */
  generateDatabaseEnvVars(configRequest, environment) {
    const dbType = configRequest.database || 'postgresql';
    const isProduction = environment === 'production';
    
    const vars = {
      DB_TYPE: dbType,
      DB_HOST: isProduction ? '${DATABASE_HOST}' : 'localhost',
      DB_PORT: this.getDefaultPort(dbType),
      DB_NAME: isProduction ? '${DATABASE_NAME}' : `${configRequest.appName.toLowerCase()}_${environment}`,
      DB_USER: isProduction ? '${DATABASE_USER}' : 'developer',
      DB_PASSWORD: isProduction ? '${DATABASE_PASSWORD}' : 'dev_password',
    };
    
    // Add database-specific settings
    if (dbType === 'postgresql') {
      vars.DB_SSL_MODE = isProduction ? 'require' : 'disable';
    }
    
    if (dbType === 'mysql') {
      vars.DB_CHARSET = 'utf8mb4';
      vars.DB_COLLATION = 'utf8mb4_unicode_ci';
    }
    
    return vars;
  }

  /**
   * Generate security environment variables
   */
  generateSecurityEnvVars(configRequest, environment) {
    const isProduction = environment === 'production';
    
    return {
      SECRET_KEY: isProduction ? '${SECRET_KEY}' : this.generateSecretKey(),
      JWT_SECRET: isProduction ? '${JWT_SECRET}' : this.generateSecretKey(),
      ENCRYPTION_KEY: isProduction ? '${ENCRYPTION_KEY}' : this.generateSecretKey(),
      SESSION_SECRET: isProduction ? '${SESSION_SECRET}' : this.generateSecretKey(),
      
      // Password hashing
      BCRYPT_ROUNDS: isProduction ? 12 : 10,
      
      // Rate limiting
      RATE_LIMIT_ENABLED: isProduction,
      RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
      RATE_LIMIT_MAX_REQUESTS: isProduction ? 100 : 1000,
      
      // Security headers
      SECURITY_HEADERS_ENABLED: isProduction,
      HTTPS_ONLY: isProduction,
    };
  }

  /**
   * Generate setup guide
   */
  generateSetupGuide(configRequest) {
    return {
      title: `Production Setup Guide for ${configRequest.appName}`,
      sections: [
        {
          title: 'Environment Setup',
          steps: [
            'Copy .env.production to .env',
            'Update all ${VARIABLE} placeholders with actual values',
            'Generate strong secrets for production keys',
            'Configure database connection strings'
          ]
        },
        {
          title: 'Database Setup',
          steps: [
            'Create production database',
            'Run migration scripts',
            'Set up database backups',
            'Configure connection pooling'
          ]
        },
        {
          title: 'Security Configuration',
          steps: [
            'Enable HTTPS in production',
            'Configure security headers',
            'Set up rate limiting',
            'Review and test CSP policy'
          ]
        },
        {
          title: 'Monitoring Setup',
          steps: [
            'Configure logging endpoints',
            'Set up health checks',
            'Enable metrics collection',
            'Configure alerting rules'
          ]
        }
      ]
    };
  }

  /**
   * Generate security checklist
   */
  generateSecurityChecklist(configRequest) {
    return {
      title: 'Production Security Checklist',
      items: [
        {
          category: 'Authentication',
          checks: [
            'Strong password requirements implemented',
            'JWT tokens have reasonable expiration times',
            'Refresh token rotation enabled',
            'Account lockout after failed attempts'
          ]
        },
        {
          category: 'Authorization',
          checks: [
            'Role-based access control implemented',
            'API endpoints properly protected',
            'Admin functions require elevated privileges',
            'User can only access their own data'
          ]
        },
        {
          category: 'Data Protection',
          checks: [
            'Database connections use SSL/TLS',
            'Sensitive data is encrypted at rest',
            'PII is properly anonymized in logs',
            'Backup data is encrypted'
          ]
        },
        {
          category: 'Network Security',
          checks: [
            'HTTPS enforced for all connections',
            'Security headers properly configured',
            'CORS policy restrictive enough',
            'Rate limiting prevents abuse'
          ]
        },
        {
          category: 'Infrastructure',
          checks: [
            'Dependencies regularly updated',
            'Secrets not committed to version control',
            'Environment variables properly configured',
            'Monitoring and logging enabled'
          ]
        }
      ]
    };
  }

  /**
   * Utility methods
   */
  generateSecretKey() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  getDefaultPort(dbType) {
    const ports = {
      'postgresql': 5432,
      'mysql': 3306,
      'mongodb': 27017,
      'redis': 6379,
      'sqlite': null
    };
    return ports[dbType];
  }

  formatEnvFile(config) {
    return Object.entries(config)
      .map(([key, value]) => {
        if (value === null || value === undefined) {
          return `# ${key}=`;
        }
        if (typeof value === 'string' && value.includes(' ')) {
          return `${key}="${value}"`;
        }
        return `${key}=${value}`;
      })
      .join('\n');
  }

  identifySensitiveVars(config) {
    const sensitivePatterns = [
      'password', 'secret', 'key', 'token', 'credential',
      'private', 'auth', 'api_key', 'access_key'
    ];
    
    return Object.keys(config).filter(key =>
      sensitivePatterns.some(pattern =>
        key.toLowerCase().includes(pattern)
      )
    );
  }

  validateConfigRequest(request) {
    const required = ['appName', 'template'];
    const missing = required.filter(field => !request[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }

  /**
   * Initialize configuration templates
   */
  initializeConfigTemplates() {
    return {
      default: {
        features: ['basic'],
        security: 'standard',
        monitoring: 'basic'
      },
      'dashboard-app': {
        features: ['auth', 'database', 'analytics'],
        security: 'enhanced',
        monitoring: 'advanced'
      },
      'saas-app': {
        features: ['auth', 'database', 'billing', 'analytics'],
        security: 'maximum',
        monitoring: 'advanced'
      }
    };
  }

  /**
   * Initialize security presets
   */
  initializeSecurityPresets() {
    return {
      basic: {
        headers: 'standard',
        rateLimit: 'lenient',
        encryption: 'basic'
      },
      standard: {
        headers: 'enhanced',
        rateLimit: 'moderate',
        encryption: 'strong'
      },
      maximum: {
        headers: 'strict',
        rateLimit: 'aggressive',
        encryption: 'maximum'
      }
    };
  }

  /**
   * Initialize environment profiles
   */
  initializeEnvironmentProfiles() {
    return {
      development: {
        debug: true,
        logging: 'verbose',
        caching: false
      },
      staging: {
        debug: false,
        logging: 'standard',
        caching: true
      },
      production: {
        debug: false,
        logging: 'minimal',
        caching: true,
        security: 'maximum'
      }
    };
  }
}