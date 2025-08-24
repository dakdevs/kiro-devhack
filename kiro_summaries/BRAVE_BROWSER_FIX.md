# Brave Browser Voice Input Fix

## The Problem
You're seeing "Speech recognition error: 'network'" because Brave browser blocks the Web Speech API by default for privacy reasons.

## Quick Fix Steps

### Method 1: Brave Shields Settings (Recommended)
1. **Look for the orange notification** at the top of your page with the lion emoji 🦁
2. **Follow the instructions** in that notification, or:
3. **Click the Brave Shields icon** (🦁) in your browser's address bar
4. **Change these settings**:
   - Set "Block fingerprinting" to **"Allow all fingerprinting"**
   - Set "Block scripts" to **"Allow all scripts"**
5. **Refresh the page**
6. **Click the microphone button** and allow access when prompted

### Method 2: Brave Settings (Alternative)
1. Go to `brave://settings/content/microphone`
2. Click "Add" next to "Allowed to use your microphone"
3. Enter: `https://localhost:3000`
4. Click "Add"
5. Refresh your page

### Method 3: Disable Brave Shields (Temporary)
1. Click the Brave Shields icon (🦁) in the address bar
2. Toggle "Shields" to **OFF** for this site
3. Refresh the page
4. Try the microphone again

## Test Your Fix

After applying any of the above methods:

1. **Look for the debug tools** on your page:
   - 🔬 **Mic Test** (purple button, bottom-right)
   - 🎤 **Debug** (blue button, bottom-right)

2. **Click "🔬 Mic Test"** and run:
   - "📋 Browser Info" - should show `Brave Browser: true`
   - "🎤 Test Microphone" - should show "✅ Microphone access granted"
   - "🗣️ Test Speech Recognition" - should work without network errors

3. **Try the voice input** in the chat:
   - The microphone button should stay active (not mute immediately)
   - You should see real-time transcription when you speak

## Expected Results

✅ **Working**: Microphone button stays active, shows transcription
❌ **Still broken**: Button mutes immediately, network error in console

## If Still Not Working

Try this **nuclear option**:

1. **Close ALL Brave browser windows**
2. **Start Brave with flags**:
   ```bash
   # macOS
   /Applications/Brave\ Browser.app/Contents/MacOS/Brave\ Browser --disable-web-security --user-data-dir=/tmp/brave-dev --unsafely-treat-insecure-origin-as-secure=https://localhost:3000
   
   # Windows
   "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe" --disable-web-security --user-data-dir=c:\temp\brave-dev --unsafely-treat-insecure-origin-as-secure=https://localhost:3000
   
   # Linux
   brave-browser --disable-web-security --user-data-dir=/tmp/brave-dev --unsafely-treat-insecure-origin-as-secure=https://localhost:3000
   ```
3. **Navigate to your app**: `https://localhost:3000`
4. **Test the microphone**

## Alternative: Use Chrome for Testing

If Brave continues to cause issues, you can test with Chrome:
1. **Install Chrome** if you don't have it
2. **Navigate to**: `https://localhost:3000`
3. **Allow microphone access** when prompted
4. **Test voice input** - it should work immediately

The voice input feature is fully functional - it's just Brave's privacy settings that are blocking it!