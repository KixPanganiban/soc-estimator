import React, { useRef } from 'react';
import { Card } from '@radix-ui/themes';

function MapView() {
  const mapRef = useRef<HTMLDivElement>(null);

  return (
    <Card style={{ height: '384px', padding: 0 }}>
      <div ref={mapRef} id="map" style={{ height: '100%', width: '100%', borderRadius: 'var(--radius-2)' }} />
    </Card>
  );
}

export default MapView;