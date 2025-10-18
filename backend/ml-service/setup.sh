#!/bin/bash

# Setup script for the Financial Prediction ML Service

echo "Setting up Financial Prediction ML Service..."

# Check if Python is installed
if ! command -v python3 &> /dev/null
then
    echo "Python3 is not installed. Please install Python3 and try again."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null
then
    echo "pip3 is not installed. Please install pip3 and try again."
    exit 1
fi

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "Installing Python requirements..."
pip install -r requirements.txt

# Initialize the model
echo "Initializing the model with sample data..."
python init_model.py

echo "Setup complete!"
echo ""
echo "To start the service, run:"
echo "  source venv/bin/activate"
echo "  python app.py"
echo ""
echo "The service will be available at http://localhost:5001"