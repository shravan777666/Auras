#!/bin/bash

# Exit on any error
set -e

# Function to print status messages
print_status() {
  echo "====> $1"
}

# Print build start message
print_status "Starting AuraCares build process"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  print_status "Error: package.json not found in current directory"
  exit 1
fi

# Check if this is frontend or backend
if [ -d "src" ]; then
  PROJECT_TYPE="frontend"
else
  PROJECT_TYPE="backend"
fi

print_status "Detected project type: $PROJECT_TYPE"

# Build based on project type
if [ "$PROJECT_TYPE" = "frontend" ]; then
  print_status "Building frontend application"
  
  # Install dependencies with legacy peer deps to avoid conflicts
  print_status "Installing frontend dependencies"
  npm ci --legacy-peer-deps
  
  # Build the application
  print_status "Building frontend assets"
  npm run build
  
  print_status "Frontend build completed successfully"
  
elif [ "$PROJECT_TYPE" = "backend" ]; then
  print_status "Installing backend dependencies"
  
  # Install dependencies
  npm ci --only=production --legacy-peer-deps
  
  print_status "Backend dependencies installed successfully"
fi

print_status "Build process completed successfully"