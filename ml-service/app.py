import os
import joblib
import pandas as pd
from sqlalchemy import create_engine
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Allow cross-origin requests
CORS(app)

# The expected location for your .pkl file
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'model')
MODEL_PATH = os.path.join(MODEL_DIR, 'market_basket_model.pkl')
# Fallback to current directory for association_rules.pkl
ALT_MODEL_PATH = os.path.join(os.path.dirname(__file__), 'association_rules.pkl')

# In Docker, we mounted the volume to /app/backend
# Locally without Docker, it's ../backend
LOCAL_DB_PATH = os.environ.get("LOCAL_DB_PATH", os.path.join(os.path.dirname(__file__), '..', 'backend', 'hardware_store_local.db'))

rules_df = None
db_engine = None

# Ensure the model directory exists
os.makedirs(MODEL_DIR, exist_ok=True)

# Try loading the local .pkl file first 
path_to_load = ALT_MODEL_PATH if os.path.exists(ALT_MODEL_PATH) else MODEL_PATH
if os.path.exists(path_to_load):
    try:
        rules_df = joblib.load(path_to_load)
        print(f"Model loaded successfully from {path_to_load}")
    except Exception as e:
        print(f"Error loading model: {e}")
else:
    print(f"Warning: Model not found at {path_to_load}.")
    if os.path.exists(LOCAL_DB_PATH):
        try:
            print(f"Connecting to local SQLite database: {LOCAL_DB_PATH}")
            db_engine = create_engine(f"sqlite:///{LOCAL_DB_PATH}")
            rules_df = pd.read_sql("SELECT * FROM association_rules", db_engine)
            print(f"Model loaded successfully from local SQLite Database: {len(rules_df)} rules found.")
        except Exception as e:
            print(f"Could not load rules from SQLite database: {e}")
    else:
         print(f"Error: Local DB not found at {LOCAL_DB_PATH}")


@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint to check if the Python service is running and model is loaded."""
    return jsonify({
        "status": "running",
        "model_loaded": rules_df is not None,
        "model_path_checked": path_to_load
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Endpoint to get recommendations based on market basket analysis."""
    if rules_df is None:
        return jsonify({"error": "Model is not loaded on the server"}), 503

    try:
        data = request.json
        if not data or 'items' not in data:
            return jsonify({"error": "Please provide 'items' in the request JSON"}), 400

        # Create a frozenset of current items in the cart
        cart_items = frozenset([str(item).strip().upper() for item in data['items']])
        
        if not cart_items:
            return jsonify({"provided_items": list(cart_items), "recommendations": []})

        # Match rules where all antecedents are in the current cart
        # rules_df['antecedents'] is expected to be a frozenset or list in the dataframe
        def is_subset(antecedents):
            if isinstance(antecedents, (frozenset, set, list)):
                # If it's a collection, check if it's a subset of cart items
                ant_set = {str(x).strip().upper() for x in antecedents}
                return len(ant_set) > 0 and ant_set.issubset(cart_items)
            # if it's a single string
            return str(antecedents).strip().upper() in cart_items

        matching_rules = rules_df[rules_df['antecedents'].apply(is_subset)]
        
        # If no rules match, return empty
        if matching_rules.empty:
            return jsonify({"provided_items": list(cart_items), "recommendations": []})
        
        # Sort by lift (highest first) to get the best recommendations
        sorted_rules = matching_rules.sort_values(by='lift', ascending=False)
        
        # Extract the consequents (the recommended items)
        recommendations = set()
        for consequents in sorted_rules['consequents']:
            if isinstance(consequents, (frozenset, set, list)):
                for item in consequents:
                    item_str = str(item).strip()
                    # Only recommend items not already in the cart
                    if item_str.upper() not in cart_items:
                        recommendations.add(item_str)
            else:
                item_str = str(consequents).strip()
                if item_str.upper() not in cart_items:
                    recommendations.add(item_str)
        
        # Return the top 4 recommendations
        top_recommendations = list(recommendations)[:4]

        return jsonify({
            "provided_items": data['items'],
            "recommendations": top_recommendations
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    # Start the Flask app
    print("Starting ML prediction service on port 5001...")
    app.run(port=5001, debug=True, host='0.0.0.0')
