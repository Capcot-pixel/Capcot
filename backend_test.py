#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Video Editor Application
Tests all backend endpoints according to test_result.md requirements
"""

import requests
import json
import os
import tempfile
import time
from pathlib import Path

# Get backend URL from frontend .env file
def get_backend_url():
    frontend_env_path = "/app/frontend/.env"
    backend_url = None
    
    if os.path.exists(frontend_env_path):
        with open(frontend_env_path, 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    backend_url = line.split('=', 1)[1].strip().strip('"')
                    break
    
    if not backend_url:
        backend_url = "http://localhost:8001"  # fallback
    
    return f"{backend_url}/api"

BASE_URL = get_backend_url()
print(f"Testing backend at: {BASE_URL}")

# Test results tracking
test_results = {
    "passed": 0,
    "failed": 0,
    "errors": []
}

def log_test(test_name, success, details=""):
    """Log test results"""
    if success:
        test_results["passed"] += 1
        print(f"✅ {test_name}")
    else:
        test_results["failed"] += 1
        test_results["errors"].append(f"{test_name}: {details}")
        print(f"❌ {test_name}: {details}")

def test_root_endpoint():
    """Test GET /api/ endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            data = response.json()
            if "message" in data and "version" in data:
                log_test("Root endpoint", True)
                return True
            else:
                log_test("Root endpoint", False, "Missing required fields in response")
                return False
        else:
            log_test("Root endpoint", False, f"Status code: {response.status_code}")
            return False
    except Exception as e:
        log_test("Root endpoint", False, f"Exception: {str(e)}")
        return False

def test_create_project():
    """Test POST /api/projects"""
    try:
        data = {"name": "Test Video Project"}
        response = requests.post(f"{BASE_URL}/projects", data=data)
        
        if response.status_code == 200:
            project_data = response.json()
            if "id" in project_data and "name" in project_data:
                log_test("Create project", True)
                return project_data["id"]
            else:
                log_test("Create project", False, "Missing required fields in response")
                return None
        else:
            log_test("Create project", False, f"Status code: {response.status_code}, Response: {response.text}")
            return None
    except Exception as e:
        log_test("Create project", False, f"Exception: {str(e)}")
        return None

def test_get_projects():
    """Test GET /api/projects"""
    try:
        response = requests.get(f"{BASE_URL}/projects")
        
        if response.status_code == 200:
            projects = response.json()
            if isinstance(projects, list):
                log_test("Get projects", True)
                return True
            else:
                log_test("Get projects", False, "Response is not a list")
                return False
        else:
            log_test("Get projects", False, f"Status code: {response.status_code}")
            return False
    except Exception as e:
        log_test("Get projects", False, f"Exception: {str(e)}")
        return False

def test_get_project(project_id):
    """Test GET /api/projects/{project_id}"""
    if not project_id:
        log_test("Get specific project", False, "No project ID provided")
        return False
        
    try:
        response = requests.get(f"{BASE_URL}/projects/{project_id}")
        
        if response.status_code == 200:
            project = response.json()
            if "id" in project and project["id"] == project_id:
                log_test("Get specific project", True)
                return True
            else:
                log_test("Get specific project", False, "Project ID mismatch")
                return False
        else:
            log_test("Get specific project", False, f"Status code: {response.status_code}")
            return False
    except Exception as e:
        log_test("Get specific project", False, f"Exception: {str(e)}")
        return False

def test_update_project(project_id):
    """Test PUT /api/projects/{project_id}"""
    if not project_id:
        log_test("Update project", False, "No project ID provided")
        return False
        
    try:
        updates = {"name": "Updated Test Project", "total_duration": 120.5}
        response = requests.put(f"{BASE_URL}/projects/{project_id}", json=updates)
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                log_test("Update project", True)
                return True
            else:
                log_test("Update project", False, "Success field not true")
                return False
        else:
            log_test("Update project", False, f"Status code: {response.status_code}")
            return False
    except Exception as e:
        log_test("Update project", False, f"Exception: {str(e)}")
        return False

