import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import joblib
from datetime import datetime

def initialize_model():
    """
    Initialize the model with the provided salon data
    """
    # Sample salon data based on the provided example
    salon_data = {
        'date': ['2025-10-10', '2025-09-27', '2025-09-23', '2025-09-23'],
        'customer': ['Ronaldo', 'Ronaldo', 'Ronaldo', 'Ronaldo'],
        'service': ['Hair Color', 'Keratin Treatment', 'Keratin Treatment', 'Manicure'],
        'revenue': [1499, 2999, 2999, 399]
    }
    
    # Create DataFrame
    df = pd.DataFrame(salon_data)
    
    # Convert date to datetime
    df['date'] = pd.to_datetime(df['date'])
    
    # Extract date features
    df['week_number'] = df['date'].dt.isocalendar().week
    df['day_of_week'] = df['date'].dt.dayofweek
    df['month'] = df['date'].dt.month
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
    
    # Encode service types
    df['service_type_keratin'] = (df['service'] == 'Keratin Treatment').astype(int)
    df['service_type_hair_color'] = (df['service'] == 'Hair Color').astype(int)
    df['service_type_manicure'] = (df['service'] == 'Manicure').astype(int)
    
    # Customer retention feature
    df['customer_retention'] = 1  # Assuming all customers are regular
    
    # Define features and target
    feature_columns = ['week_number', 'day_of_week', 'month', 'is_weekend', 
                      'service_type_keratin', 'service_type_hair_color', 'service_type_manicure', 
                      'customer_retention']
    X = df[feature_columns]
    y = df['revenue']
    
    # Train the model
    model = LinearRegression()
    model.fit(X, y)
    
    # Save the model and feature list
    joblib.dump(model, 'revenue_regression_model.pkl')
    joblib.dump(feature_columns, 'model_features.pkl')
    
    print("Model initialized successfully!")
    print(f"Model coefficients: {model.coef_}")
    print(f"Model intercept: {model.intercept_}")
    
    # Test prediction
    next_week_data = {
        'week_number': [41],  # Next week
        'day_of_week': [0],   # Monday
        'month': [10],        # October
        'is_weekend': [0],
        'service_type_keratin': [1],
        'service_type_hair_color': [0],
        'service_type_manicure': [0],
        'customer_retention': [1]
    }
    
    X_test = pd.DataFrame(next_week_data)
    prediction = model.predict(X_test)[0]
    
    print(f"Sample prediction for next week: ₹{prediction:.2f}")

if __name__ == "__main__":
    initialize_model()