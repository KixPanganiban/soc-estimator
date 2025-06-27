const apiKeySection = document.getElementById('api-key-section');
const apiKeyInput = document.getElementById('api-key-input');
const apiKeySubmit = document.getElementById('api-key-submit');
const mainContent = document.getElementById('main-content');
const changeApiKeyBtn = document.getElementById('change-api-key');

const vehicleSelect = document.getElementById('vehicle-select');
const startSoc = document.getElementById('start-soc');
const batteryCapacity = document.getElementById('battery-capacity');
const avgMileage = document.getElementById('avg-mileage');
const departureTime = document.getElementById('departure-time');
const trafficModel = document.getElementById('traffic-model');
const startPoint = document.getElementById('start-point');
const destination = document.getElementById('destination');
const estimateBtn = document.getElementById('estimate-btn');
const mapDiv = document.getElementById('map');
const resultsDiv = document.getElementById('results');

let map;
let directionsService;
let directionsRenderer;
let userApiKey = '';

// Check if API key is stored in localStorage
function checkStoredApiKey() {
    const storedKey = localStorage.getItem('googleMapsApiKey');
    if (storedKey) {
        apiKeyInput.value = storedKey;
        loadWithApiKey(storedKey);
    }
}

// Handle API key submission
apiKeySubmit.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        alert('Please enter your Google Maps API key');
        return;
    }
    loadWithApiKey(apiKey);
});

// Allow Enter key to submit API key
apiKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        apiKeySubmit.click();
    }
});

// Handle change API key button
changeApiKeyBtn.addEventListener('click', () => {
    localStorage.removeItem('googleMapsApiKey');
    apiKeyInput.value = '';
    apiKeySection.classList.remove('hidden');
    mainContent.classList.add('hidden');
    location.reload();
});

// Load Google Maps with user-provided API key
function loadWithApiKey(apiKey) {
    userApiKey = apiKey;
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
        alert('Failed to load Google Maps. Please check your API key and ensure it has the required permissions.');
        apiKeySection.classList.remove('hidden');
        mainContent.classList.add('hidden');
    };
    document.head.appendChild(script);
}

// Make initMap globally accessible
window.initMap = function() {
    try {
        // Hide API key section and show main content
        apiKeySection.classList.add('hidden');
        mainContent.classList.remove('hidden');
        
        map = new google.maps.Map(mapDiv, {
            center: { lat: 14.6091, lng: 121.0223 }, // Default to Manila, Philippines
            zoom: 10,
        });

        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer();
        directionsRenderer.setMap(map);

        const startAutocomplete = new google.maps.places.Autocomplete(startPoint);
        const destinationAutocomplete = new google.maps.places.Autocomplete(destination);

        estimateBtn.addEventListener('click', calculateRoute);
        
        // Add enter key support
        [startPoint, destination].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    calculateRoute();
                }
            });
        });
        
        console.log('Google Maps initialized successfully');
        
        // Load saved inputs and set up persistence after map loads
        loadInputs();
        setupInputPersistence();
    } catch (error) {
        console.error('Error initializing Google Maps:', error);
        showError('Failed to initialize Google Maps. Please check your API key configuration.');
        apiKeySection.classList.remove('hidden');
        mainContent.classList.add('hidden');
    }
}

