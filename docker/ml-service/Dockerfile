FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for psycopg2
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the ML service source code
COPY . .

# Ensure the model directory exists
RUN mkdir -p /app/model

# Expose port 5001 for the Flask API
EXPOSE 5001

# Run the application
CMD ["python", "app.py"]
