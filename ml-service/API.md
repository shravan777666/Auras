# ML Service API Documentation

This document defines the standardized API contract for the AuraCares ML Service, which provides machine learning-powered predictions for revenue, expenses, and add-on recommendations.

## Base URL

- Local Development: `http://localhost:5001`
- Production: Configured via `ML_SERVICE_URL` environment variable

## Common Response Format

All endpoints follow the same response format:

```json
{
  "success": true|false,
  "data": {...}, // Optional - present when success is true
  "message": "Human-readable message describing the result"
}
```

## Endpoints

### 1. Health Check

**Endpoint:** `GET /health`

**Description:** Checks the health status of the ML service and verifies that models are loaded.

**Request Parameters:** None

**Request Headers:**
- `Content-Type: application/json` (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "models_loaded": true,
    "expense_model_loaded": true,
    "timestamp": "2023-12-01T10:30:00.123Z"
  },
  "message": "Health check completed successfully"
}
```

### 2. Revenue Prediction

**Endpoint:** `GET /predict`

**Description:** Predicts next week's revenue based on the trained model.

**Request Parameters:** None

**Request Headers:**
- `Content-Type: application/json` (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "predicted_revenue": 12500.50,
    "confidence": 0.85,
    "percentage_change": 5.2,
    "trend": "positive"
  },
  "message": "Revenue prediction generated successfully"
}
```

### 3. Add-on Acceptance Prediction

**Endpoint:** `POST /predict-addon`

**Description:** Predicts if a customer will accept an add-on offer based on various factors.

**Request Body:**
```json
{
  "time_gap_size": 2,
  "discount_offered": 15,
  "customer_loyalty": 0.8,
  "past_add_on_history": 1,
  "day_of_week": 3
}
```

**Request Headers:**
- `Content-Type: application/json`

**Parameters:**
- `time_gap_size` (number): Size of time gap between appointments (required)
- `discount_offered` (number): Discount percentage offered (required)
- `customer_loyalty` (number): Customer loyalty score between 0 and 1 (required)
- `past_add_on_history` (number): Historical add-on acceptance (0 or 1) (required)
- `day_of_week` (number): Day of week (0-6 where 0 is Monday) (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "prediction": 1,
    "probability": 0.78,
    "message": "Add-on acceptance predicted successfully"
  },
  "message": "Add-on acceptance prediction generated successfully"
}
```

### 4. Revenue Model Training

**Endpoint:** `POST /train`

**Description:** Trains the revenue prediction model with new data.

**Request Body:**
```json
{
  "records": [
    {
      "date": "2023-11-01",
      "service": "hair_color",
      "revenue": 1200
    },
    {
      "date": "2023-11-02",
      "service": "keratin",
      "revenue": 2500
    }
  ]
}
```

**Request Headers:**
- `Content-Type: application/json`

**Parameters:**
- `records` (array): Array of historical revenue records (required)
  - Each record must have `date`, `service`, and `revenue` fields

**Response:**
```json
{
  "success": true,
  "data": {},
  "message": "Model trained successfully"
}
```

### 5. Add-on Model Training

**Endpoint:** `POST /train-addon`

**Description:** Trains the add-on prediction model with new data.

**Request Body:**
```json
{
  "records": [
    {
      "time_gap_size": 2,
      "discount_offered": 15,
      "customer_loyalty": 0.8,
      "past_add_on_history": 1,
      "day_of_week": 3,
      "conversion_outcome": 1
    }
  ]
}
```

**Request Headers:**
- `Content-Type: application/json`

**Parameters:**
- `records` (array): Array of historical add-on data (required)
  - Each record must have `time_gap_size`, `discount_offered`, `customer_loyalty`, `past_add_on_history`, `day_of_week`, and `conversion_outcome` fields

**Response:**
```json
{
  "success": true,
  "data": {
    "accuracy": 0.87
  },
  "message": "Add-on model trained successfully"
}
```

### 6. Expense Prediction

**Endpoint:** `POST /predict/next_month`

**Description:** Predicts next month's total expenses using the SVR model.

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

**Request Headers:**
- `Content-Type: application/json`

**Parameters:**
- `last_month_data` (object): Last month's expense data (required)
  - `total_monthly_expense` (number): Total expense for the previous month
  - `expense_lag_2` (number, optional): Expense from 2 months ago
  - `expense_lag_3` (number, optional): Expense from 3 months ago
- `next_month_planning` (object, optional): Planning data for next month
  - `planned_marketing_spend` (number, optional): Expected marketing spend
  - `num_employees` (number, optional): Expected number of employees

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

## Error Responses

All error responses follow the same format:

```json
{
  "success": false,
  "data": null,
  "message": "Descriptive error message"
}
```

Common error status codes:
- `400 Bad Request`: Invalid request parameters or missing required fields
- `404 Not Found`: Endpoint does not exist
- `500 Internal Server Error`: Server-side error during processing

## Data Types

- `number`: Floating-point or integer numbers
- `string`: Text values
- `boolean`: true or false
- `object`: JSON object
- `array`: Array of values
- `integer`: Whole numbers

## Authentication

The ML service does not require authentication. It is intended to be called internally by the backend service.

## Rate Limiting

Currently, there are no rate limits configured. For production deployments, consider implementing rate limiting based on your usage patterns.