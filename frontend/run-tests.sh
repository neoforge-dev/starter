#!/bin/bash

# Script to run tests with optimized memory settings
# Usage: ./run-tests.sh [test-file-pattern]

# Set Node.js memory limits - use a much lower limit
export NODE_OPTIONS="--max-old-space-size=256 --expose-gc"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running tests with optimized memory settings...${NC}"

# Function to run a single test with memory management
run_single_test() {
  local test_file=$1
  echo -e "${YELLOW}Running: ${test_file}${NC}"
  
  # Run test with minimal options
  NODE_OPTIONS="--max-old-space-size=256 --expose-gc" npx vitest run \
    --no-coverage \
    --reporter=basic \
    --no-watch \
    --isolate \
    --pool=forks \
    --silent \
    $test_file
  
  local result=$?
  
  # Force garbage collection
  node --expose-gc -e "global.gc(); global.gc(); setTimeout(() => {}, 100);"
  
  # Small delay to ensure cleanup
  sleep 2
  
  return $result
}

# Check if a specific test pattern was provided
if [ -n "$1" ]; then
  TEST_PATTERN=$1
  echo -e "${YELLOW}Running tests matching: ${TEST_PATTERN}${NC}"
  
  # Run specific test with memory management
  run_single_test $TEST_PATTERN
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Test passed: ${TEST_PATTERN}${NC}"
    echo -e "${GREEN}Tests completed!${NC}"
    exit 0
  else
    echo -e "${RED}✗ Test failed: ${TEST_PATTERN}${NC}"
    echo -e "${RED}Tests failed!${NC}"
    exit 1
  fi
else
  # Run all tests in sequence to avoid memory issues
  echo -e "${YELLOW}Running all tests in sequence...${NC}"
  
  # Get all test files
  TEST_FILES=$(find src/test -name "*.test.js" | grep -v "e2e" | grep -v "accessibility")
  
  # Run each test file individually
  FAILED_TESTS=()
  PASSED_TESTS=()
  
  for TEST_FILE in $TEST_FILES; do
    run_single_test $TEST_FILE
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✓ Passed: ${TEST_FILE}${NC}"
      PASSED_TESTS+=("$TEST_FILE")
    else
      echo -e "${RED}✗ Failed: ${TEST_FILE}${NC}"
      FAILED_TESTS+=("$TEST_FILE")
    fi
  done
  
  # Print summary
  echo -e "\n${YELLOW}Test Summary:${NC}"
  echo -e "${GREEN}Passed: ${#PASSED_TESTS[@]} tests${NC}"
  echo -e "${RED}Failed: ${#FAILED_TESTS[@]} tests${NC}"
  
  if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
    echo -e "\n${RED}Failed tests:${NC}"
    for TEST in "${FAILED_TESTS[@]}"; do
      echo -e "${RED}- ${TEST}${NC}"
    done
    exit 1
  fi
fi

echo -e "${GREEN}Tests completed!${NC}" 