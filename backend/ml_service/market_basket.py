import pickle
import os
import json

class MarketBasketAnalyzer:
    def __init__(self, model_path="models/association_rules.pkl"):
        script_dir = os.path.dirname(os.path.abspath(__file__))
        self.model_path = os.path.join(script_dir, model_path)
        self.rules = self.load_model()

    def load_model(self):
        if os.path.exists(self.model_path):
            with open(self.model_path, "rb") as f:
                return pickle.load(f)
        return None

    def get_top_rules_json(self, top_n=50):
        if self.rules is None or self.rules.empty:
            return json.dumps([])
            
        # Sort by confidence
        sorted_rules = self.rules.sort_values(by='confidence', ascending=False).head(top_n)
        
        result = []
        for _, row in sorted_rules.iterrows():
            a_val = row['antecedents']
            c_val = row['consequents']
            
            antecedents = list(a_val) if isinstance(a_val, (frozenset, set, list)) else [str(a_val)]
            consequents = list(c_val) if isinstance(c_val, (frozenset, set, list)) else [str(c_val)]
            
            products_list = list(set(antecedents + consequents))
            
            # Ensure proper casting for JSON serialization
            conf_val = float(row['confidence'])
            support_val = float(row['support'])
            
            # Mocking frequency from support proxy or lift
            frequency = max(1, int(support_val * 5000))
            
            result.append({
                "products": products_list,
                "frequency": frequency,
                "confidence": f"{int(conf_val * 100)}%"
            })
            
        return json.dumps(result)

import sys

def generate_rules():
    analyzer = MarketBasketAnalyzer()
    json_data = analyzer.get_top_rules_json()
    script_dir = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(script_dir, 'rules.json'), 'w') as f:
        f.write(json_data)
    print("Generated rules.json")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == 'train':
        generate_rules()
    else:
        analyzer = MarketBasketAnalyzer()
        print(analyzer.get_top_rules_json())
