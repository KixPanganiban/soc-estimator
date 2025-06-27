# EV State-of-Charge Estimator

A web application to calculate the remaining battery state-of-charge (SOC) for electric vehicles after a trip.

## Features

- Calculate remaining battery percentage based on trip distance
- **Traffic-aware energy consumption** - adjusts estimates based on real-time traffic data
- Interactive Google Maps integration with route visualization
- Input validation and error handling
- Color-coded results based on remaining charge
- Low battery warnings
- Responsive design for mobile and desktop
- Secure API key management (stored locally in browser)
- Educational insights about EV efficiency in different traffic conditions

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
- Travel time (with and without traffic)
- Base energy consumption
- Traffic-adjusted energy consumption
- Battery percentage used
- Estimated remaining state-of-charge
- Traffic conditions and their impact on efficiency

### How Traffic Affects EV Efficiency

Unlike conventional gas vehicles, electric vehicles are:
- **MORE efficient in heavy traffic** - Regenerative braking recovers energy during stop-and-go driving
- **LESS efficient at highway speeds** - Aerodynamic drag increases energy consumption

The app automatically adjusts energy consumption estimates based on real-time traffic data from Google Maps.

## Troubleshooting

### "REQUEST_DENIED" Error
If you see this error, it means the Directions API is not enabled for your Google Maps API key. Follow the setup instructions above to enable it.

### API Key Issues
- Make sure your API key has no restrictions, or if it does, ensure `localhost:5173` is in the allowed referrers
- Verify all three required APIs are enabled in the Google Cloud Console

## Contributing

### Adding New Vehicle Models

The app includes a database of popular EVs in Southeast Asia. To add a new vehicle:

1. Open `vehicles.csv` in the project root
2. Add a new line with the following columns (separated by commas):
   - `brand` - Vehicle manufacturer (e.g., "Tesla", "BYD")
   - `model` - Vehicle model name (e.g., "Model 3", "Atto 3")
   - `variant` - Specific variant/trim (e.g., "Standard Range", "Long Range")
   - `battery_capacity_kwh` - Battery capacity in kWh (e.g., "60.0")
   - `consumption_kwh_100km` - Average energy consumption per 100km (e.g., "15.5")
   - `year` - Model year (e.g., "2024")
   - `availability` - Countries where available, in quotes (e.g., "Thailand,Malaysia,Singapore")

Example entry:
```csv
Tesla,Model Y,Performance,75.0,17.5,2024,"Singapore,Thailand,Malaysia"
```

3. Save the file and test the vehicle selector in the app
4. Submit a pull request with your additions

**Tips for accurate data:**
- Check manufacturer specifications for battery capacity
- Use real-world consumption data when available (WLTP/EPA ratings tend to be optimistic)
- Include multiple variants if they have different battery sizes
- Use quotes around the availability field if it contains commas

## Technology Stack

- **Bun** - JavaScript runtime and package manager
- **Vite** - Build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Google Maps Platform** - Maps, routing, and place search
