// Vehicle Data Management Module
import appState from './appState.js';

// Load vehicle data from CSV
async function loadVehicleData() {
    try {
        const response = await fetch('./vehicles.csv');
        const csvText = await response.text();
        
        // Parse CSV
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',');
        
        const vehicleData = lines.slice(1).map(line => {
            const values = line.split(',');
            const vehicle = {};
            headers.forEach((header, index) => {
                vehicle[header] = values[index];
            });
            return vehicle;
        });
        
        // Sort by brand and model
        vehicleData.sort((a, b) => {
            const brandCompare = a.brand.localeCompare(b.brand);
            if (brandCompare !== 0) return brandCompare;
            return a.model.localeCompare(b.model);
        });
        
        // Store in centralized state
        appState.setVehicleData(vehicleData);
        
        populateVehicleSelect();
        console.log(`Loaded ${vehicleData.length} vehicle models`);
        
        // After vehicle data is loaded, restore saved inputs if in main content
        const mainContent = document.getElementById('main-content');
        if (!mainContent.classList.contains('hidden')) {
            import('./inputManager.js').then(module => {
                module.loadInputs();
            });
        }
    } catch (error) {
        console.error('Error loading vehicle data:', error);
    }
}

// Populate vehicle select dropdown
function populateVehicleSelect() {
    const vehicleSelect = document.getElementById('vehicle-select');
    
    // Clear existing options except the first one
    vehicleSelect.innerHTML = '<option value="">Select a vehicle model...</option>';
    
    // Group by brand
    const brands = {};
    const vehicleData = appState.getVehicleData();
    vehicleData.forEach(vehicle => {
        if (!brands[vehicle.brand]) {
            brands[vehicle.brand] = [];
        }
        brands[vehicle.brand].push(vehicle);
    });
    
    // Create optgroups for each brand
    Object.keys(brands).sort().forEach(brand => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = brand;
        
        brands[brand].forEach((vehicle, index) => {
            const option = document.createElement('option');
            option.value = `${brand}-${index}`;
            option.textContent = `${vehicle.model} ${vehicle.variant}`;
            option.dataset.battery = vehicle.battery_capacity_kwh;
            option.dataset.consumption = vehicle.consumption_kwh_100km;
            optgroup.appendChild(option);
        });
        
        vehicleSelect.appendChild(optgroup);
    });
}

// Handle vehicle selection
function handleVehicleSelection(e) {
    if (!e.target.value) return;
    
    const [brand, index] = e.target.value.split('-');
    const vehicleData = appState.getVehicleData();
    const vehicle = vehicleData.find(v => v.brand === brand);
    
    if (vehicle) {
        // Find the specific variant
        const brandVehicles = vehicleData.filter(v => v.brand === brand);
        const selectedVehicle = brandVehicles[parseInt(index)];
        
        if (selectedVehicle) {
            const batteryCapacity = document.getElementById('battery-capacity');
            const avgMileage = document.getElementById('avg-mileage');
            
            batteryCapacity.value = selectedVehicle.battery_capacity_kwh;
            avgMileage.value = selectedVehicle.consumption_kwh_100km;
            
            // Save the selection
            if (typeof window.saveInputs === 'function') {
                window.saveInputs();
            }
            
            console.log(`Selected: ${selectedVehicle.brand} ${selectedVehicle.model} ${selectedVehicle.variant}`);
        }
    }
}

// Export functions for use in other modules
export {
    loadVehicleData,
    populateVehicleSelect,
    handleVehicleSelection
};