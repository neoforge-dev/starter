#!/usr/bin/env node

/**
 * Component Library Builder
 * 
 * This script builds a publishable npm package from the NeoForge Web Components.
 * It creates optimized bundles, generates documentation, and prepares distribution.
 * 
 * Features:
 * - Automated component discovery and bundling
 * - Documentation generation from JSDoc comments
 * - TypeScript declaration files
 * - Optimized builds for different environments
 * - Semantic versioning integration
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { build } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');
const componentsDir = path.join(srcDir, 'components');
const distDir = path.join(projectRoot, 'dist');
const libDir = path.join(distDir, 'lib');

class ComponentLibraryBuilder {
  constructor() {
    this.components = new Map();
    this.metadata = {
      buildTime: new Date().toISOString(),
      version: null,
      components: {},
      bundles: {},
      documentation: {}
    };
  }

  async build() {
    console.log('🚀 Building NeoForge Component Library...');
    
    try {
      // Clean and prepare directories
      await this.cleanAndPrepare();
      
      // Discover components
      await this.discoverComponents();
      
      // Generate version
      this.metadata.version = this.generateVersion();
      
      // Build component bundles
      await this.buildComponentBundles();
      
      // Generate package.json
      await this.generatePackageJson();
      
      // Generate exports and barrel files
      await this.generateExports();
      
      // Generate documentation
      await this.generateDocumentation();
      
      // Generate TypeScript declarations
      await this.generateTypeDeclarations();
      
      // Create distribution packages
      await this.createDistributionPackages();
      
      // Generate metadata file
      await this.generateMetadata();
      
      console.log(`✅ Component library built successfully!`);
      console.log(`📦 Version: ${this.metadata.version}`);
      console.log(`📁 Output: ${libDir}`);
      console.log(`🧩 Components: ${this.components.size}`);
      
      return this.metadata;
      
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      throw error;
    }
  }

  async cleanAndPrepare() {
    // Clean dist directory
    await fs.rm(distDir, { recursive: true, force: true });
    await fs.mkdir(libDir, { recursive: true });
    
    // Create necessary subdirectories
    const subdirs = ['bundles', 'docs', 'types', 'examples'];
    for (const subdir of subdirs) {
      await fs.mkdir(path.join(libDir, subdir), { recursive: true });
    }
    
    console.log('🧹 Cleaned and prepared build directories');
  }

  async discoverComponents() {
    console.log('🔍 Discovering components...');
    
    const categories = ['atoms', 'molecules', 'organisms', 'pages'];
    
    for (const category of categories) {
      const categoryDir = path.join(componentsDir, category);
      
      try {
        const files = await fs.readdir(categoryDir);
        
        for (const file of files) {
          if (file.endsWith('.js') && !file.endsWith('.test.js') && !file.endsWith('.stories.js')) {
            const componentPath = path.join(categoryDir, file);
            const componentName = path.basename(file, '.js');
            
            // Read component source to extract metadata
            const source = await fs.readFile(componentPath, 'utf-8');
            const metadata = this.extractComponentMetadata(source, componentName, category);
            
            this.components.set(componentName, {
              name: componentName,
              category,
              path: componentPath,
              relativePath: path.relative(srcDir, componentPath),
              ...metadata
            });
          }
        }
      } catch (error) {
        console.warn(`⚠️ Could not read category directory: ${category}`);
      }
    }
    
    console.log(`📦 Discovered ${this.components.size} components`);
  }

  extractComponentMetadata(source, componentName, category) {
    const metadata = {
      description: '',
      properties: [],
      methods: [],
      events: [],
      dependencies: [],
      exports: []
    };
    
    // Extract JSDoc description
    const descMatch = source.match(/\/\*\*\s*\n\s*\*\s*([^@\n]+)/);
    if (descMatch) {
      metadata.description = descMatch[1].trim();
    }
    
    // Extract custom element registration
    const customElementMatch = source.match(/@customElement\(['"`]([^'"`]+)['"`]\)/);
    if (customElementMatch) {
      metadata.tagName = customElementMatch[1];
    }
    
    // Extract properties
    const propertyMatches = source.matchAll(/@property\s*\(\s*\{([^}]+)\}\s*\)\s*([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
    for (const match of propertyMatches) {
      const options = match[1];
      const propName = match[2];
      
      const typeMatch = options.match(/type:\s*([^,\s}]+)/);
      const attributeMatch = options.match(/attribute:\s*['"`]([^'"`]+)['"`]/);
      
      metadata.properties.push({
        name: propName,
        type: typeMatch ? typeMatch[1] : 'any',
        attribute: attributeMatch ? attributeMatch[1] : propName.toLowerCase()
      });
    }
    
    // Extract events
    const eventMatches = source.matchAll(/this\.dispatchEvent\(new\s+CustomEvent\(['"`]([^'"`]+)['"`]/g);
    for (const match of eventMatches) {
      if (!metadata.events.includes(match[1])) {
        metadata.events.push(match[1]);
      }
    }
    
    // Extract exports
    const exportMatches = source.matchAll(/export\s+(?:class|function|const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
    for (const match of exportMatches) {
      metadata.exports.push(match[1]);
    }
    
    return metadata;
  }

  async buildComponentBundles() {
    console.log('📦 Building component bundles...');
    
    // Build individual component bundles
    const individualBuilds = Array.from(this.components.entries()).map(async ([name, component]) => {
      const bundlePath = path.join(libDir, 'bundles', `${name}.js`);
      
      await build({
        root: projectRoot,
        build: {
          lib: {
            entry: component.path,
            name: component.exports[0] || name,
            fileName: () => `${name}.js`,
            formats: ['es']
          },
          outDir: path.join(libDir, 'bundles'),
          rollupOptions: {
            external: ['lit', 'lit/decorators.js', 'lit/directives/class-map.js'],
            output: {
              globals: {
                'lit': 'Lit'
              }
            }
          },
          minify: 'terser',
          target: 'es2020'
        },
        define: {
          'process.env.NODE_ENV': '"production"'
        }
      });
      
      // Record bundle info
      const stats = await fs.stat(bundlePath);
      this.metadata.bundles[name] = {
        path: `bundles/${name}.js`,
        size: stats.size,
        gzippedSize: await this.getGzippedSize(bundlePath)
      };
    });
    
    await Promise.all(individualBuilds);
    
    // Build category bundles
    const categories = ['atoms', 'molecules', 'organisms', 'pages'];
    
    for (const category of categories) {
      const categoryComponents = Array.from(this.components.values())
        .filter(comp => comp.category === category);
      
      if (categoryComponents.length === 0) continue;
      
      // Create category entry point
      const categoryEntry = path.join(libDir, `${category}.js`);
      const exports = categoryComponents.map(comp => 
        `export * from './bundles/${comp.name}.js';`
      ).join('\n');
      
      await fs.writeFile(categoryEntry, exports);
      
      // Build category bundle
      await build({
        root: projectRoot,
        build: {
          lib: {
            entry: categoryEntry,
            name: category,
            fileName: () => `${category}.js`,
            formats: ['es']
          },
          outDir: path.join(libDir, 'bundles'),
          rollupOptions: {
            external: ['lit', 'lit/decorators.js'],
          },
          minify: 'terser',
          target: 'es2020'
        }
      });
      
      // Record category bundle info
      const bundlePath = path.join(libDir, 'bundles', `${category}.js`);
      const stats = await fs.stat(bundlePath);
      this.metadata.bundles[category] = {
        path: `bundles/${category}.js`,
        size: stats.size,
        gzippedSize: await this.getGzippedSize(bundlePath),
        components: categoryComponents.map(c => c.name)
      };
    }
    
    console.log(`📦 Built ${Object.keys(this.metadata.bundles).length} bundles`);
  }

  async generatePackageJson() {
    const packageJson = {
      name: '@neoforge/web-components',
      version: this.metadata.version,
      description: 'Production-ready Web Components built with Lit - NeoForge Component Library',
      type: 'module',
      main: 'index.js',
      module: 'index.js',
      types: 'types/index.d.ts',
      exports: {
        '.': {
          import: './index.js',
          types: './types/index.d.ts'
        },
        './atoms': {
          import: './bundles/atoms.js',
          types: './types/atoms.d.ts'
        },
        './molecules': {
          import: './bundles/molecules.js',
          types: './types/molecules.d.ts'
        },
        './organisms': {
          import: './bundles/organisms.js',
          types: './types/organisms.d.ts'
        },
        './pages': {
          import: './bundles/pages.js',
          types: './types/pages.d.ts'
        }
      },
      files: [
        'bundles',
        'types',
        'docs',
        'index.js',
        'README.md',
        'CHANGELOG.md'
      ],
      keywords: [
        'web-components',
        'lit',
        'neoforge',
        'ui-components',
        'design-system',
        'frontend',
        'typescript',
        'javascript'
      ],
      author: 'NeoForge Team',
      license: 'MIT',
      repository: {
        type: 'git',
        url: 'https://github.com/neoforge/neoforge-starter.git',
        directory: 'frontend'
      },
      homepage: 'https://neoforge.github.io/playground',
      bugs: {
        url: 'https://github.com/neoforge/neoforge-starter/issues'
      },
      peerDependencies: {
        'lit': '^3.0.0'
      },
      devDependencies: {
        '@types/node': '^20.0.0'
      },
      engines: {
        node: '>=18.0.0'
      },
      publishConfig: {
        access: 'public',
        registry: 'https://registry.npmjs.org'
      },
      custom: {
        buildInfo: {
          timestamp: this.metadata.buildTime,
          components: this.components.size,
          categories: ['atoms', 'molecules', 'organisms', 'pages']
        }
      }
    };
    
    await fs.writeFile(
      path.join(libDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    
    console.log('📄 Generated package.json');
  }

  async generateExports() {
    // Generate main index.js with all exports
    const allExports = Array.from(this.components.values())
      .map(comp => `export * from './bundles/${comp.name}.js';`)
      .join('\n');
    
    const indexContent = `/**
 * NeoForge Web Components Library
 * 
 * Production-ready Web Components built with Lit
 * Generated on: ${this.metadata.buildTime}
 * Version: ${this.metadata.version}
 * Components: ${this.components.size}
 */

