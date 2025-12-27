# TheBrain - Real-Time Location Sharing

A web application that allows users to share their real-time location with others and view shared locations on an interactive map.

## Project Overview

**TheBrain** enables one person to share their live location, which another person can view in real-time on a map interface. Perfect for meeting up, tracking deliveries, or keeping tabs on friends and family.

## Core Features

### MVP (Minimum Viable Product)
- [ ] **Location Sharing**: Share your current location with a unique session ID
- [ ] **Location Viewing**: Enter a session ID to view someone else's location
- [ ] **Real-Time Updates**: Location updates automatically as the sharer moves
- [ ] **Interactive Map**: Display location on an interactive map
- [ ] **Session Management**: Create and join location sharing sessions

### Future Enhancements
- User authentication and accounts
- Location history/timeline
- Multiple location sharing (groups)
- Chat/messaging alongside location
- Location sharing with time limits
- Geofencing and alerts
- Mobile app version

## Technology Stack

### Frontend
- **Language**: Plain JavaScript (ES6+)
- **Maps**: Leaflet.js with OpenStreetMap
- **Styling**: Plain CSS
- **Real-time**: Socket.io client

### Backend
- **Runtime**: Node.js with Express
- **Real-time**: Socket.io server
- **Storage**: In-memory (no database for MVP)
- **Location API**: Browser Geolocation API

### Infrastructure
- **Hosting**: Render.com (both frontend and backend)
- **Maps Provider**: OpenStreetMap (free, no API key required)

## Project Structure

```
thebrain/
├── public/            # Static frontend files (HTML, CSS, JS)
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── server/            # Node.js backend server
│   ├── server.js
│   └── package.json
├── docs/             # Documentation and planning
└── README.md         # This file
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Install backend dependencies
cd server
npm install

# No environment variables needed for MVP (OpenStreetMap is free)
```

## Development Roadmap

### Phase 1: Basic Setup
- [ ] Initialize frontend and backend projects
- [ ] Set up development environment
- [ ] Configure maps library
- [ ] Create basic UI layout

### Phase 2: Core Functionality
- [ ] Implement location capture (Geolocation API)
- [ ] Create session system (generate/join sessions)
- [ ] Set up WebSocket connection
- [ ] Build map display component
- [ ] Connect frontend to backend

### Phase 3: Real-Time Updates
- [ ] Implement real-time location broadcasting
- [ ] Add location update intervals
- [ ] Handle connection/disconnection gracefully

### Phase 4: Polish & Deploy
- [ ] Error handling and edge cases
- [ ] UI/UX improvements
- [ ] Testing
- [ ] Deployment

## How It Works

1. **Sharer**: Opens the app, clicks "Share Location", gets a session ID
2. **Viewer**: Enters the session ID to join and see the sharer's location
3. **Real-Time**: Sharer's device periodically sends location updates via WebSocket
4. **Display**: Viewer's map updates in real-time showing current position

## Security Considerations

- Session IDs should be randomly generated (cryptographically secure)
- Rate limiting on location updates
- HTTPS required for Geolocation API
- Consider privacy controls (who can view, time limits)

## License

MIT License (or specify your preference)

