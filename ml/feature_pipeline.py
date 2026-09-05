import math
from datetime import datetime

FEATURE_NAMES = [
    "amount",
    "transaction_hour",
    "is_night",
    "amount_ratio_to_user_avg",
    "transactions_last_1h",
    "transactions_last_24h",
    "time_since_previous_txn",
    "location_changed",
    "new_device",
    "new_ip"
]

def parse_iso_time(ts_str):
    try:
        return datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
    except Exception:
        return datetime.now()

def extract_features_for_transaction(txn, user_history):
    """
    Extracts numerical feature vector for a single target transaction based strictly
    on historical transactions that occurred BEFORE the target transaction.
    No future data leakage!
    """
    txn_time = parse_iso_time(txn.get('timestamp', ''))
    user_id = txn.get('user_id', '')
    amount = float(txn.get('amount', 0.0))
    location = txn.get('location', '')
    device = txn.get('device', 'mobile')
    ip = txn.get('ip', '')

    hour = txn_time.hour
    is_night = 1 if (0 <= hour <= 5) else 0

    # Filter past transactions for this user prior to current transaction timestamp
    past_txns = []
    for h in user_history:
        if h.get('user_id') == user_id:
            h_time = parse_iso_time(h.get('timestamp', ''))
            if h_time < txn_time:
                past_txns.append((h_time, h))

    # Sort past transactions chronologically
    past_txns.sort(key=lambda x: x[0])

    if len(past_txns) == 0:
        amount_ratio = 1.0
        txns_1h = 0
        txns_24h = 0
        time_since_prev = 86400.0  # Default 24 hours in seconds
        loc_changed = 0
        new_device = 0
        new_ip = 0
    else:
        # Calculate user average amount
        amounts = [float(item[1].get('amount', 0.0)) for item in past_txns]
        avg_amt = sum(amounts) / len(amounts) if len(amounts) > 0 else amount
        amount_ratio = round(amount / avg_amt, 2) if avg_amt > 0 else 1.0

        # Velocity features
        txns_1h = sum(1 for t, _ in past_txns if (txn_time - t).total_seconds() <= 3600)
        txns_24h = sum(1 for t, _ in past_txns if (txn_time - t).total_seconds() <= 86400)

        # Time since previous transaction
        last_t, last_txn = past_txns[-1]
        time_since_prev = max(0.0, (txn_time - last_t).total_seconds())

        # Baseline location/device/IP consistency
        past_locations = [item[1].get('location') for item in past_txns]
        most_common_loc = max(set(past_locations), key=past_locations.count) if past_locations else location
        loc_changed = 1 if location != most_common_loc else 0

        past_devices = [item[1].get('device') for item in past_txns]
        most_common_dev = max(set(past_devices), key=past_devices.count) if past_devices else device
        new_device = 1 if device != most_common_dev else 0

        past_ips = [item[1].get('ip') for item in past_txns]
        most_common_ip = max(set(past_ips), key=past_ips.count) if past_ips else ip
        new_ip = 1 if ip != most_common_ip else 0

    feature_vector = [
        amount,
        hour,
        is_night,
        amount_ratio,
        txns_1h,
        txns_24h,
        time_since_prev,
        loc_changed,
        new_device,
        new_ip
    ]

    return feature_vector
