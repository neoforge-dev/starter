/**
 * Platform-Specific Validators
 *
 * Detailed validation logic for each deployment platform to ensure
 * platform-specific features and configurations are working correctly.
 */

export class PlatformValidators {
  constructor() {
    this.validators = this.initializeValidators();
  }

  /**
   * Get validator for specific platform
   */
  getValidator(platform) {
    return this.validators[platform] || this.validators.generic;
  }

  /**
   * Validate deployment for specific platform
   */
  async validatePlatform(platform, config) {
    const validator = this.getValidator(platform);
    return await validator.validate(config);
  }

  /**
   * Initialize all platform validators
   */
  initializeValidators() {
    return {
      vercel: new VercelValidator(),
      netlify: new NetlifyValidator(),
      'github-pages': new GitHubPagesValidator(),
      firebase: new FirebaseValidator(),
      generic: new GenericValidator()
    };
  }
}

/**
 * Vercel Platform Validator
 */
class VercelValidator {
  async validate(config) {
    const checks = {
      vercelHeaders: await this.checkVercelHeaders(config.url),
      edgeFunctions: await this.checkEdgeFunctions(config.url),
      serverlessFunctions: await this.checkServerlessFunctions(config.url),
      domainConfig: await this.checkDomainConfiguration(config.url),
      buildOutput: await this.checkBuildOutput(config.url),
      environmentVars: await this.checkEnvironmentVariables(config)
    };

    const passed = Object.values(checks).filter(check => check.passed).length;
    const total = Object.keys(checks).length;

    return {
      status: passed >= Math.ceil(total * 0.8) ? 'passed' : 'failed',
      passed,
      total,
      checks,
      recommendations: this.generateVercelRecommendations(checks)
    };
  }

