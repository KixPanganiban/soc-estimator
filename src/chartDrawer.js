// Chart Drawing Module
let segmentPolylines = [];

// Clear previous segment polylines from map
function clearSegmentPolylines() {
    segmentPolylines.forEach(polyline => {
        polyline.setMap(null);
    });
    segmentPolylines = [];
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
            
            polyline.setMap(window.map);
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
                infoWindow.open(window.map);
            });
        }
    });
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

// Export functions for use in other modules
export { 
    clearSegmentPolylines,
    drawSegmentsOnMap,
    drawSegmentCharts,
    segmentPolylines
};