${allExports}

// Re-export Lit for convenience
export { LitElement, html, css } from 'lit';
export { customElement, property, state, query } from 'lit/decorators.js';
`;
    
    await fs.writeFile(path.join(libDir, 'index.js'), indexContent);
    
    // Generate category-specific exports
    const categories = ['atoms', 'molecules', 'organisms', 'pages'];
    
    for (const category of categories) {
      const categoryComponents = Array.from(this.components.values())
        .filter(comp => comp.category === category);
      
      const categoryExports = categoryComponents
        .map(comp => `export * from './bundles/${comp.name}.js';`)
        .join('\n');
      
      const categoryContent = `/**
 * ${category.charAt(0).toUpperCase() + category.slice(1)} Components
 * 
 * ${categoryComponents.length} components in this category
 */

${categoryExports}
`;
      
      await fs.writeFile(path.join(libDir, `${category}.js`), categoryContent);
    }
    
    console.log('📁 Generated export files');
  }

  async generateDocumentation() {
    console.log('📚 Generating documentation...');
    
    // Generate README.md
    const readmeContent = this.generateReadme();
    await fs.writeFile(path.join(libDir, 'README.md'), readmeContent);
    
    // Generate CHANGELOG.md
    const changelogContent = this.generateChangelog();
    await fs.writeFile(path.join(libDir, 'CHANGELOG.md'), changelogContent);
    
    // Generate component documentation
    for (const [name, component] of this.components) {
      const componentDoc = this.generateComponentDocumentation(component);
      const docPath = path.join(libDir, 'docs', `${name}.md`);
      
      await fs.writeFile(docPath, componentDoc);
      
      this.metadata.documentation[name] = `docs/${name}.md`;
    }
    
    // Generate API documentation index
    const apiIndex = this.generateApiIndex();
    await fs.writeFile(path.join(libDir, 'docs', 'api.md'), apiIndex);
    
    console.log(`📚 Generated documentation for ${this.components.size} components`);
  }

  async generateTypeDeclarations() {
    console.log('🔤 Generating TypeScript declarations...');
    
    // Generate main index.d.ts
    const mainTypes = `/**
 * NeoForge Web Components Library Type Declarations
 */

