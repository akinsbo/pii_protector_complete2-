#!/bin/bash

# Test Settings Functionality
# This script helps verify that the settings save/load correctly

echo "🧪 Testing Ledebe Protector Settings..."
echo ""

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✅ .env file exists"
else
    echo "❌ .env file not found"
    echo "   Run: cp .env.example .env"
    exit 1
fi

# Check if .gitignore includes .env
if grep -q "^\.env$" .gitignore 2>/dev/null; then
    echo "✅ .env is in .gitignore"
else
    echo "⚠️  .env should be in .gitignore"
fi

# Check for required environment variables
echo ""
echo "📋 Environment Variables:"
echo ""

check_var() {
    local var_name=$1
    local var_value=$(grep "^${var_name}=" .env | cut -d'=' -f2-)
    
    if [ -n "$var_value" ]; then
        if [ "$var_value" = "" ] || [[ "$var_value" == *"your_"* ]]; then
            echo "⚠️  $var_name: Not configured (using placeholder)"
        else
            echo "✅ $var_name: Configured"
        fi
    else
        echo "❌ $var_name: Missing"
    fi
}

check_var "GITHUB_TOKEN"
check_var "CRASH_GIST_ID"
check_var "CRASH_WEBHOOK_URL"
check_var "DEFAULT_AI_MODEL"
check_var "OPENAI_API_KEY"
check_var "ANTHROPIC_API_KEY"
check_var "GOOGLE_API_KEY"

echo ""
echo "📝 Testing localStorage (Web App):"
echo ""
echo "To test settings in the web app:"
echo "1. Open the app in your browser"
echo "2. Open DevTools (F12)"
echo "3. Go to Console tab"
echo "4. Run: localStorage.getItem('aiKey')"
echo "5. Should return your saved API key or null"
echo ""

echo "🔧 Testing Electron Settings:"
echo ""
if [ -f "$HOME/.ledebe-settings.json" ]; then
    echo "✅ Settings file exists: ~/.ledebe-settings.json"
    echo ""
    echo "Current settings:"
    cat "$HOME/.ledebe-settings.json" | python3 -m json.tool 2>/dev/null || cat "$HOME/.ledebe-settings.json"
else
    echo "⚠️  No settings file found yet"
    echo "   Settings will be created when you save them in the app"
fi

echo ""
echo "✨ Test Complete!"
echo ""
echo "Next steps:"
echo "1. Configure your .env file with actual values"
echo "2. Open the app and go to Settings (⚙️)"
echo "3. Enable AI integration and enter your API key"
echo "4. Click 'Save Settings'"
echo "5. Refresh and verify settings persist"
echo ""
