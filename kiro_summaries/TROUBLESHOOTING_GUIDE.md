# Troubleshooting Guide: Brave Browser & Chat Issues

## Issue 1: Microphone Not Working in Brave Browser

Brave browser has additional privacy protections that can block microphone access. Here's how to fix it:

### Step 1: Enable HTTPS First
```bash
# Install the dependency
pnpm install node-forge

# Run with HTTPS
pnpm run dev:https
```

### Step 2: Configure Brave Browser Settings

1. **Open Brave Settings**:
   - Click the Brave menu (3 lines) → Settings
   - Or go to `brave://settings/`

2. **Privacy and Security Settings**:
   - Go to "Privacy and security" → "Site and Shields settings"
   - Click "Microphone"
   - Make sure "Sites can ask to use your microphone" is enabled
   - Add `https://localhost:3000` to "Allowed to use your microphone"

3. **Shields Settings for localhost**:
   - Navigate to `https://localhost:3000`
   - Click the Brave Shields icon (lion head) in the address bar
   - Set "Block fingerprinting" to "Allow all fingerprinting"
   - Set "Block scripts" to "Allow all scripts"
   - Refresh the page

4. **Advanced Privacy Settings**:
   - Go to `brave://settings/privacy`
   - Under "WebRTC IP handling policy", select "Default"
   - Ensure "Prevent sites from fingerprinting me" is set to "Standard"

### Step 3: Grant Microphone Permission
1. Navigate to `https://localhost:3000`
2. Click the microphone button in the chat
3. When prompted, click "Allow" for microphone access
4. If no prompt appears, click the lock/shield icon in the address bar
5. Set Microphone to "Allow"

### Alternative: Use Brave with Flags
If the above doesn't work, start Brave with special flags:

```bash
# Close all Brave windows first, then:

# macOS
/Applications/Brave\ Browser.app/Contents/MacOS/Brave\ Browser --unsafely-treat-insecure-origin-as-secure=http://localhost:3000 --user-data-dir=/tmp/brave-dev

# Windows
"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe" --unsafely-treat-insecure-origin-as-secure=http://localhost:3000 --user-data-dir=c:\temp\brave-dev

# Linux
brave-browser --unsafely-treat-insecure-origin-as-secure=http://localhost:3000 --user-data-dir=/tmp/brave-dev
```

## Issue 2: Chats Not Being Sent to AI Agent

### Step 1: Check API Key
Your API key looks correct, but let's verify it's working:

1. **Test the API key directly**:
```bash
curl -X POST "https://openrouter.ai/api/v1/chat/completions" \
  -H "Authorization: Bearer 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" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "liquid/lfm-3b",
    "messages": [{"role": "user", "content": "Hello, this is a test"}]
  }'
```

### Step 2: Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Send a message in the chat
4. Look for any error messages

### Step 3: Check Network Tab
1. Open Developer Tools (F12)
2. Go to Network tab
3. Send a message in the chat
4. Look for the `/api/chat` request
5. Check if it returns an error

### Step 4: Restart Development Server
```bash
# Stop the current server (Ctrl+C)
# Then restart with:
pnpm run dev:https
```

## Quick Diagnostic Steps

### 1. Check if Voice Input is Detected
I've added a debug component. Look for the "🎤 Debug" button in the bottom-right corner of your app. Click it to see:
- Browser compatibility status
- Feature availability
- Specific error messages

### 2. Test Chat Without Voice
Try typing a regular message first to see if the chat API is working at all.

### 3. Check Environment Variables
Make sure your `.env.local` file is being loaded:
```bash
# In your project directory, run:
echo $OPENROUTER_API_KEY
```

## Common Solutions

### For Microphone Issues:
1. **Use HTTPS**: `pnpm run dev:https`
2. **Configure Brave privacy settings** (see above)
3. **Grant microphone permission** when prompted
4. **Try Chrome/Edge** as a test to isolate Brave-specific issues

### For Chat Issues:
1. **Check browser console** for JavaScript errors
2. **Verify API key** is valid and has credits
3. **Test with curl** to isolate API issues
4. **Restart development server**

### For Both Issues:
1. **Clear browser cache** and cookies for localhost
2. **Try incognito/private mode**
3. **Disable browser extensions** temporarily
4. **Check firewall/antivirus** isn't blocking requests

## Testing Commands

```bash
# 1. Install dependencies
pnpm install node-forge

# 2. Start HTTPS server
pnpm run dev:https

# 3. Test in browser
# Navigate to: https://localhost:3000
# Accept security warning
# Click 🎤 Debug button to check status
# Try typing a message first
# Then try voice input
```

## Expected Behavior

When working correctly:
1. **🎤 Debug button** shows "Voice Input: Supported"
2. **Microphone button** in chat input is enabled (not grayed out)
3. **Clicking microphone** shows permission prompt or starts recording
4. **Typing messages** get responses from AI
5. **Voice input** shows real-time transcription

## Still Not Working?

If you're still having issues:

1. **Share the debug info**: Click the 🎤 Debug button and share what it shows
2. **Check browser console**: Share any error messages
3. **Try a different browser**: Test with Chrome to isolate Brave-specific issues
4. **Check API credits**: Verify your OpenRouter account has available credits

Let me know what you see in the debug panel and any error messages!