"""
Test script for the expense prediction API
"""

import requests
import json

def test_expense_prediction():
    """Test the expense prediction endpoint"""
    url = "http://localhost:5001/predict/next_month"
    
    # Test data
    data = {
        "last_month_data": {
            "total_monthly_expense": 15000,
            "expense_lag_2": 14000,
            "expense_lag_3": 13000
        },
        "next_month_planning": {
            "planned_marketing_spend": 2000,
            "num_employees": 5
        }
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_expense_prediction()