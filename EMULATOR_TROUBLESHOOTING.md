# Android Emulator Qt Error Troubleshooting

## Problem
Error: `Incompatible processor. This Qt build requires the following features: neon crc32`

## Root Cause
You're running macOS 26.1, which is very new. The Android emulator's Qt libraries were built for older macOS versions and may not be compatible with macOS 26.1.

## Current Status
- **Emulator Version**: 36.2.12 (Build 14214601) - November 2024
- **macOS Version**: 26.1 (Very new, possibly beta)
- **Issue**: Qt libraries in emulator 36.2.12 may not be compatible with macOS 26.1

## Solutions (Try in order)

### Solution 1: Update Android Emulator via Android Studio (Recommended)
The emulator version 36.2.12 may not support macOS 26.1 yet. Update to the latest version:

1. Open **Android Studio**
2. Go to **Tools > SDK Manager**
3. Click the **SDK Tools** tab
4. Check **Android Emulator**
5. Click **Apply** to update to the latest version
6. After update, try launching the emulator again

### Solution 2: Use Android Studio Device Manager
Android Studio may handle compatibility better:
1. Open Android Studio
2. Click **Device Manager** (or Tools > Device Manager)
3. Find your emulator (Pixel_7_Pro or Pixel_3a_API_33_arm64-v8a)
4. Click the **Play** button to start it

### Solution 2: Use Android Studio to Launch Emulator
Android Studio may handle compatibility better:
1. Open Android Studio
2. Tools > Device Manager
3. Click the play button next to your emulator

### Solution 3: Use Cursor Emulator Extension (Has Bug)
**⚠️ Known Issue**: The extension has a bug causing `TypeError [ERR_INVALID_ARG_TYPE]` error.

**Workaround Options**:
1. **Use VSCode Tasks** (Recommended workaround):
   - Press `Cmd+Shift+P`
   - Type "Tasks: Run Task"
   - Select "Start Android Emulator (Pixel_7_Pro)" or "Start Android Emulator (Pixel_3a)"

2. **Use npm script**:
   ```bash
   npm run emulator
   # or
   npm run emulator:3a
   ```

3. **Fix extension configuration** (if the bug gets fixed):
   - The emulator path is already configured in `.vscode/settings.json`
   - Try updating the extension to the latest version

### Solution 4: Try Different Graphics Backend
Update the emulator script in package.json to use different graphics:

```bash
npm run emulator:swiftshader
```

### Solution 5: Check for Emulator Updates via Command Line
```bash
# List installed packages
~/Library/Android/sdk/cmdline-tools/latest/bin/sdkmanager --list | grep emulator

# Update emulator
~/Library/Android/sdk/cmdline-tools/latest/bin/sdkmanager "emulator"
```

### Solution 6: Reinstall Emulator (Last Resort)
If all else fails, you may need to:
1. Uninstall the current emulator via Android Studio SDK Manager
2. Reinstall the latest version
3. Or wait for Google to release a macOS 26.1 compatible version

## Quick Test Commands

```bash
# Check emulator version
cat ~/Library/Android/sdk/emulator/source.properties

# List available AVDs
~/Library/Android/sdk/emulator/emulator -list-avds

# Try with different graphics backend
~/Library/Android/sdk/emulator/emulator -avd Pixel_7_Pro -gpu swiftshader-indirect
```

