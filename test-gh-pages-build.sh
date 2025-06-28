#!/bin/bash

# Test the GitHub Pages build locally
echo "Testing GitHub Pages build..."

# Set the BASE_URL to simulate GitHub Pages deployment
export BASE_URL="/soc-estimate/"

# Clean previous build
rm -rf dist

# Run the build
bun run build

echo ""
echo "Build complete! Check the dist/ directory."
echo "Files should have paths prefixed with /soc-estimate/"
echo ""
echo "To test locally, you can run:"
echo "  cd dist && python3 -m http.server 8000"
echo "Then visit: http://localhost:8000/soc-estimate/"