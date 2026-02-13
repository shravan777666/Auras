"""
Demo script showing how to call the expense prediction API
This demonstrates the integration between the frontend and backend
"""

import requests
import json
from datetime import datetime

def get_last_month_expense_data():
    """
    In a real application, this would fetch actual data from your database.
    For this demo, we'll return sample data.
    """
    # This would typically come from your expense tracking system
    return {
        "total_monthly_expense": 15000.0,  # Last month's total expenses
        "expense_lag_2": 14000.0,          # Two months ago
        "expense_lag_3": 13000.0           # Three months ago
    }

def get_next_month_planning_data():
    """
    Get any known planning data for next month.
    This is optional but can improve prediction accuracy.
    """
    return {
        "planned_marketing_spend": 2000.0,
        "num_employees": 5
    }

def predict_next_month_expenses():
    """
    Call the expense prediction API to get next month's forecast
    """
    # API endpoint
    url = "http://localhost:5001/predict/next_month"
    
    # Prepare the request data
    data = {
        "last_month_data": get_last_month_expense_data(),
        "next_month_planning": get_next_month_planning_data()
    }
    
    try:
        # Make the API call
        response = requests.post(url, json=data)
        
        # Check if the request was successful
        if response.status_code == 200:
            result = response.json()
            
            if result.get("success"):
                prediction_data = result.get("data", {})
                
                print("=== Expense Prediction Results ===")
                print(f"Predicted Expense: ₹{prediction_data.get('prediction', 0):,.2f}")
                print(f"Confidence Interval: ₹{prediction_data.get('lower_95', 0):,.2f} - ₹{prediction_data.get('upper_95', 0):,.2f}")
                print()
                
                print("Feature Importance:")
                for feature in prediction_data.get("feature_importances", []):
                    print(f"  {feature['feature'].replace('_', ' ').title()}: {feature['importance'] * 100:.0f}%")
                print()
                
                print("Model Metrics:")
                metrics = prediction_data.get("metrics", {})
                print(f"  RMSE: {metrics.get('rmse', 0):.2f}")
                print(f"  MAE: {metrics.get('mae', 0):.2f}")
                print(f"  R²: {metrics.get('r2', 0):.2f}")
                
                return prediction_data
            else:
                print(f"API Error: {result.get('message', 'Unknown error')}")
                return None
        else:
            print(f"HTTP Error: {response.status_code} - {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the expense prediction service.")
        print("Please make sure the ML service is running on port 5001.")
        return None
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return None

def main():
    """
    Main function to demonstrate the expense prediction API
    """
    print("Expense Prediction Demo")
    print("=" * 30)
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Get the prediction
    prediction = predict_next_month_expenses()
    
    if prediction:
        print()
        print("Prediction successful!")
        
        # You could use this data in your application
        predicted_amount = prediction.get('prediction', 0)
        lower_bound = prediction.get('lower_95', 0)
        upper_bound = prediction.get('upper_95', 0)
        
        # Example: Check if prediction is within budget
        budget = 18000.0  # Example budget
        if predicted_amount <= budget:
            print(f"✅ Prediction is within budget (₹{budget:,.2f})")
        else:
            print(f"⚠️  Prediction exceeds budget by ₹{predicted_amount - budget:,.2f}")
    else:
        print()
        print("Prediction failed. Please check the error messages above.")

if __name__ == "__main__":
    main()