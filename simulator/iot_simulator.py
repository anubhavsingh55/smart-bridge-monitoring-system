import os
import pandas as pd
import time
import json
import requests
import random
from datetime import datetime

# =========================
# CONFIGURATION
# =========================

API_URL = os.getenv(
    "API_URL",
    "https://smart-bridge-monitoring-system-production.up.railway.app/api/sensors/readings"
)

bridge_ids = [
    "Bridge_A",
    "Bridge_B",
    "Bridge_C",
    "Bridge_D"
]

# =========================
# LOAD CLEANED DATASET
# =========================

file_path = "cleaned_dataset/cleaned_bridge_dataset.csv"

df = pd.read_csv(file_path)

# Replace missing values
df = df.fillna(0)

print("\n===================================")
print(" BRIDGE IOT SIMULATOR STARTED ")
print("===================================\n")

print(f"Loaded {len(df)} records")
print(f"API URL: {API_URL}\n")

# =========================
# CONTINUOUS DATA STREAMING
# =========================

while True:

    for index, row in df.iterrows():

        try:

            sensor_data = {
                "bridge_id": random.choice(bridge_ids),

                # Real-time timestamp
                "timestamp": datetime.now().isoformat(),

                "temperature": float(row["Temperature_C"]),
                "humidity": float(row["Humidity_percent"]),
                "vibration": float(row["Vibration_ms2"]),
                "strain": float(row["Strain_microstrain"]),
                "tilt": float(row["Tilt_deg"]),

                # Simulated battery level
                "battery_level": random.randint(70, 100)
            }

            print("=" * 50)
            print(f"Reading #{index + 1}")
            print(json.dumps(sensor_data, indent=4))

            response = requests.post(
                API_URL,
                json=sensor_data,
                timeout=5
            )

            if response.status_code in [200, 201]:

                print("\n✅ Data stored successfully")
                print(f"Status Code: {response.status_code}")

            else:

                print("\n❌ API Error")
                print(f"Status Code: {response.status_code}")
                print(response.text)

            # Simulate sensor interval
            time.sleep(0.2)

        except Exception as e:

            print("\n❌ Error Sending Data")
            print(str(e))

            time.sleep(1)

    print("\n===================================")
    print(" DATASET COMPLETED - RESTARTING ")
    print("===================================\n")