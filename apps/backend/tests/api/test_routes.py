def test_list_ports(client):
    res = client.get("/list-ports")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_gps_endpoint(client):
    res = client.get("/gps")
    assert res.status_code == 200
    data = res.json()
    assert "lat" in data
    assert "lng" in data
