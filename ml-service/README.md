# AuraCares Machine Learning Service

**This is a standalone microservice for machine learning predictions, separated from the main backend for better modularity and scalability.**

This directory contains the Python microservice for financial forecasting using Linear Regression and Support Vector Regression (SVR) for expense prediction.

## Service Architecture

This ML service has been separated from the backend to:
- Enable independent scaling of ML workloads
- Isolate Python dependencies from Node.js backend
- Allow for easier model updates and retraining
- Provide better resource management for ML tasks
- Support future ML features without affecting the main application

## Overview

The ML service provides revenue predictions for the next week based on historical salon data. It uses scikit-learn for the Linear Regression model and Flask for the web API.

## Features

- Linear Regression model for revenue prediction
- Support Vector Regression (SVR) model for expense prediction
- Decision Tree model for add-on acceptance prediction
- REST API for integration with the main application
- Model training with historical data
- Health check endpoint
- Confidence scoring for predictions
- Feature importance analysis

## Setup

### Prerequisites

- Python 3.7 or higher
- pip package manager

### Installation

#### On macOS/Linux:
```bash
chmod +x setup.sh
./setup.sh
```

#### On Windows:
```cmd
setup.bat
```

#### Manual Setup:
1. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

2. Activate the virtual environment:
   - On macOS/Linux: `source venv/bin/activate`
   - On Windows: `venv\Scripts\activate`

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Initialize the model:
   ```bash
   python init_model.py
   ```

## Usage

1. Start the service:
   ```bash
   python app.py
   ```

2. The service will be available at `http://localhost:5001`

## API Documentation

For complete API documentation with standardized request/response formats, see [API.md](API.md).

### Quick Reference of Available Endpoints:

- `GET /health` - Health check
- `GET /predict` - Get next week's revenue prediction
- `POST /predict-addon` - Predict add-on acceptance
- `POST /train` - Train the revenue model with new data
- `POST /train-addon` - Train the add-on model with new data
- `POST /predict/next_month` - Predict next month's expenses using SVR

## Model Details

The Linear Regression model uses the following features:
- Week number
- Day of the week
- Month
- Weekend indicator
- Service type (Keratin Treatment, Hair Color, Manicure)
- Customer retention

## Expense Prediction

The service also includes an SVR model for predicting next month's expenses. See [README_EXPENSE_PREDICTOR.md](README_EXPENSE_PREDICTOR.md) for detailed documentation.

## Customization

To improve prediction accuracy:
1. Add more historical data
2. Include additional features (weather, holidays, etc.)
3. Experiment with different algorithms (Random Forest, XGBoost)