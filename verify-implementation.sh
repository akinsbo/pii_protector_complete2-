#!/bin/bash

echo "🔍 Multi-AI Implementation Verification"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

# Function to check status
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASS++))
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((FAIL++))
    fi
}

echo "📁 Step 1: Checking File Structure"
echo "-----------------------------------"

echo -n "Checking multi-AI chat... "
[ -f "multi-ai-chat.js" ]
check_status

echo -n "Checking company sync... "
[ -f "company-sync.js" ]
check_status

echo -n "Checking test file... "
[ -f "QA testing/cypress/e2e/multi-ai-integration.cy.ts" ]
check_status

echo -n "Checking documentation... "
[ -f "MULTI_AI_SUPPORT.md" ] && [ -f "TEST_VERIFICATION.md" ]
check_status

echo ""
echo "🔨 Step 2: TypeScript Compilation"
echo "----------------------------------"

echo "Building project..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ Build failed${NC}"
    ((FAIL++))
fi

echo ""
echo "🔍 Step 3: Type Checking"
echo "------------------------"

echo "Running TypeScript type check..."
npx tsc --noEmit > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ No type errors${NC}"
    ((PASS++))
else
    echo -e "${YELLOW}⚠️  Type errors found (check output)${NC}"
    ((FAIL++))
fi

echo ""
echo "📦 Step 4: Checking Existing Features"
echo "--------------------------------------"

echo -n "Checking main app files... "
[ -f "index.html" ] && [ -f "main.ts" ]
check_status

echo -n "Checking AI chat module... "
[ -f "ai-chat.js" ]
check_status

echo -n "Checking auth module... "
[ -f "src/auth/BrowserAuth.ts" ]
check_status

echo ""
echo "🧪 Step 5: Test Files"
echo "---------------------"

echo -n "Checking existing tests... "
[ -f "QA testing/cypress/e2e/app-functionality.cy.ts" ]
check_status

echo -n "Checking new tests... "
[ -f "QA testing/cypress/e2e/multi-ai-integration.cy.ts" ]
check_status

echo ""
echo "📚 Step 6: Documentation"
echo "------------------------"

echo -n "User documentation... "
[ -f "MULTI_AI_SUPPORT.md" ] && [ -f "MULTI_AI_INTERFACE_GUIDE.md" ]
check_status

echo -n "Developer documentation... "
[ -f "IMPLEMENTATION_SUMMARY.md" ] && [ -f "TEST_VERIFICATION.md" ]
check_status

echo -n "Quick reference... "
[ -f "MULTI_AI_QUICK_REFERENCE.md" ]
check_status

echo ""
echo "🔒 Step 7: Backward Compatibility"
echo "----------------------------------"

echo -n "Checking localStorage structure... "
grep -q "ledebe-plugin-settings" src/plugins/PluginManager.ts
check_status

echo -n "Checking existing API... "
grep -q "ChatGPTPlugin" src/plugins/index.ts
check_status

echo ""
echo "📊 Verification Summary"
echo "======================="
echo ""
echo -e "Total Checks: $((PASS + FAIL))"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! Implementation verified.${NC}"
    echo ""
    echo "✅ Next Steps:"
    echo "1. Run 'npm run dev' to test in browser"
    echo "2. Verify existing features work"
    echo "3. Test new multi-AI features"
    echo "4. Run 'npm run cypress:run' for full test suite"
    echo ""
    echo "📖 Documentation:"
    echo "- MULTI_AI_SUPPORT.md - Feature guide"
    echo "- TEST_VERIFICATION.md - Test checklist"
    echo "- FINAL_SUMMARY.md - Complete summary"
    exit 0
else
    echo -e "${RED}⚠️  Some checks failed. Please review.${NC}"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "1. Run 'npm install' to ensure dependencies"
    echo "2. Check TypeScript errors with 'npx tsc'"
    echo "3. Review failed checks above"
    echo "4. See TEST_VERIFICATION.md for details"
    exit 1
fi
