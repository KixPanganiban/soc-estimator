// Input Persistence Module

// Schema version for input storage (increment when changing input structure)
const SCHEMA_VERSION = '1.2'; // Incremented for waypoints support
const STORAGE_KEY = 'evSocEstimatorInputs';

// Save inputs to localStorage
function saveInputs() {
    // Get DOM elements
    const vehicleSelect = document.getElementById('vehicle-select');
    const startSoc = document.getElementById('start-soc');
    const batteryCapacity = document.getElementById('battery-capacity');
    const avgMileage = document.getElementById('avg-mileage');
    const departureTime = document.getElementById('departure-time');
    const trafficModel = document.getElementById('traffic-model');
    const startPoint = document.getElementById('start-point');
    const destination = document.getElementById('destination');
    const waypoints = window.waypoints || [];
    
    const inputs = {
        version: SCHEMA_VERSION,
        vehicleSelect: vehicleSelect.value,
        startSoc: startSoc.value,
        batteryCapacity: batteryCapacity.value,
        avgMileage: avgMileage.value,
        departureTime: departureTime.value,
        trafficModel: trafficModel.value,
        startPoint: startPoint.value,
        destination: destination.value,
        waypoints: waypoints.map(wp => wp.value)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
}

// Load inputs from localStorage
function loadInputs() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return;
        
        const inputs = JSON.parse(stored);
        
        // Check schema version
        if (inputs.version !== SCHEMA_VERSION) {
            console.log('Schema version mismatch, clearing stored inputs');
            localStorage.removeItem(STORAGE_KEY);
            return;
        }
        
        // Get DOM elements
        const vehicleSelect = document.getElementById('vehicle-select');
        const startSoc = document.getElementById('start-soc');
        const batteryCapacity = document.getElementById('battery-capacity');
        const avgMileage = document.getElementById('avg-mileage');
        const departureTime = document.getElementById('departure-time');
        const trafficModel = document.getElementById('traffic-model');
        const startPoint = document.getElementById('start-point');
        const destination = document.getElementById('destination');
        
        // Restore values
        if (inputs.vehicleSelect) vehicleSelect.value = inputs.vehicleSelect;
        if (inputs.startSoc) startSoc.value = inputs.startSoc;
        if (inputs.batteryCapacity) batteryCapacity.value = inputs.batteryCapacity;
        if (inputs.avgMileage) avgMileage.value = inputs.avgMileage;
        if (inputs.departureTime) departureTime.value = inputs.departureTime;
        if (inputs.trafficModel) trafficModel.value = inputs.trafficModel;
        if (inputs.startPoint) startPoint.value = inputs.startPoint;
        if (inputs.destination) destination.value = inputs.destination;
        
        // Restore waypoints
        if (inputs.waypoints && Array.isArray(inputs.waypoints)) {
            inputs.waypoints.forEach((waypointValue, index) => {
                if (waypointValue && waypointValue.trim() !== '') {
                    if (typeof window.addWaypoint === 'function') {
                        window.addWaypoint();
                        window.waypoints[index].element.value = waypointValue;
                        window.waypoints[index].value = waypointValue;
                    }
                }
            });
        }
        
        console.log('Inputs restored from localStorage');
    } catch (error) {
        console.error('Error loading saved inputs:', error);
        localStorage.removeItem(STORAGE_KEY);
    }
}

// Add input listeners to save on change
function setupInputPersistence() {
    // Get DOM elements
    const vehicleSelect = document.getElementById('vehicle-select');
    const startSoc = document.getElementById('start-soc');
    const batteryCapacity = document.getElementById('battery-capacity');
    const avgMileage = document.getElementById('avg-mileage');
    const departureTime = document.getElementById('departure-time');
    const trafficModel = document.getElementById('traffic-model');
    const startPoint = document.getElementById('start-point');
    const destination = document.getElementById('destination');
    
    const inputs = [vehicleSelect, startSoc, batteryCapacity, avgMileage, departureTime, trafficModel, startPoint, destination];
    
    inputs.forEach(input => {
        input.addEventListener('change', saveInputs);
        // For text inputs, also save on blur
        if (input.type === 'text' || input.type === 'number') {
            input.addEventListener('blur', saveInputs);
        }
    });
}

// Generate departure time options
function generateDepartureTimeOptions() {
    const now = new Date();
    const options = [];
    
    // Add "Now" option
    options.push({ value: 'now', text: 'Now' });
    
    // Get current hour and round up to next hour
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    
    // Start from next hour if we're past 0 minutes
    let startHour = currentMinutes > 0 ? currentHour + 1 : currentHour;
    
    // Generate options for next 24 hours
    for (let i = 0; i < 24; i++) {
        const hour = (startHour + i) % 24;
        const isPM = hour >= 12;
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const period = isPM ? 'PM' : 'AM';
        
        // Create date object for this time
        const optionDate = new Date(now);
        optionDate.setHours(hour, 0, 0, 0);
        
        // If the hour is before current hour, it's tomorrow
        if (hour < currentHour || (hour === currentHour && currentMinutes > 0)) {
            optionDate.setDate(optionDate.getDate() + 1);
        }
        
        // Format the display text
        const dayText = optionDate.toDateString() === now.toDateString() ? 'Today' : 'Tomorrow';
        const timeText = `${displayHour}:00 ${period}`;
        const fullText = `${timeText} (${dayText})`;
        
        options.push({
            value: optionDate.toISOString(),
            text: fullText,
            date: optionDate
        });
    }
    
    return options;
}

// Update departure time select options
function updateDepartureTimeOptions() {
    const departureTimeSelect = document.getElementById('departure-time');
    const currentValue = departureTimeSelect.value;
    const options = generateDepartureTimeOptions();
    
    // Clear existing options
    departureTimeSelect.innerHTML = '';
    
    // Add new options
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        departureTimeSelect.appendChild(optionElement);
    });
    
    // Try to restore previous value if it was a time
    if (currentValue && currentValue !== 'now' && currentValue.includes('T')) {
        departureTimeSelect.value = currentValue;
    }
}

// Export functions for use in other modules
export { 
    saveInputs,
    loadInputs,
    setupInputPersistence,
    generateDepartureTimeOptions,
    updateDepartureTimeOptions,
    SCHEMA_VERSION,
    STORAGE_KEY
};