// Analyze route segments and calculate traffic for each
function analyzeRouteSegments(route, avgMileageKwh, batteryCapacityKwh) {
    const segments = [];
    const steps = route.steps || [];
    
    steps.forEach((step, index) => {
        const segmentDistance = step.distance.value / 1000; // km
        const segmentDuration = step.duration.value; // seconds
        
        // Estimate speed for this segment (km/h)
        const avgSpeed = segmentDistance / (segmentDuration / 3600);
        
        // Determine traffic condition based on speed and road type
        let trafficCondition = 'normal';
        let trafficFactor = 1.0;
        let consumptionMultiplier = 1.0;
        
        // Analyze based on average speed
        if (avgSpeed < 20) {
            trafficCondition = 'heavy';
            trafficFactor = 1.5;
            consumptionMultiplier = 0.8; // More efficient in stop-and-go
        } else if (avgSpeed < 40) {
            trafficCondition = 'moderate';
            trafficFactor = 1.2;
            consumptionMultiplier = 0.9;
        } else if (avgSpeed > 80) {
            trafficCondition = 'light';
            trafficFactor = 0.8;
            consumptionMultiplier = 1.2; // Less efficient at high speeds
        }
        
        // Calculate energy consumption for this segment
        const baseConsumption = (segmentDistance / 100) * avgMileageKwh;
        const adjustedConsumption = baseConsumption * consumptionMultiplier;
        
        segments.push({
            index: index,
            instruction: step.html_instructions,
            distance: segmentDistance,
            duration: segmentDuration,
            avgSpeed: avgSpeed,
            trafficCondition: trafficCondition,
            trafficFactor: trafficFactor,
            baseConsumption: baseConsumption,
            adjustedConsumption: adjustedConsumption,
            consumptionMultiplier: consumptionMultiplier
        });
    });
    
    return segments;
}