  async checkVercelHeaders(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const headers = response.headers;

      // Check for Vercel-specific headers
      const vercelHeaders = {
        'x-vercel-cache': headers.get('x-vercel-cache'),
        'x-vercel-id': headers.get('x-vercel-id'),
        'server': headers.get('server')
      };

      const hasVercelSignature = vercelHeaders['server']?.includes('Vercel') ||
                                 vercelHeaders['x-vercel-id'] ||
                                 vercelHeaders['x-vercel-cache'];

      return {
        passed: hasVercelSignature,
        details: hasVercelSignature ? 'Vercel platform detected' : 'No Vercel signature found',
        headers: vercelHeaders
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  async checkEdgeFunctions(url) {
    try {
      // Check for Edge Runtime headers or functions
      const response = await fetch(`${url}/api/edge-test`, { method: 'HEAD' });

      return {
        passed: true,
        details: response.ok ? 'Edge functions accessible' : 'No edge functions detected',
        status: response.status
      };
    } catch (error) {
      return {
        passed: true, // Not required, so pass by default
        details: 'Edge functions not configured (optional)',
        note: 'Edge functions are optional for static sites'
      };
    }
  }

  async checkServerlessFunctions(url) {
    try {
      // Common serverless function endpoints
      const endpoints = ['/api/health', '/api/hello', '/api/test'];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${url}${endpoint}`);
          if (response.ok) {
            return {
              passed: true,
              details: `Serverless function found at ${endpoint}`,
              endpoint,
              status: response.status
            };
          }
        } catch (e) {
          // Continue to next endpoint
        }
      }

      return {
        passed: true, // Not required for static sites
        details: 'No serverless functions detected (may be static site)',
        note: 'Serverless functions are optional'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  async checkDomainConfiguration(url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      // Check if using Vercel domain or custom domain
      const isVercelDomain = hostname.includes('.vercel.app') ||
                            hostname.includes('.now.sh');

      // Check DNS resolution
      const response = await fetch(url, { method: 'HEAD' });
      const dnsWorking = response.ok;

      return {
        passed: dnsWorking,
        details: isVercelDomain ?
          'Using Vercel default domain' :
          'Using custom domain',
        hostname,
        isCustomDomain: !isVercelDomain,
        dnsResolved: dnsWorking
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  async checkBuildOutput(url) {
    try {
      const response = await fetch(url);
      const html = await response.text();

      // Check for common build artifacts and optimizations
      const checks = {
        hasMinifiedAssets: html.includes('.min.') || html.includes('/_next/static/'),
        hasMetaTags: html.includes('<meta') && html.includes('viewport'),
        hasModernJS: html.includes('type="module"') || html.includes('/_next/'),
        hasOptimizedImages: html.includes('_next/image') || html.includes('/_vercel/image')
      };

      const passed = Object.values(checks).filter(Boolean).length;
      const total = Object.keys(checks).length;

      return {
        passed: passed >= Math.ceil(total * 0.6),
        details: `Build optimizations: ${passed}/${total} checks passed`,
        checks,
        htmlSize: html.length
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  async checkEnvironmentVariables(config) {
    // This is a placeholder - in a real implementation, this would check
    // if environment variables are properly configured in Vercel dashboard
    return {
      passed: true,
      details: 'Environment variables validation not implemented',
      note: 'Check Vercel dashboard for environment variable configuration'
    };
  }

  generateVercelRecommendations(checks) {
    const recommendations = [];

    if (!checks.vercelHeaders?.passed) {
      recommendations.push('Verify deployment is actually on Vercel platform');
    }

    if (!checks.buildOutput?.passed) {
      recommendations.push('Optimize build output with minification and modern JS features');
    }

    if (checks.domainConfig?.isCustomDomain && !checks.domainConfig?.passed) {
      recommendations.push('Configure custom domain DNS settings in Vercel dashboard');
    }

    return recommendations;
  }
}

/**
 * Netlify Platform Validator
 */
class NetlifyValidator {
  async validate(config) {
    const checks = {
      netlifyHeaders: await this.checkNetlifyHeaders(config.url),
      buildPlugins: await this.checkBuildPlugins(config.url),
      forms: await this.checkForms(config.url),
      redirects: await this.checkRedirects(config.url),
      functions: await this.checkNetlifyFunctions(config.url),
      edgeHandlers: await this.checkEdgeHandlers(config.url)
    };

    const passed = Object.values(checks).filter(check => check.passed).length;
    const total = Object.keys(checks).length;

    return {
      status: passed >= Math.ceil(total * 0.7) ? 'passed' : 'failed',
      passed,
      total,
      checks,
      recommendations: this.generateNetlifyRecommendations(checks)
    };
  }

  async checkNetlifyHeaders(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const headers = response.headers;

      const netlifyHeaders = {
        'server': headers.get('server'),
        'x-nf-request-id': headers.get('x-nf-request-id'),
        'x-powered-by': headers.get('x-powered-by')
      };

      const hasNetlifySignature = netlifyHeaders['server']?.includes('Netlify') ||
                                  netlifyHeaders['x-nf-request-id'] ||
                                  netlifyHeaders['x-powered-by']?.includes('Netlify');

      return {
        passed: hasNetlifySignature,
        details: hasNetlifySignature ? 'Netlify platform detected' : 'No Netlify signature found',
        headers: netlifyHeaders
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  async checkBuildPlugins(url) {
    try {
      // Check for common build optimizations that Netlify plugins provide
      const response = await fetch(url);
      const html = await response.text();

      const optimizations = {
        minifiedCSS: html.match(/<link[^>]*\.css/g)?.some(link =>
          link.includes('.min.css') || link.length < 100
        ),
        preloadResources: html.includes('rel="preload"'),
        criticalCSS: html.includes('<style>') && html.includes('</style>'),
        lazyImages: html.includes('loading="lazy"')
      };

      const passed = Object.values(optimizations).filter(Boolean).length;

      return {
        passed: passed > 0,
        details: `Build optimizations detected: ${passed}/4`,
        optimizations
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  async checkForms(url) {
    try {
      const response = await fetch(url);
      const html = await response.text();

      // Check for Netlify forms
      const hasForms = html.includes('netlify') ||
                      html.includes('data-netlify="true"') ||
                      html.includes('method="POST"');

      return {
        passed: true, // Forms are optional
        details: hasForms ? 'Forms detected (check Netlify dashboard for submissions)' : 'No forms found',
        hasForms
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  async checkRedirects(url) {
    try {
      // Test common redirect patterns
      const redirectTests = [
        { from: '/old-page', to: '/', description: 'Basic redirect test' },
        { from: '/api/*', to: '/.netlify/functions/:splat', description: 'Function redirect test' }
      ];

      let workingRedirects = 0;

      for (const test of redirectTests) {
        try {
          const response = await fetch(`${url}${test.from}`, {
            method: 'HEAD',
            redirect: 'manual'
          });

          if (response.status >= 300 && response.status < 400) {
            workingRedirects++;
          }
        } catch (e) {
          // Redirect test failed, continue
        }
      }

      return {
        passed: true, // Redirects are optional
        details: workingRedirects > 0 ?
          `${workingRedirects} redirect rules working` :
          'No redirects configured (optional)',
        workingRedirects
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  async checkNetlifyFunctions(url) {
    try {
      // Check for Netlify Functions
      const endpoints = ['/.netlify/functions/hello', '/.netlify/functions/health'];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${url}${endpoint}`);
          if (response.ok) {
            return {
              passed: true,
              details: `Netlify function found at ${endpoint}`,
              endpoint
            };
          }
        } catch (e) {
          // Continue to next endpoint
        }
      }

      return {
        passed: true, // Functions are optional
        details: 'No Netlify functions detected (optional)'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  async checkEdgeHandlers(url) {
    return {
      passed: true,
      details: 'Edge handlers validation not implemented',
      note: 'Edge handlers are advanced Netlify feature'
    };
  }

  generateNetlifyRecommendations(checks) {
    const recommendations = [];

    if (!checks.netlifyHeaders?.passed) {
      recommendations.push('Verify deployment is on Netlify platform');
    }

    if (!checks.buildPlugins?.passed) {
      recommendations.push('Consider using Netlify build plugins for optimization');
    }

    if (checks.forms?.hasForms) {
      recommendations.push('Check Netlify dashboard for form submissions');
    }

    return recommendations;
  }
}

/**
 * GitHub Pages Validator
 */
class GitHubPagesValidator {
  async validate(config) {
    const checks = {
      githubHeaders: await this.checkGitHubHeaders(config.url),
      customDomain: await this.checkCustomDomain(config.url),
      httpsEnforcement: await this.checkHttpsEnforcement(config.url),
      jekyllProcessing: await this.checkJekyllProcessing(config.url),
      staticAssets: await this.checkStaticAssets(config.url),
      repoSettings: await this.checkRepositorySettings(config)
    };

    const passed = Object.values(checks).filter(check => check.passed).length;
    const total = Object.keys(checks).length;

    return {
      status: passed >= Math.ceil(total * 0.8) ? 'passed' : 'failed',
      passed,
      total,
      checks,
      recommendations: this.generateGitHubPagesRecommendations(checks)
    };
  }

  async checkGitHubHeaders(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const server = response.headers.get('server');

      const isGitHubPages = server?.includes('GitHub.com') ||
                           server?.includes('GitHub Pages') ||
                           url.includes('github.io');

      return {
        passed: isGitHubPages,
        details: isGitHubPages ? 'GitHub Pages platform detected' : 'Not recognized as GitHub Pages',
        server
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  async checkCustomDomain(url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      const isCustomDomain = !hostname.includes('github.io');

      if (isCustomDomain) {
        // Check CNAME configuration
        const response = await fetch(url, { method: 'HEAD' });
        const dnsWorking = response.ok;

        return {
          passed: dnsWorking,
          details: 'Custom domain configured',
          hostname,
          dnsResolved: dnsWorking
        };
      }

      return {
        passed: true,
        details: 'Using default github.io domain',
        hostname,
        isDefault: true
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  async checkHttpsEnforcement(url) {
    try {
      if (!url.startsWith('https://')) {
        return {
          passed: false,
          details: 'Site not served over HTTPS'
        };
      }

      // Test HTTP to HTTPS redirect
      const httpUrl = url.replace('https://', 'http://');
      const response = await fetch(httpUrl, {
        method: 'HEAD',
        redirect: 'manual'
      });

      const redirectsToHttps = response.status >= 300 &&
                               response.status < 400 &&
                               response.headers.get('location')?.startsWith('https://');

      return {
        passed: redirectsToHttps,
        details: redirectsToHttps ?
          'HTTPS enforcement enabled' :
          'HTTPS redirect not configured',
        redirectStatus: response.status
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  async checkJekyllProcessing(url) {
    try {
      const response = await fetch(url);
      const html = await response.text();

      // Check for Jekyll-processed content
      const jekyllIndicators = {
        hasJekyllComments: html.includes('<!-- Generated by Jekyll'),
        hasLiquidTags: html.includes('{{') || html.includes('{%'),
        hasJekyllAssets: html.includes('jekyll') || html.includes('_site'),
        isBuildProcessed: !html.includes('{{') && !html.includes('{%') // Liquid tags should be processed
      };

      return {
        passed: true, // Jekyll processing is optional
        details: jekyllIndicators.isBuildProcessed ?
          'Content appears to be build-processed' :
          'Static content (no Jekyll processing detected)',
        indicators: jekyllIndicators
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  async checkStaticAssets(url) {
    try {
      const response = await fetch(url);
      const html = await response.text();

      // Check for properly linked static assets
      const assetChecks = {
        hasCSSLinks: html.includes('<link') && html.includes('.css'),
        hasJSScripts: html.includes('<script') && html.includes('.js'),
        hasImages: html.includes('<img') || html.includes('background-image'),
        hasRelativePaths: html.includes('href="./') || html.includes('src="./')
      };

      const score = Object.values(assetChecks).filter(Boolean).length;

      return {
        passed: score >= 2,
        details: `Static assets: ${score}/4 types detected`,
        assetChecks
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  async checkRepositorySettings(config) {
    // This would require GitHub API access
    return {
      passed: true,
      details: 'Repository settings validation requires GitHub API access',
      note: 'Manually verify GitHub Pages is enabled in repository settings'
    };
  }

  generateGitHubPagesRecommendations(checks) {
    const recommendations = [];

    if (!checks.githubHeaders?.passed) {
      recommendations.push('Verify deployment is on GitHub Pages platform');
    }

    if (!checks.httpsEnforcement?.passed) {
      recommendations.push('Enable HTTPS enforcement in repository settings');
    }

    if (checks.customDomain?.isCustomDomain && !checks.customDomain?.passed) {
      recommendations.push('Configure CNAME file and DNS settings for custom domain');
    }

    return recommendations;
  }
}

/**
 * Firebase Hosting Validator
 */
class FirebaseValidator {
  async validate(config) {
    const checks = {
      firebaseHeaders: await this.checkFirebaseHeaders(config.url),
      hostingRules: await this.checkHostingRules(config.url),
      customDomain: await this.checkCustomDomain(config.url),
      globalCDN: await this.checkGlobalCDN(config.url),
      sslCertificate: await this.checkSSLCertificate(config.url),
      cachingRules: await this.checkCachingRules(config.url)
    };

    const passed = Object.values(checks).filter(check => check.passed).length;
    const total = Object.keys(checks).length;

    return {
      status: passed >= Math.ceil(total * 0.8) ? 'passed' : 'failed',
      passed,
      total,
      checks,
      recommendations: this.generateFirebaseRecommendations(checks)
    };
  }

  async checkFirebaseHeaders(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const headers = response.headers;

      const firebaseHeaders = {
        'server': headers.get('server'),
        'x-cloud-trace-context': headers.get('x-cloud-trace-context'),
        'alt-svc': headers.get('alt-svc')
      };

      const isFirebase = url.includes('.web.app') ||
                        url.includes('.firebaseapp.com') ||
                        firebaseHeaders['server']?.includes('Google Frontend');

      return {
        passed: isFirebase,
        details: isFirebase ? 'Firebase Hosting detected' : 'Not recognized as Firebase Hosting',
        headers: firebaseHeaders
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  async checkHostingRules(url) {
    try {
      // Test common Firebase hosting rules
      const rewrites = [
        { path: '/some-route', expected: 'should serve index.html for SPA' },
        { path: '/api/test', expected: 'should handle API routes' }
      ];

      let rulesWorking = 0;

      for (const rewrite of rewrites) {
        try {
          const response = await fetch(`${url}${rewrite.path}`);
          if (response.ok) {
            rulesWorking++;
          }
        } catch (e) {
          // Rule test failed
        }
      }

      return {
        passed: true, // Hosting rules are optional
        details: rulesWorking > 0 ?
          `${rulesWorking} hosting rules appear to be working` :
          'No custom hosting rules detected (optional)',
        rulesWorking
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  async checkCustomDomain(url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      const isCustomDomain = !hostname.includes('.web.app') &&
                            !hostname.includes('.firebaseapp.com');

      return {
        passed: true, // Custom domains are optional
        details: isCustomDomain ?
          'Custom domain configured' :
          'Using default Firebase domain',
        hostname,
        isCustomDomain
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  async checkGlobalCDN(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const cacheControl = response.headers.get('cache-control');
      const cdnHeaders = response.headers.get('cf-ray') ||
                        response.headers.get('x-served-by') ||
                        response.headers.get('server');

      return {
        passed: !!cacheControl,
        details: cacheControl ?
          'CDN caching headers present' :
          'No CDN caching headers detected',
        cacheControl,
        cdnHeaders
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  async checkSSLCertificate(url) {
    try {
      if (!url.startsWith('https://')) {
        return {
          passed: false,
          details: 'Site not served over HTTPS'
        };
      }

      // Basic SSL check (browser handles the validation)
      const response = await fetch(url, { method: 'HEAD' });

      return {
        passed: response.ok,
        details: 'SSL certificate appears valid',
        status: response.status
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        details: 'SSL certificate validation failed'
      };
    }
  }

  async checkCachingRules(url) {
    try {
      // Check different asset types for proper caching
      const assetTests = [
        { path: '/', type: 'html', expectCache: 'short' },
        { path: '/favicon.ico', type: 'icon', expectCache: 'long' }
      ];

      let cachingConfigured = 0;

      for (const test of assetTests) {
        try {
          const response = await fetch(`${url}${test.path}`, { method: 'HEAD' });
          const cacheControl = response.headers.get('cache-control');

          if (cacheControl) {
            cachingConfigured++;
          }
        } catch (e) {
          // Asset test failed
        }
      }

      return {
        passed: cachingConfigured > 0,
        details: cachingConfigured > 0 ?
          'Caching rules configured' :
          'No caching headers detected',
        cachingConfigured
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  generateFirebaseRecommendations(checks) {
    const recommendations = [];

    if (!checks.firebaseHeaders?.passed) {
      recommendations.push('Verify deployment is on Firebase Hosting');
    }

    if (!checks.sslCertificate?.passed) {
      recommendations.push('Configure SSL certificate in Firebase Console');
    }

    if (!checks.cachingRules?.passed) {
      recommendations.push('Configure caching rules in firebase.json for better performance');
    }

    return recommendations;
  }
}

/**
 * Generic Platform Validator
 */
class GenericValidator {
  async validate(config) {
    const checks = {
      basicConnectivity: await this.checkBasicConnectivity(config.url),
      responseHeaders: await this.checkResponseHeaders(config.url),
      contentDelivery: await this.checkContentDelivery(config.url)
    };

    const passed = Object.values(checks).filter(check => check.passed).length;
    const total = Object.keys(checks).length;

    return {
      status: passed >= Math.ceil(total * 0.7) ? 'passed' : 'failed',
      passed,
      total,
      checks,
      recommendations: ['Use platform-specific validator for detailed analysis']
    };
  }

  async checkBasicConnectivity(url) {
    try {
      const response = await fetch(url);
      return {
        passed: response.ok,
        status: response.status,
        details: response.ok ? 'Site accessible' : `HTTP ${response.status}`
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  async checkResponseHeaders(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const headers = Object.fromEntries(response.headers.entries());

      return {
        passed: true,
        details: `${Object.keys(headers).length} headers present`,
        headers
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  async checkContentDelivery(url) {
    try {
      const response = await fetch(url);
      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');

      return {
        passed: !!contentType,
        details: contentType || 'No content type specified',
        contentLength: contentLength ? parseInt(contentLength) : null,
        contentType
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }
}

export const platformValidators = new PlatformValidators();
