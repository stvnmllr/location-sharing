const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// In-memory session storage
// Structure: Map<sessionId, { sessionId, latestLocation, sharer, viewers, createdAt, lastActivity }>
const sessions = new Map();

// Session timeout: delete sessions after 5 minutes of inactivity (for cleanup)
const SESSION_TIMEOUT = 10 * 60 * 1000; // 5 minutes

// Generate cryptographically secure random session ID (8 characters, alphanumeric)
function generateSessionId() {
    // Generate random bytes and convert to base36 (0-9, a-z)
    // Use enough bytes to ensure we get at least 8 characters
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let sessionId = '';
    const randomBytes = crypto.randomBytes(6);
    
    for (let i = 0; i < 8; i++) {
        sessionId += chars[randomBytes[i % randomBytes.length] % chars.length];
    }
    
    return sessionId;
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle session creation
    socket.on('create-session', () => {
        console.log('Create session requested from:', socket.id);
        
        // Generate unique session ID
        let sessionId = generateSessionId();
        while (sessions.has(sessionId)) {
            sessionId = generateSessionId(); // Ensure uniqueness
        }
        
        // Create session in memory
        const session = {
            sessionId: sessionId,
            latestLocation: null,
            sharer: socket.id,
            viewers: [],
            createdAt: Date.now(),
            lastActivity: Date.now()
        };
        
        sessions.set(sessionId, session);
        console.log('Session created:', sessionId);
        
        // Store session ID on socket for cleanup
        socket.data.sessionId = sessionId;
        socket.data.role = 'sharer';
        
        // Send session ID to client
        socket.emit('session-created', { sessionId: sessionId });
    });

    // Handle session joining (for viewers) or reconnection (for sharers)
    socket.on('join-session', (data) => {
        const sessionId = (data.sessionId || '').toUpperCase().trim();
        const isReconnect = data.isReconnect || false;
        console.log('Join session requested:', sessionId, 'from:', socket.id, 'reconnect:', isReconnect);
        
        // Validate session exists
        if (!sessionId || !sessions.has(sessionId)) {
            socket.emit('session-not-found', { message: 'Session not found' });
            return;
        }
        
        const session = sessions.get(sessionId);
        
        if (isReconnect && session.sharer) {
            // Sharer is reconnecting - update sharer socket ID
            session.sharer = socket.id;
            session.lastActivity = Date.now();
            socket.data.sessionId = sessionId;
            socket.data.role = 'sharer';
            
            socket.emit('session-reconnected', { sessionId: sessionId });
            console.log('Sharer reconnected to session:', sessionId);
            
            // Resume location tracking if location was being shared
            if (session.latestLocation) {
                socket.emit('resume-sharing', { sessionId: sessionId });
            }
        } else {
            // Regular viewer joining
            if (!session.viewers.includes(socket.id)) {
                session.viewers.push(socket.id);
            }
            
            socket.data.sessionId = sessionId;
            socket.data.role = 'viewer';
            
            // Send current location if available
            if (session.latestLocation) {
                socket.emit('location-update', session.latestLocation);
            }
            
            socket.emit('session-joined', { sessionId: sessionId });
            console.log('Viewer joined session:', sessionId);
        }
        
        session.lastActivity = Date.now();
    });

    // Handle location updates from sharer
    socket.on('location-update', (data) => {
        const sessionId = socket.data.sessionId;
        
        if (!sessionId || !sessions.has(sessionId)) {
            return;
        }
        
        const session = sessions.get(sessionId);
        
        // Only accept updates from the sharer
        if (socket.data.role !== 'sharer' || socket.id !== session.sharer) {
            return;
        }
        
        // Update session with latest location
        session.latestLocation = {
            lat: data.lat,
            lng: data.lng,
            timestamp: Date.now()
        };
        session.lastActivity = Date.now();
        
        console.log('Location update for session:', sessionId, data);
        
        // Broadcast to all viewers
        session.viewers.forEach(viewerId => {
            io.to(viewerId).emit('location-update', session.latestLocation);
        });
    });

    // Cleanup on disconnect
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        const sessionId = socket.data.sessionId;
        
        if (!sessionId || !sessions.has(sessionId)) {
            return;
        }
        
        const session = sessions.get(sessionId);
        
        if (socket.data.role === 'sharer') {
            // Don't delete session immediately - allow reconnection
            // Just mark that sharer is disconnected, but keep session alive
            // Session will be cleaned up by timeout if no reconnection
            console.log('Sharer disconnected from session:', sessionId, '(session kept alive for reconnection)');
            // Keep session alive - don't delete it
        } else if (socket.data.role === 'viewer') {
            // Remove viewer from session
            session.viewers = session.viewers.filter(id => id !== socket.id);
            console.log('Viewer removed from session:', sessionId);
        }
    });
});

// Cleanup old sessions periodically
setInterval(() => {
    const now = Date.now();
    for (const [sessionId, session] of sessions.entries()) {
        if (now - session.lastActivity > SESSION_TIMEOUT) {
            sessions.delete(sessionId);
            console.log('Session expired and deleted:', sessionId);
        }
    }
}, 60000); // Check every minute

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces
server.listen(PORT, HOST, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Server accessible on local network at http://<your-ip>:${PORT}`);
    console.log('Run: ip addr show | grep "inet " to find your IP address');
});

