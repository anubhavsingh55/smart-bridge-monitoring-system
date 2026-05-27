import pandas as pd
import time
import json

# =========================
# LOAD CLEANED DATASET
# =========================

file_path = "cleaned dataset/cleaned_bridge_dataset.csv"

df = pd.read_csv(file_path)

print("\n========== IOT SIMULATOR STARTED ==========\n")

# =========================
# STREAM DATA ROW BY ROW
# =========================

for index, row in df.head(100).iterrows():

    sensor_data = row.to_dict()

    print(json.dumps(sensor_data, indent=4))

    print("\nSending sensor data to cloud...\n")

    # Simulate real-time delay
    time.sleep(0.2)