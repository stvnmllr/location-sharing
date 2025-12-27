# Architecture Overview

## System Architecture

### High-Level Flow

```
[Sharer Browser]  ←→  [Backend Server]  ←→  [Viewer Browser]
     ↓                      ↓                      ↓
  Geolocation          Socket.io              Leaflet Map
     API                Server                Display
```

## Components

### Frontend (Plain JavaScript)

**Location**: `/public/`

- **index.html**: Main HTML structure with two views:
  - Share view: Button to start sharing location
  - View view: Input to join a session and see location on map

- **app.js**: 
  - Handle Geolocation API to get user's location
  - Socket.io client connection
  - Leaflet.js map initialization
  - Session management (create/join sessions)
  - Real-time location updates

- **styles.css**: All styling with plain CSS

### Backend (Node.js/Express)

**Location**: `/server/`

- **server.js**: 
  - Express server serving static files
  - Socket.io server for real-time communication
  - In-memory session storage (Map/object)
  - Session ID generation
  - Location broadcasting

## Data Flow

### Sharing Location Flow

1. User clicks "Share Location" in browser
2. Browser requests geolocation permission
3. Frontend generates/requests session ID from backend
4. Frontend connects to Socket.io with session ID
5. Backend creates session in memory (sessionId → { locations: [] })
6. Frontend periodically sends location updates via WebSocket
7. Backend stores latest location in session
8. Backend broadcasts location to all connected viewers of that session

### Viewing Location Flow

1. User enters session ID and clicks "View Location"
2. Frontend connects to Socket.io with session ID
3. Backend adds client to session's viewer list
4. Backend sends current location (if available) to new viewer
5. Backend continues broadcasting updates to all viewers
6. Leaflet map updates marker position in real-time

## Session Storage (In-Memory)

```javascript
// In-memory structure
const sessions = {
  'abc123': {
    sessionId: 'abc123',
    latestLocation: { lat: 37.7749, lng: -122.4194, timestamp: Date.now() },
    sharer: socketId,
    viewers: [socketId1, socketId2],
    createdAt: Date.now()
  }
}
```

**Note**: Sessions will be lost on server restart. For persistence later, we can add a database.

## WebSocket Events

### Client → Server
- `create-session`: Create a new sharing session
- `join-session`: Join an existing session to view
- `location-update`: Send location update (from sharer)
- `disconnect`: Clean up session when user leaves

### Server → Client
- `session-created`: Send session ID to sharer
- `location-update`: Broadcast location to viewers
- `session-not-found`: Error when joining invalid session
- `connection-established`: Confirm connection

## Security Considerations

1. **Session IDs**: Use cryptographically secure random generation
2. **Rate Limiting**: Limit location update frequency
3. **HTTPS**: Required for Geolocation API and Render.com
4. **CORS**: Configure properly for production
5. **Input Validation**: Validate session IDs before use

## Deployment (Render.com)

### Backend Service
- Type: Web Service
- Build Command: `cd server && npm install`
- Start Command: `cd server && node server.js`
- Environment Variables:
  - `PORT` (set by Render)
  - No API keys needed (OpenStreetMap is free)

### Static Files
- Serve static files from Express (`/public` directory)
- OR use Render's Static Site option for frontend separately

## Future Enhancements (when adding database)

- Persist sessions across server restarts
- Session expiration/cleanup
- Location history per session
- Multiple sharers per session
- User accounts and authentication

