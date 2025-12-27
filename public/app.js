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
    initializeSocket();
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

// Initialize Socket.io connection
function initializeSocket() {
    socket = io(SOCKET_URL);
    
    socket.on('connect', () => {
        console.log('Connected to server');
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        if (isSharing) {
            updateSharingStatus('Disconnected');
        }
        if (isViewing) {
            updateViewStatus('Disconnected');
        }
    });
    
    // Handle session creation response
    socket.on('session-created', (data) => {
        currentSessionId = data.sessionId;
        document.getElementById('session-id-display').value = currentSessionId;
        document.getElementById('sharing-info').classList.remove('hidden');
        updateSharingStatus('Sharing...');
        
        // Start getting location updates
        startLocationTracking();
    });
    
    // Handle session joined response
    socket.on('session-joined', (data) => {
        console.log('Joined session:', data.sessionId);
        updateViewStatus('Connected');
    });
    
    // Handle session not found error
    socket.on('session-not-found', (data) => {
        showError('Session not found. Please check the session ID.');
        document.getElementById('map-container').classList.add('hidden');
    });
    
    // Handle location updates (for viewers)
    socket.on('location-update', (location) => {
        if (isViewing && map) {
            updateMapMarker(location);
        }
    });
}

// Start sharing location
function startSharing() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }
    
    // Check if we have permission (some browsers support this)
    if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
            if (result.state === 'denied') {
                alert('Location permission is denied. Please enable it in your browser settings.');
                updateSharingStatus('Permission denied');
                return;
            }
            proceedWithSharing();
        }).catch(() => {
            // If permissions API not supported, proceed anyway
            proceedWithSharing();
        });
    } else {
        // Permissions API not supported, proceed directly
        proceedWithSharing();
    }
}

function proceedWithSharing() {
    // Create session first
    socket.emit('create-session');
    isSharing = true;
    
    // Button will be hidden by sharing-info div
    document.getElementById('start-sharing-btn').style.display = 'none';
    
    // Show a message about allowing location
    updateSharingStatus('Requesting location...');
}

// Stop sharing location
function stopSharing() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    
    isSharing = false;
    currentSessionId = null;
    
    // Reset UI
    document.getElementById('sharing-info').classList.add('hidden');
    document.getElementById('start-sharing-btn').style.display = 'block';
    document.getElementById('session-id-display').value = '';
    updateSharingStatus('Stopped');
    
    // Disconnect socket if we were the only connection
    if (socket) {
        socket.disconnect();
        socket.connect(); // Reconnect for potential new session
    }
}

// Join a session to view location
function joinSession() {
    const sessionIdInput = document.getElementById('session-id-input');
    const sessionId = sessionIdInput.value.trim().toUpperCase();
    
    if (!sessionId) {
        showError('Please enter a session ID');
        return;
    }
    
    // Hide error message
    document.getElementById('error-message').classList.add('hidden');
    
    // Join session
    socket.emit('join-session', { sessionId: sessionId });
    currentSessionId = sessionId;
    isViewing = true;
    
    // Initialize map
    if (!map) {
        initializeMap();
    }
    
    document.getElementById('join-session').classList.add('hidden');
    document.getElementById('map-container').classList.remove('hidden');
}

// Leave viewing session
function leaveSession() {
    isViewing = false;
    currentSessionId = null;
    
    // Reset UI
    document.getElementById('map-container').classList.add('hidden');
    document.getElementById('join-session').classList.remove('hidden');
    document.getElementById('session-id-input').value = '';
    document.getElementById('error-message').classList.add('hidden');
    
    // Clear map
    if (marker) {
        map.removeLayer(marker);
        marker = null;
    }
    
    updateViewStatus('Disconnected');
}

