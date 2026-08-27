# Telemetry Architecture
Serial reader runs on a dedicated background thread monitoring COM ports at 115200 baud, continuously decoding Lat, Lng, HDOP, and Moves Left.
