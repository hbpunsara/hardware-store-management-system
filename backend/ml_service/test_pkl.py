import pickle

try:
    with open("models/forecast_output.pkl", "rb") as f:
        data = pickle.load(f)
        print("Type details:", type(data))
        if isinstance(data, list):
            print("Length:", len(data))
            if len(data) > 0:
                print("First item:", data[0])
        elif hasattr(data, "head"):
            print("Columns:", data.columns)
            print("Head:\n", data.head())
        elif isinstance(data, dict):
            print("Keys:", data.keys())
            for k, v in list(data.items())[:3]:
                print(f"Key: {k}, type(v): {type(v)}")
        else:
            print("Data:", data)
except Exception as e:
    print("Error:", e)
