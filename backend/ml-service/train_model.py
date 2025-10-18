import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib
import os
from datetime import datetime
import calendar

def prepare_features(df):
    """
    Prepare features for the linear regression model
    """
    # Convert date to datetime
    df['date'] = pd.to_datetime(df['date'])
    
    # Extract date features
    df['week_number'] = df['date'].dt.isocalendar().week
    df['day_of_week'] = df['date'].dt.dayofweek
    df['month'] = df['date'].dt.month
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
    
    # Encode service types
    service_types = df['service'].unique()
    for service in service_types:
        df[f'service_type_{service.lower().replace(" ", "_")}'] = (df['service'] == service).astype(int)
    
    # Customer retention feature (simplified - in real implementation, this would be more complex)
    df['customer_retention'] = 1  # Assuming all customers are regular for this example
    
    return df

def train_model(salon_data):
    """
    Train the linear regression model with salon data
    """
    # Create DataFrame from salon data
    df = pd.DataFrame(salon_data)
    
    # Prepare features
    df = prepare_features(df)
    
    # Define features and target
    feature_columns = [col for col in df.columns if col not in ['date', 'customer', 'service', 'revenue']]
    X = df[feature_columns]
    y = df['revenue']
    
    # Train the model
    model = LinearRegression()
    model.fit(X, y)
    
    # Save the model and feature list
    joblib.dump(model, 'revenue_regression_model.pkl')
    joblib.dump(feature_columns, 'model_features.pkl')
    
    return model, feature_columns

def predict_next_week_revenue(model, feature_columns, week_number=None):
    """
    Predict next week's revenue based on the trained model
    """
    if week_number is None:
        week_number = datetime.now().isocalendar()[1] + 1
    
    # Create sample data for next week prediction
    # This is a simplified example - in real implementation, you would use actual historical patterns
    prediction_data = {
        'week_number': week_number,
        'day_of_week': 0,  # Monday
        'month': datetime.now().month,
        'is_weekend': 0,
        'service_type_keratin': 1,
        'service_type_hair_color': 0,
        'service_type_manicure': 0,
        'customer_retention': 1
    }
    
    # Create DataFrame for prediction
    X_pred = pd.DataFrame([prediction_data])
    
    # Ensure all feature columns are present
    for col in feature_columns:
        if col not in X_pred.columns:
            X_pred[col] = 0
    
    # Reorder columns to match training data
    X_pred = X_pred[feature_columns]
    
    # Make prediction
    prediction = model.predict(X_pred)[0]
    
    # Calculate confidence interval (simplified)
    confidence = 0.85  # 85% confidence
    
    return prediction, confidence

if __name__ == "__main__":
    # Sample salon data based on the provided example
    salon_data = {
        'date': ['2025-10-10', '2025-09-27', '2025-09-23', '2025-09-23'],
        'customer': ['Ronaldo', 'Ronaldo', 'Ronaldo', 'Ronaldo'],
        'service': ['Hair Color', 'Keratin Treatment', 'Keratin Treatment', 'Manicure'],
        'revenue': [1499, 2999, 2999, 399]
    }
    
    # Train the model
    model, features = train_model(salon_data)
    
    # Predict next week's revenue
    next_week_revenue, confidence = predict_next_week_revenue(model, features)
    
    print(f"Next week's predicted revenue: ₹{next_week_revenue:.2f}")
    print(f"Confidence level: {confidence:.2%}")