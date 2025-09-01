#!/usr/bin/env node

/**
 * Git Hooks Setup Script
 *
 * This script sets up pre-commit hooks for quality gates and automated checks.
 * It creates hooks that run before commits to ensure code quality and prevent
 * regressions from being committed.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');
const gitHooksDir = path.join(projectRoot, '.git/hooks');

class GitHooksSetup {
  constructor() {
    this.hooks = {
      'pre-commit': this.generatePreCommitHook(),
      'pre-push': this.generatePrePushHook(),
      'commit-msg': this.generateCommitMsgHook()
    };
  }

  async setup() {
    console.log('🪝 Setting up Git hooks...');

    try {
      // Ensure .git/hooks directory exists
      await fs.mkdir(gitHooksDir, { recursive: true });

      // Install each hook
      for (const [hookName, hookContent] of Object.entries(this.hooks)) {
        await this.installHook(hookName, hookContent);
      }

      console.log('✅ Git hooks installed successfully!');
      console.log('📝 The following hooks are now active:');
      console.log('  • pre-commit: Quality checks before commit');
      console.log('  • pre-push: Full validation before push');
      console.log('  • commit-msg: Commit message validation');

    } catch (error) {
      console.error('❌ Failed to setup Git hooks:', error.message);
      throw error;
    }
  }

  async installHook(hookName, hookContent) {
    const hookPath = path.join(gitHooksDir, hookName);

    // Write hook content
    await fs.writeFile(hookPath, hookContent);

    // Make hook executable
    await fs.chmod(hookPath, 0o755);

    console.log(`🪝 Installed ${hookName} hook`);
  }

  generatePreCommitHook() {
    return `#!/bin/bash

#
# NeoForge Pre-commit Hook
# Runs quality checks before allowing commits
#

set -e

echo "🚦 Running pre-commit quality checks..."

# Navigate to frontend directory
cd frontend

# Check if we have staged JS files
STAGED_JS_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E "\\.(js|mjs)$" | grep "^frontend/" | sed 's/^frontend\\///' || true)
STAGED_JSON_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E "\\.(json)$" | grep "^frontend/" | sed 's/^frontend\\///' || true)

if [[ -z "$STAGED_JS_FILES" && -z "$STAGED_JSON_FILES" ]]; then
  echo "ℹ️ No JavaScript or JSON files staged, skipping frontend checks"
  exit 0
fi

echo "📄 Checking $$(echo "$STAGED_JS_FILES $STAGED_JSON_FILES" | wc -w) staged files..."

# 1. Lint staged files
echo "🔍 Running ESLint..."
if [[ ! -z "$STAGED_JS_FILES" ]]; then
  echo "$STAGED_JS_FILES" | xargs npx eslint --max-warnings 0
fi

# 2. Check Prettier formatting
echo "🎨 Checking Prettier formatting..."
PRETTIER_FILES=$(echo "$STAGED_JS_FILES $STAGED_JSON_FILES" | tr ' ' '\\n' | grep -E "\\.(js|json)$" | tr '\\n' ' ')
if [[ ! -z "$PRETTIER_FILES" ]]; then
  echo "$PRETTIER_FILES" | xargs npx prettier --check
fi

# 3. Run fast tests for affected components
echo "🧪 Running tests for affected components..."
AFFECTED_COMPONENTS=()

for file in $STAGED_JS_FILES; do
  if [[ "$file" =~ src/components/ ]]; then
    # Extract component name from path
    component_name=$(basename "$file" .js)
    if [[ ! "$component_name" =~ \\.(test|stories)$ ]]; then
      AFFECTED_COMPONENTS+=("$component_name")
    fi
  fi
done

# Remove duplicates
UNIQUE_COMPONENTS=$(printf '%s\\n' "\${AFFECTED_COMPONENTS[@]}" | sort -u)

if [[ \${#UNIQUE_COMPONENTS[@]} -gt 0 ]]; then
  echo "🎯 Testing affected components: \${UNIQUE_COMPONENTS[@]}"
  for component in \${UNIQUE_COMPONENTS[@]}; do
    # Run component test if it exists
    if [[ -f "src/test/components/\${component}.test.js" ]]; then
      npm run test:component -- --run "src/test/components/\${component}.test.js"
    fi
  done
else
  # Run fast test suite
  npm run test:fast --run --reporter=basic
fi

# 4. Check for security issues
echo "🛡️ Security checks..."
if grep -r -E "(password|secret|key|token).*(=|:).*(\"[^\"]{8,}\"|'[^']{8,}')" $STAGED_JS_FILES 2>/dev/null; then
  echo "❌ Potential hardcoded secrets detected in staged files"
  echo "Please review and remove any sensitive data before committing"
  exit 1
fi

# 5. Check bundle size impact (for significant changes)
if [[ \${#STAGED_JS_FILES[@]} -gt 5 ]]; then
  echo "📦 Checking bundle size impact..."
  npm run build --silent

  # Simple bundle size check
  BUNDLE_SIZE=$(find dist -name "*.js" -exec stat -f%z {} + 2>/dev/null | awk '{sum += $1} END {print sum}' || echo "0")
  if [[ $BUNDLE_SIZE -gt 1048576 ]]; then # > 1MB
    echo "⚠️ Bundle size is large (\$((BUNDLE_SIZE / 1024))KB) - consider optimization"
  fi
fi

# 6. Component registry validation
echo "🧩 Validating component registry..."
npm run lint:components --silent || echo "⚠️ Component registry issues detected - please review"

echo "✅ Pre-commit checks passed!"
echo ""
`;
  }

  generatePrePushHook() {
    return `#!/bin/bash

#
# NeoForge Pre-push Hook
# Runs comprehensive validation before pushing to remote
#

set -e

echo "🚀 Running pre-push validation..."

# Get the branch we're pushing to
remote="$1"
url="$2"

# Navigate to frontend directory
cd frontend

echo "📊 Running comprehensive test suite..."

# 1. Full lint check
echo "🔍 Running full lint check..."
npm run lint

# 2. Full test suite
echo "🧪 Running full test suite..."
npm run test:unit

# 3. Build validation
echo "🏗️ Validating build..."
npm run build

# 4. Check playground build
echo "🎮 Validating playground build..."
npm run playground:build

# 5. Run visual tests (if baselines exist)
if [[ -d "src/test/visual/baselines" ]]; then
  echo "📸 Running visual regression tests..."
  npm run test:visual || echo "⚠️ Visual tests failed - may need baseline updates"
fi

# 6. Performance validation
echo "⚡ Running performance tests..."
npm run test:perf || echo "⚠️ Performance tests failed or not available"

# 7. Security audit
echo "🛡️ Running security audit..."
npm audit --audit-level moderate

# Ignore credential-like strings in backend/tests and docs to reduce false positives
echo "🔒 Scanning for secrets (excluding tests and docs)..."
if git rev-parse --git-dir > /dev/null 2>&1; then
  CHANGED_FILES=$(git diff --cached --name-only | grep -vE '^(backend/tests/|docs/)' || true)
  if [[ -n "$CHANGED_FILES" ]]; then
    if grep -r -E "(password|secret|key|token).*(=|:).*(\"[^\"]{8,}\"|'[^']{8,}')" $CHANGED_FILES 2>/dev/null; then
      echo "❌ Potential hardcoded secrets detected in staged app files"
      echo "Please review and remove any sensitive data before pushing"
      exit 1
    fi
  fi
fi

# 8. Technical debt analysis
echo "📊 Analyzing technical debt..."
npm run debt:analyze

echo "✅ Pre-push validation completed successfully!"
echo "🚀 Ready to push to $remote"
echo ""
`;
  }

  generateCommitMsgHook() {
    return `#!/bin/bash

#
# NeoForge Commit Message Hook
# Validates commit message format and content
#

commit_regex='^(feat|fix|docs|style|refactor|perf|test|chore|ci|build)(\(.+\))?: .{1,50}'

error_msg="❌ Invalid commit message format!

Commit message should follow the Conventional Commits specification:
<type>[optional scope]: <description>

Types:
  feat:     New feature
  fix:      Bug fix
  docs:     Documentation only changes
  style:    Changes that do not affect meaning (white-space, formatting)
  refactor: Code change that neither fixes a bug nor adds a feature
  perf:     Performance improvements
  test:     Adding missing tests or correcting existing tests
  chore:    Other changes that don't modify src or test files
  ci:       Changes to CI configuration files and scripts
  build:    Changes that affect the build system or dependencies

Examples:
  feat(playground): add visual regression testing
  fix(button): resolve accessibility issue with focus states
  docs: update component library documentation
  refactor(data-table): simplify prop handling logic
"

commit_message_file="$1"
commit_message=$(cat "$commit_message_file")

# Skip check for merge commits
if [[ $commit_message =~ ^Merge ]]; then
  exit 0
fi

# Skip check for revert commits
if [[ $commit_message =~ ^Revert ]]; then
  exit 0
fi

# Check commit message format
if [[ ! $commit_message =~ $commit_regex ]]; then
  echo "$error_msg"
  echo "Your commit message:"
  echo "$commit_message"
  exit 1
fi

# Check for component-specific commits
if [[ $commit_message =~ (feat|fix)\\(([^)]+)\\): ]]; then
  component="\${BASH_REMATCH[2]}"

  # Check if component actually exists
  if [[ ! -d "frontend/src/components/atoms/$component" &&
        ! -d "frontend/src/components/molecules/$component" &&
        ! -d "frontend/src/components/organisms/$component" &&
        ! -d "frontend/src/components/pages/$component" &&
        ! -f "frontend/src/components/*/$component.js" ]]; then
    echo "⚠️ Warning: Component '$component' not found in component directories"
    echo "Make sure the component name in your commit message is correct"
  fi
