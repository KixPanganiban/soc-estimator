// Main application entry point
// Import all modules
import { checkStoredApiKey, handleApiKeySubmit, handleChangeApiKey } from './apiKeyManager.js';
import { initializeMap, addMapEventListeners } from './mapInitializer.js';
import { loadVehicleData } from './vehicleDataManager.js';
import { setupUIEventListeners } from './uiManager.js';
import { setupInputPersistence, updateDepartureTimeOptions } from './inputManager.js';
import appState from './appState.js';

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Set up UI event listeners first (for API key submit button)
        setupUIEventListeners();
        
        // Load vehicle data (can be done independently)
        await loadVehicleData();
        
        // Check for stored API key (this will trigger map load if key exists)
        await checkStoredApiKey();
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
    }
});

// Export appState for debugging purposes (optional)
window.appState = appState;
