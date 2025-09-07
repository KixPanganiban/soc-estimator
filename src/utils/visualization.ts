import { RouteSegment } from '../types';
import { getTrafficColor } from './segmentAnalyzer';

const segmentPolylines: google.maps.Polyline[] = [];

export function clearSegmentPolylines() {
  segmentPolylines.forEach(polyline => polyline.setMap(null));
  segmentPolylines.length = 0;
}

export function drawSegmentPolylines(segments: RouteSegment[], map: google.maps.Map) {
  clearSegmentPolylines();
  
  segments.forEach((segment, index) => {
    const polyline = new google.maps.Polyline({
      path: segment.path,
      strokeColor: getTrafficColor(segment.trafficCondition),
      strokeOpacity: 0.9,
      strokeWeight: 7,
      map: map,
      zIndex: segments.length - index, // Higher z-index for earlier segments
    });
    
    // Add click listener to show segment info
    polyline.addListener('click', () => {
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <strong>Segment #${index + 1}</strong><br/>
            Distance: ${segment.distance.toFixed(1)} km<br/>
            Speed: ${segment.speed.toFixed(0)} km/h<br/>
            Traffic: ${segment.trafficCondition.replace('_', ' ').toLowerCase()}<br/>
            Energy: ${segment.energyConsumption.toFixed(2)} kWh
          </div>
        `,
        position: segment.path[Math.floor(segment.path.length / 2)],
      });
      infoWindow.open(map);
      
      // Auto-close after 5 seconds
      setTimeout(() => infoWindow.close(), 5000);
    });
    
    segmentPolylines.push(polyline);
  });
}

export function drawChart(
  segments: RouteSegment[],
  startSoc: number,
  batteryCapacity: number
) {
  const labels: string[] = ['Start'];
  const socData: number[] = [startSoc];
  const consumptionData: number[] = [0];
  const segmentColors: string[] = [];
  const backgroundColors: string[] = [];
  
  let cumulativeDistance = 0;
  let cumulativeSoc = startSoc;
  let cumulativeConsumption = 0;
  
  segments.forEach((segment, index) => {
    cumulativeDistance += segment.distance;
    cumulativeConsumption += segment.energyConsumption;
    const socUsed = (segment.energyConsumption / batteryCapacity) * 100;
    cumulativeSoc -= socUsed;
    
    labels.push(`${cumulativeDistance.toFixed(1)} km`);
    socData.push(cumulativeSoc);
    consumptionData.push(cumulativeConsumption);
    
    // Get color based on traffic condition
    const color = getTrafficColor(segment.trafficCondition);
    segmentColors.push(color);
    
    // Create a semi-transparent version for background
    const alpha = 0.2;
    if (color === '#DC2626') backgroundColors.push(`rgba(220, 38, 38, ${alpha})`); // red
    else if (color === '#F97316') backgroundColors.push(`rgba(249, 115, 22, ${alpha})`); // orange
    else if (color === '#EAB308') backgroundColors.push(`rgba(234, 179, 8, ${alpha})`); // yellow
    else backgroundColors.push(`rgba(34, 197, 94, ${alpha})`); // green
  });
  
  // Add initial color for the start point
  segmentColors.unshift('#6B7280'); // gray for start
  backgroundColors.unshift('rgba(107, 114, 128, 0.2)');
  
  return {
    labels,
    datasets: [
      {
        label: 'State of Charge (%)',
        data: socData,
        borderColor: segmentColors,
        backgroundColor: backgroundColors,
        segment: {
          borderColor: (ctx: any) => {
            // Use the color for each segment
            const index = ctx.p0DataIndex;
            return segmentColors[index] || '#6B7280';
          },
          backgroundColor: (ctx: any) => {
            const index = ctx.p0DataIndex;
            return backgroundColors[index] || 'rgba(107, 114, 128, 0.2)';
          }
        },
        borderWidth: 3,
        tension: 0.1,
        yAxisID: 'y',
      },
      {
        label: 'Energy Consumed (kWh)',
        data: consumptionData,
        borderColor: 'rgb(156, 163, 175)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.1,
        yAxisID: 'y1',
      },
    ],
  };
}