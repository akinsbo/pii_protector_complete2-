#!/bin/bash
#
# Ledebe Protector - Comprehensive Validation Script
#
# Purpose: Run all quality, security, and functionality checks
# Author: Olaolu
# Version: 1.0.0
# Since: December 2025
# License: MIT
#
# This script performs:
# - Code quality validation (ESLint, Prettier)
# - Security scanning (npm audit, secret detection)
# - Build verification
# - E2E testing
# - File structure validation
#

set -e

echo "🔍 Starting comprehensive validation..."

# Change to project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

# Code quality checks
echo "📝 Running ESLint..."
npm run lint

echo "🎨 Checking code formatting..."
npm run format:check

# Security scans
echo "🔒 Running npm security audit..."
npm run security:audit

# Build validation
echo "🔨 Validating TypeScript build..."
npm run build

# Test execution
echo "🧪 Running E2E tests..."
npm run test:e2e

# File validation
echo "📁 Validating required files..."
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
fi

if [ ! -f "tsconfig.json" ]; then
    echo "❌ tsconfig.json not found"
    exit 1
fi

if [ ! -d "src" ]; then
    echo "❌ src directory not found"
    exit 1
fi

# Check for sensitive data
echo "🔍 Scanning for potential secrets..."
if grep -r "password\|secret\|key\|token" src/ --include="*.ts" --include="*.js" | grep -v "placeholder\|example\|<.*>" | head -5; then
    echo "⚠️  Potential secrets found in code. Please review."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ All validation checks passed!"
echo "🚀 Ready for deployment!"