#!/bin/bash
# Script to systematically replace console statements with Logger

# Production files only - exclude test, stories, examples, playground
PRODUCTION_FILES=$(find /Users/bogdan/work/neoforge-dev/neoforge-starter/frontend/src \
  -type f -name "*.js" \
  ! -path "*/test/*" \
  ! -path "*/tests/*" \
  ! -name "*.test.js" \
  ! -name "*.spec.js" \
  ! -path "*/examples/*" \
  ! -name "*.stories.js" \
  ! -path "*/playground/*" \
  ! -path "*/docs/*" \
  ! -name "*.md" \
  ! -name "logger.js" \
  ! -name "*example*.html")

echo "Found $(echo "$PRODUCTION_FILES" | wc -l | tr -d ' ') production files to process"
echo "$PRODUCTION_FILES" | head -20
