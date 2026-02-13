# Expense Predictor Module

This module implements a Support Vector Regression (SVR) model with RBF kernel to predict next month's total expenses using historical expense data.

## Features

- Feature engineering (lag features, temporal features, business context features)
- Scikit-learn Pipeline with StandardScaler and SVR
- TimeSeriesSplit-based GridSearchCV for hyperparameter tuning
- Model evaluation (RMSE, MAE, R²)
- Bootstrap-based 95% prediction intervals
- Permutation importance and SHAP-based explanations
- Model persistence with joblib
- Input validation with pydantic

## Installation

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. The required packages are:
- Flask==2.3.2
- scikit-learn==1.3.0
- numpy==1.24.3
- pandas==2.0.3
- joblib==1.3.1
- flask-cors==4.0.0
- python-dotenv==1.0.0
- pydantic==1.10.9
- shap==0.42.1

## Training the Model

To train the expense prediction model, run:

```bash
python train_expense_model.py
```

This will generate sample data and train the SVR model with hyperparameter tuning.

## API Endpoints

### POST /api/predict/next_month

Predict next month's total expenses.

**Request Body:**
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

**Response:**
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
      },
      {
        "feature": "expense_lag_2",
        "importance": 0.7
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

To display the expense prediction under the "Next Week Financial Forecast" card at `http://localhost:3008/salon/expenses`, you can make a POST request to the endpoint and display the results.

Example JavaScript code for frontend integration:

```javascript
// Get last month's expense data from your backend
const lastMonthData = {
  total_monthly_expense: 15000.0,
  expense_lag_2: 14000.0,
  expense_lag_3: 13000.0
};

// Optional: Add any known planning data for next month
const nextMonthPlanning = {
  planned_marketing_spend: 2000.0,
  num_employees: 5
};

// Make API call to expense predictor
fetch('http://localhost:5001/api/predict/next_month', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    last_month_data: lastMonthData,
    next_month_planning: nextMonthPlanning
  })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    // Display the prediction results
    const prediction = data.data.prediction;
    const lowerBound = data.data.lower_95;
    const upperBound = data.data.upper_95;
    
    // Update your UI with the prediction
    document.getElementById('expense-prediction').innerHTML = `
      <h3>Next Month Expense Prediction</h3>
      <p>Predicted Expense: $${prediction.toFixed(2)}</p>
      <p>Confidence Interval: $${lowerBound.toFixed(2)} - $${upperBound.toFixed(2)}</p>
    `;
  } else {
    console.error('Error:', data.message);
  }
})
.catch(error => {
  console.error('Error:', error);
});
```

## Unit Tests

To run the unit tests:

```bash
python test_expense_predictor.py
```

## Model Persistence

The trained model, scaler, and feature names are automatically saved as:
- `expense_svr_model.pkl` - The trained SVR model
- `expense_scaler.pkl` - The StandardScaler used for feature scaling
- `expense_feature_names.pkl` - The list of feature names

These files are automatically loaded when making predictions.

## Feature Importance

The model prioritizes `expense_lag_1` (previous month's expense) as the most important feature, which aligns with the requirement to prioritize this feature in the importance analysis.