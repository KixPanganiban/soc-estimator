import { RouteSegment } from '../types';

export function analyzeSegments(
  response: google.maps.DirectionsResult,
  avgMileage: number
): RouteSegment[] {
  const segments: RouteSegment[] = [];
  const route = response.routes[0];

  if (!route || !route.legs) return segments;

  route.legs.forEach((leg) => {
    leg.steps.forEach((step) => {
      const distance = step.distance?.value || 0; // meters
      const duration = step.duration?.value || 0; // seconds
      const distanceKm = distance / 1000;
      const durationHours = duration / 3600;
      
      // Calculate average speed
      const speed = durationHours > 0 ? distanceKm / durationHours : 0;
      
      // Determine traffic condition based on speed
      let trafficCondition: RouteSegment['trafficCondition'];
      let efficiencyMultiplier: number;
      
      if (speed < 15) {
        trafficCondition = 'VERY_HEAVY';
        efficiencyMultiplier = 0.75; // Better efficiency due to regenerative braking
      } else if (speed < 40) {
        trafficCondition = 'HEAVY';
        efficiencyMultiplier = 0.85;
      } else if (speed < 60) {
        trafficCondition = 'MODERATE';
        efficiencyMultiplier = 1.0;
      } else {
        trafficCondition = 'LIGHT';
        efficiencyMultiplier = 1.2; // Worse efficiency at highway speeds
      }
      
      // Calculate energy consumption for this segment
      const baseEnergyConsumption = (distanceKm / 100) * avgMileage;
      const energyConsumption = baseEnergyConsumption * efficiencyMultiplier;
      
      // Convert path to LatLng array
      const path = step.path || [];
      
      segments.push({
        distance: distanceKm,
        duration: duration,
        path: path,
        speed: speed,
        trafficCondition: trafficCondition,
        energyConsumption: energyConsumption,
      });
    });
  });

  return segments;
}

export function getTrafficColor(condition: RouteSegment['trafficCondition']): string {
  switch (condition) {
    case 'VERY_HEAVY':
      return '#DC2626'; // red-600
    case 'HEAVY':
      return '#F97316'; // orange-500
    case 'MODERATE':
      return '#EAB308'; // yellow-500
    case 'LIGHT':
      return '#22C55E'; // green-500
    default:
      return '#6B7280'; // gray-500
  }
}