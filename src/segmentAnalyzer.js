// Segment Analysis Module

// Get icon for maneuver type
function getManeuverIcon(maneuver) {
    const icons = {
        'turn-left': '↰',
        'turn-right': '↱',
        'turn-slight-left': '↖',
        'turn-slight-right': '↗',
        'turn-sharp-left': '</tool_call>',
        'turn-sharp-right': '⤽',
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

// Export functions for use in other modules
export { 
    analyzeRouteSegments,
    getManeuverIcon
};