// Start tracking location (for sharer)
function startLocationTracking() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        updateSharingStatus('Not supported');
        return;
    }
    
    // Geolocation options - more forgiving for better compatibility
    const options = {
        enableHighAccuracy: false, // Start with false for better compatibility
        timeout: 10000, // Increase timeout to 10 seconds
        maximumAge: 30000 // Accept cached location up to 30 seconds old
    };
    
    // Get initial location
    navigator.geolocation.getCurrentPosition(
        (position) => {
            console.log('Initial location obtained:', position.coords);
            sendLocationUpdate(position);
            updateSharingStatus('Sharing...');
        },
        (error) => {
            console.error('Geolocation error:', error);
            let errorMessage = 'Error getting location';
            let helpText = '';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Location permission denied';
                    helpText = 'Please enable location access:\n\n' +
                               '• Tap the lock/info icon in your browser address bar\n' +
                               '• Or go to Settings > Privacy > Location Services\n' +
                               '• Make sure location is enabled for this site';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location unavailable';
                    helpText = 'Your device cannot determine your location. Make sure:\n\n' +
                               '• GPS/Location Services are enabled\n' +
                               '• You are in an area with GPS signal';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Location request timed out';
                    helpText = 'The location request took too long. Please try again.';
                    break;
            }
            
            updateSharingStatus(errorMessage);
            if (helpText) {
                alert(`Location Error: ${errorMessage}\n\n${helpText}`);
            } else {
                alert(`Location Error: ${errorMessage}`);
            }
        },
        options
    );
    
    // Watch for location changes
    watchId = navigator.geolocation.watchPosition(
        (position) => {
            console.log('Location update:', position.coords);
            sendLocationUpdate(position);
        },
        (error) => {
            console.error('Geolocation watch error:', error);
            let errorMessage = 'Error getting location';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Permission denied - Check browser settings';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location unavailable';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Request timeout';
                    break;
            }
            
            updateSharingStatus(errorMessage);
        },
        options
    );
}

// Get current location
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => resolve(position),
            (error) => reject(error)
        );
    });
}

// Send location update to server
function sendLocationUpdate(position) {
    if (!socket || !socket.connected || !isSharing) {
        return;
    }
    
    const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
    };
    
    socket.emit('location-update', location);
    updateSharingStatus('Sharing...');
}

// Initialize Leaflet map
function initializeMap() {
    // Default center (San Francisco) - will be updated when location is received
    map = L.map('map').setView([37.7749, -122.4194], 13);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
    
    console.log('Map initialized');
}

// Update map marker with new location
function updateMapMarker(location) {
    const lat = location.lat;
    const lng = location.lng;
    
    if (!map) {
        initializeMap();
    }
    
    // Remove existing marker if it exists
    if (marker) {
        map.removeLayer(marker);
    }
    
    // Create new marker
    marker = L.marker([lat, lng]).addTo(map);
    
    // Center map on marker
    map.setView([lat, lng], map.getZoom() > 15 ? map.getZoom() : 15);
    
    // Update status
    updateViewStatus('Connected - Location updated');
}

// Update sharing status text
function updateSharingStatus(status) {
    const statusEl = document.getElementById('sharing-status');
    statusEl.textContent = status;
    
    if (status.includes('Error') || status === 'Disconnected') {
        statusEl.style.color = '#dc3545';
    } else {
        statusEl.style.color = '#28a745';
    }
}

// Update view status text
function updateViewStatus(status) {
    const statusEl = document.getElementById('view-status');
    statusEl.textContent = status;
    
    if (status === 'Disconnected') {
        statusEl.style.color = '#dc3545';
    } else {
        statusEl.style.color = '#28a745';
    }
}

// Show error message
function showError(message) {
    const errorEl = document.getElementById('error-message');
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
}

// Copy session ID to clipboard
function copySessionId() {
    const sessionIdInput = document.getElementById('session-id-display');
    sessionIdInput.select();
    sessionIdInput.setSelectionRange(0, 99999); // For mobile devices
    
    try {
        document.execCommand('copy');
        
        // Show feedback
        const copyBtn = document.getElementById('copy-btn');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.style.background = '#28a745';
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
    }
}

