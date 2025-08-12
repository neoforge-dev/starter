/**
 * Project Integrator
 * 
 * Helps developers integrate NeoForge components into existing projects.
 * Addresses the critical question: "How do I add this to my existing app?"
 */

export class ProjectIntegrator {
  constructor() {
    this.supportedProjects = this.initializeSupportedProjects();
  }

  /**
   * Analyze existing project and provide integration plan
   */
  analyzeProject(projectConfig) {
    const projectType = projectConfig.type;
    const compatibility = this.checkCompatibility(projectType);
    
    if (compatibility === 'unsupported') {
      return {
        compatibility: 'unsupported',
        reason: `${projectType} is not currently supported`,
        alternatives: this.getAlternatives(projectType)
      };
    }

    const steps = this.generateIntegrationSteps(projectConfig);
    const codeExamples = this.generateCodeExamples(projectConfig);

    return {
      compatibility: 'supported',
      steps,
      codeExamples,
      additionalConfig: this.getAdditionalConfig(projectConfig),
      troubleshooting: this.getTroubleshootingGuide(projectType)
    };
  }

  /**
   * Check if project type is supported
   */
  checkCompatibility(projectType) {
    const supported = [
      'vite-react', 'vite-vue', 'vite-vanilla',
      'create-react-app', 'next.js', 'vanilla',
      'webpack', 'rollup', 'parcel'
    ];
    
    return supported.includes(projectType) ? 'supported' : 'unsupported';
  }

  /**
   * Generate step-by-step integration plan
   */
  generateIntegrationSteps(projectConfig) {
    const steps = [];

    // Step 1: Installation
    steps.push({
      type: 'install',
      description: 'Install NeoForge Web Components',
      command: 'npm install @neoforge/web-components',
      explanation: 'Add the NeoForge component library to your project'
    });

    // Step 2: Build tool configuration
    if (this.needsBuildConfig(projectConfig.type)) {
      steps.push({
        type: 'configure',
        description: 'Configure build tool for Web Components',
        files: this.getBuildConfigFiles(projectConfig),
        explanation: 'Ensure your build tool can handle Web Components properly'
      });
    }

    // Step 3: Component imports
    steps.push({
      type: 'import',
      description: 'Import and register components',
      code: this.getImportCode(projectConfig),
      explanation: 'Import the components you want to use in your application'
    });

    // Step 4: Framework-specific integration
    if (this.isFrameworkProject(projectConfig.type)) {
      steps.push({
        type: 'framework',
        description: `Configure ${this.getFrameworkName(projectConfig.type)} integration`,
        code: this.getFrameworkCode(projectConfig),
        explanation: 'Set up framework-specific configuration for Web Components'
      });
    }

    // Step 5: Usage examples
    steps.push({
      type: 'usage',
      description: 'Use components in your application',
      code: this.getUsageCode(projectConfig),
      explanation: 'Start using NeoForge components in your templates/JSX'
    });

    return steps;
  }

  /**
   * Generate code examples for integration
   */
  generateCodeExamples(projectConfig) {
    const examples = {};

    // Package.json modifications
    examples.packageJson = {
      dependencies: {
        "@neoforge/web-components": "^1.0.0"
      }
    };

    // Main entry file
    examples.mainEntry = this.getMainEntryCode(projectConfig);

    // Component usage
    examples.componentUsage = this.getComponentUsageCode(projectConfig);

    // Build configuration
    if (this.needsBuildConfig(projectConfig.type)) {
      examples.buildConfig = this.getBuildConfigCode(projectConfig);
    }

    return examples;
  }

