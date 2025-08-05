// Google Maps Initialization Module
let map;
let directionsService;
let directionsRenderer;

// Initialize Google Maps
function initializeMap() {
    // Get DOM elements
    const mapDiv = document.getElementById('map');
    const startPoint = document.getElementById('start-point');
    const destination = document.getElementById('destination');
    
    map = new google.maps.Map(mapDiv, {
        center: { lat: 14.6091, lng: 121.0223 }, // Default to Manila, Philippines
        zoom: 10,
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressPolylines: true, // We'll draw our own colored segments
        preserveViewport: false
    });
    directionsRenderer.setMap(map);

    const startAutocomplete = new google.maps.places.Autocomplete(startPoint);
    const destinationAutocomplete = new google.maps.places.Autocomplete(destination);
    
    // Store map objects globally for access by other modules
    window.map = map;
    window.directionsService = directionsService;
    window.directionsRenderer = directionsRenderer;
    
    console.log('Google Maps initialized successfully');
}

// Add event listeners for map-related UI elements
function addMapEventListeners() {
    const estimateBtn = document.getElementById('estimate-btn');
    const addWaypointBtn = document.getElementById('add-waypoint-btn');
    const startPoint = document.getElementById('start-point');
    const destination = document.getElementById('destination');
    
    estimateBtn.addEventListener('click', () => {
        if (typeof window.calculateRoute === 'function') {
            window.calculateRoute();
        }
    });
    
    addWaypointBtn.addEventListener('click', () => {
        if (typeof window.addWaypoint === 'function') {
            window.addWaypoint();
        }
    });
    
    // Add enter key support
    [startPoint, destination].forEach(input => {
        input.addEventListener('keypress', (eSanitized) => {
            if (eSanitized.key === 'Enter') {
                if (typeof window.calculateRoute === 'function') {
                    window.calculateRoute();
                }
            }
        });
    });
}

// Export functions and variables for use in other modules
export { 
    initializeMap, 
    addMapEventListeners,
    map,
    directionsService,
    directionsRenderer
};