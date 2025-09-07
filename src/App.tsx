import React from 'react';
import { Heading, Text, Box } from '@radix-ui/themes';
import { AppProvider } from './contexts/AppContext';
import ApiKeySection from './components/ApiKeySection';
import MainContent from './components/MainContent';
import { useAppContext } from './contexts/AppContext';

function AppContent() {
  const { apiKey } = useAppContext();
  
  return (
    <Box className="container mx-auto p-4 max-w-7xl">
      <Heading size="8" className="mb-2">EV State-of-Charge Estimator</Heading>
      <Text className="text-gray-600 mb-6 block">Calculate your electric vehicle's remaining battery after a trip</Text>
      
      {!apiKey ? (
        <ApiKeySection />
      ) : (
        <MainContent />
      )}
    </Box>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;