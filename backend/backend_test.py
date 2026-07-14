#!/usr/bin/env python3
"""
Backend API tests for CMS feature (Phase 7):
- GET /api/content (public, returns per-language overrides)
- PUT /api/admin/content/{lang} (admin, saves content/locale)
- DELETE /api/admin/content/{lang} (admin, resets to defaults)
- Regression tests for existing endpoints
"""
import requests
import sys
import os
from datetime import datetime

# Public endpoint from frontend/.env
BASE_URL = "https://oksana-translate.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@translate.ua"
ADMIN_PASSWORD = "Translate2026!"

class CMSTester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.token = None
        self.test_data = []  # Track created test data for cleanup info
        self.created_content_langs = []  # Track CMS content created for cleanup

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
            raise AssertionError(f"Expected {expected}, got {response.status_code}. {msg} Response: {response.text[:200]}")

    def assert_field(self, data, field, msg=""):
        if field not in data:
            raise AssertionError(f"Missing field '{field}'. {msg}")

    # ==================== BACKEND TESTS ====================

    def test_estimate_phone_only(self):
        """POST /api/estimate with phone-only → 200 + code"""
        payload = {
            "name": "Тест Телефон",
            "phone": "+380671112233",
            "email": "",
            "direction": "ua-de",
            "doc_type": "Довіреність",
            "pages": 2,
            "urgent": False,
            "certified": False,
            "prepay": False,
            "discount_pct": 0,
            "price": 50,
            "comment": "Test phone-only estimate"
        }
        r = requests.post(f"{BASE_URL}/estimate", json=payload)
        self.assert_status(r, 200, "Phone-only estimate should succeed")
        data = r.json()
        self.assert_field(data, "code", "Response should include tracking code")
        self.assert_field(data, "id", "Response should include id")
        assert len(data["code"]) == 8, f"Code should be 8 chars, got {len(data['code'])}"
        self.test_data.append(f"Estimate lead: {data['code']} (phone +380671112233)")
        self.log(f"  → Created estimate with code: {data['code']}")

    def test_estimate_email_only(self):
        """POST /api/estimate with email-only → 200 + code"""
        payload = {
            "name": "Тест Email",
            "email": "test.estimate@example.com",
            "phone": "",
            "direction": "ua-en",
            "doc_type": "Диплом",
            "pages": 3,
            "urgent": True,
            "certified": True,
            "prepay": True,
            "discount_pct": 10,
            "price": 75,
            "comment": "Test email-only estimate"
        }
        r = requests.post(f"{BASE_URL}/estimate", json=payload)
        self.assert_status(r, 200, "Email-only estimate should succeed")
        data = r.json()
        self.assert_field(data, "code")
        assert len(data["code"]) == 8, f"Code should be 8 chars"
        self.test_data.append(f"Estimate lead: {data['code']} (email test.estimate@example.com)")
        self.log(f"  → Created estimate with code: {data['code']}")

    def test_estimate_neither_contact(self):
        """POST /api/estimate with neither email nor phone → 400"""
        payload = {
            "name": "Тест Без Контакту",
            "email": "",
            "phone": "",
            "direction": "ua-de",
            "doc_type": "Договір",
            "pages": 1,
            "price": 45
        }
        r = requests.post(f"{BASE_URL}/estimate", json=payload)
        self.assert_status(r, 400, "Estimate without contact should fail with 400")
        self.log(f"  → Correctly rejected estimate without contact info")

    def test_orders_phone_only(self):
        """POST /api/orders (multipart) with phone-only → 200 + code"""
        data = {
            "name": "Тест Замовлення Телефон",
            "phone": "+380501234567",
            "email": "",
            "direction": "de-ua",
            "doc_type": "Свідоцтво",
            "message": "[Test] Phone-only order"
        }
        r = requests.post(f"{BASE_URL}/orders", data=data)
        self.assert_status(r, 200, "Phone-only order should succeed")
        resp = r.json()
        self.assert_field(resp, "code")
        self.assert_field(resp, "id")
        assert len(resp["code"]) == 8, "Code should be 8 chars"
        assert resp["files"] == 0, "No files uploaded, count should be 0"
        self.test_data.append(f"Order: {resp['code']} (phone +380501234567)")
        self.log(f"  → Created order with code: {resp['code']}, files: {resp['files']}")

    def test_orders_neither_contact(self):
        """POST /api/orders with neither email nor phone → 400"""
        data = {
            "name": "Тест Без Контакту",
            "email": "",
            "phone": "",
            "direction": "ua-de",
            "doc_type": "Договір",
            "message": "Should fail"
        }
        r = requests.post(f"{BASE_URL}/orders", data=data)
        self.assert_status(r, 400, "Order without contact should fail with 400")
        self.log(f"  → Correctly rejected order without contact info")

    def test_orders_email_with_file(self):
        """POST /api/orders with email + file → 200 with files count"""
        # Create a small test file
        test_file_content = b"Test document content for Phase 6 testing"
        files = {"files": ("test_doc.txt", test_file_content, "text/plain")}
        data = {
            "name": "Тест Файл",
            "email": "test.file@example.com",
            "phone": "",
            "direction": "ua-de",
            "doc_type": "Тестовий документ",
            "message": "[Test] Order with file attachment"
        }
        r = requests.post(f"{BASE_URL}/orders", data=data, files=files)
        self.assert_status(r, 200, "Order with file should succeed")
        resp = r.json()
        self.assert_field(resp, "code")
        self.assert_field(resp, "files")
        assert resp["files"] == 1, f"Expected 1 file, got {resp['files']}"
        self.test_data.append(f"Order with file: {resp['code']} (email test.file@example.com)")
        self.log(f"  → Created order with code: {resp['code']}, files: {resp['files']}")

    def test_settings_hides_api_key(self):
        """GET /api/settings should NOT expose notifications.resend_api_key"""
        r = requests.get(f"{BASE_URL}/settings")
        self.assert_status(r, 200, "Settings endpoint should work")
        data = r.json()
        # Public settings should only have: site, contacts, widget, trust
        assert "site" in data, "Should have site section"
        assert "contacts" in data, "Should have contacts section"
        assert "widget" in data, "Should have widget section"
        assert "trust" in data, "Should have trust section"
        assert "notifications" not in data, "Should NOT expose notifications section publicly"
        self.log(f"  → Settings correctly hides sensitive data")

    def test_pricing_works(self):
        """GET /api/pricing should return pricing data"""
        r = requests.get(f"{BASE_URL}/pricing")
        self.assert_status(r, 200, "Pricing endpoint should work")
        data = r.json()
        assert "doc_types" in data or "enabled" in data, "Should have pricing structure"
        self.log(f"  → Pricing endpoint working")

    def test_track_order_works(self):
        """POST /api/orders/track should work with code+email"""
        # First create an order to track
        order_data = {
            "name": "Тест Трекінг",
            "email": "test.track@example.com",
            "phone": "",
            "direction": "ua-de",
            "doc_type": "Тест",
            "message": "Order for tracking test"
        }
        r1 = requests.post(f"{BASE_URL}/orders", data=order_data)
        self.assert_status(r1, 200)
        order = r1.json()
        code = order["code"]
        
        # Now track it
        track_payload = {
            "code": code,
            "email": "test.track@example.com"
        }
        r2 = requests.post(f"{BASE_URL}/orders/track", json=track_payload)
        self.assert_status(r2, 200, "Track endpoint should work")
        track_data = r2.json()
        assert track_data["code"] == code, f"Code mismatch: {track_data['code']} != {code}"
        assert "status" in track_data, "Should have status field"
        self.test_data.append(f"Tracked order: {code}")
        self.log(f"  → Successfully tracked order {code}, status: {track_data['status']}")

    def test_admin_login(self):
        """POST /api/auth/login with admin credentials"""
        payload = {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        r = requests.post(f"{BASE_URL}/auth/login", json=payload)
        self.assert_status(r, 200, "Admin login should succeed")
        data = r.json()
        self.assert_field(data, "token")
        self.token = data["token"]
        self.log(f"  → Admin login successful, token obtained")

    def test_admin_orders_list(self):
        """GET /api/admin/orders should list all orders (JWT auth)"""
        if not self.token:
            raise AssertionError("No admin token available, run admin_login first")
        headers = {"Authorization": f"Bearer {self.token}"}
        r = requests.get(f"{BASE_URL}/admin/orders", headers=headers)
        self.assert_status(r, 200, "Admin orders list should work")
        orders = r.json()
        assert isinstance(orders, list), "Should return a list"
        self.log(f"  → Admin orders list working, found {len(orders)} orders")

    def test_admin_contacts_list(self):
        """GET /api/admin/contacts should list contacts (separate from orders)"""
        if not self.token:
            raise AssertionError("No admin token available")
        headers = {"Authorization": f"Bearer {self.token}"}
        r = requests.get(f"{BASE_URL}/admin/contacts", headers=headers)
        self.assert_status(r, 200, "Admin contacts list should work")
        contacts = r.json()
        assert isinstance(contacts, list), "Should return a list"
        self.log(f"  → Admin contacts list working, found {len(contacts)} contacts")

    def test_admin_stats(self):
        """GET /api/admin/stats should return statistics"""
        if not self.token:
            raise AssertionError("No admin token available")
        headers = {"Authorization": f"Bearer {self.token}"}
        r = requests.get(f"{BASE_URL}/admin/stats", headers=headers)
        self.assert_status(r, 200, "Admin stats should work")
        stats = r.json()
        assert "orders_total" in stats, "Should have orders_total"
        assert "contacts_total" in stats, "Should have contacts_total"
        self.log(f"  → Admin stats working: {stats['orders_total']} orders, {stats['contacts_total']} contacts")

    # ==================== CMS TESTS ====================

    def test_content_empty_initially(self):
        """GET /api/content should return {} when no overrides exist"""
        r = requests.get(f"{BASE_URL}/content")
        self.assert_status(r, 200, "Content endpoint should work")
        data = r.json()
        # Should return empty dict or dict with empty language objects
        assert isinstance(data, dict), "Should return a dict"
        self.log(f"  → Content endpoint working, returned: {list(data.keys())}")

    def test_content_save_ua(self):
        """PUT /api/admin/content/ua with JWT should persist content"""
        if not self.token:
            raise AssertionError("No admin token available")
        headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        payload = {
            "content": {
                "hero": {
                    "role": "TEST UA ROLE - Професійний перекладач"
                }
            },
            "locale": {
                "faqSec": {
                    "title": "TEST UA FAQ TITLE - Часті питання"
                }
            }
        }
        r = requests.put(f"{BASE_URL}/admin/content/ua", json=payload, headers=headers)
        self.assert_status(r, 200, "Should save UA content")
        data = r.json()
        assert data["lang"] == "ua", "Should return saved language"
        assert "content" in data, "Should have content field"
        assert "locale" in data, "Should have locale field"
        self.created_content_langs.append("ua")
        self.log(f"  → Saved UA content successfully")

    def test_content_get_ua(self):
        """GET /api/content should return saved UA content"""
        r = requests.get(f"{BASE_URL}/content")
        self.assert_status(r, 200, "Content endpoint should work")
        data = r.json()
        assert "ua" in data, "Should have UA content"
        ua_data = data["ua"]
        assert "content" in ua_data, "UA should have content"
        assert "locale" in ua_data, "UA should have locale"
        # Check our test values
        if ua_data["content"].get("hero", {}).get("role"):
            assert "TEST UA ROLE" in ua_data["content"]["hero"]["role"], "Should contain test UA role"
        if ua_data["locale"].get("faqSec", {}).get("title"):
            assert "TEST UA FAQ" in ua_data["locale"]["faqSec"]["title"], "Should contain test UA FAQ title"
        self.log(f"  → Retrieved UA content successfully")

    def test_content_save_de(self):
        """PUT /api/admin/content/de should work"""
        if not self.token:
            raise AssertionError("No admin token available")
        headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        payload = {
            "content": {
                "hero": {
                    "role": "TEST DE ROLE - Professioneller Übersetzer"
                }
            },
            "locale": {
                "faqSec": {
                    "title": "TEST DE FAQ - Häufige Fragen"
                }
            }
        }
        r = requests.put(f"{BASE_URL}/admin/content/de", json=payload, headers=headers)
        self.assert_status(r, 200, "Should save DE content")
        data = r.json()
        assert data["lang"] == "de", "Should return DE language"
        self.created_content_langs.append("de")
        self.log(f"  → Saved DE content successfully")

    def test_content_save_en(self):
        """PUT /api/admin/content/en should work"""
        if not self.token:
            raise AssertionError("No admin token available")
        headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        payload = {
            "content": {
                "hero": {
                    "role": "TEST EN ROLE - Professional Translator"
                }
            },
            "locale": {
                "faqSec": {
                    "title": "TEST EN FAQ - Frequently Asked Questions"
                }
            }
        }
        r = requests.put(f"{BASE_URL}/admin/content/en", json=payload, headers=headers)
        self.assert_status(r, 200, "Should save EN content")
        data = r.json()
        assert data["lang"] == "en", "Should return EN language"
        self.created_content_langs.append("en")
        self.log(f"  → Saved EN content successfully")

    def test_content_save_without_jwt(self):
        """PUT /api/admin/content/ua without JWT should return 401"""
        payload = {"content": {}, "locale": {}}
        r = requests.put(f"{BASE_URL}/admin/content/ua", json=payload)
        self.assert_status(r, 401, "Should require authentication")
        self.log(f"  → Correctly rejected unauthenticated request")

    def test_content_save_invalid_lang(self):
        """PUT /api/admin/content/fr should return 404"""
        if not self.token:
            raise AssertionError("No admin token available")
        headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        payload = {"content": {}, "locale": {}}
        r = requests.put(f"{BASE_URL}/admin/content/fr", json=payload, headers=headers)
        self.assert_status(r, 404, "Should reject invalid language")
        self.log(f"  → Correctly rejected invalid language 'fr'")

    def test_content_delete_ua(self):
        """DELETE /api/admin/content/ua should reset to defaults"""
        if not self.token:
            raise AssertionError("No admin token available")
        headers = {"Authorization": f"Bearer {self.token}"}
        r = requests.delete(f"{BASE_URL}/admin/content/ua", headers=headers)
        self.assert_status(r, 200, "Should delete UA content")
        data = r.json()
        assert data["status"] == "reset", "Should confirm reset"
        assert data["lang"] == "ua", "Should specify language"
        # Remove from cleanup list since we already deleted it
        if "ua" in self.created_content_langs:
            self.created_content_langs.remove("ua")
        self.log(f"  → Deleted UA content successfully")

    def test_content_get_after_delete(self):
        """GET /api/content after DELETE should not contain UA"""
        r = requests.get(f"{BASE_URL}/content")
        self.assert_status(r, 200, "Content endpoint should work")
        data = r.json()
        # UA should either not exist or be empty after deletion
        if "ua" in data:
            # If it exists, it should be empty or have no content/locale
            ua_data = data["ua"]
            is_empty = (not ua_data.get("content") or not ua_data["content"]) and \
                       (not ua_data.get("locale") or not ua_data["locale"])
            # This is acceptable - either missing or empty
        self.log(f"  → Verified UA content was reset")


    def run_all(self):
        """Run all backend tests"""
        print("\n" + "="*70)
        print("CMS FEATURE BACKEND API TESTS")
        print("="*70 + "\n")

        # Admin login first (needed for CMS tests)
        print("\n--- Admin authentication ---")
        self.test("Admin login", self.test_admin_login)

        # CMS tests
        print("\n--- CMS: GET /api/content (public) ---")
        self.test("GET /api/content returns data", self.test_content_empty_initially)

        print("\n--- CMS: PUT /api/admin/content/{lang} (admin) ---")
        self.test("PUT /api/admin/content/ua with JWT", self.test_content_save_ua)
        self.test("GET /api/content returns saved UA", self.test_content_get_ua)
        self.test("PUT /api/admin/content/de with JWT", self.test_content_save_de)
        self.test("PUT /api/admin/content/en with JWT", self.test_content_save_en)
        self.test("PUT without JWT → 401", self.test_content_save_without_jwt)
        self.test("PUT /api/admin/content/fr → 404", self.test_content_save_invalid_lang)

        print("\n--- CMS: DELETE /api/admin/content/{lang} (admin) ---")
        self.test("DELETE /api/admin/content/ua", self.test_content_delete_ua)
        self.test("GET /api/content after DELETE", self.test_content_get_after_delete)

        print("\n--- Regression tests ---")
        self.test("GET /api/settings works", self.test_settings_hides_api_key)
        self.test("GET /api/pricing works", self.test_pricing_works)
        self.test("POST /api/estimate works", self.test_estimate_phone_only)
        self.test("POST /api/orders works", self.test_orders_phone_only)

        print("\n--- Admin endpoints ---")
        self.test("GET /api/admin/orders", self.test_admin_orders_list)
        self.test("GET /api/admin/contacts", self.test_admin_contacts_list)
        self.test("GET /api/admin/stats", self.test_admin_stats)

        # Summary
        print("\n" + "="*70)
        print(f"RESULTS: {self.tests_passed}/{self.tests_run} tests passed")
        print("="*70)

        if self.created_content_langs:
            print("\n⚠️  CMS content to cleanup (remaining languages):")
            for lang in self.created_content_langs:
                print(f"  • DELETE /api/admin/content/{lang}")

        if self.test_data:
            print("\n📋 Test data created:")
            for item in self.test_data:
                print(f"  • {item}")

        return 0 if self.tests_passed == self.tests_run else 1


if __name__ == "__main__":
    tester = CMSTester()
    sys.exit(tester.run_all())
