// Waypoint Management Module
let waypoints = [];
let waypointAutocompletes = [];

// Add a new waypoint input
function addWaypoint() {
    const waypointsContainer = document.getElementById('waypoints-container');
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
    
    // Add to waypoints array
    waypoints.push({ element: waypointInput, value: '' });
    
    // Initialize Google Places autocomplete for the new waypoint
    if (typeof google !== 'undefined' && google.maps && google.maps.places) {
        const autocomplete = new google.maps.places.Autocomplete(waypointInput);
        waypointAutocompletes.push(autocomplete);
        
        // Update waypoint value when place is selected
        waypointInput.addEventListener('change', () => {
            waypoints[waypointIndex].value = waypointInput.value;
            if (typeof window.saveInputs === 'function') {
                window.saveInputs();
            }
        });
        
        // Also save on blur
        waypointInput.addEventListener('blur', () => {
            waypoints[waypointIndex].value = waypointInput.value;
            if (typeof window.saveInputs === 'function') {
                window.saveInputs();
            }
        });
        
        // Add enter key support
        waypointInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (typeof window.calculateRoute === 'function') {
                    window.calculateRoute();
                }
            }
        });
    }
}

// Remove a waypoint
function removeWaypoint(index) {
    const waypointsContainer = document.getElementById('waypoints-container');
    
    // Remove from DOM
    const waypointDivs = waypointsContainer.querySelectorAll('.waypoint-item');
    waypointDivs.forEach(div => {
        if (parseInt(div.dataset.index) === index) {
            div.remove();
        }
    });
    
    // Remove from arrays
    waypoints.splice(index, 1);
    waypointAutocompletes.splice(index, 1);
    
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
    
    // Update waypoints array indices
    waypoints.forEach((waypoint, idx) => {
        waypoint.index = idx;
    });
    
    // Save the updated waypoints
    if (typeof window.saveInputs === 'function') {
        window.saveInputs();
    }
}

// Get active waypoints (those with values)
function getActiveWaypoints() {
    return waypoints.filter(wp => wp.value && wp.value.trim() !== '');
}

// Export functions and variables for use in other modules
export { 
    addWaypoint, 
    removeWaypoint, 
    getActiveWaypoints,
    waypoints,
    waypointAutocompletes
};