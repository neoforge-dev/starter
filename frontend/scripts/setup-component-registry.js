#!/usr/bin/env node

/**
 * Setup script for the component registry and ESLint plugin
 * This script:
 * 1. Installs the ESLint plugin
 * 2. Updates the ESLint configuration
 * 3. Creates a component registry if it doesn't exist
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

// Get current file and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const rootDir = path.resolve(__dirname, "..");
const eslintConfigPath = path.join(rootDir, ".eslintrc.json");
const pluginDir = path.join(__dirname, "eslint-plugin-component-registry");
const registryPath = path.join(rootDir, "docs", "COMPONENT_REGISTRY.md");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
};

// Helper function to log with color
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Helper function to check if a file exists
function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}

// Install the ESLint plugin
function installPlugin() {
  log("Installing ESLint plugin...", colors.blue);

  try {
    // Create a symlink to the plugin in node_modules
    const nodeModulesDir = path.join(rootDir, "node_modules");
    const pluginNodeModulesPath = path.join(
      nodeModulesDir,
      "eslint-plugin-component-registry"
    );

    // Create node_modules directory if it doesn't exist
    if (!fs.existsSync(nodeModulesDir)) {
      fs.mkdirSync(nodeModulesDir, { recursive: true });
    }

    // Remove existing symlink if it exists
    if (fs.existsSync(pluginNodeModulesPath)) {
      fs.unlinkSync(pluginNodeModulesPath);
    }

    // Create symlink
    fs.symlinkSync(pluginDir, pluginNodeModulesPath, "dir");

    log("ESLint plugin installed successfully!", colors.green);
  } catch (err) {
    log(`Error installing ESLint plugin: ${err.message}`, colors.red);
    process.exit(1);
  }
}

// Update ESLint configuration
function updateESLintConfig() {
  log("Updating ESLint configuration...", colors.blue);

  try {
    // Read existing config
    const eslintConfig = JSON.parse(fs.readFileSync(eslintConfigPath, "utf8"));

    // Add plugin and rule
    eslintConfig.plugins = eslintConfig.plugins || [];
    if (!eslintConfig.plugins.includes("component-registry")) {
      eslintConfig.plugins.push("component-registry");
    }

    eslintConfig.rules = eslintConfig.rules || {};
    eslintConfig.rules["component-registry/no-duplicate-components"] = "warn";

    // Add settings
    eslintConfig.settings = eslintConfig.settings || {};
    eslintConfig.settings.componentRegistry = {
      registryPath: "./docs/COMPONENT_REGISTRY.md",
    };

    // Write updated config
    fs.writeFileSync(
      eslintConfigPath,
      JSON.stringify(eslintConfig, null, 2),
      "utf8"
    );

    log("ESLint configuration updated successfully!", colors.green);
  } catch (err) {
    log(`Error updating ESLint configuration: ${err.message}`, colors.red);
    process.exit(1);
  }
}

// Check if component registry exists
function checkComponentRegistry() {
  log("Checking component registry...", colors.blue);

  if (!fileExists(registryPath)) {
    log(
      "Component registry not found. Please create it at docs/COMPONENT_REGISTRY.md",
      colors.yellow
    );
  } else {
    log("Component registry found!", colors.green);
  }
}

// Main function
function main() {
  log("Setting up component registry and ESLint plugin...", colors.blue);

  installPlugin();
  updateESLintConfig();
  checkComponentRegistry();

  log("Setup complete!", colors.green);
  log("To use the component registry:");
  log("1. Run ESLint to detect potential component duplicates");
  log("2. Check the component registry before creating new components");
  log("3. Keep the component registry up to date");
}

// Run the script
main();
