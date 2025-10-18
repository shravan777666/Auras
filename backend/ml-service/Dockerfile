# Use Python 3.9 slim image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Initialize the model
RUN python init_model.py

# Expose port
EXPOSE 5001

# Run the application
CMD ["python", "app.py"]