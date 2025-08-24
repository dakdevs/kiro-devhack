# Voice Input Setup Guide

The microphone/voice input feature requires **HTTPS** to work due to browser security requirements. Here are the solutions:

## Quick Fix (Recommended)

### Option 1: Use mkcert (Easiest)

1. **Install mkcert** (one-time setup):
   ```bash
   # macOS
   brew install mkcert
   
   # Windows (with Chocolatey)
   choco install mkcert
   
   # Windows (with Scoop)
   scoop install mkcert
   
   # Linux (Ubuntu/Debian)
   sudo apt install libnss3-tools
   wget -O mkcert https://github.com/FiloSottile/mkcert/releases/latest/download/mkcert-v*-linux-amd64
   chmod +x mkcert
   sudo mv mkcert /usr/local/bin/
   ```

2. **Generate certificates**:
   ```bash
   # Install the local CA
   mkcert -install
   
   # Generate certificate for localhost
   mkcert localhost 127.0.0.1 ::1
   ```

3. **Update your Next.js configuration**:
   Create or update `next.config.js`:
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     // Other config...
   }
   
   module.exports = nextConfig
   ```

4. **Run with HTTPS**:
   ```bash
   # Install the dependency first
   pnpm install node-forge
   
   # Then run with HTTPS
   pnpm run dev:https
   ```

### Option 2: Use Chrome Flags (Quick Test)

For quick testing, you can disable Chrome's secure context requirement:

1. **Close all Chrome windows**
2. **Start Chrome with flags**:
   ```bash
   # macOS
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --unsafely-treat-insecure-origin-as-secure=http://localhost:3000 --user-data-dir=/tmp/chrome-dev
   
   # Windows
   chrome.exe --unsafely-treat-insecure-origin-as-secure=http://localhost:3000 --user-data-dir=c:\temp\chrome-dev
   
   # Linux
   google-chrome --unsafely-treat-insecure-origin-as-secure=http://localhost:3000 --user-data-dir=/tmp/chrome-dev
   ```

3. **Run your app normally**:
   ```bash
   pnpm run dev
   ```

### Option 3: Use ngrok (Cloud Tunnel)

1. **Install ngrok**:
   ```bash
   # macOS
   brew install ngrok
   
   # Or download from https://ngrok.com/download
   ```

2. **Run your app**:
   ```bash
   pnpm run dev
   ```

3. **In another terminal, create HTTPS tunnel**:
   ```bash
   ngrok http 3000
   ```

4. **Use the HTTPS URL** provided by ngrok (e.g., `https://abc123.ngrok.io`)

## Why HTTPS is Required

The Web Speech API requires a secure context for privacy and security reasons:

- **Microphone access** is sensitive and requires user permission
- **Speech data** is transmitted to speech recognition services
- **Browser security policies** prevent microphone access over HTTP

## Troubleshooting

### If voice button is disabled:
1. Check browser console for errors
2. Verify you're using HTTPS
3. Ensure microphone permissions are granted
4. Try a supported browser (Chrome, Edge, Safari)

### If microphone permission is denied:
1. Click the microphone icon in the browser address bar
2. Select "Allow" for microphone access
3. Refresh the page

### Browser Support:
- ✅ **Chrome/Edge**: Full support with HTTPS
- ✅ **Safari**: Full support with HTTPS  
- ❌ **Firefox**: Not supported (no Web Speech API)

## Testing the Fix

1. Start the HTTPS development server
2. Navigate to `https://localhost:3000`
3. Accept the security warning (for self-signed certificates)
4. Look for the microphone button in the chat input
5. Click it and grant microphone permission when prompted
6. Start speaking - you should see real-time transcription

The voice input button should now be enabled and functional!