#!/usr/bin/env python3
"""
Backend API tests for multi-language pricing + order tracking features:
- GET /api/pricing returns name_de, name_en for doc types and note_de, note_en
- PUT /api/admin/pricing persists multi-language doc type names and notes
- POST /api/estimate works with phone-only
- POST /api/orders/track works with {code, contact} (email OR phone with normalization)
- Track validation: wrong phone → 404, email case-insensitive, back-compat {code, email}, no contact → 400
"""
import requests
import sys
import json
from datetime import datetime

# Public endpoint from frontend/.env
BASE_URL = "https://localization-stage.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@translate.ua"
ADMIN_PASSWORD = "Translate2026!"

class LocalizationTester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.token = None
        self.test_data = []
        self.original_pricing = None  # CRITICAL: save original pricing to restore at end

    def log(self, msg, status="info"):
        prefix = {"pass": "✅", "fail": "❌", "info": "🔍"}.get(status, "ℹ️")
        print(f"{prefix} {msg}")

    def test(self, name, fn):
        """Run a test function and track results"""
        self.tests_run += 1
        self.log(f"Testing {name}...", "info")
        try:
            fn()
            self.tests_passed += 1
            self.log(f"PASSED: {name}", "pass")
            return True
        except AssertionError as e:
            self.log(f"FAILED: {name} - {e}", "fail")
            return False
        except Exception as e:
            self.log(f"ERROR: {name} - {e}", "fail")
            return False

    def assert_status(self, response, expected, msg=""):
        if response.status_code != expected:
            raise AssertionError(f"Expected {expected}, got {response.status_code}. {msg} Response: {response.text[:300]}")

    def assert_field(self, data, field, msg=""):
        if field not in data:
            raise AssertionError(f"Missing field '{field}'. {msg}")

    # ==================== BACKEND TESTS ====================

    def test_admin_login(self):
        """POST /api/auth/login with admin credentials"""
        payload = {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        r = requests.post(f"{BASE_URL}/auth/login", json=payload)
        self.assert_status(r, 200, "Admin login should succeed")
        data = r.json()
        self.assert_field(data, "token")
        self.token = data["token"]
        self.log(f"  → Admin login successful, token obtained")

    def test_pricing_has_multilang_fields(self):
        """GET /api/pricing should return doc_types with name_de, name_en and note_de, note_en"""
        r = requests.get(f"{BASE_URL}/pricing")
        self.assert_status(r, 200, "Pricing endpoint should work")
        data = r.json()
        
        # Save original pricing for restoration at end
        self.original_pricing = data
        self.log(f"  → Saved original pricing for restoration")
        
        self.assert_field(data, "doc_types", "Should have doc_types")
        self.assert_field(data, "note", "Should have note field")
        
        # Check for multi-language note fields
        assert "note_de" in data, "Should have note_de field"
        assert "note_en" in data, "Should have note_en field"
        
        # Check doc_types have multi-language name fields
        if len(data["doc_types"]) > 0:
            dt = data["doc_types"][0]
            assert "name" in dt, "Doc type should have name (UA)"
            assert "name_de" in dt, "Doc type should have name_de"
            assert "name_en" in dt, "Doc type should have name_en"
            self.log(f"  → First doc type: name='{dt['name']}', name_de='{dt.get('name_de', '')}', name_en='{dt.get('name_en', '')}'")
        
        # Check default notes exist
        if data.get("note"):
            self.log(f"  → note (UA): {data['note'][:50]}...")
        if data.get("note_de"):
            self.log(f"  → note_de: {data['note_de'][:50]}...")
        if data.get("note_en"):
            self.log(f"  → note_en: {data['note_en'][:50]}...")

    def test_admin_pricing_update_multilang(self):
        """PUT /api/admin/pricing with multi-language doc type names and notes should persist"""
        if not self.token:
            raise AssertionError("No admin token available")
        if not self.original_pricing:
            raise AssertionError("Original pricing not saved")
        
        headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        
        # Create test pricing with custom multi-language values
        test_pricing = {
            "enabled": True,
            "currency": self.original_pricing.get("currency", "EUR"),
            "doc_types": [
                {
                    "name": "Тест",
                    "name_de": "Test DE",
                    "name_en": "Test EN",
                    "price": 33
                }
            ] + self.original_pricing.get("doc_types", [])[1:],  # Keep other types
            "extra_page_price": self.original_pricing.get("extra_page_price", 15),
            "urgent_pct": self.original_pricing.get("urgent_pct", 30),
            "certified_fee": self.original_pricing.get("certified_fee", 10),
            "note": "TEST NOTE UA - Орієнтовна вартість",
            "note_de": "TEST NOTE DE - Richtwert",
            "note_en": "TEST NOTE EN - Estimated price",
            "pair_multipliers": self.original_pricing.get("pair_multipliers", {}),
            "discounts": self.original_pricing.get("discounts", {})
        }
        
        r = requests.put(f"{BASE_URL}/admin/pricing", json=test_pricing, headers=headers)
        self.assert_status(r, 200, "Should update pricing")
        data = r.json()
        
        # Verify the update persisted
        assert data["doc_types"][0]["name"] == "Тест", "Should persist UA name"
        assert data["doc_types"][0]["name_de"] == "Test DE", "Should persist DE name"
        assert data["doc_types"][0]["name_en"] == "Test EN", "Should persist EN name"
        assert data["doc_types"][0]["price"] == 33, "Should persist price"
        assert "TEST NOTE UA" in data["note"], "Should persist UA note"
        assert "TEST NOTE DE" in data["note_de"], "Should persist DE note"
        assert "TEST NOTE EN" in data["note_en"], "Should persist EN note"
        
        self.log(f"  → Updated pricing with test multi-language values")

    def test_pricing_get_after_update(self):
        """GET /api/pricing should return the updated multi-language values"""
        r = requests.get(f"{BASE_URL}/pricing")
        self.assert_status(r, 200, "Pricing endpoint should work")
        data = r.json()
        
        # Verify test values are present
        assert data["doc_types"][0]["name"] == "Тест", "Should have test UA name"
        assert data["doc_types"][0]["name_de"] == "Test DE", "Should have test DE name"
        assert data["doc_types"][0]["name_en"] == "Test EN", "Should have test EN name"
        assert "TEST NOTE UA" in data["note"], "Should have test UA note"
        assert "TEST NOTE DE" in data["note_de"], "Should have test DE note"
        assert "TEST NOTE EN" in data["note_en"], "Should have test EN note"
        
        self.log(f"  → Verified updated multi-language values persist")

    def test_estimate_with_phone(self):
        """POST /api/estimate with phone (formatted) should return code"""
        payload = {
            "name": "Test Phone User",
            "phone": "+49 171 234-56-78",
            "email": "",
            "direction": "ua-de",
            "doc_type": "Довіреність",
            "pages": 2,
            "urgent": False,
            "certified": False,
            "prepay": False,
            "discount_pct": 0,
            "price": 50
        }
        r = requests.post(f"{BASE_URL}/estimate", json=payload)
        self.assert_status(r, 200, "Phone estimate should succeed")
        data = r.json()
        self.assert_field(data, "code", "Response should include tracking code")
        assert len(data["code"]) == 8, f"Code should be 8 chars, got {len(data['code'])}"
        
        # Store for tracking test
        self.test_phone_code = data["code"]
        self.test_phone = "+49 171 234-56-78"
        self.test_data.append(f"Estimate: {data['code']} (phone {self.test_phone})")
        self.log(f"  → Created estimate with code: {data['code']}, phone: {self.test_phone}")

    def test_track_with_phone_normalized(self):
        """POST /api/orders/track with {code, contact: phone} should work with different formatting"""
        if not hasattr(self, 'test_phone_code'):
            raise AssertionError("No test phone code available")
        
        # Track with differently formatted phone (no spaces, no dashes)
        track_payload = {
            "code": self.test_phone_code,
            "contact": "+491712345678"  # Same number, different formatting
        }
        r = requests.post(f"{BASE_URL}/orders/track", json=track_payload)
        self.assert_status(r, 200, "Track with normalized phone should work")
        data = r.json()
        
        assert data["code"] == self.test_phone_code, "Should return correct code"
        self.assert_field(data, "status", "Should have status")
        self.assert_field(data, "status_history", "Should have status_history")
        
        self.log(f"  → Successfully tracked with normalized phone, status: {data['status']}")

    def test_track_with_wrong_phone(self):
        """POST /api/orders/track with wrong phone should return 404"""
        if not hasattr(self, 'test_phone_code'):
            raise AssertionError("No test phone code available")
        
        track_payload = {
            "code": self.test_phone_code,
            "contact": "+380999999999"  # Wrong phone
        }
        r = requests.post(f"{BASE_URL}/orders/track", json=track_payload)
        self.assert_status(r, 404, "Track with wrong phone should return 404")
        
        self.log(f"  → Correctly returned 404 for wrong phone")

    def test_track_with_email(self):
        """POST /api/orders/track with {code, contact: email} should work case-insensitively"""
        # First create an order with email
        order_data = {
            "name": "Test Email User",
            "email": "Test.Track@Example.com",  # Mixed case
            "phone": "",
            "direction": "ua-de",
            "doc_type": "Тест",
            "message": "Order for email tracking test"
        }
        r1 = requests.post(f"{BASE_URL}/orders", data=order_data)
        self.assert_status(r1, 200)
        order = r1.json()
        code = order["code"]
        self.test_data.append(f"Order: {code} (email Test.Track@Example.com)")
        
        # Track with lowercase email
        track_payload = {
            "code": code,
            "contact": "test.track@example.com"  # Different case
        }
        r2 = requests.post(f"{BASE_URL}/orders/track", json=track_payload)
        self.assert_status(r2, 200, "Track with email should work case-insensitively")
        data = r2.json()
        
        assert data["code"] == code, "Should return correct code"
        self.log(f"  → Successfully tracked with case-insensitive email match")

    def test_track_backcompat_email_field(self):
        """POST /api/orders/track with {code, email} (old format) should still work"""
        # Create another order
        order_data = {
            "name": "Test Backcompat",
            "email": "backcompat@example.com",
            "phone": "",
            "direction": "ua-de",
            "doc_type": "Тест",
            "message": "Order for backcompat test"
        }
        r1 = requests.post(f"{BASE_URL}/orders", data=order_data)
        self.assert_status(r1, 200)
        order = r1.json()
        code = order["code"]
        self.test_data.append(f"Order: {code} (email backcompat@example.com)")
        
        # Track with old {code, email} format
        track_payload = {
            "code": code,
            "email": "backcompat@example.com"  # Old field name
        }
        r2 = requests.post(f"{BASE_URL}/orders/track", json=track_payload)
        self.assert_status(r2, 200, "Track with old email field should work")
        data = r2.json()
        
        assert data["code"] == code, "Should return correct code"
        self.log(f"  → Back-compat {{code, email}} format works")

    def test_track_without_contact(self):
        """POST /api/orders/track without contact/email should return 400"""
        track_payload = {
            "code": "abcd1234"
            # No contact or email field
        }
        r = requests.post(f"{BASE_URL}/orders/track", json=track_payload)
        self.assert_status(r, 400, "Track without contact should return 400")
        
        self.log(f"  → Correctly returned 400 for missing contact")

    def test_restore_original_pricing(self):
        """Restore original pricing to clean up test data"""
        if not self.token:
            raise AssertionError("No admin token available")
        if not self.original_pricing:
            raise AssertionError("Original pricing not saved")
        
        headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        
        r = requests.put(f"{BASE_URL}/admin/pricing", json=self.original_pricing, headers=headers)
        self.assert_status(r, 200, "Should restore original pricing")
        
        # Verify restoration
        r2 = requests.get(f"{BASE_URL}/pricing")
        self.assert_status(r2, 200)
        data = r2.json()
        
        # Check first doc type is back to original
        orig_first = self.original_pricing["doc_types"][0]
        curr_first = data["doc_types"][0]
        assert curr_first["name"] == orig_first["name"], "Should restore original UA name"
        
        self.log(f"  → Restored original pricing successfully")

    def run_all(self):
        """Run all backend tests"""
        print("\n" + "="*70)
        print("MULTI-LANGUAGE PRICING + ORDER TRACKING BACKEND TESTS")
        print("="*70 + "\n")

        # Admin login first
        print("\n--- Admin authentication ---")
        self.test("Admin login", self.test_admin_login)

        # Pricing multi-language tests
        print("\n--- GET /api/pricing multi-language fields ---")
        self.test("GET /api/pricing has name_de, name_en, note_de, note_en", self.test_pricing_has_multilang_fields)

        print("\n--- PUT /api/admin/pricing multi-language persistence ---")
        self.test("PUT /api/admin/pricing with multi-language values", self.test_admin_pricing_update_multilang)
        self.test("GET /api/pricing returns updated multi-language values", self.test_pricing_get_after_update)

        # Order tracking tests
        print("\n--- POST /api/estimate with phone ---")
        self.test("POST /api/estimate with phone returns code", self.test_estimate_with_phone)

        print("\n--- POST /api/orders/track with contact field ---")
        self.test("Track with phone (normalized formatting)", self.test_track_with_phone_normalized)
        self.test("Track with wrong phone → 404", self.test_track_with_wrong_phone)
        self.test("Track with email (case-insensitive)", self.test_track_with_email)
        self.test("Track with old {code, email} format (back-compat)", self.test_track_backcompat_email_field)
        self.test("Track without contact → 400", self.test_track_without_contact)

        # Cleanup
        print("\n--- Cleanup: restore original pricing ---")
        self.test("Restore original pricing", self.test_restore_original_pricing)

        # Summary
        print("\n" + "="*70)
        print(f"RESULTS: {self.tests_passed}/{self.tests_run} tests passed")
        print("="*70)

        if self.test_data:
            print("\n📋 Test data created (orders/estimates - admin can delete from Заявки):")
            for item in self.test_data:
                print(f"  • {item}")

        return 0 if self.tests_passed == self.tests_run else 1


if __name__ == "__main__":
    tester = LocalizationTester()
    sys.exit(tester.run_all())
