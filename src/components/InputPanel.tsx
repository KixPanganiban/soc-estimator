import React, { useEffect, useRef } from 'react';
import { Box, Flex, Heading, Text, TextField, Select, Button, Link } from '@radix-ui/themes';
import { useAppContext } from '../contexts/AppContext';
import { useRouteCalculator } from '../hooks/useRouteCalculator';
import WaypointInputs from './WaypointInputs';
import HowWeCalculateModal from './HowWeCalculateModal';

function InputPanel() {
  const {
    apiKey,
    setApiKey,
    vehicles,
    selectedVehicle,
    setSelectedVehicle,
    startSoc,
    setStartSoc,
    batteryCapacity,
    setBatteryCapacity,
    avgMileage,
    setAvgMileage,
    departureTime,
    setDepartureTime,
    trafficModel,
    setTrafficModel,
    startPoint,
    setStartPoint,
    waypoints,
    map,
  } = useAppContext();

  const { calculateRoute } = useRouteCalculator();
  const [showHowCalculate, setShowHowCalculate] = React.useState(false);
  const startInputRef = useRef<HTMLDivElement>(null);

  const handleVehicleChange = (vehicleId: string) => {
    if (vehicleId === 'none') {
      setSelectedVehicle(null);
      return;
    }
    
    const vehicle = vehicles.find(v => `${v.brand} ${v.model} ${v.variant}` === vehicleId);
    if (vehicle) {
      setSelectedVehicle(vehicle);
      setBatteryCapacity(vehicle.batteryCapacity);
      setAvgMileage(vehicle.avgMileage);
    } else {
      setSelectedVehicle(null);
    }
  };

  useEffect(() => {
    // Initialize Google Places Autocomplete when map is loaded
    if (!map) return; // Wait for map to be initialized
    
    const initAutocomplete = () => {
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        console.log('Google Maps not loaded yet');
        return;
      }

      // Find the actual input elements within the Radix UI components
      const startInput = startInputRef.current?.querySelector('input');

      if (startInput && !startInput.hasAttribute('data-autocomplete-initialized')) {
        console.log('Initializing autocomplete for start input');
        const startAutocomplete = new google.maps.places.Autocomplete(startInput, {
          fields: ['formatted_address', 'geometry', 'name', 'place_id'],
        });
        startAutocomplete.addListener('place_changed', () => {
          const place = startAutocomplete.getPlace();
          if (place) {
            // Use name if available (for businesses/POIs), otherwise formatted_address
            const address = place.name && !place.formatted_address?.startsWith(place.name) 
              ? `${place.name}, ${place.formatted_address}`
              : place.formatted_address || place.name || '';
            
            if (address) {
              setStartPoint(address);
              // Clear any manual text that doesn't match
              startInput.value = address;
            }
          }
        });
        startInput.setAttribute('data-autocomplete-initialized', 'true');
      }
    };

    // Try to initialize immediately if Google Maps is ready
    initAutocomplete();
    
    // Also try after a short delay in case the DOM needs to settle
    const timer = setTimeout(initAutocomplete, 500);
    
    return () => clearTimeout(timer);
  }, [map, setStartPoint]);

  const generateDepartureTimes = () => {
    const times = [];
    const now = new Date();
    times.push({ value: 'now', label: 'Leave now' });
    
    for (let i = 1; i <= 24; i++) {
      const time = new Date(now.getTime() + i * 60 * 60 * 1000);
      const label = time.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      times.push({ value: time.toISOString(), label: `Leave at ${label}` });
    }
    return times;
  };

  return (
    <Box style={{ padding: '20px' }}>
      <Flex direction="column" gap="3">
        <Flex justify="between" align="center" style={{ marginBottom: '8px' }}>
          <Heading size="4">Inputs</Heading>
          <Link 
            size="1" 
            style={{ cursor: 'pointer', color: 'var(--gray-11)' }}
            onClick={() => setApiKey(null)}
          >
            Change API Key
          </Link>
        </Flex>

        <Flex direction="column" gap="2">
          <Text as="label" size="2" weight="medium">
            Starting State-of-Charge (%)
          </Text>
          <TextField.Root
            type="number"
            value={startSoc.toString()}
            onChange={(e) => setStartSoc(Number(e.target.value))}
            min="0"
            max="100"
            step="1"
          />
        </Flex>

        <Flex direction="column" gap="2">
          <Text as="label" size="2" weight="medium">
            Vehicle Model (Optional)
          </Text>
          <Select.Root
            value={selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model} ${selectedVehicle.variant}` : undefined}
            onValueChange={handleVehicleChange}
          >
            <Select.Trigger placeholder="Select a vehicle model..." />
            <Select.Content position="popper" sideOffset={5} style={{ maxHeight: '300px', overflow: 'auto' }}>
              <Select.Item value="none">None</Select.Item>
              {vehicles.map((vehicle) => (
                <Select.Item 
                  key={`${vehicle.brand}-${vehicle.model}-${vehicle.variant}`} 
                  value={`${vehicle.brand} ${vehicle.model} ${vehicle.variant}`}
                >
                  {vehicle.brand} {vehicle.model} - {vehicle.variant}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          <Text size="1" color="gray">Popular EVs in Southeast Asia</Text>
        </Flex>

        <Flex direction="column" gap="2">
          <Text as="label" size="2" weight="medium">
            Total Battery Capacity (kWh)
          </Text>
          <TextField.Root
            type="number"
            value={batteryCapacity.toString()}
            onChange={(e) => setBatteryCapacity(Number(e.target.value))}
            min="1"
            step="0.1"
          />
        </Flex>

        <Flex direction="column" gap="2">
          <Text as="label" size="2" weight="medium">
            Average Mileage (kWh/100km)
          </Text>
          <TextField.Root
            type="number"
            value={avgMileage.toString()}
            onChange={(e) => setAvgMileage(Number(e.target.value))}
            min="1"
            step="0.1"
          />
        </Flex>

        <Flex direction="column" gap="2">
          <Text as="label" size="2" weight="medium">
            Departure Time
          </Text>
          <Select.Root
            defaultValue="now"
            onValueChange={(value) => setDepartureTime(value === 'now' ? new Date() : new Date(value))}
          >
            <Select.Trigger placeholder="Select departure time" />
            <Select.Content>
              {generateDepartureTimes().map(({ value, label }) => (
                <Select.Item key={value} value={value}>
                  {label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>

        <Flex direction="column" gap="2">
          <Text as="label" size="2" weight="medium">
            Traffic Prediction
          </Text>
          <Select.Root
            value={trafficModel}
            onValueChange={(value) => setTrafficModel(value as 'best_guess' | 'optimistic' | 'pessimistic')}
          >
            <Select.Trigger placeholder="Select traffic model" />
            <Select.Content>
              <Select.Item value="best_guess">Typical Traffic</Select.Item>
              <Select.Item value="optimistic">Light Traffic</Select.Item>
              <Select.Item value="pessimistic">Heavy Traffic</Select.Item>
            </Select.Content>
          </Select.Root>
          <Text size="1" color="gray">Affects route calculation and energy estimates</Text>
        </Flex>

        <Flex direction="column" gap="2">
          <Flex align="center" gap="2">
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
              A
            </Text>
            <Text as="label" size="2" weight="medium">
              Starting Point
            </Text>
          </Flex>
          <div ref={startInputRef}>
            <TextField.Root
              placeholder="Enter starting location"
              value={startPoint}
              onChange={(e) => setStartPoint(e.target.value)}
            />
          </div>
        </Flex>

        <WaypointInputs />

        <Flex direction="column" gap="2" style={{ marginTop: '8px' }}>
          <Button size="3" onClick={calculateRoute}>
            Estimate
          </Button>

          <Button 
            size="2" 
            variant="soft" 
            onClick={() => setShowHowCalculate(true)}
          >
            ❓ How We Calculate
          </Button>
        </Flex>
      </Flex>

      <HowWeCalculateModal open={showHowCalculate} onOpenChange={setShowHowCalculate} />
    </Box>
  );
}

export default InputPanel;