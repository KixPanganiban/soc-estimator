import React from 'react';
import { Card, Text, Flex, Heading, Grid, Box } from '@radix-ui/themes';
import { useAppContext } from '../contexts/AppContext';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Results() {
  const { isLoading, error, routeResult, chartData } = useAppContext();

  if (isLoading) {
    return (
      <Card style={{ minHeight: '100px', padding: '20px' }}>
        <Flex justify="center" align="center" style={{ minHeight: '60px' }}>
          <Text>Calculating route...</Text>
        </Flex>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={{ minHeight: '100px', padding: '20px' }}>
        <Flex justify="center" align="center" style={{ minHeight: '60px' }}>
          <Text color="red">{error}</Text>
        </Flex>
      </Card>
    );
  }

  if (!routeResult) {
    return (
      <Card style={{ minHeight: '100px', padding: '20px' }}>
        <Flex justify="center" align="center" style={{ minHeight: '60px' }}>
          <Text color="gray">
            Enter your trip details and click "Estimate" to see results
          </Text>
        </Flex>
      </Card>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Battery State-of-Charge Along Route',
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'State of Charge (%)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Energy Consumed (kWh)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Card style={{ padding: '20px' }}>
      <Flex direction="column" gap="4">
        <Heading size="4">Trip Results</Heading>
        
        <Grid columns="4" gap="4">
          <Flex direction="column" gap="1">
            <Text size="2" color="gray">Total Distance</Text>
            <Text size="5" weight="bold">{routeResult.totalDistance.toFixed(1)} km</Text>
          </Flex>
          <Flex direction="column" gap="1">
            <Text size="2" color="gray">Trip Duration</Text>
            <Text size="5" weight="bold">{formatDuration(routeResult.totalDuration)}</Text>
          </Flex>
          <Flex direction="column" gap="1">
            <Text size="2" color="gray">Energy Used</Text>
            <Text size="5" weight="bold">{routeResult.totalEnergyConsumption.toFixed(1)} kWh</Text>
          </Flex>
          <Flex direction="column" gap="1">
            <Text size="2" color="gray">Remaining SOC</Text>
            <Text size="5" weight="bold" color={routeResult.remainingSoc < 20 ? 'red' : 'green'}>
              {routeResult.remainingSoc.toFixed(1)}%
            </Text>
          </Flex>
        </Grid>

        {chartData && (
          <Flex direction="column" gap="2">
            <div style={{ height: '300px' }}>
              <Line data={chartData} options={chartOptions} />
            </div>
            <Flex gap="3" justify="center" style={{ fontSize: '12px' }}>
              <Flex align="center" gap="1">
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#DC2626' }} />
                <Text size="1">Very Heavy</Text>
              </Flex>
              <Flex align="center" gap="1">
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#F97316' }} />
                <Text size="1">Heavy</Text>
              </Flex>
              <Flex align="center" gap="1">
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#EAB308' }} />
                <Text size="1">Moderate</Text>
              </Flex>
              <Flex align="center" gap="1">
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
                <Text size="1">Light</Text>
              </Flex>
            </Flex>
          </Flex>
        )}

        <Flex direction="column" gap="2">
          <Heading size="3">Route Segments</Heading>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {routeResult.segments.map((segment, index) => (
              <Flex key={index} justify="between" align="center" style={{ padding: '8px', borderBottom: '1px solid var(--gray-4)' }}>
                <Flex gap="3" align="center">
                  <Text size="2" weight="bold">#{index + 1}</Text>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: segment.trafficCondition === 'VERY_HEAVY' ? '#DC2626' :
                                   segment.trafficCondition === 'HEAVY' ? '#F97316' :
                                   segment.trafficCondition === 'MODERATE' ? '#EAB308' : '#22C55E'
                  }} />
                  <Text size="2">{segment.distance.toFixed(1)} km</Text>
                  <Text size="2" color="gray">@ {segment.speed.toFixed(0)} km/h</Text>
                </Flex>
                <Text size="2" weight="medium">{segment.energyConsumption.toFixed(2)} kWh</Text>
              </Flex>
            ))}
          </div>
        </Flex>
      </Flex>
    </Card>
  );
}

export default Results;