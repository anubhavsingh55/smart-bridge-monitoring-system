import pandas as pd

# =========================
# LOAD DATASET
# =========================

# Replace with your actual CSV filename
file_path = "dataset/bridge_digital_twin_dataset.csv"

df = pd.read_csv(file_path)

print("\n========== ORIGINAL DATASET ==========")
print("Original Shape:", df.shape)

# =========================
# REMOVE DUPLICATES
# =========================

duplicate_count = df.duplicated().sum()

df = df.drop_duplicates()

print(f"\nDuplicates Removed: {duplicate_count}")

# =========================
# REMOVE EMPTY ROWS
# =========================

empty_rows = df.isnull().all(axis=1).sum()

df = df.dropna(how='all')

print(f"Empty Rows Removed: {empty_rows}")

# =========================
# HANDLE MISSING VALUES
# =========================

missing_before = df.isnull().sum().sum()

# Forward fill missing values
df = df.ffill()

missing_after = df.isnull().sum().sum()

print(f"\nMissing Values Before Cleaning: {missing_before}")
print(f"Missing Values After Cleaning: {missing_after}")

# =========================
# CLEAN COLUMN NAMES
# =========================

df.columns = df.columns.str.strip()

# =========================
# TIMESTAMP PROCESSING
# =========================

if 'timestamp' in df.columns:

    df['timestamp'] = pd.to_datetime(
        df['timestamp'],
        errors='coerce'
    )

    invalid_timestamps = df['timestamp'].isnull().sum()

    df = df.dropna(subset=['timestamp'])

    print(f"\nInvalid Timestamps Removed: {invalid_timestamps}")

# =========================
# SAVE CLEANED DATASET
# =========================

output_path = "cleaned dataset/cleaned_bridge_dataset.csv"

df.to_csv(output_path, index=False)

# =========================
# FINAL REPORT
# =========================

print("\n========== CLEANING COMPLETE ==========")

print("Final Shape:", df.shape)

print(f"\nCleaned dataset saved to:\n{output_path}")