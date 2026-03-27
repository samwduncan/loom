# iOS Deployment Guide — Loom

**Last updated:** 2026-03-27
**Mode:** server.url (personal use over Tailscale)
**Rebuild frequency:** Only when adding native Capacitor plugins or changing config. Web UI updates are instant — no rebuild needed.

---

## Prerequisites

| Requirement | Details |
|---|---|
| MacBook Pro | Any Apple Silicon or Intel Mac with macOS 14+ |
| Xcode | 16.0+ (download from App Store or developer.apple.com) |
| Apple Developer Account | $99/yr — enroll at developer.apple.com/programs |
| iPhone | iOS 15+ with Tailscale installed and connected to your tailnet |
| Loom server | Running on 100.86.4.57 (backend port 5555, frontend port 5184) |
| Node.js | 20+ (install via Homebrew: `brew install node`) |

### Why the $99 Developer Account?

Free Apple IDs can sideload apps, but they expire after **7 days** and you need to re-sign and reinstall. The paid account gives you a 1-year certificate. For an app you use daily, this is non-negotiable.

---

## Step 1: Apple Developer Account Setup

1. Go to https://developer.apple.com/programs/
2. Click **Enroll** and sign in with your Apple ID
3. Pay the $99/yr fee
4. Wait for enrollment approval (usually <24 hours, sometimes instant)
5. Once approved, your Apple ID is now a paid developer account — Xcode will detect it automatically

---

## Step 2: Clone and Build on the MacBook

```bash
# Clone the repo (or pull latest if already cloned)
git clone <your-repo-url> loom
cd loom/src

# Install dependencies
npm install

# Build web assets (creates dist/)
npm run build
```

---

## Step 3: Generate the iOS Project

