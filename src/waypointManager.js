// Waypoint Management Module
import appState from './appState.js';

// Add a new waypoint input
function addWaypoint() {
    const waypointsContainer = document.getElementById('waypoints-container');
    const waypoints = appState.getWaypoints();
    const waypointIndex = waypoints.length;
    const waypointDiv = document.createElement('div');
    waypointDiv.className = 'flex gap-2 waypoint-item';
    waypointDiv.dataset.index = waypointIndex;
    
    const waypointInput = document.createElement('input');
    waypointInput.type = 'text';
    waypointInput.className = 'flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
    waypointInput.placeholder = `Waypoint ${waypointIndex + 1}`;
    waypointInput.id = `waypoint-${waypointIndex}`;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'text-red-600 hover:text-red-700 px-2';
    removeBtn.innerHTML = '✕';
    removeBtn.onclick = () => removeWaypoint(waypointIndex);
    
    waypointDiv.appendChild(waypointInput);
    waypointDiv.appendChild(removeBtn);
    waypointsContainer.appendChild(waypointDiv);
    
    // Add to centralized state
    appState.addWaypoint({ element: waypointInput, value: '' });
    
    // Initialize Google Places autocomplete for the new waypoint
    if (typeof google !== 'undefined' && google.maps && google.maps.places) {
        const autocomplete = new google.maps.places.Autocomplete(waypointInput);
        appState.addWaypointAutocomplete(autocomplete);
        
        // Update waypoint value when place is selected
        waypointInput.addEventListener('change', () => {
            const waypoints = appState.getWaypoints();
            waypoints[waypointIndex].value = waypointInput.value;
            import('./inputManager.js').then(module => {
                module.saveInputs();
            });
        });
        
        // Also save on blur
        waypointInput.addEventListener('blur', () => {
            const waypoints = appState.getWaypoints();
            waypoints[waypointIndex].value = waypointInput.value;
            import('./inputManager.js').then(module => {
                module.saveInputs();
            });
        });
        
        // Add enter key support
        waypointInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                import('./routeCalculator.js').then(module => {
                    module.calculateRoute();
                });
            }
        });
    }
}

// Remove a waypoint
function removeWaypoint(index) {
    const waypointsContainer = document.getElementById('waypoints-container');
    const waypoints = appState.getWaypoints();
    
    // Remove from DOM
    const waypointDivs = waypointsContainer.querySelectorAll('.waypoint-item');
    waypointDivs.forEach(div => {
        if (parseInt(div.dataset.index) === index) {
            div.remove();
        }
    });
    
    // Remove from centralized state
    appState.removeWaypoint(index);
    
    // Re-index remaining waypoints
    const remainingDivs = waypointsContainer.querySelectorAll('.waypoint-item');
    remainingDivs.forEach((div, newIndex) => {
        div.dataset.index = newIndex;
        const input = div.querySelector('input');
        input.placeholder = `Waypoint ${newIndex + 1}`;
        input.id = `waypoint-${newIndex}`;
        
        // Update remove button onclick
        const removeBtn = div.querySelector('button');
        removeBtn.onclick = () => removeWaypoint(newIndex);
    });
    
    // Save the updated waypoints
    import('./inputManager.js').then(module => {
        module.saveInputs();
    });
}

// Get active waypoints (those with values)
function getActiveWaypoints() {
    return appState.getActiveWaypoints();
}

// Export functions for use in other modules
export {
    addWaypoint,
    removeWaypoint,
    getActiveWaypoints
};