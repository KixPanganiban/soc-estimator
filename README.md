# EV State-of-Charge Estimator

A web application to calculate the remaining battery state-of-charge (SOC) for electric vehicles after a trip.

## Features

- Calculate remaining battery percentage based on trip distance
- Interactive Google Maps integration with route visualization
- Input validation and error handling
- Color-coded results based on remaining charge
- Low battery warnings
- Responsive design for mobile and desktop
- Secure API key management (stored locally in browser)

## Setup

### Prerequisites

- [Bun](https://bun.sh) (v1.2.5 or later)
- A Google Maps API key with the following APIs enabled:
  - Maps JavaScript API
  - Places API
  - **Directions API** (Required for route calculations)

### Installation

1. Clone the repository and install dependencies:
```bash
bun install
```

2. Run the development server:
```bash
bun run dev
```

3. When the app opens, enter your Google Maps API key in the input field

### Google Maps API Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - **Directions API** ⚠️ (This is required for the app to work)
4. Create an API key and optionally add restrictions
5. Enter the API key in the app when prompted

## Development

Run the development server:
```bash
bun run dev
```

The app will open automatically at `http://localhost:5173/`

## Building for Production

Build the application:
```bash
bun run build
```

Preview the production build:
```bash
bun run preview
```

## Usage

1. Enter your vehicle's starting state-of-charge (%)
2. Enter your vehicle's total battery capacity (kWh)
3. Enter your vehicle's average energy consumption (kWh/100km)
4. Type in your starting location and destination
5. Click "Estimate" to calculate the remaining battery

The app will display:
- Trip distance
- Travel time
- Energy consumed
- Battery percentage used
- Estimated remaining state-of-charge

## Troubleshooting

### "REQUEST_DENIED" Error
If you see this error, it means the Directions API is not enabled for your Google Maps API key. Follow the setup instructions above to enable it.

### API Key Issues
- Make sure your API key has no restrictions, or if it does, ensure `localhost:5173` is in the allowed referrers
- Verify all three required APIs are enabled in the Google Cloud Console

## Technology Stack

- **Bun** - JavaScript runtime and package manager
- **Vite** - Build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Google Maps Platform** - Maps, routing, and place search
