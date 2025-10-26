#!/bin/bash

# Exit on any error
set -e

# Function to print status messages
print_status() {
  echo "====> $1"
}

# Print build start message
print_status "Starting AuraCares build process"

# Debug: Print current directory and contents
print_status "Current directory: $(pwd)"
print_status "Directory contents:"
ls -la

# Debug: Print all environment variables related to Vite
print_status "Vite-related environment variables:"
env | grep -E "^(VITE_|NODE_ENV)" || echo "No Vite-related environment variables found"

# Check if RENDER_SERVICE_NAME is set (Render sets this for each service)
if [ -n "$RENDER_SERVICE_NAME" ]; then
  print_status "Render service name: $RENDER_SERVICE_NAME"
  
  # Try to determine service type based on service name
  if [[ "$RENDER_SERVICE_NAME" == *"frontend"* ]]; then
    print_status "This appears to be the frontend service"
    if [ -d "frontend" ]; then
      print_status "Changing to frontend directory"
      cd frontend
    fi
  elif [[ "$RENDER_SERVICE_NAME" == *"backend"* ]]; then
    print_status "This appears to be the backend service"
    if [ -d "backend" ]; then
      print_status "Changing to backend directory"
      cd backend
    fi
  fi
fi

# Debug: Print current directory after potential cd
print_status "Working directory after service-specific setup: $(pwd)"
print_status "Directory contents after setup:"
ls -la

# Check if we're in the right directory by looking for package.json
if [ ! -f "package.json" ]; then
  print_status "Error: package.json not found in current directory"
  print_status "Looking for package.json in subdirectories..."
  
  # Try to find package.json in common locations
  if [ -f "frontend/package.json" ]; then
    print_status "Found package.json in frontend directory"
    cd frontend
  elif [ -f "backend/package.json" ]; then
    print_status "Found package.json in backend directory"
    cd backend
  else
    print_status "Could not find package.json in expected locations"
    exit 1
  fi
fi

# Debug: Print current directory after potential cd
print_status "Working directory after package.json check: $(pwd)"
print_status "Directory contents after package.json check:"
ls -la

# Check if this is frontend or backend by looking for specific files/directories
if [ -d "src" ]; then
  PROJECT_TYPE="frontend"
  print_status "Detected as frontend project (found src directory)"
elif [ -f "server.js" ]; then
  PROJECT_TYPE="backend"
  print_status "Detected as backend project (found server.js)"
else
  print_status "Could not determine project type"
  exit 1
fi

print_status "Confirmed project type: $PROJECT_TYPE"

# Build based on project type
if [ "$PROJECT_TYPE" = "frontend" ]; then
  print_status "Building frontend application"
  
  # Debug: Print environment variables again before build
  print_status "Environment variables before build:"
  env | grep -E "^(VITE_|NODE_ENV)" || echo "No Vite-related environment variables found"
  
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