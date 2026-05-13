FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for psycopg2
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from the backend/ml_service directory
COPY backend/ml_service/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the actual ML scripts
COPY backend/ml_service/ ./ml_service/

# Ensure the models directory exists
RUN mkdir -p ./ml_service/models

# Expose port 5001 if we add an API later
EXPOSE 5001

# Default command: Run the training pipeline and then keep alive
# (Change this to "python ml_service/app.py" if an API is added)
CMD ["sh", "-c", "python ml_service/market_basket.py train && python ml_service/seasonal_analysis.py train && python ml_service/product_forecast.py train && tail -f /dev/null"]
