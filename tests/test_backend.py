import sys
import os
from datetime import datetime, date, timedelta
from fastapi.testclient import TestClient

# Append backend directory to sys path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["service"] == "ResQFood API Server"
    assert response.json()["status"] == "active"

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_seed_demo_data():
    response = client.post("/api/seed")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert len(data["demo_accounts"]) >= 4

def test_auth_login_business_and_ngo():
    # Test business login
    biz_login = client.post("/api/auth/login", json={
        "email": "supermarket@greenmart.com",
        "password": "password123"
    })
    assert biz_login.status_code == 200
    biz_token = biz_login.json()["access_token"]
    assert biz_token is not None

    # Test NGO login
    ngo_login = client.post("/api/auth/login", json={
        "email": "contact@hopefoodbank.org",
        "password": "password123"
    })
    assert ngo_login.status_code == 200
    ngo_token = ngo_login.json()["access_token"]
    assert ngo_token is not None

    return biz_token, ngo_token

def test_ai_waste_risk_and_reorder():
    biz_login = client.post("/api/auth/login", json={
        "email": "supermarket@greenmart.com",
        "password": "password123"
    })
    token = biz_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Waste risk
    risk_res = client.get("/api/ai/waste-risk", headers=headers)
    assert risk_res.status_code == 200
    risks = risk_res.json()
    assert isinstance(risks, list)
    assert len(risks) > 0
    # Check that highest risk has required fields
    top = risks[0]
    assert "risk_score" in top
    assert "risk_level" in top
    assert "recommended_action" in top

    # Reorders
    reorder_res = client.get("/api/ai/reorder-recommendations", headers=headers)
    assert reorder_res.status_code == 200
    reorders = reorder_res.json()
    assert isinstance(reorders, list)

def test_donation_lifecycle():
    # 1. Login Business
    b_res = client.post("/api/auth/login", json={"email": "supermarket@greenmart.com", "password": "password123"})
    b_token = b_res.json()["access_token"]
    b_headers = {"Authorization": f"Bearer {b_token}"}

    # 2. Create Donation Listing
    now = datetime.utcnow()
    listing_res = client.post("/api/donations", headers=b_headers, json={
        "title": "Fresh Apples & Pears Crates",
        "description": "50kg of crisp fruit ready for donation",
        "quantity": 50.0,
        "unit": "kg",
        "dietary_tags": "Vegan, Gluten-Free",
        "storage_condition": "ambient",
        "urgency": "high",
        "pickup_address": "45 Market St, Bay 3",
        "pickup_window_start": (now + timedelta(hours=1)).isoformat(),
        "pickup_window_end": (now + timedelta(hours=12)).isoformat(),
        "expiry_date": (date.today() + timedelta(days=2)).isoformat()
    })
    assert listing_res.status_code == 200
    donation = listing_res.json()
    donation_id = donation["id"]
    assert donation["status"] == "available"

    # 3. Login NGO
    n_res = client.post("/api/auth/login", json={"email": "contact@hopefoodbank.org", "password": "password123"})
    n_token = n_res.json()["access_token"]
    n_headers = {"Authorization": f"Bearer {n_token}"}

    # 4. View Live Feed
    feed_res = client.get("/api/donations/live", headers=n_headers)
    assert feed_res.status_code == 200
    feed = feed_res.json()
    assert any(d["id"] == donation_id for d in feed)

    # 5. Claim Donation
    claim_res = client.post(f"/api/donations/{donation_id}/claim", headers=n_headers, json={
        "pickup_time": (now + timedelta(hours=3)).isoformat(),
        "beneficiary_count": 120,
        "driver_name": "Marcus Vance",
        "driver_phone": "+1-555-0987",
        "notes": "Driver arriving in marked van"
    })
    assert claim_res.status_code == 200
    claim = claim_res.json()
    assert claim["status"] == "claimed"
    code = claim["verification_code"]
    assert code.startswith("RQ-")

    # 6. Verify Handover with OTP
    verify_res = client.post(f"/api/donations/{donation_id}/verify-pickup", headers=b_headers, json={
        "verification_code": code
    })
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["status"] == "success"
    assert v_data["impact"]["meals_served"] > 0
    assert v_data["impact"]["co2_diverted_kg"] > 0

    # 7. Check Impact Analytics
    impact_res = client.get("/api/analytics/impact", headers=b_headers)
    assert impact_res.status_code == 200
    impact = impact_res.json()
    assert impact["total_food_rescued_kg"] > 0
    assert impact["total_meals_served"] > 0
