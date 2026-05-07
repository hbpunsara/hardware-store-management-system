import sqlite3
import pandas as pd
import json
import os
import sys

def generate_forecast():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(script_dir, '..', 'hardware_store_local.db')
    json_path = os.path.join(script_dir, 'forecast.json')
    
    try:
        conn = sqlite3.connect(db_path)
        df = pd.read_sql_query("SELECT created_at, total FROM sales WHERE status != 'Voided'", conn)
        conn.close()
        
        if df.empty:
            forecast = [0, 0, 0]
        else:
            df['Date'] = pd.to_datetime(df['created_at'])
            df['YearMonth'] = df['Date'].dt.to_period('M')
            
            monthly_sales = df.groupby('YearMonth')['total'].sum().reset_index()
            monthly_sales = monthly_sales.sort_values(by='YearMonth')
            sales_values = monthly_sales['total'].tolist()
            
            if len(sales_values) == 0:
                forecast = [0, 0, 0]
            elif len(sales_values) == 1:
                val = sales_values[0]
                forecast = [val, val, val]
            elif len(sales_values) == 2:
                avg = sum(sales_values) / 2
                forecast = [avg, avg, avg]
            else:
                last_3 = sales_values[-3:]
                forecast = []
                for _ in range(3):
                    next_val = sum(last_3) / 3
                    forecast.append(round(next_val, 2))
                    last_3 = last_3[1:] + [next_val]
        
        with open(json_path, 'w') as f:
            json.dump(forecast, f)
            
        print("Generated forecast.json")
        return forecast
    except Exception as e:
        print(f"Error generating forecast: {e}")
        with open(json_path, 'w') as f:
            json.dump([], f)
        return []

class SeasonalAnalyzer:
    def get_monthly_forecast_json(self):
        json_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'forecast.json')
        try:
            with open(json_path, 'r') as f:
                return f.read()
        except:
            return json.dumps([])

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == 'train':
        generate_forecast()
    else:
        analyzer = SeasonalAnalyzer()
        print(analyzer.get_monthly_forecast_json())
