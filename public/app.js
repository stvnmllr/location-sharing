// TODO: Initialize Socket.io connection
// TODO: Implement location sharing functionality
// TODO: Implement location viewing functionality
// TODO: Integrate Leaflet.js

// Configuration
const SOCKET_URL = window.location.origin;
const UPDATE_INTERVAL = 5000; // 5 seconds

// State
let socket = null;
let map = null;
let marker = null;
let watchId = null;
let currentSessionId = null;
let isSharing = false;
let isViewing = false;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeViews();
    // TODO: Initialize socket connection
    // TODO: Set up event listeners
});

function initializeViews() {
    // View switcher
    document.getElementById('switch-to-share').addEventListener('click', () => {
        showView('share');
    });
    
    document.getElementById('switch-to-view').addEventListener('click', () => {
        showView('view');
    });

    // Share view buttons
    document.getElementById('start-sharing-btn').addEventListener('click', startSharing);
    document.getElementById('stop-sharing-btn').addEventListener('click', stopSharing);
    document.getElementById('copy-btn').addEventListener('click', copySessionId);

    // View view buttons
    document.getElementById('join-btn').addEventListener('click', joinSession);
    document.getElementById('leave-btn').addEventListener('click', leaveSession);

    // Enter key for session ID input
    document.getElementById('session-id-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            joinSession();
        }
    });
}

function showView(viewName) {
    // Hide all views
    document.getElementById('share-view').classList.add('hidden');
    document.getElementById('view-view').classList.add('hidden');
    
    // Show selected view
    if (viewName === 'share') {
        document.getElementById('share-view').classList.remove('hidden');
        document.getElementById('switch-to-share').classList.add('active');
        document.getElementById('switch-to-view').classList.remove('active');
    } else {
        document.getElementById('view-view').classList.remove('hidden');
        document.getElementById('switch-to-view').classList.add('active');
        document.getElementById('switch-to-share').classList.remove('active');
    }
}

function startSharing() {
    // TODO: Request geolocation permission
    // TODO: Connect to socket
    // TODO: Create session
    // TODO: Start periodic location updates
    console.log('Start sharing - to be implemented');
}

function stopSharing() {
    // TODO: Stop location updates
    // TODO: Disconnect from session
    // TODO: Clear UI
    console.log('Stop sharing - to be implemented');
}

function joinSession() {
    // TODO: Get session ID from input
    // TODO: Connect to socket
    // TODO: Join session
    // TODO: Initialize map
    console.log('Join session - to be implemented');
}

function leaveSession() {
    // TODO: Disconnect from session
    // TODO: Clear map
    // TODO: Reset UI
    console.log('Leave session - to be implemented');
}

function copySessionId() {
    const sessionIdInput = document.getElementById('session-id-display');
    sessionIdInput.select();
    document.execCommand('copy');
    // TODO: Show feedback that it was copied
}

// TODO: Add functions for:
// - initializeSocket()
// - getCurrentLocation()
// - sendLocationUpdate()
// - initializeMap() // Initialize Leaflet map
// - updateMapMarker() // Update Leaflet marker position
// - handleSocketEvents()