The `ios/` folder is gitignored (generated scaffold shouldn't be committed). Regenerate it on the Mac:

```bash
cd /path/to/loom/src

# Generate the iOS Xcode project
npx cap add ios
```

If you get "ios platform already exists" (because an old scaffold is present):
```bash
rm -rf ios
npx cap add ios
```

---

## Step 4: Configure for Tailscale server.url Mode

Sync the web build into the iOS project **with your Tailscale server URL**:

```bash
cd /path/to/loom/src
CAPACITOR_SERVER_URL=http://100.86.4.57:5184 npx cap sync ios
```

This bakes the URL into `ios/App/App/capacitor.config.json`. The app will load Loom from your Tailscale server instead of bundled assets.

### Verify the config was set

```bash
cat ios/App/App/capacitor.config.json
```

You should see:
```json
{
  "appId": "com.loom.agent",
  "appName": "Loom",
  "webDir": "dist",
  "server": {
    "url": "http://100.86.4.57:5184",
    "cleartext": true,
    "allowNavigation": ["100.86.4.57:*", "*.ts.net"]
  },
  ...
}
```

If `"url"` is missing, the env var wasn't set. Run the sync command again.

---

## Step 5: Add ATS Exception for HTTP

iOS blocks HTTP connections by default (App Transport Security). You need to allow HTTP for the Tailscale IP.

Open `ios/App/App/Info.plist` in a text editor and add this inside the top-level `<dict>`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

**Note:** Capacitor may or may not add this automatically depending on the version. Check if it's already there before adding it. If you skip this step and the app shows a blank white screen, this is why.

---

## Step 6: Open in Xcode

```bash
cd /path/to/loom/src
npx cap open ios
```

This opens `ios/App/App.xcodeproj` in Xcode.

---

## Step 7: Configure Signing

1. In Xcode, click on the **App** project in the left sidebar (the blue icon at the top)
2. Select the **App** target
3. Go to the **Signing & Capabilities** tab
4. Check **Automatically manage signing**
5. **Team:** Select your Apple Developer account from the dropdown
6. **Bundle Identifier:** Should be `com.loom.agent` (already set by Capacitor)

If you see a red error about provisioning profiles, Xcode needs a moment to download them. Wait 30 seconds and it should resolve.

---

## Step 8: Set the Build Target

1. In the top toolbar, click the device selector (currently says "Any iOS Device" or similar)
2. Plug in your iPhone via USB **OR** enable wireless debugging:
   - On iPhone: Settings → Developer → Enable wireless debugging (requires iOS 16+)
   - On Mac: Window → Devices and Simulators → find your phone → Connect via Network
3. Select your iPhone from the dropdown

---

## Step 9: Build and Run

1. Press **Cmd+R** (or click the Play button)
2. First build takes 1-2 minutes (subsequent builds are faster)
3. If prompted about trusting the developer on the iPhone:
   - On iPhone: **Settings → General → VPN & Device Management**
   - Find your developer certificate and tap **Trust**
4. The app launches on your iPhone

---

## Step 10: Verify It Works

1. Make sure **Tailscale is connected** on your iPhone
2. Loom should load in full-screen (no Safari chrome)
3. Test: send a message, verify streaming works
4. Test: check WebSocket connection (terminal tab, if applicable)
5. Background the app and reopen — should reconnect automatically

If you see a **white screen**: ATS is blocking HTTP. Go back to Step 5.
If you see a **connection error**: Tailscale is not connected on the iPhone, or the Loom server is not running.

---

## Day-to-Day Usage

### You DO NOT need to rebuild when:
- You change Loom's frontend code (just refresh — content loads from the server)
- You update the backend
- You restart the Loom server
- You change CSS, components, features — anything web-side

### You DO need to rebuild when:
- You add a new Capacitor plugin (push notifications, haptics, etc.)
- You change `capacitor.config.ts` settings
- Your Tailscale IP changes (update `CAPACITOR_SERVER_URL` and re-sync)
- Xcode or iOS major version updates that require project regeneration

### Rebuild procedure (when needed):
```bash
cd /path/to/loom/src
npm run build
CAPACITOR_SERVER_URL=http://100.86.4.57:5184 npx cap sync ios
# Then open Xcode and hit Cmd+R
```

---

## App Icon (Optional but Recommended)

The default Capacitor app icon is a generic blue square. To customize:

1. Create a 1024x1024 PNG of the Loom icon (no transparency, no rounded corners — iOS adds rounding)
2. In Xcode: open `ios/App/App/Assets.xcassets/AppIcon.appiconset`
3. Drag your 1024x1024 image onto the **App Store** slot
4. Xcode auto-generates all smaller sizes

Alternatively, use a tool like https://www.appicon.co/ to generate all sizes at once, then replace the contents of the `AppIcon.appiconset` folder.

---

## Troubleshooting

### White screen on launch
**Cause:** ATS blocking HTTP to Tailscale IP
**Fix:** Add `NSAllowsArbitraryLoads` to Info.plist (Step 5)

### "Could not launch App" / signing error
**Cause:** Provisioning profile issue
**Fix:** Xcode → Signing & Capabilities → uncheck and re-check "Automatically manage signing". Select your team again. If still failing, go to developer.apple.com → Certificates, Identifiers & Profiles → Devices → make sure your iPhone's UDID is registered.

### App launches but can't connect
**Cause:** Tailscale not active on iPhone, or server not running
**Fix:** Check Tailscale status on iPhone. Verify `http://100.86.4.57:5184` loads in Safari on the phone first.

### WebSocket disconnects frequently
**Cause:** iOS aggressively suspends background network connections
**Fix:** This is normal iOS behavior. The app should reconnect when foregrounded. If it doesn't, the frontend's WebSocket reconnection logic needs to handle the `visibilitychange` event (already implemented in Loom's connection store).

### "Untrusted Developer" on iPhone
**Cause:** First-time install from this developer certificate
**Fix:** Settings → General → VPN & Device Management → trust your certificate

### Build fails with "No such module 'Capacitor'"
**Cause:** SPM packages not resolved
**Fix:** In Xcode: File → Packages → Resolve Package Versions. Wait for download to complete, then build again.

---

## Future: Adding Push Notifications

When you're ready to add native push notifications:

### 1. Install the plugin
```bash
cd /path/to/loom/src
npm install @capacitor/push-notifications
npx cap sync ios
```

### 2. Add capability in Xcode
- App target → Signing & Capabilities → **+ Capability** → **Push Notifications**
- Also add **Background Modes** → check **Remote notifications**

### 3. Create APNs key
- developer.apple.com → Certificates, Identifiers & Profiles → Keys
- Create a new key, enable **Apple Push Notifications service (APNs)**
- Download the `.p8` file (save it — you can only download it once)
- Note the Key ID and your Team ID

### 4. Add registration code to AppDelegate.swift
```swift
import Capacitor
import UserNotifications

// In didFinishLaunchingWithOptions:
UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
    if granted {
        DispatchQueue.main.async {
            UIApplication.shared.registerForRemoteNotifications()
        }
    }
}
```

### 5. Frontend integration
```typescript
import { PushNotifications } from '@capacitor/push-notifications';

// Request permission and get token
const result = await PushNotifications.requestPermissions();
if (result.receive === 'granted') {
  await PushNotifications.register();
}

// Listen for token
PushNotifications.addListener('registration', (token) => {
  // Send token.value to your backend for storage
  fetch('/api/push/register', {
    method: 'POST',
    body: JSON.stringify({ token: token.value })
  });
});
```

### 6. Backend: send pushes
Use a library like `apn` or `node-apn` on the Express backend to send notifications when:
- A long-running Claude session completes
- A session receives a response while the app is backgrounded
- An error occurs that needs attention

This is a half-day project and would make a good standalone phase when you're ready.

---

## Quick Reference

```bash
# === FIRST TIME SETUP ===
cd /path/to/loom/src
npm install
npm run build
npx cap add ios
CAPACITOR_SERVER_URL=http://100.86.4.57:5184 npx cap sync ios
# Edit ios/App/App/Info.plist → add NSAllowsArbitraryLoads (if not present)
npx cap open ios
# In Xcode: set signing team, select iPhone, Cmd+R

# === REBUILD (when needed) ===
cd /path/to/loom/src
npm run build
CAPACITOR_SERVER_URL=http://100.86.4.57:5184 npx cap sync ios
# Xcode: Cmd+R

# === ADD A PLUGIN (e.g., haptics) ===
cd /path/to/loom/src
npm install @capacitor/haptics
npx cap sync ios
# Xcode: Cmd+R
```
