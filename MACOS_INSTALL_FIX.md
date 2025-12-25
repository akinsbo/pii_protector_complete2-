# macOS Installation Fix

If you get the error **"pii-protector" is damaged and can't be opened**, this is a macOS Gatekeeper security feature blocking unsigned apps.

## Quick Fix (Recommended)

1. **Right-click** on the app and select **"Open"**
2. Click **"Open"** in the dialog that appears
3. The app will now run and be trusted for future launches

## Alternative Fix (Terminal)

If the right-click method doesn't work:

```bash
# Remove quarantine attribute
xattr -d com.apple.quarantine "/Applications/Ledebe Protector.app"

# Or if installed elsewhere, replace with actual path:
xattr -d com.apple.quarantine "/path/to/Ledebe Protector.app"
```

## Why This Happens

- The app is not code-signed with an Apple Developer Certificate
- macOS Gatekeeper blocks unsigned apps by default
- This is a security feature, not actual damage to the app

## Security Note

This app is safe to use. The "damaged" message is misleading - it's just macOS being cautious about unsigned applications.

---

**Need help?** Contact support or check our documentation for more details.