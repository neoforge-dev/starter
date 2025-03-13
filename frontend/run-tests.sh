#!/bin/bash
# Script to run tests with optimized memory settings and parallel execution
# Usage: ./run-tests.sh [test-file-pattern]

# Set Node.js memory limits - increased for better performance
export NODE_OPTIONS="--max-old-space-size=4096 --expose-gc"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running tests with optimized parallel settings...${NC}"

# Function to run tests in parallel batches
run_tests_parallel() {
  local test_files=("$@")
  local batch_size=8  # Number of tests to run in parallel
  local total=${#test_files[@]}
  local batches=$(( (total + batch_size - 1) / batch_size ))  # Ceiling division
  
  echo -e "${YELLOW}Running ${total} tests in ${batches} batches of up to ${batch_size} tests each${NC}"
  
  local failed_tests=()
  local passed_tests=()
  
  for (( i=0; i<${total}; i+=${batch_size} )); do
    local end=$(( i + batch_size > total ? total : i + batch_size ))
    local batch=("${test_files[@]:i:end-i}")
    
    echo -e "${YELLOW}Running batch $(( i / batch_size + 1 )) of ${batches}...${NC}"
    
    # Join the batch files with spaces
    local batch_joined=$(printf " %s" "${batch[@]}")
    batch_joined=${batch_joined:1}  # Remove the leading space
    
    # Run the batch with vitest
    npx vitest run --reporter=basic --no-watch $batch_joined
    
    local result=$?
    if [ $result -eq 0 ]; then
      passed_tests+=("${batch[@]}")
      echo -e "${GREEN}Batch $(( i / batch_size + 1 )) passed!${NC}"
    else
      failed_tests+=("${batch[@]}")
      echo -e "${RED}Batch $(( i / batch_size + 1 )) had failures!${NC}"
    fi
  done
  
  # Print summary
  echo -e "\n${YELLOW}Test Summary:${NC}"
  echo -e "${GREEN}Passed: ${#passed_tests[@]} tests${NC}"
  echo -e "${RED}Failed: ${#failed_tests[@]} tests${NC}"
  
  if [ ${#failed_tests[@]} -gt 0 ]; then
    echo -e "\n${RED}Failed tests:${NC}"
    for TEST in "${failed_tests[@]}"; do
      echo -e "${RED}- ${TEST}${NC}"
    done
    return 1
  fi
  
  return 0
}

# Check if a specific test pattern was provided
if [ -n "$1" ]; then
  TEST_PATTERN=$1
  echo -e "${YELLOW}Running tests matching: ${TEST_PATTERN}${NC}"
  
  # Run specific test
  npx vitest run --reporter=basic --no-watch $TEST_PATTERN
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Tests passed: ${TEST_PATTERN}${NC}"
    echo -e "${GREEN}Tests completed!${NC}"
    exit 0
  else
    echo -e "${RED}✗ Tests failed: ${TEST_PATTERN}${NC}"
    echo -e "${RED}Tests failed!${NC}"
    exit 1
  fi
else
  # Run all tests in optimized parallel batches
  echo -e "${YELLOW}Running all tests in parallel batches...${NC}"
  
  # Get all test files
  TEST_FILES=($(find src/test -name "*.test.js" | grep -v "e2e" | grep -v "accessibility"))
  
  # Run tests in parallel batches
  run_tests_parallel "${TEST_FILES[@]}"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
  else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
  fi
fi