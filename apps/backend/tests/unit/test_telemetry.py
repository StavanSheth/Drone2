from drone_backend.pipelines.cv.detector import calculate_battery_percentage

def test_battery_calculation():
    assert calculate_battery_percentage(25.2) == 100.0
    assert calculate_battery_percentage(18.0) == 0.0
    assert calculate_battery_percentage(21.6) == 50.0
