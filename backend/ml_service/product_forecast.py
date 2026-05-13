import sqlite3
import psycopg2
import pandas as pd
import json
import os
import sys
from datetime import datetime
from dateutil.relativedelta import relativedelta

def get_connection():
    db_url = os.environ.get('DATABASE_URL')
    if db_url and db_url.startswith('postgresql://'):
        return psycopg2.connect(db_url)
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(script_dir, '..', 'hardware_store_local.db')
    return sqlite3.connect(db_path)

def generate_product_forecast():
    """
    Generates per-product demand forecasting using a 3-month simple moving average.
    Reads from sale_items joined with sales, groups by product and month,
    then predicts the next 3 months of quantity for each product.
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, 'product_forecast.json')

    try:
        conn = get_connection()

        query = """
            SELECT 
                si.product_name,
                s.created_at,
                si.quantity
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            WHERE s.status != 'Voided'
        """
        df = pd.read_sql_query(query, conn)
        conn.close()


        if df.empty:
            result = {"products": []}
            with open(json_path, 'w') as f:
                json.dump(result, f, indent=2)
            print(json.dumps(result))
            return result

        # Parse dates and extract year-month
        df['date'] = pd.to_datetime(df['created_at'], errors='coerce')
        df = df.dropna(subset=['date'])
        df['year_month'] = df['date'].dt.to_period('M')

        # Group by product and month -> sum quantities
        monthly = df.groupby(['product_name', 'year_month'])['quantity'].sum().reset_index()
        monthly = monthly.sort_values(['product_name', 'year_month'])

        now = datetime.now()
        products_result = []

        for product_name, group in monthly.groupby('product_name'):
            group = group.sort_values('year_month')
            
            # Build history array
            history = []
            qty_values = []
            for _, row in group.iterrows():
                period = row['year_month']
                month_label = period.strftime('%b %Y')
                qty = int(row['quantity'])
                history.append({"month": month_label, "qty": qty})
                qty_values.append(qty)

            total_sold = sum(qty_values)
            avg_monthly = round(total_sold / len(qty_values), 1) if qty_values else 0

            # Compute 3-month moving average forecast
            forecast = []
            if len(qty_values) == 0:
                forecast_values = [0, 0, 0]
            elif len(qty_values) == 1:
                forecast_values = [qty_values[0]] * 3
            elif len(qty_values) == 2:
                avg = sum(qty_values) / 2
                forecast_values = [round(avg)] * 3
            else:
                last_3 = list(qty_values[-3:])
                forecast_values = []
                for _ in range(3):
                    next_val = sum(last_3) / len(last_3)
                    forecast_values.append(round(next_val))
                    last_3 = last_3[1:] + [next_val]

            # Generate month labels for forecast (next 3 months from now)
            for i, fv in enumerate(forecast_values):
                future_date = now + relativedelta(months=i + 1)
                month_label = future_date.strftime('%b %Y')
                forecast.append({"month": month_label, "qty": int(fv)})

            # Determine trend direction
            if len(qty_values) >= 2:
                recent_avg = sum(qty_values[-2:]) / 2
                older_avg = sum(qty_values[:-1]) / max(len(qty_values) - 1, 1)
                if recent_avg > older_avg * 1.1:
                    trend = "growing"
                elif recent_avg < older_avg * 0.9:
                    trend = "declining"
                else:
                    trend = "stable"
            else:
                trend = "stable"

            # Calculate growth percentage
            if len(qty_values) >= 2 and qty_values[-2] > 0:
                growth_pct = round(((qty_values[-1] - qty_values[-2]) / qty_values[-2]) * 100, 1)
            else:
                growth_pct = 0.0

            products_result.append({
                "name": product_name,
                "history": history,
                "forecast": forecast,
                "totalSold": total_sold,
                "avgMonthly": avg_monthly,
                "trend": trend,
                "growthPct": growth_pct
            })

        # Sort by totalSold descending (most sold products first)
        products_result.sort(key=lambda x: x['totalSold'], reverse=True)

        result = {"products": products_result}

        with open(json_path, 'w') as f:
            json.dump(result, f, indent=2)

        print(json.dumps(result))
        return result

    except Exception as e:
        print(f"Error generating product forecast: {e}", file=sys.stderr)
        fallback = {"products": []}
        with open(json_path, 'w') as f:
            json.dump(fallback, f)
        print(json.dumps(fallback))
        return fallback


def read_cached_forecast():
    """Read the cached product_forecast.json and print it."""
    json_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'product_forecast.json')
    try:
        with open(json_path, 'r') as f:
            data = f.read()
            print(data)
            return data
    except Exception:
        fallback = json.dumps({"products": []})
        print(fallback)
        return fallback


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == 'train':
        generate_product_forecast()
    else:
        read_cached_forecast()
