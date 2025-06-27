const apiKeySection = document.getElementById('api-key-section');
const apiKeyInput = document.getElementById('api-key-input');
const apiKeySubmit = document.getElementById('api-key-submit');
const mainContent = document.getElementById('main-content');
const changeApiKeyBtn = document.getElementById('change-api-key');

const startSoc = document.getElementById('start-soc');
const batteryCapacity = document.getElementById('battery-capacity');
const avgMileage = document.getElementById('avg-mileage');
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
    resultsDiv.innerHTML = '<p class="text-gray-600">Calculating route...</p>';
    estimateBtn.disabled = true;

    const request = {
        origin: startPoint.value,
        destination: destination.value,
        travelMode: 'DRIVING',
    };

    directionsService.route(request, (result, status) => {
        estimateBtn.disabled = false;
        
        if (status === 'OK') {
            directionsRenderer.setDirections(result);

            const route = result.routes[0].legs[0];
            const distance = route.distance.value / 1000; // in km
            const travelTime = route.duration.text;

            const energyConsumed = (distance / 100) * avgMileageValue;
            const socConsumed = (energyConsumed / batteryCapacityValue) * 100;
            const estimatedSocLeft = startSocValue - socConsumed;

            // Color code the result based on remaining SOC
            let socColor = 'text-green-600';
            if (estimatedSocLeft < 20) {
                socColor = 'text-red-600';
            } else if (estimatedSocLeft < 40) {
                socColor = 'text-yellow-600';
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
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Energy Consumed</p>
                        <p class="font-semibold">${energyConsumed.toFixed(1)} kWh</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">SOC Consumed</p>
                        <p class="font-semibold">${socConsumed.toFixed(1)}%</p>
                    </div>
                </div>
                <div class="mt-4 pt-4 border-t border-gray-200">
                    <p class="text-sm text-gray-600">Estimated State-of-Charge Left</p>
                    <p class="text-2xl font-bold ${socColor}">${estimatedSocLeft.toFixed(1)}%</p>
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

// Check for stored API key when page loads
checkStoredApiKey();
