import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import { IconButton, Heading, Text, Grid, Card, Flex, Box, Code } from '@radix-ui/themes';

interface HowWeCalculateModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function HowWeCalculateModal({ open, onOpenChange }: HowWeCalculateModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 50
          }}
        />
        <Dialog.Content 
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            maxWidth: '1200px',
            width: '90vw',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            zIndex: 51
          }}
        >
          <Flex justify="between" align="center" style={{ marginBottom: '20px' }}>
            <Dialog.Title asChild>
              <Heading size="7">How We Calculate</Heading>
            </Dialog.Title>
            <Dialog.Close asChild>
              <IconButton size="2" variant="ghost">
                <Cross2Icon />
              </IconButton>
            </Dialog.Close>
          </Flex>

          <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="4">
            <Card>
              <Flex direction="column" gap="3">
                <Heading size="3">⚡ Basic Energy Consumption</Heading>
                <Code size="2" style={{ padding: '8px', display: 'block' }}>
                  Base Energy = (Distance ÷ 100) × Average Mileage
                </Code>
                <Text size="2">Where:</Text>
                <Box style={{ paddingLeft: '16px' }}>
                  <Flex direction="column" gap="1">
                    <Text size="2">• Distance is in kilometers (km)</Text>
                    <Text size="2">• Average Mileage is in kWh/100km</Text>
                    <Text size="2">• Result is in kilowatt-hours (kWh)</Text>
                  </Flex>
                </Box>
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" gap="3">
                <Heading size="3">🚦 Traffic Adjustment</Heading>
                <Code size="2" style={{ padding: '8px', display: 'block' }}>
                  Traffic Factor = Traffic Duration ÷ Normal Duration
                </Code>
                <Code size="2" style={{ padding: '8px', display: 'block' }}>
                  Adjusted Energy = Base Energy × (2 - Traffic Factor)
                </Code>
                <Text size="2">This inverse relationship means:</Text>
                <Box style={{ paddingLeft: '16px' }}>
                  <Flex direction="column" gap="1">
                    <Text size="2">• Heavy traffic (factor &gt; 1) → Lower consumption</Text>
                    <Text size="2">• Light traffic (factor &lt; 1) → Higher consumption</Text>
                  </Flex>
                </Box>
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" gap="3">
                <Heading size="3">🔋 Battery Usage</Heading>
                <Code size="2" style={{ padding: '8px', display: 'block' }}>
                  SOC Used = (Energy Consumed ÷ Battery Capacity) × 100
                </Code>
                <Code size="2" style={{ padding: '8px', display: 'block' }}>
                  SOC Remaining = Starting SOC - SOC Used
                </Code>
                <Text size="2">Results in percentage (%) of battery charge</Text>
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" gap="3">
                <Heading size="3">🛣️ Segment Analysis</Heading>
                <Code size="2" style={{ padding: '8px', display: 'block' }}>
                  For each route segment:
                </Code>
                <Box style={{ paddingLeft: '16px' }}>
                  <Flex direction="column" gap="1">
                    <Text size="2">• Calculate average speed from distance/time</Text>
                    <Text size="2">• Assign traffic condition based on speed</Text>
                    <Text size="2">• Apply efficiency multiplier per segment</Text>
                    <Text size="2">• Sum all segments for total consumption</Text>
                  </Flex>
                </Box>
                <Box style={{ paddingTop: '8px', borderTop: '1px solid var(--gray-4)' }}>
                  <Text size="1" color="gray">
                    Each segment is color-coded on the map based on its traffic condition
                  </Text>
                </Box>
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" gap="3">
                <Heading size="3">🗺️ Google Maps Data</Heading>
                <Text size="2">We extract from each route:</Text>
                <Box style={{ paddingLeft: '16px' }}>
                  <Flex direction="column" gap="1">
                    <Text size="2">• Turn-by-turn steps</Text>
                    <Text size="2">• Distance per segment</Text>
                    <Text size="2">• Duration per segment</Text>
                    <Text size="2">• Traffic predictions</Text>
                    <Text size="2">• Route polylines for visualization</Text>
                  </Flex>
                </Box>
                <Box style={{ paddingTop: '8px', borderTop: '1px solid var(--gray-4)' }}>
                  <Text size="1" color="gray">
                    Real-time traffic data when available, otherwise uses traffic model predictions
                  </Text>
                </Box>
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" gap="3">
                <Heading size="3">🏎️ Speed & Efficiency</Heading>
                <Text size="2" weight="medium">Speed ranges & multipliers:</Text>
                <Flex direction="column" gap="2">
                  <Flex justify="between">
                    <Text size="2">🔴 &lt;15 km/h (very heavy)</Text>
                    <Code size="2">×0.75</Code>
                  </Flex>
                  <Flex justify="between">
                    <Text size="2">🟠 15-40 km/h (heavy)</Text>
                    <Code size="2">×0.8-0.9</Code>
                  </Flex>
                  <Flex justify="between">
                    <Text size="2">🟡 40-60 km/h (normal)</Text>
                    <Code size="2">×1.0</Code>
                  </Flex>
                  <Flex justify="between">
                    <Text size="2">🟢 &gt;80 km/h (light)</Text>
                    <Code size="2">×1.2</Code>
                  </Flex>
                </Flex>
                <Text size="1" color="gray">
                  Lower speeds = better efficiency due to regenerative braking
                </Text>
              </Flex>
            </Card>

            <Card style={{ gridColumn: 'span 2' }}>
              <Flex direction="column" gap="3">
                <Heading size="3">📊 Example Calculation</Heading>
                <Text size="2">For a 50km trip with:</Text>
                <Box style={{ paddingLeft: '16px' }}>
                  <Flex direction="column" gap="1">
                    <Text size="2">• 18 kWh/100km consumption</Text>
                    <Text size="2">• 75 kWh battery</Text>
                    <Text size="2">• 80% starting charge</Text>
                    <Text size="2">• Mixed traffic segments</Text>
                  </Flex>
                </Box>
                <Box style={{ paddingTop: '8px', borderTop: '1px solid var(--gray-4)' }}>
                  <Flex direction="column" gap="1">
                    <Code size="1">Segment 1: 20km @ 25km/h = 3.2 kWh</Code>
                    <Code size="1">Segment 2: 30km @ 90km/h = 6.5 kWh</Code>
                    <Code size="1">Total: 9.7 kWh</Code>
                    <Code size="1">SOC Used: (9.7÷75)×100 = 12.9%</Code>
                    <Code size="1" weight="bold">Remaining: 80% - 12.9% = 67.1%</Code>
                  </Flex>
                </Box>
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" gap="3">
                <Heading size="3">🔄 Calculation Flow</Heading>
                <Flex direction="column" gap="2" align="center">
                  <Code size="1">Google Maps Route</Code>
                  <Text size="1" color="gray">↓</Text>
                  <Code size="1">Split into Segments</Code>
                  <Text size="1" color="gray">↓</Text>
                  <Code size="1">Calculate Speed</Code>
                  <Text size="1" color="gray">↓</Text>
                  <Code size="1">Apply Efficiency</Code>
                  <Text size="1" color="gray">↓</Text>
                  <Code size="1">Sum Energy</Code>
                  <Text size="1" color="gray">↓</Text>
                  <Code size="1" color="green" weight="bold">Final SOC</Code>
                </Flex>
                <Text size="1" color="gray" align="center">
                  Each segment is analyzed independently
                </Text>
              </Flex>
            </Card>
          </Grid>

          <Box style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--gray-4)' }}>
            <Text size="1" color="gray">
              Note: Actual consumption varies based on driving style, weather, terrain, and vehicle condition. 
              Traffic adjustments are estimates based on typical EV behavior with regenerative braking.
            </Text>
          </Box>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default HowWeCalculateModal;