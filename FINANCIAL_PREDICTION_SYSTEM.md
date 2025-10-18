# Financial Prediction System for AuraCares Salon Management

## Overview

This document explains how to set up and use the Financial Prediction system for the AuraCares salon management application. The system uses Linear Regression to predict next week's revenue based on historical data.

## System Architecture

The financial prediction system consists of:

1. **Python ML Microservice** - Handles the machine learning model training and predictions
2. **Node.js Backend API** - Integrates with the Python service and provides REST endpoints
3. **React Frontend Component** - Displays the financial forecast in the dashboard

## Setup Instructions

### 1. Python ML Service Setup

Navigate to the ml-service directory:
```bash
cd backend/ml-service
```

Install the required Python packages:
```bash
pip install -r requirements.txt
```

Initialize the model with sample data:
```bash
python init_model.py
```

Start the Flask service:
```bash
python app.py
```

The service will run on port 5001 by default.

### 2. Environment Configuration

Add the following to your backend `.env` file:
```env
ML_SERVICE_URL=http://localhost:5001
ML_SERVICE_TIMEOUT=5000
```

### 3. Backend Integration

The system automatically integrates with the existing backend. The following endpoints are available:

- `GET /api/financial-forecast/forecast` - Get next week's revenue prediction
- `POST /api/financial-forecast/train` - Train the model with new data

### 4. Frontend Integration

The financial forecast component is automatically displayed in the Financial Dashboard, positioned after the expense tracking section and before the revenue records.

## How It Works

### Data Features

The model uses the following features for prediction:
- Week number
- Day of the week
- Month
- Weekend indicator
- Service type (Keratin Treatment, Hair Color, Manicure)
- Customer retention

### Training Data

The model is initially trained with sample data:
- Date: 2025-10-10, Customer: Ronaldo, Service: Hair Color, Amount: ₹1,499
- Date: 2025-09-27, Customer: Ronaldo, Service: Keratin Treatment, Amount: ₹2,999
- Date: 2025-09-23, Customer: Ronaldo, Service: Keratin Treatment, Amount: ₹2,999
- Date: 2025-09-23, Customer: Ronaldo, Service: Manicure, Amount: ₹399

### Prediction Output

The system provides:
- Predicted revenue for next week
- Confidence level of the prediction
- Percentage change compared to current month
- Trend indicator (positive/negative)

## Customization

### Adding More Training Data

To improve prediction accuracy, you can add more historical data by calling the train endpoint with appointment records.

### Adjusting the Model

The model can be retrained with new data to adapt to changing business patterns.

## Troubleshooting

### Common Issues

1. **ML Service Not Responding**
   - Ensure the Python service is running on port 5001
   - Check that the ML_SERVICE_URL in the backend .env file is correct

2. **Prediction Errors**
   - Verify that the model files (revenue_regression_model.pkl, model_features.pkl) exist
   - Run `python init_model.py` to reinitialize the model if needed

3. **Frontend Not Displaying Data**
   - Check browser console for API errors
   - Verify that the backend can communicate with the ML service

## Future Enhancements

1. **Advanced Features**
   - Seasonal adjustments for holidays and special events
   - Weather impact on revenue
   - Marketing campaign effects

2. **Model Improvements**
   - Use more sophisticated algorithms (Random Forest, XGBoost)
   - Add more features (staff performance, customer demographics)
   - Implement time series forecasting (ARIMA, LSTM)

3. **UI Enhancements**
   - Historical prediction accuracy tracking
   - Detailed breakdown by service type
   - Comparison with actual results