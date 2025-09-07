import { useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Vehicle } from '../types';

export function useVehicleData() {
  const { setVehicles, setError } = useAppContext();

  const loadVehicles = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}vehicles.csv`);
      const text = await response.text();
      
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',');
      
      const vehicles: Vehicle[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length >= 5) { // Ensure we have at least the required columns
          vehicles.push({
            brand: values[0].trim(),
            model: values[1].trim(),
            variant: values[2].trim(),
            batteryCapacity: parseFloat(values[3]), // battery_capacity_kwh is at index 3
            avgMileage: parseFloat(values[4]), // consumption_kwh_100km is at index 4
          });
        }
      }
      
      console.log(`Loaded ${vehicles.length} vehicles`);
      setVehicles(vehicles);
    } catch (error) {
      setError('Failed to load vehicle data');
      console.error('Error loading vehicles:', error);
    }
  }, [setVehicles, setError]);

  return { loadVehicles };
}