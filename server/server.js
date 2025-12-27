// TODO: Implement Express server
// TODO: Set up Socket.io
// TODO: Implement session management
// TODO: Implement location broadcasting

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// In-memory session storage
const sessions = new Map();

// TODO: Generate session ID function
function generateSessionId() {
    // TODO: Generate cryptographically secure random session ID
    return 'ABC123'; // Placeholder
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // TODO: Handle session creation
    socket.on('create-session', () => {
        console.log('Create session requested');
        // TODO: Generate session ID
        // TODO: Create session in memory
        // TODO: Send session ID to client
    });

    // TODO: Handle session joining
    socket.on('join-session', (sessionId) => {
        console.log('Join session requested:', sessionId);
        // TODO: Validate session exists
        // TODO: Add viewer to session
        // TODO: Send current location if available
    });

    // TODO: Handle location updates
    socket.on('location-update', (data) => {
        console.log('Location update received:', data);
        // TODO: Update session with latest location
        // TODO: Broadcast to all viewers
    });

    // Cleanup on disconnect
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // TODO: Remove from sessions
        // TODO: Clean up empty sessions
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

