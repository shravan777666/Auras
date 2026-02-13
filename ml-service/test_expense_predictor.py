"""
Unit tests for the expense predictor module
"""

import numpy as np
import os
import pandas as pd
from datetime import datetime, timedelta
from expense_predictor import ExpensePredictor
from expense_models import ExpensePredictionRequest, LastMonthData

# Test data (3 years of monthly data)
SAMPLE_EXPENSES = pd.DataFrame([
    # Year 1
    {'date': '2021-01-01', 'amount': 10000},
    {'date': '2021-02-01', 'amount': 12000},
    {'date': '2021-03-01', 'amount': 11000},
    {'date': '2021-04-01', 'amount': 13000},
    {'date': '2021-05-01', 'amount': 12500},
    {'date': '2021-06-01', 'amount': 14000},
    {'date': '2021-07-01', 'amount': 13500},
    {'date': '2021-08-01', 'amount': 15000},
    {'date': '2021-09-01', 'amount': 14500},
    {'date': '2021-10-01', 'amount': 16000},
    {'date': '2021-11-01', 'amount': 18000},  # Holiday season
    {'date': '2021-12-01', 'amount': 19000},  # Holiday season
    
    # Year 2
    {'date': '2022-01-01', 'amount': 11000},
    {'date': '2022-02-01', 'amount': 12500},
    {'date': '2022-03-01', 'amount': 11500},
    {'date': '2022-04-01', 'amount': 13500},
    {'date': '2022-05-01', 'amount': 13000},
    {'date': '2022-06-01', 'amount': 14500},
    {'date': '2022-07-01', 'amount': 14000},
    {'date': '2022-08-01', 'amount': 15500},
    {'date': '2022-09-01', 'amount': 15000},
    {'date': '2022-10-01', 'amount': 16500},
    {'date': '2022-11-01', 'amount': 18500},  # Holiday season
    {'date': '2022-12-01', 'amount': 19500},  # Holiday season
    
    # Year 3
    {'date': '2023-01-01', 'amount': 11500},
    {'date': '2023-02-01', 'amount': 13000},
    {'date': '2023-03-01', 'amount': 12000},
    {'date': '2023-04-01', 'amount': 14000},
    {'date': '2023-05-01', 'amount': 13500},
    {'date': '2023-06-01', 'amount': 15000},
    {'date': '2023-07-01', 'amount': 14500},
    {'date': '2023-08-01', 'amount': 16000},
    {'date': '2023-09-01', 'amount': 15500},
    {'date': '2023-10-01', 'amount': 17000},
    {'date': '2023-11-01', 'amount': 19000},  # Holiday season
    {'date': '2023-12-01', 'amount': 20000},  # Holiday season
])

def test_expense_predictor_initialization():
    """Test ExpensePredictor initialization"""
    predictor = ExpensePredictor()
    assert predictor is not None
    assert predictor.model is None
    assert predictor.scaler is None
    assert predictor.is_trained is False

def test_feature_creation():
    """Test feature creation methods"""
    predictor = ExpensePredictor()
    
    # Test lag features
    df = predictor._create_lag_features(SAMPLE_EXPENSES)
    assert 'expense_lag_1' in df.columns
    assert 'expense_lag_2' in df.columns
    assert 'expense_lag_3' in df.columns
    
    # Test temporal features
    df = predictor._create_temporal_features(SAMPLE_EXPENSES)
    assert 'month_of_year' in df.columns
    assert 'quarter' in df.columns
    assert 'is_holiday_season' in df.columns
    
    # Test business features
    df = predictor._create_business_features(SAMPLE_EXPENSES)
    assert 'is_rent_month' in df.columns
    assert 'is_tax_month' in df.columns

def test_prepare_features():
    """Test feature preparation"""
    predictor = ExpensePredictor()
    
    # Convert DataFrame to list of dictionaries
    expenses_list = SAMPLE_EXPENSES.to_dict('records')
    X, y = predictor.prepare_features(expenses_list)
    
    # Check that we have the expected feature columns
    expected_features = [
        'expense_lag_1', 'expense_lag_2', 'expense_lag_3',
        'month_of_year', 'quarter', 'is_holiday_season',
        'is_rent_month', 'is_tax_month'
    ]
    
    assert list(X.columns) == expected_features
    assert len(X) == len(y)

def test_model_training():
    """Test model training"""
    predictor = ExpensePredictor()
    
    # Convert DataFrame to list of dictionaries
    expenses_list = SAMPLE_EXPENSES.to_dict('records')
    
    # Train the model
    metrics = predictor.train(expenses_list)
    
    # Check that metrics are returned
    assert 'rmse' in metrics
    assert 'mae' in metrics
    assert 'r2' in metrics
    assert 'best_params' in metrics
    
    # Check that model is trained
    assert predictor.is_trained is True
    assert predictor.model is not None
    assert predictor.scaler is not None

def test_model_persistence():
    """Test model saving and loading"""
    predictor = ExpensePredictor()
    
    # Convert DataFrame to list of dictionaries
    expenses_list = SAMPLE_EXPENSES.to_dict('records')
    
    # Train the model
    predictor.train(expenses_list)
    
    # Check that model files were created
    assert os.path.exists('expense_svr_model.pkl')
    assert os.path.exists('expense_scaler.pkl')
    assert os.path.exists('expense_feature_names.pkl')
    
    # Create a new predictor and load the model
    new_predictor = ExpensePredictor()
    assert new_predictor.is_trained is False
    
    # Load the model
    success = new_predictor.load_model()
    assert success is True
    assert new_predictor.is_trained is True
    assert new_predictor.model is not None
    assert new_predictor.scaler is not None

def test_prediction():
    """Test expense prediction"""
    predictor = ExpensePredictor()
    
    # Convert DataFrame to list of dictionaries
    expenses_list = SAMPLE_EXPENSES.to_dict('records')
    
    # Train the model
    predictor.train(expenses_list)
    
    # Create test data for prediction
    last_month_data = {
        'total_monthly_expense': 15000,
        'expense_lag_2': 14000,
        'expense_lag_3': 13000
    }
    
    # Make prediction
    result = predictor.predict_next_month(last_month_data)
    
    # Check that result contains expected fields
    assert 'prediction' in result
    assert 'lower_95' in result
    assert 'upper_95' in result
    assert 'feature_importances' in result
    assert 'metrics' in result
    
    # Check that prediction is reasonable (positive)
    assert result['prediction'] >= 0

def test_pydantic_models():
    """Test Pydantic models"""
    # Test LastMonthData model
    last_month_data = LastMonthData(
        total_monthly_expense=15000,
        expense_lag_2=14000,
        expense_lag_3=13000
    )
    
    assert last_month_data.total_monthly_expense == 15000
    assert last_month_data.expense_lag_2 == 14000
    assert last_month_data.expense_lag_3 == 13000
    
    # Test ExpensePredictionRequest model
    request_data = ExpensePredictionRequest(
        last_month_data=last_month_data
    )
    
    assert request_data.last_month_data.total_monthly_expense == 15000

if __name__ == "__main__":
    # Run tests manually
    test_expense_predictor_initialization()
    test_feature_creation()
    test_prepare_features()
    test_model_training()
    test_model_persistence()
    test_prediction()
    test_pydantic_models()
    print("All tests passed!")