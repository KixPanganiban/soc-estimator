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
const howCalculateBtn = document.getElementById('how-calculate-btn');
const howCalculateModal = document.getElementById('how-calculate-modal');
const closeModalBtn = document.getElementById('close-modal-btn');

let map;
let directionsService;
let directionsRenderer;
let userApiKey = '';
let segmentPolylines = [];

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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=initMap`;
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
        directionsRenderer = new google.maps.DirectionsRenderer({
            suppressPolylines: true, // We'll draw our own colored segments
            preserveViewport: false
        });
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
        
        // Update departure time options
        updateDepartureTimeOptions();
        
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

// Get icon for maneuver type
function getManeuverIcon(maneuver) {
    const icons = {
        'turn-left': '↰',
        'turn-right': '↱',
        'turn-slight-left': '↖',
        'turn-slight-right': '↗',
        'turn-sharp-left': '⤺',
        'turn-sharp-right': '⤻',
        'straight': '↑',
        'merge': '⤵',
        'ramp-left': '⤶',
        'ramp-right': '⤷',
        'fork-left': '⤛',
        'fork-right': '⤜',
        'keep-left': '⬅',
        'keep-right': '➡',
        'roundabout-left': '↻',
        'roundabout-right': '↺',
        'uturn-left': '↶',
        'uturn-right': '↷'
    };
    return icons[maneuver] || '';
}

// Clear previous segment polylines from map
function clearSegmentPolylines() {
    segmentPolylines.forEach(polyline => {
        polyline.setMap(null);
    });
    segmentPolylines = [];
}

// Draw charts for segment analysis
function drawSegmentCharts(segments, startSoc, batteryCapacity) {
    // Destroy any existing charts first
    if (window.socChart && window.socChart instanceof Chart) {
        window.socChart.destroy();
        window.socChart = null;
    }
    if (window.efficiencyChart && window.efficiencyChart instanceof Chart) {
        window.efficiencyChart.destroy();
        window.efficiencyChart = null;
    }
    
    // Wait for DOM to update
    setTimeout(() => {
        // Chart 1: SOC over distance
        const socCanvas = document.getElementById('soc-chart');
        if (socCanvas && segments && segments.length > 0) {
            // Get fresh context
            const socCtx = socCanvas.getContext('2d');
            
            // Calculate cumulative distance and SOC at each point
            let cumulativeDistance = 0;
            let currentSoc = startSoc;
            const socData = [{x: 0, y: startSoc}]; // Start point
            
            segments.forEach(segment => {
                cumulativeDistance += segment.distance;
                const socUsed = (segment.adjustedConsumption / batteryCapacity) * 100;
                currentSoc -= socUsed;
                socData.push({x: cumulativeDistance, y: currentSoc});
            });
            
            // Create multiple datasets for each segment with different colors
            const datasets = [];
            let prevPoint = socData[0];
            
            segments.forEach((segment, index) => {
                const currentPoint = socData[index + 1];
                
                // Create a dataset for this segment
                datasets.push({
                    label: `Segment ${index + 1}`,
                    data: [prevPoint, currentPoint],
                    borderColor: segment.color,
                    backgroundColor: segment.color + '20',
                    borderWidth: 3,
                    tension: 0.1,
                    fill: false,
                    pointRadius: index === 0 ? 4 : 3,
                    pointHoverRadius: 6,
                    showLine: true
                });
                
                prevPoint = currentPoint;
            });
            
            window.socChart = new Chart(socCtx, {
                type: 'line',
                data: {
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                title: function(context) {
                                    if (context[0]) {
                                        return `Distance: ${context[0].parsed.x.toFixed(1)} km`;
                                    }
                                    return '';
                                },
                                label: function(context) {
                                    const segmentIndex = context.datasetIndex;
                                    if (segmentIndex < segments.length) {
                                        const segment = segments[segmentIndex];
                                        return [
                                            `SOC: ${context.parsed.y.toFixed(1)}%`,
                                            `Speed: ${segment.avgSpeed.toFixed(0)} km/h`,
                                            `Traffic: ${segment.trafficCondition}`
                                        ];
                                    }
                                    return `SOC: ${context.parsed.y.toFixed(1)}%`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'linear',
                            title: { display: true, text: 'Distance (km)' },
                            ticks: { precision: 0 }
                        },
                        y: {
                            title: { display: true, text: 'State of Charge (%)' },
                            min: 0,
                            max: 100,
                            ticks: { stepSize: 20 }
                        }
                    }
                }
            });
        }
        
        // Chart 2: Efficiency by segment
        const efficiencyCanvas = document.getElementById('efficiency-chart');
        if (efficiencyCanvas && segments && segments.length > 0) {
            // Get fresh context
            const effCtx = efficiencyCanvas.getContext('2d');
            
            // Calculate efficiency for each segment
            const efficiencyData = segments.map((segment, index) => ({
                x: index + 1,
                y: segment.consumptionMultiplier
            }));
            
            const colors = segments.map(segment => segment.color);
            
            window.efficiencyChart = new Chart(effCtx, {
                type: 'bar',
                data: {
                    labels: segments.map((_, i) => `${i + 1}`),
                    datasets: [{
                        label: 'Efficiency Multiplier',
                        data: efficiencyData.map(d => d.y),
                        backgroundColor: colors,
                        borderColor: colors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const segment = segments[context.dataIndex];
                                    return [
                                        `Efficiency: ${context.parsed.y.toFixed(2)}x`,
                                        `Speed: ${segment.avgSpeed.toFixed(0)} km/h`,
                                        `Traffic: ${segment.trafficCondition}`
                                    ];
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: { display: true, text: 'Segment #' }
                        },
                        y: {
                            title: { display: true, text: 'Efficiency Multiplier' },
                            min: 0.5,
                            max: 1.5,
                            ticks: {
                                callback: function(value) {
                                    return value.toFixed(1) + 'x';
                                }
                            }
                        }
                    }
                }
            });
        }
    }, 100);
}

// Draw colored segments on map
function drawSegmentsOnMap(segments) {
    clearSegmentPolylines();
    
    segments.forEach(segment => {
        if (segment.polyline && segment.polyline.points) {
            const path = google.maps.geometry.encoding.decodePath(segment.polyline.points);
            
            const polyline = new google.maps.Polyline({
                path: path,
                geodesic: true,
                strokeColor: segment.color,
                strokeOpacity: 0.8,
                strokeWeight: 6,
                zIndex: 100
            });
            
            polyline.setMap(map);
            segmentPolylines.push(polyline);
            
            // Add info window on click
            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div style="padding: 8px; min-width: 200px;">
                        <p style="font-weight: bold; margin: 0 0 4px 0;">Segment ${segment.index + 1}</p>
                        <p style="margin: 0; font-size: 12px; color: #666;">${segment.instruction.replace(/<[^>]*>/g, '').substring(0, 50)}...</p>
                        <hr style="margin: 8px 0; border-color: #e5e7eb;">
                        <p style="margin: 0; font-size: 12px;">Speed: ${segment.avgSpeed.toFixed(0)} km/h</p>
                        <p style="margin: 0; font-size: 12px;">Traffic: <span style="color: ${segment.color}">●</span> ${segment.trafficCondition}</p>
                        <p style="margin: 0; font-size: 12px;">Distance: ${segment.distance.toFixed(1)} km</p>
                        <p style="margin: 0; font-size: 12px;">Energy: ${segment.adjustedConsumption.toFixed(2)} kWh</p>
                    </div>
                `
            });
            
            polyline.addListener('click', (event) => {
                infoWindow.setPosition(event.latLng);
                infoWindow.open(map);
            });
        }
    });
}