def test_video_info():
    """Test POST /api/video/info with test video"""
    test_video_path = "/tmp/test_video.mp4"
    
    if not os.path.exists(test_video_path):
        log_test("Video info endpoint", False, "Test video file not found")
        return False
        
    try:
        with open(test_video_path, 'rb') as video_file:
            files = {'file': ('test_video.mp4', video_file, 'video/mp4')}
            response = requests.post(f"{BASE_URL}/video/info", files=files)
        
        if response.status_code == 200:
            info = response.json()
            required_fields = ["duration", "width", "height", "fps", "format", "size"]
            if all(field in info for field in required_fields):
                log_test("Video info endpoint", True)
                return True
            else:
                missing_fields = [field for field in required_fields if field not in info]
                log_test("Video info endpoint", False, f"Missing fields: {missing_fields}")
                return False
        else:
            log_test("Video info endpoint", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("Video info endpoint", False, f"Exception: {str(e)}")
        return False

def test_video_trim():
    """Test POST /api/video/trim"""
    test_video_path = "/tmp/test_video.mp4"
    
    if not os.path.exists(test_video_path):
        log_test("Video trim endpoint", False, "Test video file not found")
        return False
        
    try:
        with open(test_video_path, 'rb') as video_file:
            files = {'file': ('test_video.mp4', video_file, 'video/mp4')}
            data = {'start_time': 0, 'end_time': 5}
            response = requests.post(f"{BASE_URL}/video/trim", files=files, data=data)
        
        if response.status_code == 200:
            # Check if response is a video file
            content_type = response.headers.get('content-type', '')
            if 'video' in content_type or response.headers.get('content-disposition'):
                log_test("Video trim endpoint", True)
                return True
            else:
                log_test("Video trim endpoint", False, f"Unexpected content type: {content_type}")
                return False
        else:
            log_test("Video trim endpoint", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("Video trim endpoint", False, f"Exception: {str(e)}")
        return False

def test_video_filter():
    """Test POST /api/video/filter"""
    test_video_path = "/tmp/test_video.mp4"
    
    if not os.path.exists(test_video_path):
        log_test("Video filter endpoint", False, "Test video file not found")
        return False
        
    try:
        with open(test_video_path, 'rb') as video_file:
            files = {'file': ('test_video.mp4', video_file, 'video/mp4')}
            data = {'filter_type': 'grayscale', 'intensity': 1.0}
            response = requests.post(f"{BASE_URL}/video/filter", files=files, data=data)
        
        if response.status_code == 200:
            # Check if response is a video file
            content_type = response.headers.get('content-type', '')
            if 'video' in content_type or response.headers.get('content-disposition'):
                log_test("Video filter endpoint", True)
                return True
            else:
                log_test("Video filter endpoint", False, f"Unexpected content type: {content_type}")
                return False
        else:
            log_test("Video filter endpoint", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("Video filter endpoint", False, f"Exception: {str(e)}")
        return False

def test_video_merge():
    """Test POST /api/video/merge"""
    test_video_path = "/tmp/test_video.mp4"
    
    if not os.path.exists(test_video_path):
        log_test("Video merge endpoint", False, "Test video file not found")
        return False
        
    try:
        # Use the same video file twice for merge test
        with open(test_video_path, 'rb') as video_file1, open(test_video_path, 'rb') as video_file2:
            files = [
                ('files', ('test_video1.mp4', video_file1, 'video/mp4')),
                ('files', ('test_video2.mp4', video_file2, 'video/mp4'))
            ]
            response = requests.post(f"{BASE_URL}/video/merge", files=files)
        
        if response.status_code == 200:
            # Check if response is a video file
            content_type = response.headers.get('content-type', '')
            if 'video' in content_type or response.headers.get('content-disposition'):
                log_test("Video merge endpoint", True)
                return True
            else:
                log_test("Video merge endpoint", False, f"Unexpected content type: {content_type}")
                return False
        else:
            log_test("Video merge endpoint", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("Video merge endpoint", False, f"Exception: {str(e)}")
        return False

def test_video_export():
    """Test POST /api/video/export"""
    test_video_path = "/tmp/test_video.mp4"
    
    if not os.path.exists(test_video_path):
        log_test("Video export endpoint", False, "Test video file not found")
        return False
        
    try:
        with open(test_video_path, 'rb') as video_file:
            files = {'file': ('test_video.mp4', video_file, 'video/mp4')}
            data = {'resolution': '720p', 'fps': 30, 'quality': 'medium'}
            response = requests.post(f"{BASE_URL}/video/export", files=files, data=data)
        
        if response.status_code == 200:
            # Check if response is a video file
            content_type = response.headers.get('content-type', '')
            if 'video' in content_type or response.headers.get('content-disposition'):
                log_test("Video export endpoint", True)
                return True
            else:
                log_test("Video export endpoint", False, f"Unexpected content type: {content_type}")
                return False
        else:
            log_test("Video export endpoint", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("Video export endpoint", False, f"Exception: {str(e)}")
        return False

def test_error_handling():
    """Test error handling with invalid requests"""
    try:
        # Test invalid project ID
        response = requests.get(f"{BASE_URL}/projects/invalid-id")
        if response.status_code == 404:
            log_test("Error handling - Invalid project ID", True)
        else:
            log_test("Error handling - Invalid project ID", False, f"Expected 404, got {response.status_code}")
        
        # Test missing parameters for video endpoints
        response = requests.post(f"{BASE_URL}/video/trim", data={'start_time': 0})  # Missing end_time
        if response.status_code in [400, 422]:  # Bad request or validation error
            log_test("Error handling - Missing parameters", True)
        else:
            log_test("Error handling - Missing parameters", False, f"Expected 400/422, got {response.status_code}")
            
    except Exception as e:
        log_test("Error handling tests", False, f"Exception: {str(e)}")

def run_all_tests():
    """Run all backend tests"""
    print("=" * 60)
    print("STARTING BACKEND API TESTS")
    print("=" * 60)
    
    # Test basic API functionality
    if not test_root_endpoint():
        print("❌ Root endpoint failed - stopping tests")
        return
    
    # Test project management
    project_id = test_create_project()
    test_get_projects()
    test_get_project(project_id)
    test_update_project(project_id)
    
    # Test video processing endpoints
    test_video_info()
    test_video_trim()
    test_video_filter()
    test_video_merge()
    test_video_export()
    
    # Test error handling
    test_error_handling()
    
    # Print summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"✅ Passed: {test_results['passed']}")
    print(f"❌ Failed: {test_results['failed']}")
    
    if test_results['errors']:
        print("\nFAILED TESTS:")
        for error in test_results['errors']:
            print(f"  - {error}")
    
    print("=" * 60)
    
    return test_results['failed'] == 0

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)