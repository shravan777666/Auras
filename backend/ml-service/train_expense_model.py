"""
Training script for the expense predictor model
"""

import sys
import os
import json
import logging
from datetime import datetime, timedelta
from expense_predictor import ExpensePredictor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_sample_data():
    """
    Generate sample expense data for training the model.
    In a real application, this data would come from a database.
    """
    # Generate 3 years of monthly expense data
    expenses = []
    start_date = datetime.now() - timedelta(days=3*365)
    
    for i in range(36):  # 3 years of monthly data
        date = start_date + timedelta(days=i*30)
        # Generate realistic expense amounts with some seasonality
        base_amount = 10000  # Base monthly expense
        seasonal_factor = 1.2 if date.month in [11, 12] else 1.0  # Higher expenses in holiday season
        random_factor = 0.9 + (0.2 * (i % 10) / 10)  # Some random variation
        amount = base_amount * seasonal_factor * random_factor
        
        expenses.append({
            'date': date.isoformat(),
            'amount': amount
        })
    
    return expenses

def main():
    """Main training function"""
    logger.info("Starting expense predictor model training...")
    
    try:
        # Initialize predictor
        predictor = ExpensePredictor()
        
        # Generate or load training data
        # In a real application, you would load this from a database
        logger.info("Generating sample training data...")
        expenses = generate_sample_data()
        
        if len(expenses) < 10:
            logger.error("Insufficient training data. Need at least 10 months of data.")
            return False
        
        logger.info(f"Training data generated: {len(expenses)} months of expense data")
        
        # Train the model
        metrics = predictor.train(expenses)
        
        logger.info("Model training completed successfully!")
        logger.info(f"Best parameters: {metrics['best_params']}")
        logger.info(f"Training metrics - RMSE: {metrics['rmse']:.2f}, MAE: {metrics['mae']:.2f}, R²: {metrics['r2']:.2f}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error during model training: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)