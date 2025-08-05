# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

The SOC Estimate project is an EV (Electric Vehicle) state-of-charge calculator web application that helps users estimate remaining battery after a trip. It features Google Maps integration, real-time traffic analysis, and vehicle-specific calculations.

## Technology Stack

- **Runtime**: Bun (v1.2.5+)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **APIs**: Google Maps Platform (Maps JavaScript API, Places API, Directions API)
- **Language**: JavaScript (ES6+ modules)
- **Deployment**: GitHub Pages via GitHub Actions

## Development Commands

```bash
# Install dependencies
bun install

# Run development server (auto-opens at localhost:5173)
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Test GitHub Pages build locally
./test-gh-pages-build.sh
```

## Architecture

The application uses a modular JavaScript architecture with ES6 modules:

```
src/
├── main.js              # Entry point, simplified initialization
├── appState.js          # Centralized state management (NEW)
├── apiKeyManager.js     # Google Maps API key handling
├── mapInitializer.js    # Google Maps setup and initialization
├── vehicleDataManager.js # Vehicle database and selection
├── waypointManager.js   # Waypoint/destination management
├── routeCalculator.js   # Route calculation and SOC estimation
├── segmentAnalyzer.js   # Traffic analysis and energy adjustment
├── chartDrawer.js       # Visualization and charting
├── uiManager.js         # UI state and modal management
├── inputManager.js      # Form input persistence and validation
└── styles.css           # Tailwind CSS input file
```

### Key Design Patterns

1. **Centralized State Management**: All shared state now managed through `appState.js` singleton
2. **Module Pattern**: Each file exports specific functions, imports `appState` for shared data
3. **Simplified Initialization**: `main.js` no longer exposes globals, cleaner async initialization
4. **API Key Security**: Stored in localStorage, never committed to code

### AppState Module

The `appState.js` module provides centralized state management:
- **Map objects**: map, directionsService, directionsRenderer
- **Vehicle data**: Array of available vehicles from CSV
- **Waypoints**: Dynamic list of waypoints and their autocomplete instances
- **Visualization**: Segment polylines and Chart.js instances
- **API Key**: Current Google Maps API key
- **Methods**: Getters/setters for all state, cleanup methods for charts/polylines

### Core Functionality Flow

1. User enters API key → Stored in localStorage and appState
2. Map initializes → Objects stored in appState
3. User selects vehicle → Data loaded into appState
4. User enters start/destination → Managed via appState waypoints
5. Route calculation → Uses appState's directionsService
6. Traffic analysis → Results stored for visualization
7. Results displayed → Charts stored in appState for cleanup

## Important Implementation Details

### Traffic-Aware Energy Calculations

The app adjusts EV energy consumption based on traffic:
- Heavy traffic → Lower consumption (regenerative braking)
- Highway speeds → Higher consumption (aerodynamic drag)
- See `segmentAnalyzer.js` for traffic multiplier logic

### Vehicle Database

- Vehicle data stored in `vehicles.csv` (brand, model, battery capacity, consumption)
- Loaded dynamically via fetch in `vehicleDataManager.js`
- CSV copied to dist during build (see `vite.config.js` plugin)

### API Key Management

- Prompt shown if no key stored
- Key validated on first use
- Stored in localStorage as 'gmaps-api-key'
- Never hardcode API keys in source

## Testing and Validation

Currently no automated tests. Manual testing approach:
1. Test with various start/end locations
2. Verify traffic multipliers with known congested routes
3. Test GitHub Pages deployment with `test-gh-pages-build.sh`
4. Check browser console for API errors

## Deployment

GitHub Pages deployment is automated via GitHub Actions:
- Triggered on push to `main` branch
- Sets `BASE_URL` environment variable for proper asset paths
- Deploys from `dist/` directory
- Workflow defined in `.github/workflows/deploy.yml`

## Adding Features

When adding new features:
1. Follow existing module pattern
2. Import `appState` to access/modify shared state
3. Export only functions that other modules need
4. Use appState getters/setters instead of module-level variables
5. Update vehicle database by editing `vehicles.csv`
6. Maintain traffic analysis logic in `segmentAnalyzer.js`
7. For debugging, access state via `window.appState` in console

## Common Issues

1. **"REQUEST_DENIED" Error**: Enable Directions API in Google Cloud Console
2. **Map not loading**: Check API key permissions and referrer restrictions
3. **Vehicles not loading**: Ensure `vehicles.csv` exists and is copied during build
4. **GitHub Pages 404**: Check BASE_URL configuration in build