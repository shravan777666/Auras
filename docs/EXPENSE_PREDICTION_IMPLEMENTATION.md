# Expense Prediction Implementation

This document describes the implementation of the Support Vector Regression (SVR) model for predicting next month's expenses in the AuraCares system.

## Overview

The expense prediction feature uses a machine learning model to forecast next month's total expenses based on historical expense data. The implementation consists of:

1. A Python ML service with SVR model
2. A Flask API endpoint for predictions
3. A React frontend component for visualization

## Backend Implementation

### Files Created/Modified

1. **`ml-service/expense_predictor.py`** - Main expense prediction module
2. **`ml-service/expense_models.py`** - Pydantic models for input validation
3. **`ml-service/train_expense_model.py`** - Training script
4. **`ml-service/test_expense_predictor.py`** - Unit tests
5. **`ml-service/app.py`** - Updated to include the new endpoint
6. **`ml-service/requirements.txt`** - Updated dependencies

### Features Implemented

- **Feature Engineering**:
  - Lag features (`expense_lag_1`, `expense_lag_2`, `expense_lag_3`)
  - Temporal features (`month_of_year`, `quarter`, `is_holiday_season`)
  - Business context features (`is_rent_month`, `is_tax_month`)

- **Model Pipeline**:
  - StandardScaler for feature scaling
  - SVR with RBF kernel
  - TimeSeriesSplit-based GridSearchCV for hyperparameter tuning
  - C: [0.1, 1, 10, 100]
  - gamma: [0.001, 0.01, 0.1]
  - epsilon: [0.01, 0.1, 0.5]

- **Model Evaluation**:
  - RMSE (Root Mean Square Error)
  - MAE (Mean Absolute Error)
  - R² (Coefficient of Determination)

- **Prediction Features**:
  - Bootstrap-based 95% prediction intervals
  - Feature importance analysis (prioritizing `expense_lag_1`)
  - Model persistence with joblib

### API Endpoint

**POST** `/predict/next_month`

**Request Body**:
```json
{
  "last_month_data": {
    "total_monthly_expense": 15000.0,
    "expense_lag_2": 14000.0,
    "expense_lag_3": 13000.0
  },
  "next_month_planning": {
    "planned_marketing_spend": 2000.0,
    "num_employees": 5
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "prediction": 16500.0,
    "lower_95": 15000.0,
    "upper_95": 18000.0,
    "feature_importances": [
      {
        "feature": "expense_lag_1",
        "importance": 1.0
      }
    ],
    "metrics": {
      "rmse": 500.0,
      "mae": 400.0,
      "r2": 0.95
    }
  },
  "message": "Expense prediction generated successfully"
}
```

## Frontend Integration

### Files Created/Modified

1. **`frontend/src/components/salon/NextMonthExpenseForecast.jsx`** - React component for displaying predictions
2. **`frontend/src/pages/salon/ExpenseTracking.jsx`** - Integrated the component into the expense tracking page
3. **`frontend/src/services/salon.js`** - Added expense forecast method

### Component Features

- Displays predicted expense with confidence interval
- Shows feature importance analysis
- Visualizes model performance metrics
- Handles loading and error states

## Usage Instructions

### Training the Model

1. Navigate to the ML service directory:
   ```bash
   cd ml-service
   ```

2. Run the training script:
   ```bash
   python train_expense_model.py
   ```

### Starting the Service

1. Navigate to the ML service directory:
   ```bash
   cd ml-service
   ```

2. Start the Flask server:
   ```bash
   python app.py
   ```

### Making Predictions

Use the `POST /predict/next_month` endpoint with the required data structure.

### Frontend Integration

The expense forecast is automatically displayed on the Expense Tracking page at `http://localhost:3008/salon/expenses`.

## Testing

### Unit Tests

Run the unit tests:
```bash
cd ml-service
python test_expense_predictor.py
```

### API Testing

Test the API endpoint:
```bash
cd ml-service
python test_expense_api.py
```

## Dependencies

The implementation uses the following Python packages:
- Flask
- scikit-learn
- numpy
- pandas
- joblib
- pydantic

## Model Persistence

The trained model and scaler are saved as:
- `expense_svr_model.pkl`
- `expense_scaler.pkl`
- `expense_feature_names.pkl`

These files are automatically loaded when making predictions.

## Feature Importance

The model prioritizes `expense_lag_1` (previous month's expense) as the most important feature, which aligns with the business requirement to prioritize this feature in the importance analysis.