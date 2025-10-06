import requests
import sys
import json
import io
from datetime import datetime, timedelta

class IndustrialAnalyticsAPITester:
    def __init__(self, base_url="https://factorysight.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.machine_ids = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for file uploads
                    headers.pop('Content-Type', None)
                    response = requests.post(url, files=files, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:200]}"
                
                self.log_test(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic health endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_login(self, email="admin@factory.com", password="admin123"):
        """Test user authentication"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   🔑 Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_user_profile(self):
        """Test getting current user profile"""
        return self.run_test("Get User Profile", "GET", "auth/me", 200)

    def test_dashboard_kpis(self):
        """Test dashboard KPIs endpoint"""
        return self.run_test("Dashboard KPIs", "GET", "dashboard", 200)

    def test_get_machines(self):
        """Test getting machines list"""
        success, response = self.run_test("Get Machines", "GET", "machines", 200)
        if success and isinstance(response, list):
            self.machine_ids = [machine['id'] for machine in response]
            print(f"   📊 Found {len(self.machine_ids)} machines")
        return success

    def test_create_machine(self):
        """Test creating a new machine"""
        machine_data = {
            "name": f"Test Machine {datetime.now().strftime('%H%M%S')}",
            "type": "Robot",
            "site": "Test Factory",
            "status": "operational"
        }
        
        success, response = self.run_test(
            "Create Machine",
            "POST",
            "machines",
            200,
            data=machine_data
        )
        
        if success and 'id' in response:
            self.machine_ids.append(response['id'])
            print(f"   🏭 Created machine with ID: {response['id']}")
        
        return success

    def test_get_machine_details(self):
        """Test getting specific machine details"""
        if not self.machine_ids:
            self.log_test("Get Machine Details", False, "No machines available")
            return False
        
        machine_id = self.machine_ids[0]
        return self.run_test(
            "Get Machine Details",
            "GET",
            f"machines/{machine_id}",
            200
        )

    def test_production_data(self):
        """Test production data endpoints"""
        # Get production data
        success1, _ = self.run_test("Get Production Data", "GET", "production", 200)
        
        # Create production data if we have machines
        success2 = True
        if self.machine_ids:
            production_data = {
                "machine_id": self.machine_ids[0],
                "date": datetime.now().strftime("%Y-%m-%d"),
                "output": 1000.0,
                "downtime": 15.0,
                "efficiency": 85.5,
                "quality_rate": 0.96
            }
            
            success2, _ = self.run_test(
                "Create Production Data",
                "POST",
                "production",
                200,
                data=production_data
            )
        
        return success1 and success2

    def test_csv_upload(self):
        """Test CSV file upload functionality"""
        # Create a test CSV content
        csv_content = """machine_id,date,output,downtime,efficiency,quality_rate
test-machine-001,2024-01-15,1200,15,85.5,0.96
test-machine-002,2024-01-15,980,25,78.2,0.94"""
        
        # Create a file-like object
        csv_file = io.StringIO(csv_content)
        
        files = {
            'file': ('test_data.csv', csv_content, 'text/csv')
        }
        
        return self.run_test(
            "CSV Upload",
            "POST",
            "upload-csv",
            200,
            files=files
        )

    def test_ml_training(self):
        """Test ML model training"""
        return self.run_test("ML Model Training", "POST", "ml/train", 200)

    def test_ml_predictions(self):
        """Test ML predictions"""
        if not self.machine_ids:
            self.log_test("ML Predictions", False, "No machines available")
            return False
        
        machine_id = self.machine_ids[0]
        return self.run_test(
            "ML Predictions",
            "POST",
            f"ml/predict/{machine_id}?days_ahead=7",
            200
        )

    def test_get_predictions(self):
        """Test getting existing predictions"""
        if not self.machine_ids:
            self.log_test("Get Predictions", False, "No machines available")
            return False
        
        machine_id = self.machine_ids[0]
        return self.run_test(
            "Get Predictions",
            "GET",
            f"predictions/{machine_id}",
            200
        )

    def test_analytics_trends(self):
        """Test analytics trends endpoint"""
        return self.run_test("Analytics Trends", "GET", "analytics/trends?days=30", 200)

    def test_maintenance_logs(self):
        """Test maintenance logs endpoints"""
        # Get maintenance logs
        success1, _ = self.run_test("Get Maintenance Logs", "GET", "maintenance", 200)
        
        # Create maintenance log if we have machines
        success2 = True
        if self.machine_ids:
            maintenance_data = {
                "machine_id": self.machine_ids[0],
                "type": "preventive",
                "duration": 2.5,
                "technician": "Test Technician",
                "notes": "Test maintenance log",
                "date": datetime.now().strftime("%Y-%m-%d")
            }
            
            success2, _ = self.run_test(
                "Create Maintenance Log",
                "POST",
                "maintenance",
                200,
                data=maintenance_data
            )
        
        return success1 and success2

    def test_sample_data_initialization(self):
        """Test sample data initialization"""
        return self.run_test("Initialize Sample Data", "POST", "init-sample-data", 200)

    def test_realtime_data_simulation(self):
        """Test real-time data simulation"""
        return self.run_test("Simulate Real-time Data", "POST", "simulate-data", 200)

    def run_all_tests(self):
        """Run comprehensive API test suite"""
        print("🚀 Starting Industrial Analytics Platform API Tests")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)

        # Basic connectivity tests
        print("\n📡 CONNECTIVITY TESTS")
        self.test_health_check()

        # Authentication tests
        print("\n🔐 AUTHENTICATION TESTS")
        if not self.test_login():
            print("❌ Authentication failed - stopping tests")
            return self.generate_report()

        self.test_user_profile()

        # Core functionality tests
        print("\n🏭 MACHINE MANAGEMENT TESTS")
        self.test_get_machines()
        self.test_create_machine()
        self.test_get_machine_details()

        print("\n📊 PRODUCTION DATA TESTS")
        self.test_production_data()

        print("\n📈 DASHBOARD & ANALYTICS TESTS")
        self.test_dashboard_kpis()
        self.test_analytics_trends()

        print("\n📁 DATA IMPORT TESTS")
        self.test_csv_upload()

        print("\n🤖 MACHINE LEARNING TESTS")
        self.test_ml_training()
        self.test_ml_predictions()
        self.test_get_predictions()

        print("\n🔧 MAINTENANCE TESTS")
        self.test_maintenance_logs()

        print("\n🎲 DATA SIMULATION TESTS")
        self.test_sample_data_initialization()
        self.test_realtime_data_simulation()

        return self.generate_report()

    def generate_report(self):
        """Generate final test report"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if self.tests_run - self.tests_passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['details']}")
        
        print("\n✅ PASSED TESTS:")
        for result in self.test_results:
            if result['success']:
                print(f"   • {result['test']}")
        
        return 0 if success_rate >= 80 else 1

def main():
    """Main test execution"""
    tester = IndustrialAnalyticsAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())