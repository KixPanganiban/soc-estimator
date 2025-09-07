export interface Vehicle {
  brand: string;
  model: string;
  variant: string;
  batteryCapacity: number;
  avgMileage: number;
}

export interface Waypoint {
  id: string;
  address: string;
  placeId?: string;
  autocomplete?: google.maps.places.Autocomplete;
}

export interface RouteSegment {
  distance: number;
  duration: number;
  trafficDuration?: number;
  path: google.maps.LatLng[];
  speed: number;
  trafficCondition: 'VERY_HEAVY' | 'HEAVY' | 'MODERATE' | 'LIGHT';
  energyConsumption: number;
}

export interface RouteCalculationResult {
  totalDistance: number;
  totalDuration: number;
  totalEnergyConsumption: number;
  socUsed: number;
  remainingSoc: number;
  segments: RouteSegment[];
}

export interface AppState {
  apiKey: string | null;
  map: google.maps.Map | null;
  directionsService: google.maps.DirectionsService | null;
  directionsRenderer: google.maps.DirectionsRenderer | null;
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  waypoints: Waypoint[];
  startSoc: number;
  batteryCapacity: number;
  avgMileage: number;
  departureTime: Date;
  trafficModel: 'best_guess' | 'optimistic' | 'pessimistic';
  startPoint: string;
  isLoading: boolean;
  error: string | null;
  routeResult: RouteCalculationResult | null;
  chartData: any | null;
}