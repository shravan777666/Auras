import pandas as pd
import numpy as np
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import json

def prepare_sample_data():
    """
    Prepare sample training data for the add-on prediction model
    In a real scenario, this data would come from the database
    """
    # Sample data based on historical patterns
    data = {
        'time_gap_size': [30, 45, 60, 90, 120, 30, 45, 60, 90, 120, 45, 60, 75, 90, 105],
        'discount_offered': [0.15, 0.20, 0.25, 0.30, 0.35, 0.15, 0.20, 0.25, 0.30, 0.35, 0.20, 0.25, 0.25, 0.30, 0.30],
        'customer_loyalty': [5, 10, 15, 20, 25, 1, 2, 3, 4, 5, 8, 12, 16, 20, 24],
        'past_add_on_history': [1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1],
        'day_of_week': [0, 1, 2, 3, 4, 5, 6, 0, 1, 2, 3, 4, 5, 6, 0],
        'conversion_outcome': [1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1]
    }
    
    return pd.DataFrame(data)

def train_model(df):
    """
    Train the Decision Tree model for add-on predictions
    """
    # Define features and target
    feature_columns = ['time_gap_size', 'discount_offered', 'customer_loyalty', 'past_add_on_history', 'day_of_week']
    X = df[feature_columns]
    y = df['conversion_outcome']
    
    # Split data for training and testing
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)
    
    # Train the Decision Tree model
    model = DecisionTreeClassifier(random_state=42, max_depth=5)
    model.fit(X_train, y_train)
    
    # Make predictions on test set
    y_pred = model.predict(X_test)
    
    # Calculate accuracy
    accuracy = accuracy_score(y_test, y_pred)
    
    # Print classification report
    print("Classification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save the model and feature list
    joblib.dump(model, 'addon_decision_tree_model.pkl')
    joblib.dump(feature_columns, 'addon_model_features.pkl')
    
    print(f"Model trained successfully with accuracy: {accuracy:.2f}")
    print(f"Feature columns: {feature_columns}")
    
    return model, feature_columns, accuracy

def test_prediction(model, feature_columns):
    """
    Test the model with a sample prediction
    """
    # Create sample data for prediction
    sample_data = {
        'time_gap_size': [45],
        'discount_offered': [0.20],
        'customer_loyalty': [8],
        'past_add_on_history': [1],
        'day_of_week': [1]
    }
    
    X_pred = pd.DataFrame(sample_data)
    
    # Ensure all feature columns are present
    for col in feature_columns:
        if col not in X_pred.columns:
            X_pred[col] = 0
    
    # Reorder columns to match training data
    X_pred = X_pred[feature_columns]
    
    # Make prediction
    prediction = model.predict(X_pred)[0]
    probability = model.predict_proba(X_pred)[0].max()
    
    print(f"\nSample prediction:")
    print(f"Input: {sample_data}")
    print(f"Prediction: {prediction} (1 = accept, 0 = reject)")
    print(f"Probability: {probability:.2f}")
    
    return prediction, probability

if __name__ == "__main__":
    # Prepare sample data
    df = prepare_sample_data()
    print("Sample training data:")
    print(df.head(10))
    print()
    
    # Train the model
    model, features, accuracy = train_model(df)
    
    # Test prediction
    test_prediction(model, features)
    
    # Save sample data to JSON for reference
    df.to_json('sample_addon_training_data.json', orient='records', indent=2)
    print("\nSample training data saved to 'sample_addon_training_data.json'")