// Centralized Application State Management
class AppState {
    constructor() {
        this.map = null;
        this.directionsService = null;
        this.directionsRenderer = null;
        this.vehicleData = [];
        this.waypoints = [];
        this.waypointAutocompletes = [];
        this.segmentPolylines = [];
        this.charts = {
            socChart: null,
            efficiencyChart: null
        };
        this.apiKey = null;
        this.isInitialized = false;
    }

    // Map-related state
    setMap(map) {
        this.map = map;
    }

    getMap() {
        return this.map;
    }

    setDirectionsService(service) {
        this.directionsService = service;
    }

    getDirectionsService() {
        return this.directionsService;
    }

    setDirectionsRenderer(renderer) {
        this.directionsRenderer = renderer;
    }

    getDirectionsRenderer() {
        return this.directionsRenderer;
    }

    // Vehicle data state
    setVehicleData(data) {
        this.vehicleData = data;
    }

    getVehicleData() {
        return this.vehicleData;
    }

    // Waypoints state
    addWaypoint(waypoint) {
        this.waypoints.push(waypoint);
    }

    removeWaypoint(index) {
        this.waypoints.splice(index, 1);
    }

    getWaypoints() {
        return this.waypoints;
    }

    getActiveWaypoints() {
        return this.waypoints.filter(wp => wp.value && wp.value.trim() !== '');
    }

    addWaypointAutocomplete(autocomplete) {
        this.waypointAutocompletes.push(autocomplete);
    }

    removeWaypointAutocomplete(index) {
        this.waypointAutocompletes.splice(index, 1);
    }

    // Segment polylines state
    addSegmentPolyline(polyline) {
        this.segmentPolylines.push(polyline);
    }

    clearSegmentPolylines() {
        this.segmentPolylines.forEach(polyline => {
            if (polyline && polyline.setMap) {
                polyline.setMap(null);
            }
        });
        this.segmentPolylines = [];
    }

    // Charts state
    setSocChart(chart) {
        this.charts.socChart = chart;
    }

    getSocChart() {
        return this.charts.socChart;
    }

    setEfficiencyChart(chart) {
        this.charts.efficiencyChart = chart;
    }

    getEfficiencyChart() {
        return this.charts.efficiencyChart;
    }

    clearCharts() {
        if (this.charts.socChart && this.charts.socChart.destroy) {
            this.charts.socChart.destroy();
        }
        if (this.charts.efficiencyChart && this.charts.efficiencyChart.destroy) {
            this.charts.efficiencyChart.destroy();
        }
        this.charts.socChart = null;
        this.charts.efficiencyChart = null;
    }

    // API Key state
    setApiKey(key) {
        this.apiKey = key;
    }

    getApiKey() {
        return this.apiKey;
    }

    // Initialization state
    setInitialized(flag) {
        this.isInitialized = flag;
    }

    isAppInitialized() {
        return this.isInitialized;
    }

    // Utility method to reset all state
    reset() {
        this.clearSegmentPolylines();
        this.clearCharts();
        this.waypoints = [];
        this.waypointAutocompletes = [];
        this.vehicleData = [];
        this.isInitialized = false;
    }
}

// Create singleton instance
const appState = new AppState();

export default appState;