#!/usr/bin/env node

/**
 * Test script to verify that story files can execute properly after CDN to npm conversion
 */

import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs';

const require = createRequire(import.meta.url);

// Mock DOM environment for Node.js execution
global.document = {
  createElement: () => ({ 
    setAttribute: () => {},
    textContent: '',
    appendChild: () => {},
    style: {}
  }),
  head: { appendChild: () => {} },
  querySelector: () => null,
  querySelectorAll: () => []
};

global.customElements = {
  define: (name, constructor) => {
    console.log(`✅ Component registered: ${name}`);
  },
  get: () => null
};

global.window = global;

async function testStoryFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  
  try {
    console.log(`📄 Testing story file: ${relativePath}`);
    
    // Import the story file
    const fileUrl = pathToFileURL(filePath).href;
    const storyModule = await import(fileUrl);
    
    // Check if it has a default export (Storybook format)
    if (!storyModule.default) {
      throw new Error('No default export found (not a valid Storybook story)');
    }
    
    const storyConfig = storyModule.default;
    
    // Verify story structure
    if (!storyConfig.title) {
      throw new Error('Story missing title');
    }
    
    if (!storyConfig.component) {
      throw new Error('Story missing component specification');
    }
    
    // Count exported stories
    const storyExports = Object.keys(storyModule).filter(key => 
      key !== 'default' && 
      typeof storyModule[key] === 'function'
    );
    
    console.log(`   ✅ Title: ${storyConfig.title}`);
    console.log(`   ✅ Component: ${storyConfig.component}`);
    console.log(`   ✅ Stories: ${storyExports.length} (${storyExports.join(', ')})`);
    
    return {
      success: true,
      file: relativePath,
      title: storyConfig.title,
      component: storyConfig.component,
      storyCount: storyExports.length
    };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return {
      success: false,
      file: relativePath,
      error: error.message
    };
  }
}

async function main() {
  console.log('🚀 Testing story file execution after CDN to npm conversion\n');
  
  // Find story files
  const storyFiles = [];
  
  function findStoryFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !['node_modules', 'dist', 'build'].includes(file)) {
        findStoryFiles(fullPath);
      } else if (file.endsWith('.stories.js')) {
        storyFiles.push(fullPath);
      }
    }
  }
  
  findStoryFiles('src');
  
  console.log(`Found ${storyFiles.length} story files\n`);
  
  const results = [];
  
  // Test a representative sample of story files
  const sampleFiles = storyFiles.slice(0, 10); // Test first 10 files
  
  for (const file of sampleFiles) {
    const result = await testStoryFile(file);
    results.push(result);
    console.log(''); // Empty line between tests
  }
  
  // Summary
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log('📊 Test Results Summary:');
  console.log(`  ✅ Successful: ${successful.length}`);
  console.log(`  ❌ Failed: ${failed.length}`);
  console.log(`  📈 Success Rate: ${Math.round(successful.length / results.length * 100)}%`);
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Files:');
    failed.forEach(result => {
      console.log(`  - ${result.file}: ${result.error}`);
    });
  }
  
  if (successful.length > 0) {
    console.log('\n✅ Story Components Found:');
    const components = [...new Set(successful.map(r => r.component))];
    components.forEach(comp => {
      console.log(`  - ${comp}`);
    });
  }
  
  console.log('\n🎉 Story execution test completed!');
  
  if (failed.length === 0) {
    console.log('✅ All tested story files can execute properly with npm imports!');
  }
}

main().catch(console.error);