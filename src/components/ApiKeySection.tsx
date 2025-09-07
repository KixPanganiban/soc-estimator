import React, { useState } from 'react';
import { Card, Flex, Heading, Text, TextField, Button, Link } from '@radix-ui/themes';
import { useAppContext } from '../contexts/AppContext';

function ApiKeySection() {
  const { setApiKey } = useAppContext();
  const [inputKey, setInputKey] = useState('');

  const handleSubmit = () => {
    if (inputKey.trim()) {
      setApiKey(inputKey.trim());
    }
  };

  return (
    <Card className="bg-yellow-50 border-yellow-200">
      <Heading size="4" className="mb-2">Google Maps API Key Required</Heading>
      <Text size="2" className="text-gray-700 mb-3">
        Enter your Google Maps API key to use this application.{' '}
        <Link href="https://console.cloud.google.com" target="_blank">
          Get an API key
        </Link>
      </Text>
      <Flex gap="2">
        <TextField.Root
          type="password"
          placeholder="Enter your Google Maps API key"
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className="flex-1"
        />
        <Button onClick={handleSubmit}>Load Map</Button>
      </Flex>
      <Text size="1" className="text-gray-600 mt-2">
        Required APIs: Maps JavaScript API, Places API, Directions API
      </Text>
    </Card>
  );
}

export default ApiKeySection;