  /**
   * Get main entry file code
   */
  getMainEntryCode(projectConfig) {
    switch (projectConfig.type) {
      case 'vite-react':
      case 'create-react-app':
        return `// src/main.jsx or src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import NeoForge components
import '@neoforge/web-components/button';
import '@neoforge/web-components/card';
import '@neoforge/web-components/table';

ReactDOM.createRoot(document.getElementById('root')).render(<App />);`;

      case 'next.js':
        return `// pages/_app.js
import '@neoforge/web-components/button';
import '@neoforge/web-components/card';
import '@neoforge/web-components/table';

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}`;

      case 'vite-vue':
        return `// src/main.js
import { createApp } from 'vue';
import App from './App.vue';

// Import NeoForge components
import '@neoforge/web-components/button';
import '@neoforge/web-components/card';
import '@neoforge/web-components/table';

createApp(App).mount('#app');`;

      case 'vanilla':
      case 'vite-vanilla':
        return `// src/main.js
// Import NeoForge components
import '@neoforge/web-components/button';
import '@neoforge/web-components/card';
import '@neoforge/web-components/table';

// Your app code
document.addEventListener('DOMContentLoaded', () => {
  console.log('NeoForge components loaded');
});`;

      default:
        return '// Add component imports to your main entry file';
    }
  }

  /**
   * Get component usage code examples
   */
  getComponentUsageCode(projectConfig) {
    switch (projectConfig.type) {
      case 'vite-react':
      case 'create-react-app':
      case 'next.js':
        return `// React component example
function MyComponent() {
  return (
    <div>
      <neo-button variant="primary" onClick={handleClick}>
        Click me
      </neo-button>
      
      <neo-card style={{padding: '1rem', margin: '1rem 0'}}>
        <h3>Card Title</h3>
        <p>Card content goes here</p>
      </neo-card>
      
      <neo-table 
        data={JSON.stringify(tableData)}
        columns={JSON.stringify(columns)}
      />
    </div>
  );
}`;

      case 'vite-vue':
        return `<!-- Vue component example -->
<template>
  <div>
    <neo-button 
      variant="primary" 
      @click="handleClick"
    >
      Click me
    </neo-button>
    
    <neo-card style="padding: 1rem; margin: 1rem 0;">
      <h3>Card Title</h3>
      <p>Card content goes here</p>
    </neo-card>
    
    <neo-table 
      :data="JSON.stringify(tableData)"
      :columns="JSON.stringify(columns)"
    />
  </div>
</template>`;

      case 'vanilla':
      case 'vite-vanilla':
        return `// Vanilla JavaScript usage
document.getElementById('app').innerHTML = \`
  <neo-button variant="primary">Click me</neo-button>
  
  <neo-card style="padding: 1rem; margin: 1rem 0;">
    <h3>Card Title</h3>
    <p>Card content goes here</p>
  </neo-card>
  
  <neo-table 
    data='[{"name":"John","email":"john@example.com"}]'
    columns='[{"key":"name","label":"Name"},{"key":"email","label":"Email"}]'
  ></neo-table>
\`;

// Add event listeners
document.querySelector('neo-button').addEventListener('click', () => {
  console.log('Button clicked!');
});`;

      default:
        return '// Framework-specific usage examples';
    }
  }

  /**
   * Get build configuration code
   */
  getBuildConfigCode(projectConfig) {
    switch (projectConfig.type) {
      case 'vite-react':
      case 'vite-vue':
      case 'vite-vanilla':
        return `// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  // Ensure Web Components work properly
  define: {
    'process.env': {}
  },
  optimizeDeps: {
    include: ['@neoforge/web-components']
  }
});`;

      case 'webpack':
        return `// webpack.config.js
module.exports = {
  // Existing config...
  
  resolve: {
    alias: {
      '@neoforge': '@neoforge/web-components'
    }
  },
  
  module: {
    rules: [
      // Existing rules...
      {
        test: /\.js$/,
        include: /node_modules\/@neoforge/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};`;

      case 'next.js':
        return `// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: 'loose'
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.js$/,
      include: /node_modules\/@neoforge/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env']
        }
      }
    });
    return config;
  }
};

module.exports = nextConfig;`;

      default:
        return '// No additional build configuration needed';
    }
  }

