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
    // Configure Socket.io for better reconnection
    socket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
        timeout: 20000
    });
    
    socket.on('connect', () => {
        console.log('Connected to server');
        
        // Try to reconnect to previous session if we were sharing or viewing
        const savedSessionId = localStorage.getItem('sessionId');
        const savedRole = localStorage.getItem('sessionRole');
        
        if (savedSessionId && savedRole === 'sharer' && isSharing) {
            // Reconnect as sharer
            console.log('Reconnecting as sharer to session:', savedSessionId);
            socket.emit('join-session', { 
                sessionId: savedSessionId, 
                isReconnect: true 
            });
        } else if (savedSessionId && savedRole === 'viewer' && isViewing) {
            // Reconnect as viewer
            console.log('Reconnecting as viewer to session:', savedSessionId);
            socket.emit('join-session', { 
                sessionId: savedSessionId, 
                isReconnect: false 
            });
        }
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        if (isSharing) {
            updateSharingStatus('Reconnecting...');
        }
        if (isViewing) {
            updateViewStatus('Reconnecting...');
        }
    });
    
    socket.on('reconnect', () => {
        console.log('Reconnected to server');
        // Reconnection logic is handled in 'connect' event
    });
    
    // Handle session creation response
    socket.on('session-created', (data) => {
        currentSessionId = data.sessionId;
        
        // Save to localStorage for reconnection
        localStorage.setItem('sessionId', currentSessionId);
        localStorage.setItem('sessionRole', 'sharer');
        
        document.getElementById('session-id-display').value = currentSessionId;
        document.getElementById('sharing-info').classList.remove('hidden');
        updateSharingStatus('Sharing...');
        
        // Start getting location updates
        startLocationTracking();
    });
    
    // Handle session reconnection response (for sharer)
    socket.on('session-reconnected', (data) => {
        console.log('Reconnected to session:', data.sessionId);
        currentSessionId = data.sessionId;
        updateSharingStatus('Sharing...');
        
        // Resume location tracking
        if (!watchId) {
            startLocationTracking();
        }
    });
    
    // Handle resume sharing (when reconnected)
    socket.on('resume-sharing', (data) => {
        console.log('Resuming sharing for session:', data.sessionId);
        // Location tracking should already be active, just update status
        updateSharingStatus('Sharing...');
    });
    
    // Handle session joined response
    socket.on('session-joined', (data) => {
        console.log('Joined session:', data.sessionId);
        currentSessionId = data.sessionId;
        
        // Save to localStorage for reconnection
        localStorage.setItem('sessionId', data.sessionId);
        localStorage.setItem('sessionRole', 'viewer');
        
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
    
    // Clear background interval
    if (backgroundLocationInterval) {
        clearInterval(backgroundLocationInterval);
        backgroundLocationInterval = null;
    }
    
    isSharing = false;
    currentSessionId = null;
    lastKnownPosition = null;
    
    // Clear saved session
    localStorage.removeItem('sessionId');
    localStorage.removeItem('sessionRole');
    
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
    
    // Show map container first
    document.getElementById('join-session').classList.add('hidden');
    document.getElementById('map-container').classList.remove('hidden');
    
    // Initialize map after container is visible (with small delay to ensure rendering)
    setTimeout(() => {
        if (!map) {
            initializeMap();
        } else {
            // If map already exists, invalidate size to fix rendering
            map.invalidateSize();
        }
    }, 100);
}

// Leave viewing session
function leaveSession() {
    isViewing = false;
    currentSessionId = null;
    
    // Clear saved session
    localStorage.removeItem('sessionId');
    localStorage.removeItem('sessionRole');
    
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

// Background location tracking state
let backgroundLocationInterval = null;
let lastKnownPosition = null;

// Start tracking location (for sharer)
function startLocationTracking() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        updateSharingStatus('Not supported');
        return;
    }
    
    // Geolocation options - optimized for background tracking
    const options = {
        enableHighAccuracy: true, // Better accuracy when available
        timeout: 15000, // Longer timeout for background scenarios
        maximumAge: 0 // Always get fresh location
    };
    
    // Get initial location
    navigator.geolocation.getCurrentPosition(
        (position) => {
            console.log('Initial location obtained:', position.coords);
            lastKnownPosition = position;
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
            lastKnownPosition = position;
            sendLocationUpdate(position);
            
            // Clear background interval if we got a fresh update
            if (backgroundLocationInterval) {
                clearInterval(backgroundLocationInterval);
                backgroundLocationInterval = null;
            }
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
    
    // Set up visibility change listener for background handling
    setupVisibilityChangeListener();
}

// Handle page visibility changes (background/foreground)
function setupVisibilityChangeListener() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Page went to background
            console.log('Page went to background - setting up periodic location updates');
            updateSharingStatus('Sharing (background)...');
            
            // Use periodic getCurrentPosition as fallback when watchPosition may be throttled
            // This helps maintain location updates in background (where supported)
            if (backgroundLocationInterval) {
                clearInterval(backgroundLocationInterval);
            }
            
            backgroundLocationInterval = setInterval(() => {
                if (isSharing && !document.hidden) {
                    // Page is visible again, stop interval
                    clearInterval(backgroundLocationInterval);
                    backgroundLocationInterval = null;
                    return;
                }
                
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        console.log('Background location update:', position.coords);
                        lastKnownPosition = position;
                        sendLocationUpdate(position);
                    },
                    (error) => {
                        console.warn('Background location error:', error);
                        // Don't show errors in background, just log them
                    },
                    {
                        enableHighAccuracy: false, // Use less battery in background
                        timeout: 10000,
                        maximumAge: 60000 // Accept cached location up to 1 minute old
                    }
                );
            }, 30000); // Update every 30 seconds in background (where supported)
        } else {
            // Page came to foreground
            console.log('Page came to foreground');
            updateSharingStatus('Sharing...');
            
            // Clear background interval - watchPosition should handle it now
            if (backgroundLocationInterval) {
                clearInterval(backgroundLocationInterval);
                backgroundLocationInterval = null;
            }
            
            // Get fresh location immediately when coming to foreground
            if (isSharing) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        lastKnownPosition = position;
                        sendLocationUpdate(position);
                    },
                    (error) => console.warn('Foreground location error:', error),
                    { timeout: 10000, maximumAge: 0 }
                );
            }
        }
    });
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
    // Check if map container exists and is visible
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Map container not found');
        return;
    }
    
    // Default center (San Francisco) - will be updated when location is received
    map = L.map('map', {
        zoomControl: true,
        attributionControl: true
    }).setView([37.7749, -122.4194], 13);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        tileSize: 256,
        zoomOffset: 0
    }).addTo(map);
    
    // Invalidate size after a brief delay to ensure container is fully rendered
    setTimeout(() => {
        if (map) {
            map.invalidateSize();
        }
    }, 200);
    
    console.log('Map initialized');
}

// Update map marker with new location
function updateMapMarker(location) {
    const lat = location.lat;
    const lng = location.lng;
    
    if (!map) {
        // Ensure map container is visible before initializing
        const mapContainer = document.getElementById('map-container');
        if (mapContainer.classList.contains('hidden')) {
            mapContainer.classList.remove('hidden');
        }
        setTimeout(() => {
            initializeMap();
            addMarkerToMap(lat, lng);
        }, 100);
        return;
    }
    
    addMarkerToMap(lat, lng);
    
    // Update status
    updateViewStatus('Connected - Location updated');
}

// Helper function to add/update marker
function addMarkerToMap(lat, lng) {
    if (!map) return;
    
    // Remove existing marker if it exists
    if (marker) {
        map.removeLayer(marker);
    }
    
    // Create new marker
    marker = L.marker([lat, lng]).addTo(map);
    
    // Center map on marker
    map.setView([lat, lng], map.getZoom() > 15 ? map.getZoom() : 15);
    
    // Invalidate size to ensure tiles render properly
    map.invalidateSize();
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

