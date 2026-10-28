import pytest

def test_doctor_registration_and_login(client):
    # 1. Doctor Registration
    doc_payload = {
        "full_name": "Dr. Gregory House, MD",
        "license_number": "MD-88192-NJ",
        "specialization": "Diagnostic Medicine",
        "hospital_name": "Princeton-Plainsboro Teaching Hospital",
        "email": "house@diagnostics.org",
        "password": "Password123!",
        "confirm_password": "Password123!"
    }
    res = client.post("/api/v1/auth/doctor/register", json=doc_payload)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "doctor"
    assert data["user"]["email"] == "house@diagnostics.org"
    assert data["user"]["is_verified"] is True

    # 2. Duplicate registration should fail
    dup_res = client.post("/api/v1/auth/doctor/register", json=doc_payload)
    assert dup_res.status_code == 400

    # 3. Doctor Login with valid credentials
    login_res = client.post("/api/v1/auth/doctor/login", json={
        "email": "house@diagnostics.org",
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # 4. Doctor Login with invalid password
    bad_login = client.post("/api/v1/auth/doctor/login", json={
        "email": "house@diagnostics.org",
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401

    # 5. Access /auth/me with Bearer token
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "house@diagnostics.org"

def test_patient_registration_and_login(client):
    # 1. Patient Registration (auto-provisions linked medical record)
    patient_payload = {
        "full_name": "Sarah Connor",
        "email": "sarah.connor@resistance.net",
        "phone": "+1-555-0199",
        "date_of_birth": "1965-11-10",
        "password": "Terminator123!",
        "confirm_password": "Terminator123!"
    }
    res = client.post("/api/v1/auth/patient/register", json=patient_payload)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "patient"
    assert data["user"]["patient_id"] is not None

    p_token = data["access_token"]
    p_id = data["user"]["patient_id"]

    # 2. Patient Login with Email
    login_res = client.post("/api/v1/auth/patient/login", json={
        "identifier": "sarah.connor@resistance.net",
        "password": "Terminator123!"
    })
    assert login_res.status_code == 200

    # 3. Patient Login with Phone
    phone_login = client.post("/api/v1/auth/patient/login", json={
        "identifier": "+1-555-0199",
        "password": "Terminator123!"
    })
    assert phone_login.status_code == 200

    # 4. Cross-role login prevention (patient cannot login through doctor endpoint)
    wrong_portal = client.post("/api/v1/auth/doctor/login", json={
        "email": "sarah.connor@resistance.net",
        "password": "Terminator123!"
    })
    assert wrong_portal.status_code == 403

def test_patient_record_isolation(client):
    # Create Patient A
    pa_res = client.post("/api/v1/auth/patient/register", json={
        "full_name": "Patient Alpha",
        "email": "alpha@health.org",
        "date_of_birth": "1980-01-01",
        "password": "AlphaPass123!",
        "confirm_password": "AlphaPass123!"
    }).json()
    token_a = pa_res["access_token"]
    id_a = pa_res["user"]["patient_id"]

    # Create Patient B
    pb_res = client.post("/api/v1/auth/patient/register", json={
        "full_name": "Patient Beta",
        "email": "beta@health.org",
        "date_of_birth": "1990-02-02",
        "password": "BetaPass123!",
        "confirm_password": "BetaPass123!"
    }).json()
    id_b = pb_res["user"]["patient_id"]

    # Patient A attempts to access Patient B's timeline events -> Must receive 403 Forbidden!
    forbidden_res = client.get(
        f"/api/v1/timeline/patient/{id_b}",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert forbidden_res.status_code == 403
    assert "Access denied" in forbidden_res.json()["detail"]

    # Patient A accessing their own timeline -> Authorized (200 OK)
    own_res = client.get(
        f"/api/v1/timeline/patient/{id_a}",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert own_res.status_code == 200

def test_seed_demo_accounts(client):
    res = client.post("/api/v1/auth/seed-demo-accounts")
    assert res.status_code == 200
    info = res.json()
    assert "doctor" in info["demo_accounts"]
    assert "patient" in info["demo_accounts"]

    # Test login with seeded demo doctor
    doc_login = client.post("/api/v1/auth/doctor/login", json={
        "email": "doctor@medicassist.ai",
        "password": "Doctor123!"
    })
    assert doc_login.status_code == 200
    assert doc_login.json()["user"]["role"] == "doctor"

    # Test login with seeded demo patient
    pat_login = client.post("/api/v1/auth/patient/login", json={
        "identifier": "patient@medicassist.ai",
        "password": "Patient123!"
    })
    assert pat_login.status_code == 200
    assert pat_login.json()["user"]["role"] == "patient"
