import csv
import random
from datetime import datetime, timedelta

USERS = [f"USR{i:03d}" for i in range(1, 21)]  # 20 users
LOCATIONS = ['Mumbai, Maharashtra', 'Delhi, Delhi', 'Bengaluru, Karnataka', 'Chennai, Tamil Nadu', 'Kolkata, West Bengal', 'Hyderabad, Telangana', 'Pune, Maharashtra']
HIGH_RISK_LOCATIONS = ['Jamtara, Jharkhand', 'Mewat, Haryana', 'Unknown Location']
DEVICES = ['mobile', 'desktop']
BENEFICIARIES = [f"BEN-{i:04d}" for i in range(1001, 1050)] + [f"BEN-SCAM-{i:04d}" for i in range(7700, 7710)]

USER_BASELINES = {}
for u in USERS:
    USER_BASELINES[u] = {
        'avg_amount': random.randint(1500, 8000),
        'home_location': random.choice(LOCATIONS),
        'primary_device': 'mobile' if random.random() > 0.15 else 'desktop',
        'primary_ip': f"103.21.{random.randint(1, 255)}.{random.randint(1, 255)}"
    }

def generate_dataset(num_rows=5000, output_file="data/transactions.csv"):
    start_time = datetime.now() - timedelta(days=60)
    rows = []

    for i in range(1, num_rows + 1):
        user_id = random.choice(USERS)
        baseline = USER_BASELINES[user_id]
        
        # 12% probability of fraud
        is_fraud = random.random() < 0.12
        
        # Advance timestamp
        timestamp = start_time + timedelta(minutes=random.randint(5, 30) * i // 5)
        
        if not is_fraud:
            # Legitimate pattern
            amount = round(random.uniform(0.3, 2.2) * baseline['avg_amount'], 2)
            location = baseline['home_location'] if random.random() > 0.08 else random.choice(LOCATIONS)
            ip = baseline['primary_ip'] if random.random() > 0.10 else f"103.21.{random.randint(1, 255)}.{random.randint(1, 255)}"
            device = baseline['primary_device']
            beneficiary_id = random.choice(BENEFICIARIES[:40])
            label = 0
        else:
            # Fraudulent pattern (anomalous amount, location change, night time, scam beneficiary)
            amount = round(random.uniform(5.5, 18.0) * baseline['avg_amount'], 2)
            location = random.choice(HIGH_RISK_LOCATIONS + LOCATIONS)
            ip = f"185.220.{random.randint(100, 200)}.{random.randint(1, 255)}"
            device = 'desktop' if baseline['primary_device'] == 'mobile' else 'mobile'
            beneficiary_id = random.choice(BENEFICIARIES[40:])
            label = 1

        txn_id = f"TXN-HIST-{i:05d}"
        rows.append({
            'txn_id': txn_id,
            'user_id': user_id,
            'amount': amount,
            'location': location,
            'ip': ip,
            'device': device,
            'timestamp': timestamp.isoformat(),
            'beneficiary_id': beneficiary_id,
            'is_fraud': label
        })

    # Ensure data directory exists
    import os
    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['txn_id', 'user_id', 'amount', 'location', 'ip', 'device', 'timestamp', 'beneficiary_id', 'is_fraud'])
        writer.writeheader()
        writer.writerows(rows)

    print(f"Dataset generated successfully with {len(rows)} rows: {output_file}")

if __name__ == '__main__':
    generate_dataset()
