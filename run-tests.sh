#!/bin/bash

# PII Protector - Comprehensive Test Runner
# This script runs all e2e tests to ensure nothing is broken

set -e

echo "🧪 PII Protector - Comprehensive Test Suite"
echo "==========================================="

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if npm is available
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Build the application
print_status "Building application..."
npm run build

# Function to run tests with error handling
run_test_suite() {
    local test_name="$1"
    local test_command="$2"
    
    print_status "Running $test_name..."
    
    if eval "$test_command"; then
        print_success "$test_name completed successfully"
        return 0
    else
        print_error "$test_name failed"
        return 1
    fi
}

# Initialize test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test suites to run
declare -A TEST_SUITES=(
    ["Playwright E2E Tests"]="npm run test:e2e"
    ["Cypress Core Functionality"]="npm run cypress:run -- --spec 'QA testing/cypress/e2e/app-functionality.cy.ts'"
    ["Cypress File Upload Tests"]="npm run cypress:run -- --spec 'QA testing/cypress/e2e/file-upload.cy.ts'"
    ["Cypress UI/Accessibility Tests"]="npm run cypress:run -- --spec 'QA testing/cypress/e2e/ui-accessibility.cy.ts'"
    ["Cypress Advanced Features"]="npm run cypress:run -- --spec 'QA testing/cypress/e2e/advanced-features.cy.ts'"
    ["Linting"]="npm run lint"
    ["Format Check"]="npm run format:check"
)

# Check if we should run specific test suite
if [ $# -eq 1 ]; then
    TEST_SUITE="$1"
    if [[ -n "${TEST_SUITES[$TEST_SUITE]}" ]]; then
        print_status "Running specific test suite: $TEST_SUITE"
        run_test_suite "$TEST_SUITE" "${TEST_SUITES[$TEST_SUITE]}"
        exit $?
    else
        print_error "Unknown test suite: $TEST_SUITE"
        echo "Available test suites:"
        for suite in "${!TEST_SUITES[@]}"; do
            echo "  - $suite"
        done
        exit 1
    fi
fi

# Run all test suites
echo ""
print_status "Running all test suites..."
echo ""

for test_name in "${!TEST_SUITES[@]}"; do
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if run_test_suite "$test_name" "${TEST_SUITES[$test_name]}"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    echo ""
done

# Print summary
echo "=========================================="
echo "🧪 Test Suite Summary"
echo "=========================================="
echo "Total Test Suites: $TOTAL_TESTS"
print_success "Passed: $PASSED_TESTS"

if [ $FAILED_TESTS -gt 0 ]; then
    print_error "Failed: $FAILED_TESTS"
    echo ""
    print_error "Some tests failed. Please check the output above for details."
    exit 1
else
    echo ""
    print_success "🎉 All tests passed! Your application is working correctly."
    
    # Additional success information
    echo ""
    echo "✅ Core functionality working"
    echo "✅ File upload and processing working"
    echo "✅ UI and accessibility standards met"
    echo "✅ Advanced features working"
    echo "✅ Code quality standards met"
    echo ""
    print_success "Ready for deployment! 🚀"
fi