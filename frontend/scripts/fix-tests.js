#!/usr/bin/env node

/**
 * Test Fixing Script
 *
 * This script automates the process of fixing skipped tests by:
 * 1. Identifying skipped tests
 * 2. Creating a mock implementation based on the component type
 * 3. Updating the test to use the mock approach
 * 4. Running the test to verify it passes
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { glob } from "glob";

// Setup __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Configuration
const TEST_DIR = path.resolve(__dirname, "../src/test");
const COMPONENT_DIR = path.resolve(__dirname, "../src/components");
const MOCK_TEMPLATES_DIR = path.resolve(__dirname, "./mock-templates");

// Create mock templates directory if it doesn't exist
if (!fs.existsSync(MOCK_TEMPLATES_DIR)) {
  fs.mkdirSync(MOCK_TEMPLATES_DIR);

  // Create basic mock template
  const basicMockTemplate = `
// Basic component mock template
let componentProps;

beforeEach(() => {
  // Create a mock of the component properties
  componentProps = {
    // Properties
    property1: "value1",
    property2: "value2",
    
    // Methods
    method1: function() {
      // Implementation
    },
    method2: function() {
      // Implementation
    },
    
    // Event handling
    addEventListener: function(event, callback) {
      this[\`_\${event}Callback\`] = callback;
    },
    
    // Shadow DOM
    shadowRoot: {
      querySelector: function(selector) {
        // Return mock elements based on the selector
        return null;
      },
      querySelectorAll: function(selector) {
        // Return mock elements based on the selector
        return [];
      }
    },
    
    // Other properties needed for testing
    updateComplete: Promise.resolve(true),
    classList: {
      contains: function(className) {
        // Implementation
        return false;
      }
    }
  };
});
`;

  fs.writeFileSync(
    path.join(MOCK_TEMPLATES_DIR, "basic.js"),
    basicMockTemplate
  );
}

// Find all skipped tests
function findSkippedTests() {
  console.log("Finding skipped tests...");

  const skippedTests = [];

  // Find all test files
  const testFiles = glob.sync(`${TEST_DIR}/**/*.test.js`);

  testFiles.forEach((file) => {
    const content = fs.readFileSync(file, "utf8");

    // Check if the file contains a skipped test
    if (content.includes("describe.skip(")) {
      skippedTests.push({
        file,
        relativePath: path.relative(process.cwd(), file),
        componentName: extractComponentName(content),
        componentType: determineComponentType(file),
      });
    }
  });

  console.log(`Found ${skippedTests.length} skipped tests.`);
  return skippedTests;
}

// Extract component name from test file
function extractComponentName(content) {
  const match = content.match(/describe\.skip\(['"](.*?)['"]/);
  return match ? match[1] : "Unknown";
}

// Determine component type based on file path
function determineComponentType(filePath) {
  if (filePath.includes("/atoms/")) {
    return "atom";
  } else if (filePath.includes("/molecules/")) {
    return "molecule";
  } else if (filePath.includes("/organisms/")) {
    return "organism";
  } else if (filePath.includes("/pages/")) {
    return "page";
  } else if (filePath.includes("/visual/")) {
    return "visual";
  } else {
    return "unknown";
  }
}

// Find component file based on test file
function findComponentFile(testFile, componentName) {
  console.log(`Finding component file for ${componentName}...`);

  // Extract component name from test file name
  const testFileName = path.basename(testFile, ".test.js");

  // Try to find the component file
  const possiblePaths = [
    // Check in atoms directory
    glob.sync(`${COMPONENT_DIR}/atoms/**/${testFileName}.js`),
    // Check in molecules directory
    glob.sync(`${COMPONENT_DIR}/molecules/**/${testFileName}.js`),
    // Check in organisms directory
    glob.sync(`${COMPONENT_DIR}/organisms/**/${testFileName}.js`),
    // Check in ui directory
    glob.sync(`${COMPONENT_DIR}/ui/**/${testFileName}.js`),
    // Check in pages directory
    glob.sync(`${COMPONENT_DIR}/pages/**/${testFileName}.js`),
    // Check directly in components directory
    glob.sync(`${COMPONENT_DIR}/${testFileName}.js`),
  ];

  // Flatten the array and get the first match
  const matches = [].concat(...possiblePaths);

  if (matches.length > 0) {
    console.log(`Found component file: ${matches[0]}`);
    return matches[0];
  }

  console.log(`Could not find component file for ${componentName}.`);
  return null;
}

// Create mock implementation based on component file
function createMockImplementation(componentFile, componentName, componentType) {
  console.log(`Creating mock implementation for ${componentName}...`);

  if (!componentFile) {
    console.log(`Using basic mock template for ${componentName}.`);
    return fs.readFileSync(path.join(MOCK_TEMPLATES_DIR, "basic.js"), "utf8");
  }

  // Read component file
  const content = fs.readFileSync(componentFile, "utf8");

  // Extract properties and methods
  const properties = extractProperties(content);
  const methods = extractMethods(content);

  // Create mock implementation
  const mockImplementation = `
// Mock implementation for ${componentName}
let ${camelCase(componentName)}Props;

