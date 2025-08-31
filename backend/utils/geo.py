from geopy.distance import great_circle
import hashlib

def calculate_distance_m(point1: tuple, point2: tuple) -> float:
    """Calculates the distance in meters between two (lat, lon) points."""
    return great_circle(point1, point2).meters

def hash_gps(lat: float, lon: float, timestamp: int, pepper: str) -> bytes:
    """
    Creates a geographic hash for auditing without storing exact PII.
    Rounds coordinates and buckets timestamp.
    """
    lat_rounded = round(lat, 3)
    lon_rounded = round(lon, 3)
    time_bucket = timestamp // 60
    
    data_to_hash = f"{lat_rounded}:{lon_rounded}:{time_bucket}:{pepper}"
    
    return hashlib.sha256(data_to_hash.encode()).digest()
