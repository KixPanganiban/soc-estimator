import React, { useEffect, useRef } from 'react';
import { Grid, Card } from '@radix-ui/themes';
import InputPanel from './InputPanel';
import MapView from './MapView';
import Results from './Results';
import { useMapInitializer } from '../hooks/useMapInitializer';
import { useVehicleData } from '../hooks/useVehicleData';

function MainContent() {
  const { initializeMap } = useMapInitializer();
  const { loadVehicles } = useVehicleData();
  const initializedRef = useRef(false);

  useEffect(() => {
    console.log('MainContent mounted');
    if (!initializedRef.current) {
      initializedRef.current = true;
      console.log('Initializing map and loading vehicles...');
      initializeMap();
      loadVehicles();
    }
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="md:col-span-1 p-0">
        <InputPanel />
      </Card>
      <div className="md:col-span-2 space-y-4">
        <MapView />
        <Results />
      </div>
    </div>
  );
}

export default MainContent;