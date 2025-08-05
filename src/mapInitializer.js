// Google Maps Initialization Module
import appState from './appState.js';

// Initialize Google Maps
function initializeMap() {
    // Get DOM elements
    const mapDiv = document.getElementById('map');
    const startPoint = document.getElementById('start-point');
    const destination = document.getElementById('destination');
    
    const map = new google.maps.Map(mapDiv, {
        center: { lat: 14.6091, lng: 121.0223 }, // Default to Manila, Philippines
        zoom: 10,
    });

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
        suppressPolylines: true, // We'll draw our own colored segments
        preserveViewport: false
    });
    directionsRenderer.setMap(map);

    const startAutocomplete = new google.maps.places.Autocomplete(startPoint);
    const destinationAutocomplete = new google.maps.places.Autocomplete(destination);
    
    // Store map objects in centralized state
    appState.setMap(map);
    appState.setDirectionsService(directionsService);
    appState.setDirectionsRenderer(directionsRenderer);
    
    console.log('Google Maps initialized successfully');
}

// Add event listeners for map-related UI elements
function addMapEventListeners() {
    const estimateBtn = document.getElementById('estimate-btn');
    const addWaypointBtn = document.getElementById('add-waypoint-btn');
    const startPoint = document.getElementById('start-point');
    const destination = document.getElementById('destination');
    
    estimateBtn.addEventListener('click', () => {
        // Use dynamic import to avoid circular dependencies
        import('./routeCalculator.js').then(module => {
            module.calculateRoute();
        });
    });
    
    addWaypointBtn.addEventListener('click', () => {
        import('./waypointManager.js').then(module => {
            module.addWaypoint();
        });
    });
    
    // Add enter key support
    [startPoint, destination].forEach(input => {
        input.addEventListener('keypress', (eSanitized) => {
            if (eSanitized.key === 'Enter') {
                import('./routeCalculator.js').then(module => {
                    module.calculateRoute();
                });
            }
        });
    });
}

// Export functions for use in other modules
export {
    initializeMap,
    addMapEventListeners
};