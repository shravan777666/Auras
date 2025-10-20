import pandas as pd
import numpy as np
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib
import os
from datetime import datetime
import calendar

def prepare_features(df):
    """
    Prepare features for the Decision Tree model
    """
    # Convert date to datetime if it's not already
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'])
        # Extract day of week (0=Monday, 6=Sunday)
        df['day_of_week'] = df['date'].dt.dayofweek
    
    # Convert categorical variables to numerical
    if 'day_of_week' in df.columns:
        # Already numerical from above
        pass
    else:
        # If day_of_week is provided as string, encode it
        le = LabelEncoder()
        df['day_of_week'] = le.fit_transform(df['day_of_week'])
    
    # Ensure all required columns exist
    required_columns = ['time_gap_size', 'discount_offered', 'customer_loyalty', 'past_add_on_history', 'day_of_week']
    for col in required_columns:
        if col not in df.columns:
            df[col] = 0  # Default value
    
    return df

def train_addon_model(data):
    """
    Train the Decision Tree model for add-on predictions
    """
    # Create DataFrame from data
    df = pd.DataFrame(data)
    
    # Prepare features
    df = prepare_features(df)
    
    # Define features and target
    feature_columns = ['time_gap_size', 'discount_offered', 'customer_loyalty', 'past_add_on_history', 'day_of_week']
    X = df[feature_columns]
    y = df['conversion_outcome']
    
    # Split data for training and testing
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train the Decision Tree model
    model = DecisionTreeClassifier(random_state=42, max_depth=5)
    model.fit(X_train, y_train)
    
    # Calculate accuracy
    accuracy = model.score(X_test, y_test)
    
    # Save the model and feature list
    joblib.dump(model, 'addon_decision_tree_model.pkl')
    joblib.dump(feature_columns, 'addon_model_features.pkl')
    
    return model, feature_columns, accuracy

def predict_addon_acceptance(model, feature_columns, time_gap_size, discount_offered, customer_loyalty, past_add_on_history, day_of_week):
    """
    Predict if a customer will accept an add-on offer
    """
    # Create DataFrame for prediction
    prediction_data = {
        'time_gap_size': [time_gap_size],
        'discount_offered': [discount_offered],
        'customer_loyalty': [customer_loyalty],
        'past_add_on_history': [past_add_on_history],
        'day_of_week': [day_of_week]
    }
    
    X_pred = pd.DataFrame(prediction_data)
    
    # Ensure all feature columns are present
    for col in feature_columns:
        if col not in X_pred.columns:
            X_pred[col] = 0
    
    # Reorder columns to match training data
    X_pred = X_pred[feature_columns]
    
    # Make prediction
    prediction = model.predict(X_pred)[0]
    probability = model.predict_proba(X_pred)[0].max()
    
    return prediction, probability

if __name__ == "__main__":
    # Sample training data (in a real scenario, this would come from the database)
    sample_data = {
        'time_gap_size': [30, 45, 60, 90, 120, 30, 45, 60, 90, 120],
        'discount_offered': [0.15, 0.20, 0.25, 0.30, 0.35, 0.15, 0.20, 0.25, 0.30, 0.35],
        'customer_loyalty': [5, 10, 15, 20, 25, 1, 2, 3, 4, 5],
        'past_add_on_history': [1, 1, 0, 0, 1, 0, 0, 0, 0, 1],
        'day_of_week': [0, 1, 2, 3, 4, 5, 6, 0, 1, 2],
        'conversion_outcome': [1, 1, 0, 0, 1, 0, 0, 0, 0, 1]
    }
    
    # Train the model
    model, features, accuracy = train_addon_model(sample_data)
    
    print(f"Model trained successfully with accuracy: {accuracy:.2f}")
    print(f"Feature columns: {features}")
    
    # Test prediction
    prediction, probability = predict_addon_acceptance(
        model, features, 
        time_gap_size=45, 
        discount_offered=0.20, 
        customer_loyalty=8, 
        past_add_on_history=1, 
        day_of_week=1
    )
    
    print(f"Sample prediction: {prediction} (probability: {probability:.2f})")