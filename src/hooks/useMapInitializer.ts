import { useCallback, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';

export function useMapInitializer() {
  const { apiKey, setMap, setDirectionsService, setDirectionsRenderer, setError } = useAppContext();
  const scriptLoadedRef = useRef(false);

  const loadGoogleMapsScript = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      // Check if script is already in the DOM
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Wait for existing script to load
        if (scriptLoadedRef.current) {
          resolve();
        } else {
          existingScript.addEventListener('load', () => resolve());
          existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));
        }
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        scriptLoadedRef.current = true;
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Maps script'));
      };
      
      document.head.appendChild(script);
    });
  }, [apiKey]);

  const initializeMap = useCallback(async () => {
    if (!apiKey) {
      setError('API key is required');
      return;
    }

    try {
      await loadGoogleMapsScript();

      const mapElement = document.getElementById('map');
      if (!mapElement) {
        setError('Map container not found');
        return;
      }

      const map = new google.maps.Map(mapElement, {
        center: { lat: 1.3521, lng: 103.8198 }, // Singapore
        zoom: 11,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
      });

      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: false, // Keep the default markers with A, B, C labels
        suppressPolylines: true, // Hide the default polyline so we can draw our own colored segments
        markerOptions: {
          zIndex: 1000, // Ensure markers are on top
        }
      });

      setMap(map);
      setDirectionsService(directionsService);
      setDirectionsRenderer(directionsRenderer);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to initialize map');
    }
  }, [apiKey, setMap, setDirectionsService, setDirectionsRenderer, setError]);

  return { initializeMap };
}