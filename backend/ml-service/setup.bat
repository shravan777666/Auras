@echo off
REM Setup script for the Financial Prediction ML Service on Windows

echo Setting up Financial Prediction ML Service...

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed. Please install Python and try again.
    exit /b 1
)

REM Check if pip is installed
pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo pip is not installed. Please install pip and try again.
    exit /b 1
)

REM Create virtual environment
echo Creating virtual environment...
python -m venv venv

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install requirements
echo Installing Python requirements...
pip install -r requirements.txt

REM Initialize the model
echo Initializing the model with sample data...
python init_model.py

echo Setup complete!
echo.
echo To start the service, run:
echo   call venv\Scripts\activate
echo   python app.py
echo.
echo The service will be available at http://localhost:5001