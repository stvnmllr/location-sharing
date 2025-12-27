# Quick Start Guide

## Local Development Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Start the Server

**Note**: No environment variables needed! OpenStreetMap is free and doesn't require an API key.

```bash
cd server
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

### 3. Open in Browser

Visit: http://localhost:3000

### 4. Test the Application

1. Click "Start Sharing" and grant location permission
2. Copy the session ID
3. Open another browser/incognito window
4. Switch to "View" tab
5. Paste the session ID and click "View Location"
6. You should see the location on the map updating in real-time

## Next Steps

The skeleton is set up with TODOs in the code. You'll need to implement:

1. **Backend (`server/server.js`)**:
   - Session ID generation
   - Socket.io event handlers
   - Location broadcasting logic

2. **Frontend (`public/app.js`)**:
   - Socket.io client connection
   - Geolocation API integration
   - Leaflet.js map initialization
   - Real-time location updates

See `ARCHITECTURE.md` and `FEATURES.md` for detailed implementation guidance.