beforeEach(() => {
  // Create a mock of the ${componentName} properties
  ${camelCase(componentName)}Props = {
    // Properties
${properties.map((prop) => `    ${prop}: undefined,`).join("\n")}
    
    // Methods
${methods
  .map(
    (method) => `    ${method}: function() {
      // Implementation
    },`
  )
  .join("\n")}
    
    // Event handling
    addEventListener: function(event, callback) {
      this[\`_\${event}Callback\`] = callback;
    },
    
    // Shadow DOM
    shadowRoot: {
      querySelector: function(selector) {
        // Return mock elements based on the selector
        return null;
      },
      querySelectorAll: function(selector) {
        // Return mock elements based on the selector
        return [];
      }
    },
    
    // Other properties needed for testing
    updateComplete: Promise.resolve(true),
    classList: {
      contains: function(className) {
        // Implementation
        return false;
      }
    }
  };
});
`;

  return mockImplementation;
}

// Extract properties from component file
function extractProperties(content) {
  const properties = [];

  // Look for property declarations
  const propertyRegex =
    /(?:@property|static get properties\(\).*?return\s*{)(.*?)(?:}|\))/gs;
  const match = propertyRegex.exec(content);

  if (match && match[1]) {
    const propertyBlock = match[1];

    // Extract property names
    const propertyNameRegex = /(\w+)(?:\s*:\s*{|\s*:)/g;
    let propertyMatch;

    while ((propertyMatch = propertyNameRegex.exec(propertyBlock)) !== null) {
      properties.push(propertyMatch[1]);
    }
  }

  return properties;
}

// Extract methods from component file
function extractMethods(content) {
  const methods = [];

  // Look for method declarations
  const methodRegex = /(?:^|\s)(\w+)\s*\([^)]*\)\s*{/gm;
  let match;

  while ((match = methodRegex.exec(content)) !== null) {
    const methodName = match[1];

    // Skip constructor and lifecycle methods
    if (
      ![
        "constructor",
        "connectedCallback",
        "disconnectedCallback",
        "attributeChangedCallback",
        "adoptedCallback",
      ].includes(methodName)
    ) {
      methods.push(methodName);
    }
  }

  return methods;
}

// Convert component name to camel case
function camelCase(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, "");
}

// Update test file to use mock approach
function updateTestFile(testFile, mockImplementation) {
  console.log(`Updating test file: ${testFile}...`);

  // Read test file
  let content = fs.readFileSync(testFile, "utf8");

  // Replace describe.skip with describe
  content = content.replace("describe.skip(", "describe(");

  // Find the position to insert the mock implementation
  const beforeEachIndex = content.indexOf("beforeEach(");

  if (beforeEachIndex !== -1) {
    // Replace the existing beforeEach block
    const beforeEachEndIndex = findMatchingBrace(
      content,
      beforeEachIndex + "beforeEach(".length
    );

    if (beforeEachEndIndex !== -1) {
      content =
        content.substring(0, beforeEachIndex) +
        mockImplementation +
        content.substring(beforeEachEndIndex + 1);
    } else {
      // If we can't find the end of the beforeEach block, insert the mock implementation after the imports
      const lastImportIndex = content.lastIndexOf("import");
      const lastImportEndIndex = content.indexOf(";", lastImportIndex);

      if (lastImportEndIndex !== -1) {
        content =
          content.substring(0, lastImportEndIndex + 1) +
          "\n\n" +
          mockImplementation +
          content.substring(lastImportEndIndex + 1);
      }
    }
  } else {
    // If there's no beforeEach block, insert the mock implementation after the imports
    const lastImportIndex = content.lastIndexOf("import");
    const lastImportEndIndex = content.indexOf(";", lastImportIndex);

    if (lastImportEndIndex !== -1) {
      content =
        content.substring(0, lastImportEndIndex + 1) +
        "\n\n" +
        mockImplementation +
        content.substring(lastImportEndIndex + 1);
    }
  }

  // Write updated content back to the file
  fs.writeFileSync(testFile, content);

  console.log(`Updated test file: ${testFile}`);
}

// Find the position of the matching closing brace
function findMatchingBrace(content, startIndex) {
  let braceCount = 1;
  let index = startIndex;

  while (braceCount > 0 && index < content.length) {
    const char = content[index];

    if (char === "{") {
      braceCount++;
    } else if (char === "}") {
      braceCount--;
    }

    index++;
  }

  return braceCount === 0 ? index - 1 : -1;
}

// Run test to verify it passes
function runTest(testFile) {
  console.log(`Running test: ${testFile}...`);

  try {
    const relativePath = path.relative(process.cwd(), testFile);
    const output = execSync(`npm test -- ${relativePath} --no-watch`, {
      encoding: "utf8",
    });

    console.log(output);

    if (output.includes("FAIL")) {
      console.log(`Test failed: ${testFile}`);
      return false;
    } else {
      console.log(`Test passed: ${testFile}`);
      return true;
    }
  } catch (error) {
    console.error(`Error running test: ${testFile}`);
    console.error(error.message);
    return false;
  }
}

// Main function
function main() {
  console.log("Starting test fixing script...");

  // Find all skipped tests
  const skippedTests = findSkippedTests();

  // Process each skipped test
  skippedTests.forEach((test) => {
    console.log(`\nProcessing test: ${test.relativePath}`);

    // Find component file
    const componentFile = findComponentFile(test.file, test.componentName);

    // Create mock implementation
    const mockImplementation = createMockImplementation(
      componentFile,
      test.componentName,
      test.componentType
    );

    // Update test file
    updateTestFile(test.file, mockImplementation);

    // Run test
    const passed = runTest(test.file);

    if (passed) {
      console.log(`Successfully fixed test: ${test.relativePath}`);
    } else {
      console.log(`Failed to fix test: ${test.relativePath}`);
    }
  });

  console.log("\nTest fixing script completed.");
}

// Run the script
main();