  /**
   * Get framework integration code
   */
  getFrameworkCode(projectConfig) {
    switch (projectConfig.type) {
      case 'vite-react':
      case 'create-react-app':
      case 'next.js':
        return `// React integration helpers
import { useEffect, useRef } from 'react';

// Custom hook for Web Component integration
export function useWebComponent(elementRef, props) {
  useEffect(() => {
    if (elementRef.current) {
      Object.entries(props).forEach(([key, value]) => {
        elementRef.current[key] = value;
      });
    }
  }, [props]);
}

// Example usage in component
function MyComponent() {
  const tableRef = useRef(null);
  
  useWebComponent(tableRef, {
    data: tableData,
    columns: columns
  });
  
  return <neo-table ref={tableRef} />;
}`;

      case 'vite-vue':
        return `// Vue integration (vue.config.js or main.js)
import { createApp } from 'vue';

const app = createApp({});

// Configure Vue to ignore custom elements
app.config.compilerOptions.isCustomElement = (tag) => {
  return tag.startsWith('neo-');
};`;

      default:
        return '// No framework-specific integration needed';
    }
  }

  /**
   * Helper methods
   */
  needsBuildConfig(projectType) {
    return ['vite-react', 'vite-vue', 'vite-vanilla', 'webpack', 'next.js'].includes(projectType);
  }

  isFrameworkProject(projectType) {
    return ['vite-react', 'create-react-app', 'next.js', 'vite-vue'].includes(projectType);
  }

  getFrameworkName(projectType) {
    const frameworks = {
      'vite-react': 'React',
      'create-react-app': 'React',
      'next.js': 'Next.js',
      'vite-vue': 'Vue'
    };
    return frameworks[projectType] || 'Framework';
  }

  getImportCode(projectConfig) {
    return `// Import the components you need
import '@neoforge/web-components/button';
import '@neoforge/web-components/card';
import '@neoforge/web-components/table';`;
  }

  getUsageCode(projectConfig) {
    return this.getComponentUsageCode(projectConfig);
  }

  getBuildConfigFiles(projectConfig) {
    const configs = {
      'vite-react': ['vite.config.js'],
      'vite-vue': ['vite.config.js'],
      'vite-vanilla': ['vite.config.js'],
      'webpack': ['webpack.config.js'],
      'next.js': ['next.config.js']
    };
    return configs[projectConfig.type] || [];
  }

  getAdditionalConfig(projectConfig) {
    return {
      typescript: {
        types: '@neoforge/web-components/types',
        description: 'Add TypeScript definitions for better development experience'
      },
      eslint: {
        rules: {
          'react/no-unknown-property': 'off' // For React projects
        },
        description: 'ESLint configuration for Web Components'
      }
    };
  }

  getTroubleshootingGuide(projectType) {
    return [
      {
        issue: 'Components not rendering',
        solution: 'Ensure you have imported the component modules in your entry file'
      },
      {
        issue: 'TypeScript errors',
        solution: 'Add component type definitions to your tsconfig.json'
      },
      {
        issue: 'React warnings about unknown props',
        solution: 'Configure ESLint to ignore unknown properties for custom elements'
      },
      {
        issue: 'Build errors',
        solution: 'Check that your build tool is configured to handle Web Components'
      }
    ];
  }

  getAlternatives(projectType) {
    return [
      'Use vanilla JavaScript implementation',
      'Copy component source code directly',
      'Use CDN imports instead of npm package'
    ];
  }

  initializeSupportedProjects() {
    return {
      'vite-react': { complexity: 'easy', setup: 'minimal' },
      'vite-vue': { complexity: 'easy', setup: 'minimal' },
      'vite-vanilla': { complexity: 'very-easy', setup: 'none' },
      'create-react-app': { complexity: 'medium', setup: 'moderate' },
      'next.js': { complexity: 'medium', setup: 'moderate' },
      'vanilla': { complexity: 'very-easy', setup: 'none' },
      'webpack': { complexity: 'hard', setup: 'complex' },
      'rollup': { complexity: 'medium', setup: 'moderate' },
      'parcel': { complexity: 'easy', setup: 'minimal' }
    };
  }
}