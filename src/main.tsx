import React from 'react';
import ReactDOM from 'react-dom/client';
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import App from './App';
import './styles.css';

// Add background class to body
document.body.classList.add('bg-gray-100');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Theme appearance="light" accentColor="blue" grayColor="slate" radius="medium">
      <App />
    </Theme>
  </React.StrictMode>
);