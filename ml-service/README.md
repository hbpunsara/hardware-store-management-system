# Market Basket Analysis (ML Service)

This is a Python microservice built with Flask to serve your Market Basket Analysis `.pkl` model alongside your Node.js backend.

## Setup Instructions

1. **Place your `.pkl` file**
   Move your `.pkl` file into the `model/` directory that was automatically created. By default, the code expects it to be named `market_basket_model.pkl`. 
   *(Expected Path: `hardware-store-app/ml-service/model/market_basket_model.pkl`)*

2. **Install Python Dependencies**
   Open a terminal in the `ml-service` folder and install the required packages:
   ```bash
   pip install -r requirements.txt
   ```
   *(Note: You may want to create a virtual environment first: `python -m venv venv` and activate it before installing).*

3. **Modify `app.py` Prediction Logic**
   Every machine learning model takes slightly different inputs. Open `app.py`, find the `predict()` function, and update how the model processes the `items` array to generate the output.

4. **Run the Service**
   Start the API server:
   ```bash
   python app.py
   ```
   The service will run on `http://localhost:5001`. Your Node.js backend can now make HTTP POST requests to `http://localhost:5001/predict` to securely get recommendations for the front-end!
