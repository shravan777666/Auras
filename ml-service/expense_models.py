"""
Pydantic models for expense prediction input validation
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class LastMonthData(BaseModel):
    """Model for last month's expense data"""
    total_monthly_expense: float
    expense_lag_2: Optional[float] = 0.0
    expense_lag_3: Optional[float] = 0.0
    date: Optional[datetime] = None

class NextMonthPlanning(BaseModel):
    """Model for next month's planning data"""
    planned_marketing_spend: Optional[float] = 0.0
    num_employees: Optional[int] = 0
    # Add other planning fields as needed

class ExpensePredictionRequest(BaseModel):
    """Model for expense prediction request"""
    last_month_data: LastMonthData
    next_month_planning: Optional[NextMonthPlanning] = None

class ExpensePredictionResponse(BaseModel):
    """Model for expense prediction response"""
    prediction: float
    lower_95: float
    upper_95: float
    feature_importances: list
    metrics: Dict[str, Any]