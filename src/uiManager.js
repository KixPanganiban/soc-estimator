// UI Interaction Module

// Show the "How We Calculate" modal
function showCalculationModal() {
    const howCalculateModal = document.getElementById('how-calculate-modal');
    howCalculateModal.classList.remove('hidden');
}

// Close the "How We Calculate" modal
function closeCalculationModal() {
    const howCalculateModal = document.getElementById('how-calculate-modal');
    howCalculateModal.classList.add('hidden');
    
    // Also close if clicking outside the modal content
    howCalculateModal.addEventListener('click', (e) => {
        if (e.target === howCalculateModal) {
            howCalculateModal.classList.add('hidden');
        }
    });
}

// Set up event listeners for UI elements
function setupUIEventListeners() {
    // Get DOM elements
    const howCalculateBtn = document.getElementById('how-calculate-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const howCalculateModal = document.getElementById('how-calculate-modal');
    const apiKeySubmit = document.getElementById('api-key-submit');
    const apiKeyInput = document.getElementById('api-key-input');
    const changeApiKeyBtn = document.getElementById('change-api-key');
    const vehicleSelect = document.getElementById('vehicle-select');
    
    // Modal event listeners
    howCalculateBtn.addEventListener('click', showCalculationModal);
    closeModalBtn.addEventListener('click', closeCalculationModal);
    
    // Close modal when clicking outside
    howCalculateModal.addEventListener('click', (e) => {
        if (e.target === howCalculateModal) {
            closeCalculationModal();
        }
    });
    
    // Handle API key submission
    apiKeySubmit.addEventListener('click', () => {
        if (typeof window.handleApiKeySubmit === 'function') {
            window.handleApiKeySubmit();
        }
    });
    
    // Allow Enter key to submit API key
    apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            apiKeySubmit.click();
        }
    });
    
    // Handle change API key button
    changeApiKeyBtn.addEventListener('click', () => {
        if (typeof window.handleChangeApiKey === 'function') {
            window.handleChangeApiKey();
        }
    });
    
    // Handle vehicle selection
    vehicleSelect.addEventListener('change', (e) => {
        if (typeof window.handleVehicleSelection === 'function') {
            window.handleVehicleSelection(e);
        }
    });
}

// Export functions for use in other modules
export { 
    showCalculationModal,
    closeCalculationModal,
    setupUIEventListeners
};