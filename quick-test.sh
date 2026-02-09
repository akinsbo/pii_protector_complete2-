#!/bin/bash

# Quick Test Runner - For development and CI
# Runs essential tests quickly

set -e

echo "⚡ Quick Test Suite"
echo "=================="

# Colors
GREEN='\\033[0;32m'
BLUE='\\033[0;34m'
NC='\\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Quick build check
print_status "Building application..."
npm run build

# Run core functionality tests only
print_status "Running core functionality tests..."
npm run cypress:run -- --spec "cypress/e2e/app-functionality.cy.ts"

# Run linting
print_status "Checking code quality..."
npm run lint

print_success "✅ Quick tests passed! Core functionality is working."
echo ""
echo "💡 To run full test suite: ./run-tests.sh"
echo "💡 To run specific test: ./run-tests.sh 'Test Suite Name'"