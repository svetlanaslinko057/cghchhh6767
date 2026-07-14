#!/usr/bin/env python3
"""
Backend API tests for UA-DE Translation Service
Tests all endpoints: health, orders, contacts, auth, admin
"""
import requests
import sys
import io
from datetime import datetime

BASE_URL = "https://oksana-translate.preview.emergentagent.com/api"

class APITester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.token = None
        self.test_order_id = None
        self.test_file_path = None

    def log(self, emoji, message):
        print(f"{emoji} {message}")

    def test(self, name, method, endpoint, expected_status, **kwargs):
        """Run a single API test"""
        url = f"{BASE_URL}{endpoint}"
        self.tests_run += 1
        
        headers = kwargs.pop('headers', {})
        if self.token and 'Authorization' not in headers:
            headers['Authorization'] = f'Bearer {self.token}'
        
        self.log("🔍", f"Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30, **kwargs)
            elif method == 'POST':
                response = requests.post(url, headers=headers, timeout=30, **kwargs)
            elif method == 'PATCH':
                response = requests.patch(url, headers=headers, timeout=30, **kwargs)
            elif method == 'PUT':
                response = requests.put(url, headers=headers, timeout=30, **kwargs)
            
            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.log("✅", f"PASS - {name} (status: {response.status_code})")
                try:
                    return True, response.json()
                except:
                    return True, response.content
            else:
                self.log("❌", f"FAIL - {name} (expected {expected_status}, got {response.status_code})")
                try:
                    self.log("📄", f"Response: {response.text[:200]}")
                except:
                    pass
                return False, {}
        
        except Exception as e:
            self.log("❌", f"FAIL - {name} (error: {str(e)})")
            return False, {}

    def run_all_tests(self):
        """Run all backend tests"""
        self.log("🚀", "Starting Backend API Tests")
        self.log("🌐", f"Base URL: {BASE_URL}")
        print("=" * 60)
        
        # 1. Health check
        self.log("📋", "TEST GROUP: Health Check")
        self.test("GET /api/ health", "GET", "/", 200)
        print()
        
        # 2. Orders endpoint - valid submission
        self.log("📋", "TEST GROUP: Orders API")
        
        # Create a test file
        test_file = io.BytesIO(b"Test document content for translation")
        test_file.name = "test_document.pdf"
        
        form_data = {
            'name': 'Test User',
            'email': 'test@example.com',
            'phone': '+380123456789',
            'direction': 'ua-de',
            'doc_type': 'legal',
            'message': 'Test order message'
        }
        
        files = {'files': ('test_document.pdf', test_file, 'application/pdf')}
        
        success, response = self.test(
            "POST /api/orders (valid with file)",
            "POST",
            "/orders",
            200,
            data=form_data,
            files=files
        )
        
        if success and 'id' in response:
            self.test_order_id = response['id']
            file_count = response.get('files', 0)
            if file_count > 0:
                self.log("✅", f"Order created with ID: {self.test_order_id}, files: {file_count}")
            else:
                self.log("⚠️", f"Order created but file count is: {file_count}")
        print()
        
        # 3. Orders validation - missing name
        self.log("📋", "TEST GROUP: Orders Validation")
        self.test(
            "POST /api/orders (missing name)",
            "POST",
            "/orders",
            400,
            data={'email': 'test@example.com'}
        )
        
        # Orders validation - missing email
        self.test(
            "POST /api/orders (missing email)",
            "POST",
            "/orders",
            400,
            data={'name': 'Test User'}
        )
        
        # Orders validation - disallowed file extension
        bad_file = io.BytesIO(b"malicious content")
        bad_file.name = "virus.exe"
        
        self.test(
            "POST /api/orders (disallowed .exe file)",
            "POST",
            "/orders",
            400,
            data={'name': 'Test', 'email': 'test@example.com'},
            files={'files': ('virus.exe', bad_file, 'application/octet-stream')}
        )
        print()
        
        # 4. Contact endpoint
        self.log("📋", "TEST GROUP: Contact API")
        success, response = self.test(
            "POST /api/contact",
            "POST",
            "/contact",
            200,
            json={'name': 'Contact Test', 'email': 'contact@example.com', 'message': 'Test message'},
            headers={'Content-Type': 'application/json'}
        )
        
        if success and 'id' in response and 'status' in response:
            self.log("✅", f"Contact created with ID: {response['id']}, status: {response['status']}")
        print()
        
        # 5. Auth - login with correct credentials
        self.log("📋", "TEST GROUP: Authentication")
        success, response = self.test(
            "POST /api/auth/login (valid credentials)",
            "POST",
            "/auth/login",
            200,
            json={'email': 'admin@translate.ua', 'password': 'Translate2026!'},
            headers={'Content-Type': 'application/json'}
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.log("✅", f"Login successful, token received (length: {len(self.token)})")
        else:
            self.log("❌", "Login failed - no token received")
        
        # Auth - login with wrong credentials
        self.test(
            "POST /api/auth/login (wrong credentials)",
            "POST",
            "/auth/login",
            401,
            json={'email': 'admin@translate.ua', 'password': 'WrongPassword'},
            headers={'Content-Type': 'application/json'}
        )
        print()
        
        # 6. Admin endpoints - without token
        self.log("📋", "TEST GROUP: Admin API (Authorization)")
        
        # Temporarily remove token to test 401
        temp_token = self.token
        self.token = None
        
        self.test(
            "GET /api/admin/orders (no token)",
            "GET",
            "/admin/orders",
            401
        )
        
        self.test(
            "GET /api/admin/contacts (no token)",
            "GET",
            "/admin/contacts",
            401
        )
        
        # Restore token
        self.token = temp_token
        print()
        
        # 7. Admin endpoints - with token
        self.log("📋", "TEST GROUP: Admin API (Authorized)")
        
        success, orders = self.test(
            "GET /api/admin/orders (with token)",
            "GET",
            "/admin/orders",
            200
        )
        
        if success and isinstance(orders, list):
            self.log("✅", f"Retrieved {len(orders)} orders")
            # Try to find a file path from orders
            if len(orders) > 0:
                for order in orders:
                    if order.get('files') and len(order['files']) > 0:
                        self.test_file_path = order['files'][0].get('storage_path')
                        self.log("📁", f"Found file path for download test: {self.test_file_path}")
                        break
        
        success, contacts = self.test(
            "GET /api/admin/contacts (with token)",
            "GET",
            "/admin/contacts",
            200
        )
        
        if success and isinstance(contacts, list):
            self.log("✅", f"Retrieved {len(contacts)} contacts")
        print()
        
        # 8. File download
        if self.test_file_path:
            self.log("📋", "TEST GROUP: File Download")
            success, file_data = self.test(
                "GET /api/admin/files/{path}?auth=TOKEN",
                "GET",
                f"/admin/files/{self.test_file_path}?auth={self.token}",
                200
            )
            
            if success and file_data:
                self.log("✅", f"File downloaded successfully (size: {len(file_data)} bytes)")
        else:
            self.log("⚠️", "Skipping file download test - no file path available")
        
        print()
        
        # 9. NEW FEATURE: Legal Pages API
        self.log("📋", "TEST GROUP: Legal Pages API (NEW FEATURE)")
        
        # Test GET /api/legal - list all legal docs
        success, legal_list = self.test(
            "GET /api/legal (list all docs)",
            "GET",
            "/legal",
            200
        )
        
        if success and isinstance(legal_list, list):
            self.log("✅", f"Retrieved {len(legal_list)} legal documents")
            if len(legal_list) == 3:
                self.log("✅", "Correct number of legal docs (3)")
                # Check structure including NEW EN fields
                for doc in legal_list:
                    required_fields = ['slug', 'title_ua', 'title_de', 'title_en', 'content_ua', 'content_de', 'content_en', 'updated_at']
                    if all(k in doc for k in required_fields):
                        self.log("✅", f"Legal doc '{doc['slug']}' has correct structure with EN fields")
                        # Check EN content is not empty
                        if doc.get('title_en') and doc.get('content_en'):
                            self.log("✅", f"Legal doc '{doc['slug']}' has non-empty EN content")
                        else:
                            self.log("❌", f"Legal doc '{doc['slug']}' has empty EN fields")
                    else:
                        missing = [f for f in required_fields if f not in doc]
                        self.log("❌", f"Legal doc '{doc.get('slug', 'unknown')}' missing fields: {missing}")
            else:
                self.log("❌", f"Expected 3 legal docs, got {len(legal_list)}")
        
        # Test GET /api/legal/terms
        success, terms_doc = self.test(
            "GET /api/legal/terms",
            "GET",
            "/legal/terms",
            200
        )
        
        if success and 'slug' in terms_doc:
            self.log("✅", f"Terms doc retrieved: {terms_doc.get('title_ua', 'N/A')}")
            # Check EN fields specifically
            if terms_doc.get('title_en') == 'Terms of Use':
                self.log("✅", "Terms doc has correct EN title: 'Terms of Use'")
            else:
                self.log("❌", f"Terms doc EN title incorrect: '{terms_doc.get('title_en', 'N/A')}'")
            
            if terms_doc.get('content_en') and len(terms_doc.get('content_en', '')) > 100:
                self.log("✅", f"Terms doc has non-empty EN content ({len(terms_doc.get('content_en', ''))} chars)")
            else:
                self.log("❌", "Terms doc EN content is empty or too short")
        
        # Test GET /api/legal/privacy
        success, privacy_doc = self.test(
            "GET /api/legal/privacy",
            "GET",
            "/legal/privacy",
            200
        )
        
        if success and 'slug' in privacy_doc:
            self.log("✅", f"Privacy doc retrieved: {privacy_doc.get('title_ua', 'N/A')}")
        
        # Test GET /api/legal/cookies
        success, cookies_doc = self.test(
            "GET /api/legal/cookies",
            "GET",
            "/legal/cookies",
            200
        )
        
        if success and 'slug' in cookies_doc:
            self.log("✅", f"Cookies doc retrieved: {cookies_doc.get('title_ua', 'N/A')}")
        
        # Test GET /api/legal/unknown - should return 404
        self.test(
            "GET /api/legal/unknown (404)",
            "GET",
            "/legal/unknown",
            404
        )
        
        # Test PUT /api/admin/legal/terms without token - should return 401
        temp_token = self.token
        self.token = None
        
        self.test(
            "PUT /api/admin/legal/terms (no token)",
            "PUT",
            "/admin/legal/terms",
            401,
            json={'title_ua': 'Test', 'title_de': 'Test', 'title_en': 'Test', 'content_ua': 'Test', 'content_de': 'Test', 'content_en': 'Test'},
            headers={'Content-Type': 'application/json'}
        )
        
        self.token = temp_token
        
        # Test PUT /api/admin/legal/terms with token - should update including EN fields
        if self.token and terms_doc:
            # Append a test marker to content
            test_marker = f"\n\n## TEST MARKER {datetime.now().isoformat()}"
            updated_content_ua = terms_doc.get('content_ua', '') + test_marker
            updated_content_en = terms_doc.get('content_en', '') + test_marker
            
            success, updated_doc = self.test(
                "PUT /api/admin/legal/terms (with token, including EN)",
                "PUT",
                "/admin/legal/terms",
                200,
                json={
                    'title_ua': terms_doc.get('title_ua', ''),
                    'title_de': terms_doc.get('title_de', ''),
                    'title_en': terms_doc.get('title_en', ''),
                    'content_ua': updated_content_ua,
                    'content_de': terms_doc.get('content_de', ''),
                    'content_en': updated_content_en
                },
                headers={'Content-Type': 'application/json'}
            )
            
            if success and 'updated_at' in updated_doc:
                self.log("✅", f"Legal doc updated successfully at {updated_doc['updated_at']}")
                # Verify EN fields were persisted
                if updated_doc.get('content_en') and test_marker in updated_doc.get('content_en', ''):
                    self.log("✅", "EN content was persisted correctly")
                else:
                    self.log("❌", "EN content was NOT persisted correctly")
                
                # Restore original content
                self.test(
                    "PUT /api/admin/legal/terms (restore original)",
                    "PUT",
                    "/admin/legal/terms",
                    200,
                    json={
                        'title_ua': terms_doc.get('title_ua', ''),
                        'title_de': terms_doc.get('title_de', ''),
                        'title_en': terms_doc.get('title_en', ''),
                        'content_ua': terms_doc.get('content_ua', ''),
                        'content_de': terms_doc.get('content_de', ''),
                        'content_en': terms_doc.get('content_en', '')
                    },
                    headers={'Content-Type': 'application/json'}
                )
                self.log("✅", "Original content restored")
        
        print()
        
        # 10. REGRESSION: Public endpoints
        self.log("📋", "TEST GROUP: Regression - Public Endpoints")
        
        # Test GET /api/settings
        success, settings = self.test(
            "GET /api/settings",
            "GET",
            "/settings",
            200
        )
        
        if success and isinstance(settings, dict):
            self.log("✅", f"Settings retrieved with sections: {list(settings.keys())}")
        
        # Test GET /api/pricing
        success, pricing = self.test(
            "GET /api/pricing",
            "GET",
            "/pricing",
            200
        )
        
        if success and isinstance(pricing, dict):
            self.log("✅", f"Pricing retrieved, enabled: {pricing.get('enabled', False)}")
        
        # Test POST /api/estimate
        success, estimate = self.test(
            "POST /api/estimate",
            "POST",
            "/estimate",
            200,
            json={
                'name': 'Test Estimate',
                'email': 'estimate@test.com',
                'phone': '+380123456789',
                'direction': 'ua-de',
                'doc_type': 'Договір',
                'pages': 3,
                'urgent': False,
                'certified': False,
                'prepay': False,
                'discount_pct': 0,
                'price': 100,
                'comment': 'Test estimate'
            },
            headers={'Content-Type': 'application/json'}
        )
        
        if success and 'code' in estimate:
            self.log("✅", f"Estimate created with code: {estimate['code']}")
        
        print()
        print("=" * 60)
        self.log("📊", f"RESULTS: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            self.log("🎉", "All tests passed!")
            return 0
        else:
            self.log("⚠️", f"{self.tests_run - self.tests_passed} test(s) failed")
            return 1

def main():
    tester = APITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())
