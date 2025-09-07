import React, { useEffect, useRef } from 'react';
import { Flex, Text, TextField, Button, IconButton } from '@radix-ui/themes';
import { Cross2Icon, PlusIcon } from '@radix-ui/react-icons';
import { useAppContext } from '../contexts/AppContext';

function WaypointInputs() {
  const { waypoints, addWaypoint, updateWaypoint, removeWaypoint, map } = useAppContext();
  const waypointRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const autocompletesRef = useRef<{ [key: string]: google.maps.places.Autocomplete }>({});

  // Ensure at least one waypoint exists (as destination)
  useEffect(() => {
    if (waypoints.length === 0) {
      addWaypoint();
    }
  }, [waypoints.length, addWaypoint]);

  useEffect(() => {
    // Initialize autocomplete for each waypoint when map is ready
    if (!map || !window.google || !window.google.maps || !window.google.maps.places) return;

    waypoints.forEach((waypoint) => {
      const container = waypointRefs.current[waypoint.id];
      if (!container) return;

      const input = container.querySelector('input');
      if (!input) return;

      // Check if autocomplete already exists for this waypoint
      if (!autocompletesRef.current[waypoint.id]) {
        try {
          const autocomplete = new google.maps.places.Autocomplete(input, {
            fields: ['formatted_address', 'geometry', 'name', 'place_id'],
          });
          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place) {
              // Use name if available (for businesses/POIs), otherwise formatted_address
              const address = place.name && !place.formatted_address?.startsWith(place.name) 
                ? `${place.name}, ${place.formatted_address}`
                : place.formatted_address || place.name || '';
              
              if (address) {
                updateWaypoint(waypoint.id, address);
                // Update the input value to match what we stored
                input.value = address;
              }
            }
          });
          autocompletesRef.current[waypoint.id] = autocomplete;
        } catch (error) {
          console.error('Error initializing waypoint autocomplete:', error);
        }
      }
    });

    // Cleanup autocompletes for removed waypoints
    Object.keys(autocompletesRef.current).forEach((id) => {
      if (!waypoints.find(w => w.id === id)) {
        delete autocompletesRef.current[id];
      }
    });
  }, [map, waypoints, updateWaypoint]);

  const handleRemoveWaypoint = (id: string) => {
    // Clean up autocomplete reference
    if (autocompletesRef.current[id]) {
      delete autocompletesRef.current[id];
    }
    removeWaypoint(id);
  };

  return (
    <Flex direction="column" gap="2">
      <Flex justify="between" align="center">
        <Text as="label" size="2" weight="medium">Stops</Text>
        <Button size="1" variant="ghost" onClick={addWaypoint}>
          <PlusIcon /> Add stop
        </Button>
      </Flex>
      {waypoints.map((waypoint, index) => (
        <Flex key={waypoint.id} gap="2" align="center">
          <Flex direction="column" align="center" gap="0">
            <Text 
              size="1" 
              weight="bold" 
              style={{ 
                backgroundColor: '#EA4335', 
                color: 'white', 
                padding: '2px 6px', 
                borderRadius: '4px',
                minWidth: '20px',
                textAlign: 'center'
              }}
            >
              {String.fromCharCode(66 + index)}
            </Text>
            {index === waypoints.length - 1 && (
              <Text size="1" color="gray" style={{ fontSize: '10px', marginTop: '2px' }}>
                Dest
              </Text>
            )}
          </Flex>
          <div 
            ref={(el) => { waypointRefs.current[waypoint.id] = el; }}
            style={{ flex: 1 }}
          >
            <TextField.Root
              placeholder={index === waypoints.length - 1 ? "Enter destination" : "Enter waypoint"}
              value={waypoint.address}
              onChange={(e) => updateWaypoint(waypoint.id, e.target.value)}
              data-waypoint-id={waypoint.id}
            />
          </div>
          {waypoints.length > 1 && (
            <IconButton
              size="2"
              variant="soft"
              color="red"
              onClick={() => handleRemoveWaypoint(waypoint.id)}
            >
              <Cross2Icon />
            </IconButton>
          )}
        </Flex>
      ))}
    </Flex>
  );
}

export default WaypointInputs;