// Re-export Lit types
export * from 'lit';

// Component exports
${Array.from(this.components.values())
  .map(comp => `export * from './${comp.category}/${comp.name}.js';`)
  .join('\n')}
`;
    
    await fs.writeFile(path.join(libDir, 'types', 'index.d.ts'), mainTypes);
    
    // Generate individual component type declarations
    for (const [name, component] of this.components) {
      const componentTypes = this.generateComponentTypes(component);
      const typesPath = path.join(libDir, 'types', component.category, `${name}.d.ts`);
      
      await fs.mkdir(path.dirname(typesPath), { recursive: true });
      await fs.writeFile(typesPath, componentTypes);
    }
    
    console.log('🔤 Generated TypeScript declarations');
  }

  async createDistributionPackages() {
    console.log('📦 Creating distribution packages...');
    
    // Create CDN-ready bundle
    const cdnBundle = path.join(libDir, 'cdn', 'neoforge-components.min.js');
    await fs.mkdir(path.dirname(cdnBundle), { recursive: true });
    
    // Build UMD bundle for CDN
    await build({
      root: projectRoot,
      build: {
        lib: {
          entry: path.join(libDir, 'index.js'),
          name: 'NeoForgeComponents',
          fileName: () => 'neoforge-components.min.js',
          formats: ['umd']
        },
        outDir: path.join(libDir, 'cdn'),
        rollupOptions: {
          external: ['lit'],
          output: {
            globals: {
              'lit': 'Lit'
            }
          }
        },
        minify: 'terser',
        target: 'es2017' // Broader browser support for CDN
      }
    });
    
    // Create examples directory with sample usage
    const examplesDir = path.join(libDir, 'examples');
    await this.generateExamples(examplesDir);
    
    console.log('📦 Created distribution packages');
  }

  async generateExamples(examplesDir) {
    // HTML example
    const htmlExample = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NeoForge Components Example</title>
    <script type="module" src="../index.js"></script>
</head>
<body>
    <h1>NeoForge Components Demo</h1>
    
    <!-- Atoms -->
    <section>
        <h2>Atoms</h2>
        <neo-button variant="primary">Primary Button</neo-button>
        <neo-badge variant="success">Success</neo-badge>
    </section>
    
    <!-- Add more component examples -->
</body>
</html>`;
    
    await fs.writeFile(path.join(examplesDir, 'basic.html'), htmlExample);
    
    // React example
    const reactExample = `import React from 'react';
import '@neoforge/web-components';

function App() {
  return (
    <div>
      <h1>NeoForge Components in React</h1>
      <neo-button variant="primary" onClick={handleClick}>
        Click Me
      </neo-button>
    </div>
  );
}

function handleClick() {
  console.log('Button clicked!');
}

export default App;`;
    
    await fs.writeFile(path.join(examplesDir, 'react-example.jsx'), reactExample);
    
    // Vue example
    const vueExample = `<template>
  <div>
    <h1>NeoForge Components in Vue</h1>
    <neo-button variant="primary" @click="handleClick">
      Click Me
    </neo-button>
  </div>
</template>

<script>
import '@neoforge/web-components';

export default {
  name: 'App',
  methods: {
    handleClick() {
      console.log('Button clicked!');
    }
  }
};
</script>`;
    
    await fs.writeFile(path.join(examplesDir, 'vue-example.vue'), vueExample);
  }

  generateVersion() {
    // Use semantic versioning based on date and git hash
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    let gitHash = '';
    try {
      gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      gitHash = 'dev';
    }
    
    return `${year}.${month}.${day}-${gitHash}`;
  }

  generateReadme() {
    return `# NeoForge Web Components

Production-ready Web Components built with Lit for modern web applications.

## Installation

\`\`\`bash
npm install @neoforge/web-components
\`\`\`

## Usage

\`\`\`javascript
import '@neoforge/web-components';

// Use in HTML
<neo-button variant="primary">Click Me</neo-button>
\`\`\`

## Components

This library includes ${this.components.size} components across 4 categories:

${Array.from(['atoms', 'molecules', 'organisms', 'pages']).map(category => {
  const categoryComponents = Array.from(this.components.values())
    .filter(comp => comp.category === category);
  
  return `### ${category.charAt(0).toUpperCase() + category.slice(1)} (${categoryComponents.length})

${categoryComponents.map(comp => `- **${comp.name}**: ${comp.description || 'No description available'}`).join('\n')}`;
}).join('\n\n')}

## Browser Support

- Chrome 63+
- Firefox 63+
- Safari 13.1+
- Edge 79+

## License

MIT
`;
  }

  generateChangelog() {
    return `# Changelog

## [${this.metadata.version}] - ${new Date().toISOString().split('T')[0]}

### Added
- Initial release of NeoForge Web Components library
- ${this.components.size} production-ready components
- TypeScript declarations
- Comprehensive documentation
- CDN distribution

### Components Included
${Array.from(this.components.values()).map(comp => `- ${comp.name}`).join('\n')}
`;
  }

  generateComponentDocumentation(component) {
    return `# ${component.name}

${component.description || 'No description available.'}

## Usage

\`\`\`html
<${component.tagName || component.name.toLowerCase()}></${component.tagName || component.name.toLowerCase()}>
\`\`\`

## Properties

${component.properties.length > 0 ? component.properties.map(prop => `
### ${prop.name}
- **Type**: \`${prop.type}\`
- **Attribute**: \`${prop.attribute}\`
`).join('\n') : 'No public properties.'}

