#!/bin/bash
set -e

echo "=== Building AuraCares Frontend for Render ==="

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build

# Ensure _redirects file exists in dist
echo "Verifying _redirects file..."
if [ -f "public/_redirects" ]; then
  echo "Found _redirects in public folder"
  cp public/_redirects dist/_redirects
  echo "Copied _redirects to dist folder"
else
  echo "Creating _redirects file in dist..."
  echo "/*    /index.html   200" > dist/_redirects
fi

# Verify the file is in dist
if [ -f "dist/_redirects" ]; then
  echo "✓ _redirects file confirmed in dist folder"
  cat dist/_redirects
else
  echo "✗ ERROR: _redirects file missing from dist folder"
  exit 1
fi

echo "=== Build completed successfully ==="