fi

# Check commit message length
first_line=$(echo "$commit_message" | head -n1)
if [[ \${#first_line} -gt 72 ]]; then
  echo "⚠️ Warning: Commit message first line is longer than 72 characters"
  echo "Consider shortening it for better readability in Git logs"
fi

echo "✅ Commit message format is valid"
`;
  }

  async remove() {
    console.log('🗑️ Removing Git hooks...');

    try {
      for (const hookName of Object.keys(this.hooks)) {
        const hookPath = path.join(gitHooksDir, hookName);

        try {
          await fs.unlink(hookPath);
          console.log(`🗑️ Removed ${hookName} hook`);
        } catch (error) {
          if (error.code !== 'ENOENT') {
            console.warn(`⚠️ Could not remove ${hookName} hook:`, error.message);
          }
        }
      }

      console.log('✅ Git hooks removed successfully!');

    } catch (error) {
      console.error('❌ Failed to remove Git hooks:', error.message);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const setup = new GitHooksSetup();

  try {
    switch (command) {
      case 'install':
      case 'setup':
        await setup.setup();
        break;

      case 'remove':
      case 'uninstall':
        await setup.remove();
        break;

      default:
        console.log(\`
Usage: node setup-git-hooks.js <command>

Commands:
  install, setup     Install Git hooks
  remove, uninstall  Remove Git hooks

The following hooks will be installed:
  pre-commit         Quality checks before commit
  pre-push          Full validation before push
  commit-msg        Commit message validation
        \`);
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  main();
}

export { GitHooksSetup };
