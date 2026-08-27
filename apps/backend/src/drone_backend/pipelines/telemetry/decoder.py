def decode_mavlink_or_raw(payload: bytes):
    return payload.decode("utf-8", errors="ignore")