## Events

${component.events.length > 0 ? component.events.map(event => `- \`${event}\``).join('\n') : 'No custom events.'}

## Examples

\`\`\`html
<!-- Basic usage -->
<${component.tagName || component.name.toLowerCase()}></${component.tagName || component.name.toLowerCase()}>
\`\`\`
`;
  }

  generateApiIndex() {
    const categories = ['atoms', 'molecules', 'organisms', 'pages'];
    
    return `# API Reference

Complete API documentation for all NeoForge Web Components.

## Components by Category

${categories.map(category => {
  const categoryComponents = Array.from(this.components.values())
    .filter(comp => comp.category === category);
  
  return `### ${category.charAt(0).toUpperCase() + category.slice(1)}

${categoryComponents.map(comp => `- [${comp.name}](${comp.name}.md)`).join('\n')}`;
}).join('\n\n')}

## Quick Reference

| Component | Tag Name | Description |
|-----------|----------|-------------|
${Array.from(this.components.values()).map(comp => 
  `| ${comp.name} | \`${comp.tagName || comp.name.toLowerCase()}\` | ${comp.description || 'No description'} |`
).join('\n')}
`;
  }

  generateComponentTypes(component) {
    return `/**
 * ${component.description || `${component.name} component`}
 */

import { LitElement } from 'lit';

