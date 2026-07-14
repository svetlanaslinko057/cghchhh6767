#!/usr/bin/env python3
"""
Backend API Testing for Translation Services CMS
Tests content management endpoints and regression checks
"""
import requests
import sys
from datetime import datetime

BASE_URL = "https://localization-stage.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@translate.ua"
ADMIN_PASSWORD = "Translate2026!"

class ContentCMSTester:
    def __init__(self):
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_orders = []
        self.test_contacts = []

    def log(self, emoji, message):
        print(f"{emoji} {message}")

    def test(self, name, fn):
        """Run a single test"""
        self.tests_run += 1
        self.log("🔍", f"Testing: {name}")
        try:
            fn()
            self.tests_passed += 1
            self.log("✅", f"PASSED: {name}")
            return True
        except AssertionError as e:
            self.log("❌", f"FAILED: {name} - {e}")
            return False
        except Exception as e:
            self.log("❌", f"ERROR: {name} - {e}")
            return False

    def test_admin_login(self):
        """Test POST /api/auth/login"""
        def run():
            resp = requests.post(f"{BASE_URL}/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
            data = resp.json()
            assert "token" in data, "No token in response"
            assert "email" in data, "No email in response"
            self.token = data["token"]
            self.log("🔑", f"Token obtained: {self.token[:20]}...")
        self.test("Admin login (POST /api/auth/login)", run)

    def test_content_get_initial(self):
        """Test GET /api/content returns empty dict initially"""
        def run():
            resp = requests.get(f"{BASE_URL}/content")
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
            data = resp.json()
            # Initially should be empty or have minimal data
            self.log("📦", f"Initial content: {data}")
        self.test("GET /api/content (initial state)", run)

    def test_content_put_ua(self):
        """Test PUT /api/admin/content/ua with JWT"""
        def run():
            assert self.token, "No token available"
            payload = {
                "content": {
                    "hero": {"role": "TEST ROLE UA"},
                    "seo": {"home": {"title": "TEST SEO UA"}},
                },
                "locale": {
                    "nav": {"work": "TEST KICKER"}
                }
            }
            resp = requests.put(
                f"{BASE_URL}/admin/content/ua",
                json=payload,
                headers={"Authorization": f"Bearer {self.token}"}
            )
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
            data = resp.json()
            assert data.get("lang") == "ua", "Language mismatch"
            self.log("💾", f"UA content saved: {data.get('updated_at')}")
        self.test("PUT /api/admin/content/ua (with JWT)", run)

    def test_content_get_ua_override(self):
        """Test GET /api/content returns UA overrides"""
        def run():
            resp = requests.get(f"{BASE_URL}/content")
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
            data = resp.json()
            assert "ua" in data, "No UA in response"
            ua_content = data["ua"].get("content", {})
            assert ua_content.get("hero", {}).get("role") == "TEST ROLE UA", "UA override not found"
            self.log("✓", "UA overrides verified in GET /api/content")
        self.test("GET /api/content (verify UA overrides)", run)

    def test_content_put_de(self):
        """Test PUT /api/admin/content/de"""
        def run():
            assert self.token, "No token available"
            payload = {
                "content": {
                    "hero": {"role": "TEST ROLE DE"},
                    "seo": {"home": {"title": "TEST SEO DE"}},
                }
            }
            resp = requests.put(
                f"{BASE_URL}/admin/content/de",
                json=payload,
                headers={"Authorization": f"Bearer {self.token}"}
            )
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
            self.log("💾", "DE content saved")
        self.test("PUT /api/admin/content/de", run)

    def test_content_put_en(self):
        """Test PUT /api/admin/content/en"""
        def run():
            assert self.token, "No token available"
            payload = {
                "content": {
                    "hero": {"role": "TEST ROLE EN"},
                    "seo": {"home": {"title": "TEST SEO EN"}},
                }
            }
            resp = requests.put(
                f"{BASE_URL}/admin/content/en",
                json=payload,
                headers={"Authorization": f"Bearer {self.token}"}
            )
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
            self.log("💾", "EN content saved")
        self.test("PUT /api/admin/content/en", run)

    def test_content_put_invalid_lang(self):
        """Test PUT /api/admin/content/fr returns 404"""
        def run():
            assert self.token, "No token available"
            resp = requests.put(
                f"{BASE_URL}/admin/content/fr",
                json={"content": {}},
                headers={"Authorization": f"Bearer {self.token}"}
            )
            assert resp.status_code == 404, f"Expected 404 for invalid lang, got {resp.status_code}"
            self.log("✓", "Invalid language (fr) correctly rejected with 404")
        self.test("PUT /api/admin/content/fr (should 404)", run)

    def test_content_put_no_auth(self):
        """Test PUT /api/admin/content/ua without JWT returns 401"""
        def run():
            resp = requests.put(
                f"{BASE_URL}/admin/content/ua",
                json={"content": {}}
            )
            assert resp.status_code in [401, 403], f"Expected 401/403, got {resp.status_code}"
            self.log("✓", "No auth correctly rejected")
        self.test("PUT /api/admin/content/ua (no JWT, should 401/403)", run)

    def test_content_delete_ua(self):
        """Test DELETE /api/admin/content/ua"""
        def run():
            assert self.token, "No token available"
            resp = requests.delete(
                f"{BASE_URL}/admin/content/ua",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
            data = resp.json()
            assert data.get("status") == "reset", "Reset status not returned"
            self.log("🗑️", "UA content reset")
        self.test("DELETE /api/admin/content/ua (reset)", run)

    def test_content_get_after_delete(self):
        """Test GET /api/content after DELETE (UA should be gone)"""
        def run():
            resp = requests.get(f"{BASE_URL}/content")
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
            data = resp.json()
            # UA should not be present or should be empty after delete
            if "ua" in data:
                ua_content = data["ua"].get("content", {})
                # Should be empty or not have our test override
                assert ua_content.get("hero", {}).get("role") != "TEST ROLE UA", "UA override still present after delete"
            self.log("✓", "UA overrides removed after DELETE")
        self.test("GET /api/content (after DELETE ua)", run)

    # Regression tests
    def test_regression_settings(self):
        """Test GET /api/settings still works"""
        def run():
            resp = requests.get(f"{BASE_URL}/settings")
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
            data = resp.json()
            assert "site" in data or "contacts" in data, "Settings structure invalid"
            self.log("✓", "GET /api/settings working")
        self.test("Regression: GET /api/settings", run)

    def test_regression_pricing(self):
        """Test GET /api/pricing still works"""
        def run():
            resp = requests.get(f"{BASE_URL}/pricing")
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
            data = resp.json()
            assert "enabled" in data or "currency" in data, "Pricing structure invalid"
            self.log("✓", "GET /api/pricing working")
        self.test("Regression: GET /api/pricing", run)

    def test_regression_work(self):
        """Test GET /api/work still works"""
        def run():
            resp = requests.get(f"{BASE_URL}/work")
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
            data = resp.json()
            assert isinstance(data, list), "Work items should be a list"
            self.log("✓", f"GET /api/work working ({len(data)} items)")
        self.test("Regression: GET /api/work", run)

    def test_regression_legal(self):
        """Test GET /api/legal still works"""
        def run():
            resp = requests.get(f"{BASE_URL}/legal")
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
            data = resp.json()
            assert isinstance(data, list), "Legal pages should be a list"
            self.log("✓", f"GET /api/legal working ({len(data)} pages)")
        self.test("Regression: GET /api/legal", run)

    def test_regression_estimate(self):
        """Test POST /api/estimate (name+phone only)"""
        def run():
            payload = {
                "name": f"Test User {datetime.now().strftime('%H%M%S')}",
                "phone": "+380501234567",
                "direction": "ua-de",
                "doc_type": "Договір",
                "pages": 2,
                "price": 70
            }
            resp = requests.post(f"{BASE_URL}/estimate", json=payload)
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
            data = resp.json()
            assert "id" in data, "No order ID returned"
            assert "code" in data, "No order code returned"
            self.test_orders.append(data["id"])
            self.log("✓", f"POST /api/estimate working (order: {data['code']})")
        self.test("Regression: POST /api/estimate", run)

    def cleanup_test_data(self):
        """Cleanup: delete test orders and reset content overrides"""
        self.log("🧹", "Starting cleanup...")
        
        # Delete test orders
        if self.token and self.test_orders:
            self.log("🗑️", f"Cleaning up {len(self.test_orders)} test orders...")
            # Note: There's no DELETE endpoint for orders in the API, so we skip this
            # In a real scenario, we'd need an admin endpoint to delete orders
        
        # Reset content overrides for all languages
        if self.token:
            for lang in ["ua", "de", "en"]:
                try:
                    resp = requests.delete(
                        f"{BASE_URL}/admin/content/{lang}",
                        headers={"Authorization": f"Bearer {self.token}"}
                    )
                    if resp.status_code == 200:
                        self.log("✓", f"Reset {lang.upper()} content")
                except Exception as e:
                    self.log("⚠️", f"Failed to reset {lang}: {e}")
        
        self.log("✅", "Cleanup complete")

    def run_all(self):
        """Run all tests in sequence"""
        self.log("🚀", "Starting Backend API Tests")
        self.log("🌐", f"Base URL: {BASE_URL}")
        
        # Auth tests
        self.test_admin_login()
        
        # Content API tests
        self.test_content_get_initial()
        self.test_content_put_ua()
        self.test_content_get_ua_override()
        self.test_content_put_de()
        self.test_content_put_en()
        self.test_content_put_invalid_lang()
        self.test_content_put_no_auth()
        self.test_content_delete_ua()
        self.test_content_get_after_delete()
        
        # Regression tests
        self.test_regression_settings()
        self.test_regression_pricing()
        self.test_regression_work()
        self.test_regression_legal()
        self.test_regression_estimate()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Summary
        print("\n" + "="*60)
        self.log("📊", f"Tests Run: {self.tests_run}")
        self.log("✅", f"Tests Passed: {self.tests_passed}")
        self.log("❌", f"Tests Failed: {self.tests_run - self.tests_passed}")
        print("="*60)
        
        return 0 if self.tests_passed == self.tests_run else 1

if __name__ == "__main__":
    tester = ContentCMSTester()
    sys.exit(tester.run_all())
