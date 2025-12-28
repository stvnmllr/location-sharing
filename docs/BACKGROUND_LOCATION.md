# Background Location Tracking

## Limitations

Browsers have significant limitations when tracking location in the background:

### Desktop Browsers
- ✅ **Background tabs**: Usually continue tracking, but may throttle updates
- ✅ **Minimized browser**: May continue tracking (depends on browser)

### Mobile Browsers
- ⚠️ **Background tabs**: Heavily throttled or suspended
- ⚠️ **Switched apps**: Location tracking is typically suspended
- ⚠️ **Locked screen**: Location tracking stops
- ❌ **Safari iOS**: Very aggressive about suspending background tabs

### Progressive Web Apps (PWAs)
- ✅ **Installed PWA**: Better background support when installed as an app
- ✅ **Service Workers**: Can help maintain connections in background
- ⚠️ **Still limited**: Operating systems may still suspend apps

## Current Implementation

The app implements several strategies to maximize background location tracking:

1. **watchPosition()**: Primary method for continuous location updates
2. **Visibility API**: Detects when page goes to background
3. **Periodic fallback**: Uses `getCurrentPosition()` every 30 seconds when in background (where supported)
4. **Socket reconnection**: Maintains connection to server even if location updates pause

## How It Works

1. When page is **visible**: Uses `watchPosition()` for real-time updates
2. When page goes to **background**:
   - Continues `watchPosition()` (may be throttled by browser)
   - Adds periodic `getCurrentPosition()` as fallback (every 30 seconds)
   - Updates status to "Sharing (background)..."
3. When page returns to **foreground**: 
   - Stops periodic fallback
   - Gets fresh location immediately
   - Returns to normal `watchPosition()` updates

## Browser Support

| Browser | Background Tracking | Notes |
|---------|-------------------|-------|
| Chrome Desktop | ✅ Good | Continues in background tabs |
| Chrome Android | ⚠️ Limited | Throttled when app switched |
| Firefox Desktop | ✅ Good | Continues in background tabs |
| Firefox Android | ⚠️ Limited | Throttled when app switched |
| Safari iOS | ❌ Poor | Very aggressive suspension |
| Safari macOS | ⚠️ Moderate | Some throttling in background |

## Recommendations for Better Background Tracking

### For Users:
1. **Keep app in foreground**: Best way to ensure continuous tracking
2. **Install as PWA**: Better background support when installed
3. **Keep screen on**: Prevents most background suspension
4. **Use desktop**: Desktop browsers have better background support

### For Developers (Future Enhancements):
1. **Service Worker**: Implement background sync
2. **Push Notifications**: Wake app periodically (requires server)
3. **Native App**: Consider React Native/Flutter for true background tracking
4. **Background Geolocation API**: Browser API (still experimental)

## Technical Notes

- Background intervals use less accurate settings (`enableHighAccuracy: false`) to save battery
- Updates every 30 seconds in background (vs 5 seconds when foreground)
- Accepts cached location up to 1 minute old in background mode
- Socket connection is maintained independently of location updates