export declare class ${component.exports[0] || component.name} extends LitElement {
${component.properties.map(prop => `  ${prop.name}: ${this.mapTypeScriptType(prop.type)};`).join('\n')}
  
  connectedCallback(): void;
  disconnectedCallback(): void;
  render(): import('lit').TemplateResult;
}

declare global {
  interface HTMLElementTagNameMap {
    '${component.tagName || component.name.toLowerCase()}': ${component.exports[0] || component.name};
  }
}
`;
  }

  mapTypeScriptType(litType) {
    const typeMap = {
      'String': 'string',
      'Number': 'number',
      'Boolean': 'boolean',
      'Array': 'any[]',
      'Object': 'Record<string, any>'
    };
    
    return typeMap[litType] || 'any';
  }

  async generateMetadata() {
    await fs.writeFile(
      path.join(libDir, 'metadata.json'),
      JSON.stringify(this.metadata, null, 2)
    );
  }

  async getGzippedSize(filePath) {
    try {
      const { execSync } = await import('child_process');
      const result = execSync(`gzip -c "${filePath}" | wc -c`, { encoding: 'utf8' });
      return parseInt(result.trim());
    } catch (error) {
      return 0;
    }
  }
}

// CLI Interface
async function main() {
  const builder = new ComponentLibraryBuilder();
  
  try {
    await builder.build();
    
    console.log('\n📊 Build Summary:');
    console.log(`Version: ${builder.metadata.version}`);
    console.log(`Components: ${builder.components.size}`);
    console.log(`Bundles: ${Object.keys(builder.metadata.bundles).length}`);
    console.log(`Total Bundle Size: ${Object.values(builder.metadata.bundles).reduce((total, bundle) => total + bundle.size, 0)} bytes`);
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { ComponentLibraryBuilder };