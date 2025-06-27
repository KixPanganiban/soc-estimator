# Plan for EV State-of-Charge Estimator Web App

This document outlines the plan to build a simple web application for estimating the remaining battery state-of-charge (SOC) for an electric vehicle after a trip.

## 1. Project Overview

The goal is to create a single-page web application with a user-friendly interface. The user will input their vehicle's battery details and a start/end location. The application will use the Google Maps API to calculate the travel distance and time, and then estimate the remaining battery percentage, displaying the route and results on an interactive map.

## 2. Technology Stack

-   **Runtime/Build System:** Bun
-   **Language:** JavaScript (ES6+)
-   **Styling:** Tailwind CSS
-   **APIs:** Google Maps Platform (Places API, Directions API, Maps JavaScript API)

## 3. File Structure

A simple and flat structure will be used for this project.

```
/
├── .env                # To store the Google Maps API key (IMPORTANT!)
├── PLAN.md             # This file
├── index.html          # Main HTML file for the application
├── package.json        # Bun project configuration and dependencies
├── src/
│   ├── main.js         # Core application logic
│   └── styles.css      # Input CSS file for Tailwind processing
└── tailwind.config.js  # Tailwind CSS configuration
```

## 4. Development Steps

### Step 1: Project Setup

1.  **Initialize Project:** Run `bun init` to create the `package.json` and scaffold the project.
2.  **Install Dependencies:** Install Tailwind CSS: `bun add -d tailwindcss`.
3.  **Configure Tailwind:** Create `tailwind.config.js` and `src/styles.css`. The config file will specify which files to scan for Tailwind classes. The CSS file will contain the base Tailwind directives (`@tailwind base; @tailwind components; @tailwind utilities;`).
4.  **Add Build Script:** Add a script to `package.json` to run the Tailwind CSS build process, e.g., `"build:css": "tailwindcss -i ./src/styles.css -o ./dist/styles.css --watch"`.

### Step 2: HTML Structure (`index.html`)

1.  Create the main container for the application.
2.  Add a form section with the following input fields:
    -   `input type="number"` for Starting SOC (%)
    -   `input type="number"` for Battery Capacity (kWh)
    -   `input type="number"` for Average Mileage (kWh/100km)
    -   `input type="text"` with `id="start-point"` for the starting location.
    -   `input type="text"` with `id="destination"` for the destination.
3.  Add a `button` with `id="estimate-btn"`.
4.  Create a `div` with `id="map"` where the Google Map will be rendered.
5.  Create a `div` with `id="results"` to display the text output (Estimated SOC left, Travel Time).
6.  Include a `<script>` tag for the Google Maps API, ensuring to use a placeholder for the API key.
7.  Include a `<script>` tag for our `src/main.js` file.

### Step 3: Google Maps API Integration (`index.html` & `src/main.js`)

1.  **API Key:** Obtain a Google Maps API key with the "Maps JavaScript API", "Places API", and "Directions API" enabled. **Crucially**, this key will be managed via a `.env` file and loaded securely, not hardcoded in the HTML.
2.  **Map Initialization:** In `src/main.js`, write a function to initialize the map and render it in the `#map` div.
3.  **Autocomplete:** Attach `google.maps.places.Autocomplete` to the `#start-point` and `#destination` input fields to provide address search functionality.
4.  **Services:** Instantiate the `google.maps.DirectionsService` and `google.maps.DirectionsRenderer`. The renderer will be linked to the map instance to automatically draw the route.

### Step 4: Core Logic (`src/main.js`)

1.  Add a click event listener to the `#estimate-btn`.
2.  Inside the listener function:
    a. Get the user's input values from the form. Perform basic validation (e.g., ensure numbers are positive).
    b. Get the start and end locations from the autocomplete input fields.
    c. Create a request object for the `DirectionsService`, including the `origin`, `destination`, and `travelMode: 'DRIVING'`.
    d. Call `directionsService.route()` with the request.
3.  In the callback function for the route call:
    a. Check if the status is `OK`.
    b. If `OK`, pass the `response` to `directionsRenderer.setDirections()` to draw the route on the map.
    c. Extract the total distance (`response.routes[0].legs[0].distance.value` in meters) and travel time (`response.routes[0].legs[0].duration.text`).
    d. Convert distance from meters to kilometers.
    e. **Perform the Calculation:**
        -   `energyConsumed = (distanceInKm / 100) * averageMileage`
        -   `socConsumed = (energyConsumed / batteryCapacity) * 100`
        -   `estimatedSocLeft = startingSoc - socConsumed`
    f. Display the `estimatedSocLeft` (formatted to 1-2 decimal places) and the `travelTime` in the `#results` div.
    g. Optionally, display the results in an `InfoWindow` on the map.

## 5. Next Steps

Once this plan is approved, I will begin with **Step 1: Project Setup**.
