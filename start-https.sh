#!/bin/bash

echo "🚀 Starting Voice Input Chat with HTTPS..."
echo ""

# Check if node-forge is installed
if ! npm list node-forge > /dev/null 2>&1; then
    echo "📦 Installing required dependency..."
    pnpm install node-forge
fi

echo "🔐 Starting HTTPS development server..."
echo "📍 Your app will be available at: https://localhost:3000"
echo ""
echo "⚠️  You may see a security warning in your browser."
echo "   Click 'Advanced' → 'Proceed to localhost (unsafe)' to continue."
echo ""
echo "🎤 For Brave Browser users:"
echo "   1. Click the Brave Shields icon (lion head) in the address bar"
echo "   2. Set 'Block fingerprinting' to 'Allow all fingerprinting'"
echo "   3. Set 'Block scripts' to 'Allow all scripts'"
echo "   4. Refresh the page"
echo ""
echo "🧪 Debug Tools Available:"
echo "   - Click '🎤 Debug' button for voice input status"
echo "   - Click '🧪 Chat Test' button to test API connectivity"
echo ""

pnpm run dev:https