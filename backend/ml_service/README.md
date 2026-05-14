# 🤖 AI & Machine Learning Service

A collection of Python scripts designed to provide intelligent business insights for the hardware store. These models analyze transaction history and product movement to optimize operations.

---

## 📈 Included Models

### 1. Sales Forecasting (`product_forecast.py`)
- **Algorithm**: Linear Regression / Time Series Analysis.
- **Purpose**: Predicts the next 30 days of sales for each product SKU.
- **Output**: Generates `product_forecast.json` which is consumed by the backend dashboard.

### 2. Market Basket Analysis (`market_basket.py`)
- **Algorithm**: Apriori Algorithm.
- **Purpose**: Identifies relationships between products (e.g., customers who buy a "Hammer" also buy "Nails" 80% of the time).
- **Output**: Populates the `market_basket_recommendations` table.

### 3. Seasonal Trend Analysis (`seasonal_analysis.py`)
- **Purpose**: Identifies demand multipliers for products during different months of the year.
- **Output**: Populates the `seasonal_trends` table.

---

## 🛠️ Requirements
- Python 3.9+
- Pandas, Scikit-learn, SQLAlchemy, Psycopg2

---

## 🚀 Training the Models
The models can be trained manually or automatically during Docker startup.

```bash
# Install dependencies
pip install -r requirements.txt

# Train all models
python product_forecast.py train
python market_basket.py train
python seasonal_analysis.py train
```

---

## 🔗 Integration
The ML service connects directly to the PostgreSQL database (local or remote) using the `DATABASE_URL` environment variable.
