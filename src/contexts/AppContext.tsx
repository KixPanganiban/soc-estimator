import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Vehicle, Waypoint, AppState, RouteCalculationResult } from '../types';

interface AppContextType extends AppState {
  setApiKey: (key: string | null) => void;
  setMap: (map: google.maps.Map | null) => void;
  setDirectionsService: (service: google.maps.DirectionsService | null) => void;
  setDirectionsRenderer: (renderer: google.maps.DirectionsRenderer | null) => void;
  setVehicles: (vehicles: Vehicle[]) => void;
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
  addWaypoint: () => void;
  updateWaypoint: (id: string, address: string) => void;
  removeWaypoint: (id: string) => void;
  setWaypointAutocomplete: (id: string, autocomplete: google.maps.places.Autocomplete) => void;
  setStartSoc: (soc: number) => void;
  setBatteryCapacity: (capacity: number) => void;
  setAvgMileage: (mileage: number) => void;
  setDepartureTime: (time: Date) => void;
  setTrafficModel: (model: 'best_guess' | 'optimistic' | 'pessimistic') => void;
  setStartPoint: (point: string) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRouteResult: (result: RouteCalculationResult | null) => void;
  setChartData: (data: any | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(localStorage.getItem('gmaps-api-key'));
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([{ id: 'initial-destination', address: '' }]);
  const [startSoc, setStartSoc] = useState(80);
  const [batteryCapacity, setBatteryCapacity] = useState(75);
  const [avgMileage, setAvgMileage] = useState(18);
  const [departureTime, setDepartureTime] = useState(new Date());
  const [trafficModel, setTrafficModel] = useState<'best_guess' | 'optimistic' | 'pessimistic'>('best_guess');
  const [startPoint, setStartPoint] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeResult, setRouteResult] = useState<RouteCalculationResult | null>(null);
  const [chartData, setChartData] = useState<any | null>(null);

  const handleSetApiKey = useCallback((key: string | null) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem('gmaps-api-key', key);
    } else {
      localStorage.removeItem('gmaps-api-key');
    }
  }, []);

  const addWaypoint = useCallback(() => {
    const id = `waypoint-${Date.now()}`;
    setWaypoints(prev => [...prev, { id, address: '' }]);
  }, []);

  const updateWaypoint = useCallback((id: string, address: string) => {
    setWaypoints(prev => prev.map(wp => wp.id === id ? { ...wp, address } : wp));
  }, []);

  const removeWaypoint = useCallback((id: string) => {
    setWaypoints(prev => prev.filter(wp => wp.id !== id));
  }, []);

  const setWaypointAutocomplete = useCallback((id: string, autocomplete: google.maps.places.Autocomplete) => {
    setWaypoints(prev => prev.map(wp => wp.id === id ? { ...wp, autocomplete } : wp));
  }, []);

  const value: AppContextType = {
    apiKey,
    map,
    directionsService,
    directionsRenderer,
    vehicles,
    selectedVehicle,
    waypoints,
    startSoc,
    batteryCapacity,
    avgMileage,
    departureTime,
    trafficModel,
    startPoint,
    isLoading,
    error,
    routeResult,
    chartData,
    setApiKey: handleSetApiKey,
    setMap,
    setDirectionsService,
    setDirectionsRenderer,
    setVehicles,
    setSelectedVehicle,
    addWaypoint,
    updateWaypoint,
    removeWaypoint,
    setWaypointAutocomplete,
    setStartSoc,
    setBatteryCapacity,
    setAvgMileage,
    setDepartureTime,
    setTrafficModel,
    setStartPoint,
    setIsLoading,
    setError,
    setRouteResult,
    setChartData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}