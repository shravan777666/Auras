# ML Service Migration Guide

## Overview

The machine learning service has been separated from the backend into a standalone top-level service. This change improves modularity, scalability, and maintainability of the codebase.

## What Changed

### Directory Structure
- **Before**: `backend/ml-service/`
- **After**: `ml-service/` (top-level directory)

### Benefits of This Change
1. **Independent Scaling**: ML service can be scaled independently from the backend
2. **Language Isolation**: Python dependencies are completely separate from Node.js backend
3. **Easier Deployment**: ML service can be deployed to specialized Python hosting environments
4. **Better Resource Management**: CPU/GPU resources can be allocated specifically to ML workloads
5. **Cleaner Architecture**: Clear separation of concerns between business logic and ML inference

## Migration Steps (Already Completed)

✅ Created new top-level `ml-service/` directory  
✅ Moved all ML-related files from `backend/ml-service/` to `ml-service/`  
✅ Updated `docker-compose.yml` to reference new location  
✅ Updated `render.yaml` deployment configuration  
✅ Updated all documentation references  
✅ Added ML service to `.gitignore`  
✅ Removed old `backend/ml-service/` directory  

## Configuration Updates

### Docker Compose
The `docker-compose.yml` file has been updated:
```yaml
ml-service:
  build:
    context: ./ml-service  # Changed from ./backend/ml-service
    dockerfile: Dockerfile
```

### Render Deployment
Added new ML service configuration to `render.yaml`:
```yaml
- type: web
  name: auracare-ml-service
  env: python
  rootDir: ml-service
  buildCommand: pip install -r requirements.txt
  startCommand: python app.py
```

### Environment Variables
Backend services connect to ML service via:
- `ML_SERVICE_URL`: URL of the ML service (default: http://localhost:5001)
- `ML_SERVICE_TIMEOUT`: Request timeout in milliseconds (default: 5000)

## For Developers

### Running Locally

#### Backend (Node.js)
```bash
cd backend
npm install
npm start
```

#### ML Service (Python)
```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Running with Docker
```bash
docker-compose up
```
All services will start automatically with proper networking.

### Testing the Integration
The backend controllers (`financialForecastController.js`, `expenseForecastController.js`) communicate with the ML service via HTTP requests using the `ML_SERVICE_URL` environment variable.

## API Endpoints

The ML service exposes the following endpoints:

- `GET /health` - Health check
- `GET /predict` - Revenue prediction for next week
- `POST /train` - Train revenue model with new data
- `POST /predict/next_month` - Expense prediction for next month
- `POST /recommend_addon` - Addon recommendation based on customer data

## Troubleshooting

### ML Service Connection Issues
If the backend cannot connect to the ML service:
1. Verify ML service is running: `curl http://localhost:5001/health`
2. Check `ML_SERVICE_URL` environment variable in backend
3. Ensure no firewall is blocking port 5001

### Model Not Found Errors
If you get pickle file errors:
1. Navigate to `ml-service/`
2. Run `python init_model.py` to initialize models
3. Or train models: `python train_model.py`

### Python Environment Issues
1. Ensure Python 3.7+ is installed
2. Create fresh virtual environment
3. Install dependencies: `pip install -r requirements.txt`

## Files Moved

All files from `backend/ml-service/` were moved to the new `ml-service/` directory:

### Python Scripts
- `app.py` - Flask API server
- `init_model.py` - Model initialization
- `train_model.py` - Revenue model training
- `train_expense_model.py` - Expense model training
- `train_addon_model.py` - Addon model training
- `expense_predictor.py` - Expense prediction logic
- `expense_models.py` - Pydantic models
- `addon_model.py` - Addon recommendation logic

### Model Files (.pkl)
- `revenue_regression_model.pkl`
- `expense_svr_model.pkl`
- `expense_scaler.pkl`
- `expense_feature_names.pkl`
- `addon_decision_tree_model.pkl`
- `addon_model_features.pkl`
- `model_features.pkl`

### Configuration Files
- `requirements.txt` - Python dependencies
- `Dockerfile` - Container configuration
- `package.json` - Node.js metadata (if needed)
- `setup.sh` / `setup.bat` - Setup scripts

### Documentation
- `README.md` - Main ML service documentation
- `README_EXPENSE_PREDICTOR.md` - Expense predictor documentation

### Test Files
- `test_expense_predictor.py`
- `test_expense_api.py`
- `demo_api_call.py`

## Documentation Updates

The following documentation files were updated to reflect the new structure:

- `docs/README.md` - Updated project structure diagram
- `docs/FINANCIAL_PREDICTION_SYSTEM.md` - Updated file paths
- `docs/FINANCIAL_PREDICTION_IMPLEMENTATION_SUMMARY.md` - Updated references
- `docs/FINANCIAL_PREDICTION_FILE_SUMMARY.md` - Updated file locations
- `docs/EXPENSE_PREDICTION_IMPLEMENTATION.md` - Updated all command examples
- `ml-service/README.md` - Added architecture explanation

## Future Enhancements

With this separation, the following improvements are now easier to implement:

1. **GPU Support**: Deploy ML service to GPU-enabled infrastructure
2. **Model Versioning**: Implement A/B testing for different model versions
3. **Batch Predictions**: Add endpoints for batch processing
4. **Model Monitoring**: Add logging and performance metrics
5. **Auto-scaling**: Scale ML service based on prediction load
6. **Multiple Models**: Serve different models for different purposes
7. **Model Registry**: Implement MLflow or similar for model management

## Questions or Issues?

If you encounter any issues with the ML service migration, please:
1. Check this guide for troubleshooting steps
2. Review the ML service README at `ml-service/README.md`
3. Verify all environment variables are set correctly
4. Ensure Docker networking is configured (if using containers)