function calculateRoute() {
    // Validate inputs
    if (startPoint.value === '' || destination.value === '') {
        showError('Please enter a starting point and destination.');
        return;
    }

    const startSocValue = parseFloat(startSoc.value);
    const batteryCapacityValue = parseFloat(batteryCapacity.value);
    const avgMileageValue = parseFloat(avgMileage.value);

    if (isNaN(startSocValue) || startSocValue < 0 || startSocValue > 100) {
        showError('Please enter a valid starting SOC between 0 and 100%.');
        return;
    }

    if (isNaN(batteryCapacityValue) || batteryCapacityValue <= 0) {
        showError('Please enter a valid battery capacity greater than 0.');
        return;
    }

    if (isNaN(avgMileageValue) || avgMileageValue <= 0) {
        showError('Please enter a valid average mileage greater than 0.');
        return;
    }

    // Show loading state
    resultsDiv.innerHTML = '<p class="text-gray-600">Calculating route with traffic data...</p>';
    estimateBtn.disabled = true;

    // Calculate departure time
    const now = new Date();
    let departureTimeValue;
    
    switch(departureTime.value) {
        case 'now':
            // Set to 1 minute in future to ensure we get traffic data
            departureTimeValue = new Date(now.getTime() + 60000);
            break;
        case '15min':
            departureTimeValue = new Date(now.getTime() + 15 * 60000);
            break;
        case '30min':
            departureTimeValue = new Date(now.getTime() + 30 * 60000);
            break;
        case '1hour':
            departureTimeValue = new Date(now.getTime() + 60 * 60000);
            break;
        case '2hours':
            departureTimeValue = new Date(now.getTime() + 120 * 60000);
            break;
    }

    // Build request with traffic options
    const request = {
        origin: startPoint.value,
        destination: destination.value,
        travelMode: google.maps.TravelMode.DRIVING,
        drivingOptions: {
            departureTime: departureTimeValue
        }
    };
    
    // Try to add traffic model if requested
    if (trafficModel.value && trafficModel.value !== 'best_guess') {
        // Use the string values directly as the API seems to accept them
        request.drivingOptions.trafficModel = trafficModel.value;
    }
    
    console.log('Directions request:', request);

    directionsService.route(request, (result, status) => {
        estimateBtn.disabled = false;
        
        if (status === 'OK') {
            directionsRenderer.setDirections(result);

            const route = result.routes[0].legs[0];
            const distance = route.distance.value / 1000; // in km
            const travelTime = route.duration.text;
            
            // Process route segments (steps)
            const segments = analyzeRouteSegments(route, avgMileageValue, batteryCapacityValue);
            
            // Log the route data to debug
            console.log('Route data:', {
                duration: route.duration,
                duration_in_traffic: route.duration_in_traffic,
                departure_time: route.departure_time,
                arrival_time: route.arrival_time,
                segments: segments
            });
            
            // Get traffic data
            const normalDuration = route.duration.value; // in seconds
            let trafficDuration = route.duration_in_traffic ? route.duration_in_traffic.value : null;
            let trafficFactor = 1.0;
            
            // If no traffic data provided, simulate based on traffic model selection
            if (!trafficDuration) {
                console.log('No duration_in_traffic provided, simulating based on traffic model');
                switch(trafficModel.value) {
                    case 'pessimistic':
                        trafficFactor = 1.3; // 30% longer travel time
                        break;
                    case 'optimistic':
                        trafficFactor = 0.85; // 15% shorter travel time
                        break;
                    default:
                        trafficFactor = 1.0; // Normal conditions
                }
                trafficDuration = normalDuration * trafficFactor;
            } else {
                trafficFactor = trafficDuration / normalDuration;
            }
            
            console.log('Traffic calculations:', {
                normalDuration: normalDuration + 's',
                trafficDuration: Math.round(trafficDuration) + 's',
                trafficFactor: trafficFactor,
                simulated: !route.duration_in_traffic
            });
            
            // Calculate total energy consumption from segments
            const totalSegmentBase = segments.reduce((sum, seg) => sum + seg.baseConsumption, 0);
            const totalSegmentAdjusted = segments.reduce((sum, seg) => sum + seg.adjustedConsumption, 0);
            
            // Use segment-based calculations if available, otherwise fall back to route-level
            const baseEnergyConsumed = segments.length > 0 ? totalSegmentBase : (distance / 100) * avgMileageValue;
            const adjustedEnergyConsumed = segments.length > 0 ? totalSegmentAdjusted : baseEnergyConsumed * (2 - trafficFactor);
            
            // Calculate battery consumption
            const socConsumed = (adjustedEnergyConsumed / batteryCapacityValue) * 100;
            const estimatedSocLeft = startSocValue - socConsumed;
            
            // Calculate efficiency impact
            const efficiencyChange = ((baseEnergyConsumed - adjustedEnergyConsumed) / baseEnergyConsumed) * 100;

            // Color code the result based on remaining SOC
            let socColor = 'text-green-600';
            if (estimatedSocLeft < 20) {
                socColor = 'text-red-600';
            } else if (estimatedSocLeft < 40) {
                socColor = 'text-yellow-600';
            }

            // Determine traffic status and color
            let trafficStatus, trafficColor, trafficIcon;
            if (trafficFactor > 1.2) {
                trafficStatus = 'Heavy Traffic';
                trafficColor = 'text-green-600';
                trafficIcon = '🚦';
            } else if (trafficFactor > 0.9) {
                trafficStatus = 'Normal Traffic';
                trafficColor = 'text-gray-600';
                trafficIcon = '🚗';
            } else {
                trafficStatus = 'Light Traffic';
                trafficColor = 'text-yellow-600';
                trafficIcon = '🏎️';
            }

            // Generate segments HTML if available
            let segmentsHTML = '';
            if (segments.length > 0) {
                segmentsHTML = `
                    <div class="mt-6">
                        <h3 class="text-md font-semibold mb-3">Route Segments Analysis</h3>
                        <div class="max-h-64 overflow-y-auto">
                            <table class="w-full text-sm">
                                <thead class="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th class="px-2 py-1 text-left">#</th>
                                        <th class="px-2 py-1 text-left">Segment</th>
                                        <th class="px-2 py-1 text-right">Distance</th>
                                        <th class="px-2 py-1 text-center">Traffic</th>
                                        <th class="px-2 py-1 text-right">Energy</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200">
                                    ${segments.map((seg, idx) => {
                                        const trafficColor = seg.trafficCondition === 'heavy' ? 'text-green-600' : 
                                                           seg.trafficCondition === 'light' ? 'text-yellow-600' : 'text-gray-600';
                                        const trafficIcon = seg.trafficCondition === 'heavy' ? '🚦' : 
                                                          seg.trafficCondition === 'light' ? '🏎️' : '🚗';
                                        return `
                                            <tr class="hover:bg-gray-50">
                                                <td class="px-2 py-1">${idx + 1}</td>
                                                <td class="px-2 py-1">
                                                    <div class="truncate max-w-xs" title="${seg.instruction.replace(/<[^>]*>/g, '')}">
                                                        ${seg.instruction.replace(/<[^>]*>/g, '').substring(0, 40)}...
                                                    </div>
                                                </td>
                                                <td class="px-2 py-1 text-right">${seg.distance.toFixed(1)} km</td>
                                                <td class="px-2 py-1 text-center">
                                                    <span class="${trafficColor}">${trafficIcon} ${seg.avgSpeed.toFixed(0)} km/h</span>
                                                </td>
                                                <td class="px-2 py-1 text-right">${seg.adjustedConsumption.toFixed(2)} kWh</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                                <tfoot class="bg-gray-100 font-semibold">
                                    <tr>
                                        <td colspan="2" class="px-2 py-1">Total</td>
                                        <td class="px-2 py-1 text-right">${distance.toFixed(1)} km</td>
                                        <td class="px-2 py-1"></td>
                                        <td class="px-2 py-1 text-right">${adjustedEnergyConsumed.toFixed(1)} kWh</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                `;
            }
            
            resultsDiv.innerHTML = `
                <h2 class="text-lg font-semibold mb-4">Trip Results</h2>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-gray-600">Distance</p>
                        <p class="font-semibold">${distance.toFixed(1)} km</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Travel Time</p>
                        <p class="font-semibold">${travelTime}</p>
                        ${trafficDuration !== normalDuration ? `<p class="text-xs text-gray-500">(${Math.round(normalDuration/60)} min without traffic)</p>` : ''}
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Base Energy Consumption</p>
                        <p class="font-semibold">${baseEnergyConsumed.toFixed(1)} kWh</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Adjusted for Traffic</p>
                        <p class="font-semibold">${adjustedEnergyConsumed.toFixed(1)} kWh</p>
                        <p class="text-xs ${efficiencyChange > 0 ? 'text-green-600' : 'text-red-600'}">${efficiencyChange > 0 ? '↓' : '↑'} ${Math.abs(efficiencyChange).toFixed(0)}%</p>
                    </div>
                </div>
                
                <div class="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="text-lg">${trafficIcon}</span>
                            <span class="font-medium ${trafficColor}">${trafficStatus}</span>
                        </div>
                        <span class="text-sm text-gray-600">Traffic Factor: ${trafficFactor.toFixed(2)}x</span>
                    </div>
                    ${trafficFactor > 1.1 ? 
                        '<p class="text-sm text-gray-600 mt-2">Traffic conditions detected. Energy consumption adjusted based on stop-and-go patterns.</p>' : 
                        trafficFactor < 0.9 ? 
                        '<p class="text-sm text-gray-600 mt-2">Light traffic detected. Energy consumption adjusted for higher speeds.</p>' :
                        '<p class="text-sm text-gray-600 mt-2">Normal traffic conditions - standard energy consumption.</p>'
                    }
                    ${!route.duration_in_traffic ? '<p class="text-xs text-gray-500 mt-1">⚠️ Traffic data unavailable - using traffic model simulation</p>' : ''}
                </div>
                
                <div class="mt-4 pt-4 border-t border-gray-200">
                    <p class="text-sm text-gray-600">Estimated State-of-Charge Left</p>
                    <p class="text-2xl font-bold ${socColor}">${estimatedSocLeft.toFixed(1)}%</p>
                    <p class="text-sm text-gray-500">SOC Used: ${socConsumed.toFixed(1)}%</p>
                    ${estimatedSocLeft < 20 ? '<p class="text-sm text-red-600 mt-2">⚠️ Low battery warning! Consider charging during your trip.</p>' : ''}
                </div>
                
                ${segmentsHTML}
            `;
        } else {
            console.error('Directions API Error:', status);
            if (status === 'REQUEST_DENIED') {
                showError(`
                    <strong>API Configuration Error</strong><br>
                    The Directions API is not enabled for your Google Maps API key.<br><br>
                    To fix this:
                    <ol class="list-decimal list-inside mt-2 text-sm">
                        <li>Go to <a href="https://console.cloud.google.com" target="_blank" class="text-blue-600 underline">Google Cloud Console</a></li>
                        <li>Enable the "Directions API" for your project</li>
                        <li>Make sure your API key has the correct restrictions</li>
                    </ol>
                `);
            } else {
                showError(`Could not calculate the route. Error: ${status}`);
            }
        }
    });
}

function showError(message) {
    resultsDiv.innerHTML = `<p class="text-red-600">${message}</p>`;
}

// Schema version for input storage (increment when changing input structure)
const SCHEMA_VERSION = '1.1'; // Incremented for vehicle selection
const STORAGE_KEY = 'evSocEstimatorInputs';

// Save inputs to localStorage
function saveInputs() {
    const inputs = {
        version: SCHEMA_VERSION,
        vehicleSelect: vehicleSelect.value,
        startSoc: startSoc.value,
        batteryCapacity: batteryCapacity.value,
        avgMileage: avgMileage.value,
        departureTime: departureTime.value,
        trafficModel: trafficModel.value,
        startPoint: startPoint.value,
        destination: destination.value
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
        
        // Restore values
        if (inputs.vehicleSelect) vehicleSelect.value = inputs.vehicleSelect;
        if (inputs.startSoc) startSoc.value = inputs.startSoc;
        if (inputs.batteryCapacity) batteryCapacity.value = inputs.batteryCapacity;
        if (inputs.avgMileage) avgMileage.value = inputs.avgMileage;
        if (inputs.departureTime) departureTime.value = inputs.departureTime;
        if (inputs.trafficModel) trafficModel.value = inputs.trafficModel;
        if (inputs.startPoint) startPoint.value = inputs.startPoint;
        if (inputs.destination) destination.value = inputs.destination;
        
        console.log('Inputs restored from localStorage');
    } catch (error) {
        console.error('Error loading saved inputs:', error);
        localStorage.removeItem(STORAGE_KEY);
    }
}

// Add input listeners to save on change
function setupInputPersistence() {
    const inputs = [vehicleSelect, startSoc, batteryCapacity, avgMileage, departureTime, trafficModel, startPoint, destination];
    
    inputs.forEach(input => {
        input.addEventListener('change', saveInputs);
        // For text inputs, also save on blur
        if (input.type === 'text') {
            input.addEventListener('blur', saveInputs);
        }
    });
}

// Vehicle data management
let vehicleData = [];

// Load vehicle data from CSV
async function loadVehicleData() {
    try {
        const response = await fetch('./vehicles.csv');
        const csvText = await response.text();
        
        // Parse CSV
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',');
        
        vehicleData = lines.slice(1).map(line => {
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
        
        populateVehicleSelect();
        console.log(`Loaded ${vehicleData.length} vehicle models`);
        
        // After vehicle data is loaded, restore saved inputs if in main content
        if (!mainContent.classList.contains('hidden')) {
            loadInputs();
        }
    } catch (error) {
        console.error('Error loading vehicle data:', error);
    }
}

// Populate vehicle select dropdown
function populateVehicleSelect() {
    // Clear existing options except the first one
    vehicleSelect.innerHTML = '<option value="">Select a vehicle model...</option>';
    
    // Group by brand
    const brands = {};
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
vehicleSelect.addEventListener('change', (e) => {
    if (!e.target.value) return;
    
    const [brand, index] = e.target.value.split('-');
    const vehicle = vehicleData.find(v => v.brand === brand);
    
    if (vehicle) {
        // Find the specific variant
        const brandVehicles = vehicleData.filter(v => v.brand === brand);
        const selectedVehicle = brandVehicles[parseInt(index)];
        
        if (selectedVehicle) {
            batteryCapacity.value = selectedVehicle.battery_capacity_kwh;
            avgMileage.value = selectedVehicle.consumption_kwh_100km;
            
            // Save the selection
            saveInputs();
            
            console.log(`Selected: ${selectedVehicle.brand} ${selectedVehicle.model} ${selectedVehicle.variant}`);
        }
    }
});

// Check for stored API key when page loads
checkStoredApiKey();

// Load vehicle data when page loads
loadVehicleData();
