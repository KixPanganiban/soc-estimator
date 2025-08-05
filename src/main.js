// Main application entry point
// Import all modules
import { checkStoredApiKey, handleApiKeySubmit, handleChangeApiKey, userApiKey } from './apiKeyManager.js';
import { initializeMap, addMapEventListeners, map, directionsService, directionsRenderer } from './mapInitializer.js';
import { loadVehicleData, populateVehicleSelect, handleVehicleSelection, vehicleData } from './vehicleDataManager.js';
import { addWaypoint, removeWaypoint, getActiveWaypoints, waypoints, waypointAutocompletes } from './waypointManager.js';
import { calculateRoute, formatDuration, getManeuverIcon, showError } from './routeCalculator.js';
import { analyzeRouteSegments } from './segmentAnalyzer.js';
import { clearSegmentPolylines, drawSegmentsOnMap, drawSegmentCharts, segmentPolylines } from './chartDrawer.js';
import { showCalculationModal, closeCalculationModal, setupUIEventListeners } from './uiManager.js';
import { saveInputs, loadInputs, setupInputPersistence, updateDepartureTimeOptions } from './inputManager.js';

// Make these globally accessible for other modules that depend on them
window.userApiKey = userApiKey;
window.map = map;
window.directionsService = directionsService;
window.directionsRenderer = directionsRenderer;
window.waypoints = waypoints;
window.waypointAutocompletes = waypointAutocompletes;
window.segmentPolylines = segmentPolylines;

// Make functions globally accessible
window.checkStoredApiKey = checkStoredApiKey;
window.handleApiKeySubmit = handleApiKeySubmit;
window.handleChangeApiKey = handleChangeApiKey;
window.initializeMap = initializeMap;
window.loadVehicleData = loadVehicleData;
window.populateVehicleSelect = populateVehicleSelect;
window.handleVehicleSelection = handleVehicleSelection;
window.addWaypoint = addWaypoint;
window.removeWaypoint = removeWaypoint;
window.getActiveWaypoints = getActiveWaypoints;
window.calculateRoute = calculateRoute;
window.formatDuration = formatDuration;
window.getManeuverIcon = getManeuverIcon;
window.showError = showError;
window.analyzeRouteSegments = analyzeRouteSegments;
window.clearSegmentPolylines = clearSegmentPolylines;
window.drawSegmentsOnMap = drawSegmentsOnMap;
window.drawSegmentCharts = drawSegmentCharts;
window.showCalculationModal = showCalculationModal;
window.closeCalculationModal = closeCalculationModal;
window.saveInputs = saveInputs;
window.loadInputs = loadInputs;
window.setupInputPersistence = setupInputPersistence;
window.updateDepartureTimeOptions = updateDepartureTimeOptions;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check for stored API key
    checkStoredApiKey();
    
    // Set up UI event listeners
    setupUIEventListeners();
    
    // Load vehicle data
    loadVehicleData();
    
    // Add map event listeners
    addMapEventListeners();
});
