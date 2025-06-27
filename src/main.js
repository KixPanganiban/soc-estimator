const apiKeySection = document.getElementById('api-key-section');
const apiKeyInput = document.getElementById('api-key-input');
const apiKeySubmit = document.getElementById('api-key-submit');
const mainContent = document.getElementById('main-content');
const changeApiKeyBtn = document.getElementById('change-api-key');

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
            
            // Log the route data to debug
            console.log('Route data:', {
                duration: route.duration,
                duration_in_traffic: route.duration_in_traffic,
                departure_time: route.departure_time,
                arrival_time: route.arrival_time
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
            
            // Calculate base energy consumption
            const baseEnergyConsumed = (distance / 100) * avgMileageValue;
            
            // Adjust for traffic - EVs are MORE efficient in heavy traffic (stop-and-go)
            // and LESS efficient at highway speeds (light traffic)
            // Traffic factor > 1 means heavy traffic, < 1 means light traffic
            const trafficAdjustment = 2 - trafficFactor; // Inverts the relationship
            const adjustedEnergyConsumed = baseEnergyConsumed * trafficAdjustment;
            
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
const SCHEMA_VERSION = '1.0';
const STORAGE_KEY = 'evSocEstimatorInputs';

// Save inputs to localStorage
function saveInputs() {
    const inputs = {
        version: SCHEMA_VERSION,
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
    const inputs = [startSoc, batteryCapacity, avgMileage, departureTime, trafficModel, startPoint, destination];
    
    inputs.forEach(input => {
        input.addEventListener('change', saveInputs);
        // For text inputs, also save on blur
        if (input.type === 'text') {
            input.addEventListener('blur', saveInputs);
        }
    });
}

// Check for stored API key when page loads
checkStoredApiKey();
