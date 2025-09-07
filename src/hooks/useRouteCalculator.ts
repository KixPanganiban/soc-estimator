import { useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { RouteSegment, RouteCalculationResult } from '../types';
import { analyzeSegments } from '../utils/segmentAnalyzer';
import { drawChart, drawSegmentPolylines } from '../utils/visualization';

export function useRouteCalculator() {
  const {
    directionsService,
    directionsRenderer,
    map,
    startPoint,
    waypoints,
    departureTime,
    trafficModel,
    avgMileage,
    batteryCapacity,
    startSoc,
    setIsLoading,
    setError,
    setRouteResult,
    setChartData,
  } = useAppContext();

  const calculateRoute = useCallback(async () => {
    if (!directionsService || !directionsRenderer || !map) {
      setError('Map not initialized');
      return;
    }

    // Filter out waypoints with empty or whitespace-only addresses
    const validWaypoints = waypoints.filter(wp => wp.address && wp.address.trim().length > 0);
    
    if (!startPoint || validWaypoints.length === 0) {
      setError('Please enter both starting point and at least one destination');
      return;
    }
    
    // The last waypoint is the destination
    const destination = validWaypoints[validWaypoints.length - 1].address;
    const intermediateWaypoints = validWaypoints.slice(0, -1);

    setIsLoading(true);
    setError(null);

    try {
      const waypointList = intermediateWaypoints.map(wp => ({ 
        location: wp.address.trim(), 
        stopover: true 
      }));

      console.log('Intermediate waypoints being sent:', waypointList);
      console.log('Destination:', destination);

      // Convert string traffic model to Google Maps enum
      const getTrafficModel = () => {
        switch (trafficModel) {
          case 'optimistic':
            return google.maps.TrafficModel.OPTIMISTIC;
          case 'pessimistic':
            return google.maps.TrafficModel.PESSIMISTIC;
          case 'best_guess':
          default:
            return google.maps.TrafficModel.BEST_GUESS;
        }
      };

      const request: google.maps.DirectionsRequest = {
        origin: startPoint,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false, // Preserve the order of waypoints as entered by user
        drivingOptions: {
          departureTime: departureTime,
          trafficModel: getTrafficModel(),
        },
        unitSystem: google.maps.UnitSystem.METRIC,
      };

      // Only add waypoints if there are valid ones
      if (waypointList.length > 0) {
        request.waypoints = waypointList;
      }

      console.log('Directions request:', request);

      const response = await directionsService.route(request);
      directionsRenderer.setDirections(response);

      // Analyze route segments
      const segments = analyzeSegments(response, avgMileage);
      
      // Calculate totals
      const totalDistance = segments.reduce((sum, seg) => sum + seg.distance, 0);
      const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);
      const totalEnergyConsumption = segments.reduce((sum, seg) => sum + seg.energyConsumption, 0);
      const socUsed = (totalEnergyConsumption / batteryCapacity) * 100;
      const remainingSoc = startSoc - socUsed;

      const result: RouteCalculationResult = {
        totalDistance,
        totalDuration,
        totalEnergyConsumption,
        socUsed,
        remainingSoc,
        segments,
      };

      // Visualize results
      // Clear any existing polylines first
      drawSegmentPolylines(segments, map);
      const chartData = drawChart(segments, startSoc, batteryCapacity);

      // Update results in context
      setRouteResult(result);
      setChartData(chartData);
      
      console.log('Route calculation results:', result);
      console.log('Chart data:', chartData);

      setIsLoading(false);
    } catch (error: any) {
      console.error('Route calculation error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to calculate route';
      
      if (error?.status === 'ZERO_RESULTS') {
        errorMessage = 'No route found between the specified locations';
      } else if (error?.status === 'NOT_FOUND') {
        errorMessage = 'One or more locations could not be found';
      } else if (error?.status === 'INVALID_REQUEST') {
        errorMessage = 'Invalid request. Please check your start point, destination, and waypoints';
        console.log('Invalid request details:', {
          startPoint,
          destination,
          waypoints: validWaypoints,
        });
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [
    directionsService,
    directionsRenderer,
    map,
    startPoint,
    waypoints,
    departureTime,
    trafficModel,
    avgMileage,
    batteryCapacity,
    startSoc,
    setIsLoading,
    setError,
    setRouteResult,
    setChartData,
  ]);

  return { calculateRoute };
}