#!/bin/bash

# Setup script for free crash reporting using GitHub Gists
# This creates a private gist to store crash reports

echo "🔧 Setting up free crash reporting storage..."

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not found. Please install it first:"
    echo "   brew install gh"
    echo "   or visit: https://cli.github.com/"
    exit 1
fi

# Check if user is logged in
if ! gh auth status &> /dev/null; then
    echo "🔐 Please login to GitHub first:"
    gh auth login
fi

echo "📝 Creating private gist for crash storage..."

# Create initial gist with README
GIST_ID=$(gh gist create --public=false --filename="README.md" --desc="Ledebe Protector Crash Reports" - << 'EOF'
# Ledebe Protector Crash Reports

This gist stores crash reports from the Ledebe Protector application.

## Structure
- Each crash report is stored as `crash-{id}.json`
- Reports include system info, stack traces, and user breadcrumbs
- Data is automatically cleaned up after 30 days

## Privacy
- This gist is private and only accessible to authorized users
- User IDs are anonymized UUIDs
- No personal information is stored

Last updated: $(date)
EOF
)

if [ $? -eq 0 ]; then
    echo "✅ Gist created successfully!"
    echo "📋 Gist ID: $GIST_ID"
    echo ""
    echo "🔧 Next steps:"
    echo "1. Set environment variables:"
    echo "   export GITHUB_TOKEN=\"$(gh auth token)\""
    echo "   export CRASH_GIST_ID=\"$GIST_ID\""
    echo ""
    echo "2. Update management portal:"
    echo "   Replace 'YOUR_GIST_ID' in management-portal/index.html with: $GIST_ID"
    echo ""
    echo "3. Add to your shell profile (~/.zshrc or ~/.bashrc):"
    echo "   echo 'export GITHUB_TOKEN=\"$(gh auth token)\"' >> ~/.zshrc"
    echo "   echo 'export CRASH_GIST_ID=\"$GIST_ID\"' >> ~/.zshrc"
    echo ""
    echo "🌐 View gist at: https://gist.github.com/$GIST_ID"
else
    echo "❌ Failed to create gist"
    exit 1
fi