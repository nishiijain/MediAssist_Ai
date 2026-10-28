import pytest

def test_health_check(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_patient_crud(client):
    # 1. Create Patient
    payload = {
        "name": "Alice Wonderland",
        "date_of_birth": "1975-03-22",
        "gender": "Female",
        "reported_conditions": ["Asthma"],
        "reported_allergies": ["Sulfa"],
        "reported_medications": ["Albuterol inhaler"]
    }
    create_res = client.post("/api/v1/patients", json=payload)
    assert create_res.status_code == 201
    patient_data = create_res.json()
    p_id = patient_data["id"]
    assert patient_data["name"] == "Alice Wonderland"

    # 2. List Patients
    list_res = client.get("/api/v1/patients")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 3. Get Patient
    get_res = client.get(f"/api/v1/patients/{p_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Alice Wonderland"

    # 4. Update Patient
    update_res = client.put(f"/api/v1/patients/{p_id}", json={"phone": "+1-555-9988"})
    assert update_res.status_code == 200
    assert update_res.json()["phone"] == "+1-555-9988"

    # 5. Delete Patient
    del_res = client.delete(f"/api/v1/patients/{p_id}")
    assert del_res.status_code == 204

def test_load_demo_patient_endpoint(client):
    res = client.post("/api/v1/demo/load")
    assert res.status_code == 201
    demo_p = res.json()
    assert "Johnathan Doe" in demo_p["name"]
    assert demo_p["mrn"] == "MED-98402"

    # Verify timeline endpoint returns events
    t_res = client.get(f"/api/v1/timeline/patient/{demo_p['id']}")
    assert t_res.status_code == 200
    assert len(t_res.json()) > 0

    # Verify trends endpoint returns series
    trend_res = client.get(f"/api/v1/timeline/patient/{demo_p['id']}/trends")
    assert trend_res.status_code == 200
    assert len(trend_res.json()) > 0

    # Verify summary endpoint returns 10-section summary
    s_res = client.get(f"/api/v1/summaries/patient/{demo_p['id']}")
    assert s_res.status_code == 200
    summary = s_res.json()
    assert len(summary["summary_content"]["sections"]) == 10

def test_dashboard_stats_endpoint(client):
    res = client.get("/api/v1/stats/dashboard")
    assert res.status_code == 200
    stats = res.json()
    assert "total_patients" in stats
    assert "unresolved_issues_count" in stats
