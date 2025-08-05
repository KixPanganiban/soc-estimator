// API Key Management Module
import appState from './appState.js';

let userApiKey = '';

// Check if API key is stored in localStorage
function checkStoredApiKey() {
    const storedKey = localStorage.getItem('googleMapsApiKey');
    if (storedKey) {
        const apiKeyInput = document.getElementById('api-key-input');
        apiKeyInput.value = storedKey;
        loadWithApiKey(storedKey);
    }
}

// Handle API key submission
function handleApiKeySubmit() {
    const apiKeyInput = document.getElementById('api-key-input');
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        alert('Please enter your Google Maps API key');
        return;
    }
    loadWithApiKey(apiKey);
}

// Handle change API key button
function handleChangeApiKey() {
    localStorage.removeItem('googleMapsApiKey');
    const apiKeyInput = document.getElementById('api-key-input');
    apiKeyInput.value = '';
    const apiKeySection = document.getElementById('api-key-section');
    const mainContent = document.getElementById('main-content');
    apiKeySection.classList.remove('hidden');
    mainContent.classList.add('hidden');
    location.reload();
}

// Load Google Maps with user-provided API key
function loadWithApiKey(apiKey) {
    userApiKey = apiKey;
    appState.setApiKey(apiKey);
    localStorage.setItem('googleMapsApiKey', apiKey);
    loadGoogleMapsScript(apiKey);
}

// Load Google Maps script dynamically
function loadGoogleMapsScript(apiKey) {
    // Remove any existing Google Maps script
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
        existingScript.remove();
    }
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
        alert('Failed to load Google Maps. Please check your API key and ensure it has the required permissions.');
        const apiKeySection = document.getElementById('api-key-section');
        const mainContent = document.getElementById('main-content');
        apiKeySection.classList.remove('hidden');
        mainContent.classList.add('hidden');
    };
    document.head.appendChild(script);
}

// Make initMap globally accessible
window.initMap = async function() {
    try {
        const apiKeySection = document.getElementById('api-key-section');
        const mainContent = document.getElementById('main-content');
        
        // Hide API key section and show main content
        apiKeySection.classList.add('hidden');
        mainContent.classList.remove('hidden');
        
        // Initialize map by importing the module
        const { initializeMap, addMapEventListeners } = await import('./mapInitializer.js');
        initializeMap();
        
        // Add map event listeners
        addMapEventListeners();
        
        // Update departure time options
        const { updateDepartureTimeOptions } = await import('./inputManager.js');
        updateDepartureTimeOptions();
        
        // Load saved inputs and set up persistence after map loads
        const { loadInputs, setupInputPersistence } = await import('./inputManager.js');
        loadInputs();
        setupInputPersistence();
        
        // Set appState as initialized
        const appStateModule = await import('./appState.js');
        appStateModule.default.setInitialized(true);
    } catch (error) {
        console.error('Error initializing Google Maps:', error);
        const apiKeySection = document.getElementById('api-key-section');
        const mainContent = document.getElementById('main-content');
        showError('Failed to initialize Google Maps. Please check your API key configuration.');
        apiKeySection.classList.remove('hidden');
        mainContent.classList.add('hidden');
    }
}

function showError(message) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `<p class="text-red-600">${message}</p>`;
}

// Export functions for use in other modules
export { 
    checkStoredApiKey, 
    handleApiKeySubmit, 
    handleChangeApiKey, 
    loadWithApiKey, 
    loadGoogleMapsScript,
    userApiKey
};