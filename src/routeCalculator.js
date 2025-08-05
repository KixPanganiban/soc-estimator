// Route Calculation Module
import { getActiveWaypoints } from './waypointManager.js';
import { analyzeRouteSegments } from './segmentAnalyzer.js';
import { drawSegmentsOnMap, drawSegmentCharts } from './chartDrawer.js';

// Format duration from seconds to human-readable text
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours} hr ${minutes} min`;
    } else {
        return `${minutes} min`;
    }
}

// Get icon for maneuver type
function getManeuverIcon(maneuver) {
    const icons = {
        'turn-left': '↰',
        'turn-right': '↱',
        'turn-slight-left': '↖',
        'turn-slight-right': '↗',
        'turn-sharp-left': '⤽',
        'turn-sharp-right': '⤵',
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

function calculateRoute() {
    // Get DOM elements
    const startPoint = document.getElementById('start-point');
    const destination = document.getElementById('destination');
    const startSoc = document.getElementById('start-soc');
    const batteryCapacity = document.getElementById('battery-capacity');
    const avgMileage = document.getElementById('avg-mileage');
    const departureTime = document.getElementById('departure-time');
    const trafficModel = document.getElementById('traffic-model');
    const resultsDiv = document.getElementById('results');
    const estimateBtn = document.getElementById('estimate-btn');
    
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
    
    // Add waypoints if any exist
    const activeWaypoints = getActiveWaypoints();
    if (activeWaypoints.length > 0) {
        request.waypoints = activeWaypoints.map(wp => ({
            location: wp.value,
            stopover: true
        }));
    }
    
    // Try to add traffic model if requested
    if (trafficModel.value && trafficModel.value !== 'best_guess') {
        // Use the string values directly as the API seems to accept them
        request.drivingOptions.trafficModel = trafficModel.value;
    }
    
    console.log('Directions request:', request);

    // Access directions service from global window object
    const directionsService = window.directionsService;
    const directionsRenderer = window.directionsRenderer;
    
    directionsService.route(request, (result, status) => {
        estimateBtn.disabled = false;
        
        if (status === 'OK') {
            directionsRenderer.setDirections(result);

            const legs = result.routes[0].legs;
            
            // Calculate total distance and time across all legs
            let totalDistance = 0;
            let totalTime = 0;
            let totalTimeText = '';
            
            // Process all legs (segments between waypoints)
            let allSegments = [];
            
            legs.forEach((leg, legIndex) => {
                totalDistance += leg.distance.value / 1000; // in km
                totalTime += leg.duration.value; // in seconds
                
                // Process route segments (steps) for this leg
                try {
                    const legSegments = analyzeRouteSegments(leg, avgMileageValue, batteryCapacityValue);
                    // Add leg index to each segment for identification
                    legSegments.forEach(segment => {
                        segment.legIndex = legIndex;
                        segment.legDescription = legIndex === 0 ? 'Start' : `Waypoint ${legIndex}`;
                        segment.legDestination = legIndex === legs.length - 1 ? 'Destination' : `Waypoint ${legIndex + 1}`;
                    });
                    allSegments = allSegments.concat(legSegments);
                } catch (error) {
                    console.error(`Error analyzing route segments for leg ${legIndex}:`, error);
                }
            });
            
            const distance = totalDistance;
            const travelTime = formatDuration(totalTime);
            
            // Draw all segments on map
            if (allSegments.length > 0) {
                drawSegmentsOnMap(allSegments);
            }
            
            let segments = allSegments;
            
            // Log the route data to debug
            console.log('Route data:', {
                legs: legs.length,
                totalDistance: distance,
                totalTime: travelTime,
                segments: segments
            });
            
            // Get traffic data (aggregate from all legs)
            let totalNormalDuration = 0;
            let totalTrafficDuration = 0;
            let hasTrafficData = false;
            
            legs.forEach(leg => {
                totalNormalDuration += leg.duration.value;
                if (leg.duration_in_traffic) {
                    totalTrafficDuration += leg.duration_in_traffic.value;
                    hasTrafficData = true;
                } else {
                    totalTrafficDuration += leg.duration.value;
                }
            });
            
            let trafficFactor = 1.0;
            if (hasTrafficData) {
                trafficFactor = totalTrafficDuration / totalNormalDuration;
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
            const trafficDuration = totalNormalDuration * trafficFactor;
            
            console.log('Traffic calculations:', {
                normalDuration: totalNormalDuration + 's',
                googleTrafficDuration: hasTrafficData ? totalTrafficDuration + 's' : 'Not available',
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
                trafficIcon = '_traffic light_';
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
                                <span><15 km/h</span>
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
                                <span>>80 km/h</span>
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
                                <h4 class="text-sm font-semibold mb-2">_chart increasing_ SOC Over Distance</h4>
                                <div style="position: relative; height: 200px;">
                                    <canvas id="soc-chart"></canvas>
                                </div>
                            </div>
                            <div class="bg-white rounded-lg p-4 shadow-sm">
                                <h4 class="text-sm font-semibold mb-2">_zap_ Efficiency by Segment</h4>
                                <div style="position: relative; height: 200px;">
                                    <canvas id="efficiency-chart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            // Build waypoints display if any
            let waypointsDisplay = '';
            if (activeWaypoints.length > 0) {
                waypointsDisplay = `
                    <div class="mb-3 p-2 bg-blue-50 rounded">
                        <p class="text-sm font-medium text-blue-900">Route includes ${activeWaypoints.length} waypoint${activeWaypoints.length > 1 ? 's' : ''}</p>
                        <p class="text-xs text-blue-700">${activeWaypoints.map((wp, i) => `${i + 1}. ${wp.value}`).join(' → ')}</p>
                    </div>
                `;
            }

            resultsDiv.innerHTML = `
                <h2 class="text-lg font-semibold mb-4">Trip Results</h2>
                ${waypointsDisplay}
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-gray-600">Distance</p>
                        <p class="font-semibold">${distance.toFixed(1)} km</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Travel Time</p>
                        <p class="font-semibold">${travelTime}</p>
                        ${trafficDuration !== totalNormalDuration ? `<p class="text-xs text-gray-500">(${Math.round(totalNormalDuration/60)} min without traffic)</p>` : ''}
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
                    ${!hasTrafficData ? '<p class="text-xs text-gray-500 mt-1">⚠️ Traffic data unavailable - using base estimates</p>' : ''}
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
                setTimeout(() => {
                    drawSegmentCharts(segments, startSocValue, batteryCapacityValue);
                }, 100);
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
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `<p class="text-red-600">${message}</p>`;
}

// Export functions for use in other modules
export { 
    calculateRoute,
    formatDuration,
    getManeuverIcon,
    showError
};