// Analyze route segments and calculate traffic for each
function analyzeRouteSegments(route, avgMileageKwh, batteryCapacityKwh) {
    const segments = [];
    const steps = route.steps || [];
    
    // Get traffic model multiplier
    const trafficModelSelect = document.getElementById('traffic-model');
    let modelMultiplier = 1.0;
    if (trafficModelSelect) {
        switch(trafficModelSelect.value) {
            case 'pessimistic':
                modelMultiplier = 1.2; // Assume 20% worse traffic
                break;
            case 'optimistic':
                modelMultiplier = 0.9; // Assume 10% better traffic
                break;
            default:
                modelMultiplier = 1.0;
        }
    }
    
    steps.forEach((step, index) => {
        
        const segmentDistance = step.distance.value / 1000; // km
        const segmentDuration = step.duration.value; // seconds
        
        // Estimate speed for this segment (km/h)
        // Apply traffic model multiplier to simulate different traffic conditions
        const adjustedDuration = segmentDuration * modelMultiplier;
        const avgSpeed = segmentDistance / (adjustedDuration / 3600);
        
        // Determine traffic condition based on speed and road type
        let trafficCondition = 'normal';
        let trafficFactor = 1.0;
        let consumptionMultiplier = 1.0;
        let color = '#10b981'; // Default green
        
        // Analyze based on average speed with color gradient
        if (avgSpeed < 15) {
            trafficCondition = 'very heavy';
            trafficFactor = 1.6;
            consumptionMultiplier = 0.75; // Most efficient in very slow traffic
            color = '#dc2626'; // Red
        } else if (avgSpeed < 25) {
            trafficCondition = 'heavy';
            trafficFactor = 1.4;
            consumptionMultiplier = 0.8;
            color = '#ef4444'; // Light red
        } else if (avgSpeed < 40) {
            trafficCondition = 'moderate';
            trafficFactor = 1.2;
            consumptionMultiplier = 0.9;
            color = '#f97316'; // Orange
        } else if (avgSpeed < 60) {
            trafficCondition = 'normal';
            trafficFactor = 1.0;
            consumptionMultiplier = 1.0;
            color = '#f59e0b'; // Amber
        } else if (avgSpeed < 80) {
            trafficCondition = 'light';
            trafficFactor = 0.9;
            consumptionMultiplier = 1.1;
            color = '#84cc16'; // Lime
        } else {
            trafficCondition = 'very light';
            trafficFactor = 0.8;
            consumptionMultiplier = 1.2; // Least efficient at high speeds
            color = '#10b981'; // Green
        }
        
        // Calculate energy consumption for this segment
        const baseConsumption = (segmentDistance / 100) * avgMileageKwh;
        const adjustedConsumption = baseConsumption * consumptionMultiplier;
        
        // Extract instruction for info window display
        const instruction = step.html_instructions || `Step ${index + 1}`;
        
        segments.push({
            index: index,
            instruction: instruction,
            maneuver: step.maneuver || '',
            distance: segmentDistance,
            duration: segmentDuration,
            avgSpeed: avgSpeed,
            trafficCondition: trafficCondition,
            trafficFactor: trafficFactor,
            baseConsumption: baseConsumption,
            adjustedConsumption: adjustedConsumption,
            consumptionMultiplier: consumptionMultiplier,
            color: color,
            polyline: step.polyline,
            startLocation: step.start_location,
            endLocation: step.end_location
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
    let departureTimeValue;
    
    if (departureTime.value === 'now') {
        // Set to 1 minute in future to ensure we get traffic data
        departureTimeValue = new Date(Date.now() + 60000);
    } else {
        // Parse the ISO date string
        departureTimeValue = new Date(departureTime.value);
        
        // Ensure the departure time is in the future
        if (departureTimeValue < new Date()) {
            departureTimeValue = new Date(Date.now() + 60000);
        }
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
            let segments = [];
            try {
                segments = analyzeRouteSegments(route, avgMileageValue, batteryCapacityValue);
                if (segments.length > 0) {
                    drawSegmentsOnMap(segments);
                }
            } catch (error) {
                console.error('Error analyzing route segments:', error);
                // Continue with route-level analysis if segment analysis fails
            }
            
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
            
            // Calculate base traffic factor from Google Maps data
            if (trafficDuration) {
                trafficFactor = trafficDuration / normalDuration;
            } else {
                trafficFactor = 1.0; // Default if no traffic data
                trafficDuration = normalDuration;
            }
            
            // Apply traffic model as additional adjustment
            let modelMultiplier = 1.0;
            switch(trafficModel.value) {
                case 'pessimistic':
                    modelMultiplier = 1.2; // Assume 20% worse traffic than predicted
                    break;
                case 'optimistic':
                    modelMultiplier = 0.9; // Assume 10% better traffic than predicted
                    break;
                default: // best_guess
                    modelMultiplier = 1.0; // Use Google's prediction as-is
            }
            
            // Combine Google's traffic data with user's traffic model
            trafficFactor = trafficFactor * modelMultiplier;
            trafficDuration = normalDuration * trafficFactor;
            
            console.log('Traffic calculations:', {
                normalDuration: normalDuration + 's',
                googleTrafficDuration: route.duration_in_traffic ? route.duration_in_traffic.value + 's' : 'Not available',
                modelMultiplier: modelMultiplier,
                finalTrafficDuration: Math.round(trafficDuration) + 's',
                finalTrafficFactor: trafficFactor,
                trafficModel: trafficModel.value
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
                        <div class="mb-3 flex items-center gap-3 text-xs">
                            <span class="font-medium">Speed Legend:</span>
                            <div class="flex items-center gap-1">
                                <div class="w-3 h-3 rounded-full" style="background-color: #dc2626"></div>
                                <span>&lt;15 km/h</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <div class="w-3 h-3 rounded-full" style="background-color: #f97316"></div>
                                <span>25-40 km/h</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <div class="w-3 h-3 rounded-full" style="background-color: #f59e0b"></div>
                                <span>40-60 km/h</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <div class="w-3 h-3 rounded-full" style="background-color: #10b981"></div>
                                <span>&gt;80 km/h</span>
                            </div>
                        </div>
                        <div class="max-h-64 overflow-y-auto">
                            <table class="w-full text-sm">
                                <thead class="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th class="px-2 py-1 text-left">#</th>
                                        <th class="px-2 py-1 text-right">Distance</th>
                                        <th class="px-2 py-1 text-center">Speed/Traffic</th>
                                        <th class="px-2 py-1 text-right">Energy</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200">
                                    ${segments.map((seg, idx) => {
                                        return `
                                            <tr class="hover:bg-gray-50">
                                                <td class="px-2 py-1">${idx + 1}</td>
                                                <td class="px-2 py-1 text-right">${seg.distance.toFixed(1)} km</td>
                                                <td class="px-2 py-1 text-center">
                                                    <div class="flex items-center justify-center gap-1">
                                                        <div class="w-3 h-3 rounded-full" style="background-color: ${seg.color}"></div>
                                                        <span>${seg.avgSpeed.toFixed(0)} km/h</span>
                                                    </div>
                                                </td>
                                                <td class="px-2 py-1 text-right">${seg.adjustedConsumption.toFixed(2)} kWh</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                                <tfoot class="bg-gray-100 font-semibold">
                                    <tr>
                                        <td class="px-2 py-1">Total</td>
                                        <td class="px-2 py-1 text-right">${distance.toFixed(1)} km</td>
                                        <td class="px-2 py-1"></td>
                                        <td class="px-2 py-1 text-right">${adjustedEnergyConsumed.toFixed(1)} kWh</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        
                        <!-- Charts Section -->
                        <div class="mt-6 grid md:grid-cols-2 gap-4">
                            <div class="bg-white rounded-lg p-4 shadow-sm">
                                <h4 class="text-sm font-semibold mb-2">📈 SOC Over Distance</h4>
                                <div style="position: relative; height: 200px;">
                                    <canvas id="soc-chart"></canvas>
                                </div>
                            </div>
                            <div class="bg-white rounded-lg p-4 shadow-sm">
                                <h4 class="text-sm font-semibold mb-2">⚡ Efficiency by Segment</h4>
                                <div style="position: relative; height: 200px;">
                                    <canvas id="efficiency-chart"></canvas>
                                </div>
                            </div>
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
                    ${!route.duration_in_traffic ? '<p class="text-xs text-gray-500 mt-1">⚠️ Traffic data unavailable - using base estimates</p>' : ''}
                    ${modelMultiplier !== 1.0 ? `<p class="text-xs text-gray-500 mt-1">📊 Traffic model applied: ${trafficModel.value === 'pessimistic' ? 'Heavy (+20%)' : 'Light (-10%)'}</p>` : ''}
                </div>
                
                <div class="mt-4 pt-4 border-t border-gray-200">
                    <p class="text-sm text-gray-600">Estimated State-of-Charge Left</p>
                    <p class="text-2xl font-bold ${socColor}">${estimatedSocLeft.toFixed(1)}%</p>
                    <p class="text-sm text-gray-500">SOC Used: ${socConsumed.toFixed(1)}%</p>
                    ${estimatedSocLeft < 20 ? '<p class="text-sm text-red-600 mt-2">⚠️ Low battery warning! Consider charging during your trip.</p>' : ''}
                </div>
                
                ${segmentsHTML}
            `;
            
            // Draw charts if segments are available
            if (segments.length > 0) {
                drawSegmentCharts(segments, startSocValue, batteryCapacityValue);
            }
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

// Modal event listeners
howCalculateBtn.addEventListener('click', () => {
    howCalculateModal.classList.remove('hidden');
});

closeModalBtn.addEventListener('click', () => {
    howCalculateModal.classList.add('hidden');
});

// Close modal when clicking outside
howCalculateModal.addEventListener('click', (e) => {
    if (e.target === howCalculateModal) {
        howCalculateModal.classList.add('hidden');
    }
});

// Check for stored API key when page loads
checkStoredApiKey();

// Load vehicle data when page loads
loadVehicleData();
