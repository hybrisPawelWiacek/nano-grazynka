#!/usr/bin/env python3
"""
Backend API Test Suite
Tests all API endpoints for nano-Grazynka backend
"""

import requests
import json
import time
import sys
from pathlib import Path

BASE_URL = "http://localhost:3101"
TEST_USER_ID = "test-user-api"

def print_test(test_name, passed, details=""):
    status = "✅ PASSED" if passed else "❌ FAILED"
    print(f"{test_name}: {status}")
    if details:
        print(f"  Details: {details}")
    return passed

def test_health_endpoints():
    """Test health and ready endpoints"""
    print("\n=== Testing Health Endpoints ===")
    
    # Test /health
    try:
        response = requests.get(f"{BASE_URL}/health")
        passed = response.status_code == 200
        data = response.json()
        print_test("GET /health", passed, f"Status: {response.status_code}, Data: {data}")
    except Exception as e:
        print_test("GET /health", False, str(e))
        return False
    
    # Test /ready
    try:
        response = requests.get(f"{BASE_URL}/ready")
        passed = response.status_code == 200
        data = response.json()
        has_checks = 'checks' in data
        print_test("GET /ready", passed and has_checks, f"Status: {response.status_code}, Has checks: {has_checks}")
    except Exception as e:
        print_test("GET /ready", False, str(e))
        return False
    
    return True

def test_list_voice_notes():
    """Test listing voice notes"""
    print("\n=== Testing List Voice Notes ===")
    
    try:
        response = requests.get(f"{BASE_URL}/api/voice-notes", params={"userId": TEST_USER_ID})
        passed = response.status_code == 200
        data = response.json()
        has_array = 'voiceNotes' in data and isinstance(data['voiceNotes'], list)
        print_test("GET /api/voice-notes", passed and has_array, 
                   f"Status: {response.status_code}, Has voiceNotes array: {has_array}")
        return passed and has_array
    except Exception as e:
        print_test("GET /api/voice-notes", False, str(e))
        return False

def test_upload_voice_note():
    """Test uploading a voice note"""
    print("\n=== Testing Upload Voice Note ===")
    
    # Create a small test audio file
    test_file = Path("test_audio_api.m4a")
    test_file.write_bytes(b"fake audio content for API testing")
    
    try:
        with open(test_file, 'rb') as f:
            files = {'file': ('test_audio_api.m4a', f, 'audio/m4a')}
            data = {
                'title': 'API Test Audio',
                'userId': TEST_USER_ID,
                'language': 'en'
            }
            response = requests.post(f"{BASE_URL}/api/voice-notes", files=files, data=data)
        
        passed = response.status_code == 201
        result = response.json()
        has_voice_note = 'voiceNote' in result
        voice_note_id = result.get('voiceNote', {}).get('id') if has_voice_note else None
        
        print_test("POST /api/voice-notes", passed and has_voice_note, 
                   f"Status: {response.status_code}, Has voiceNote: {has_voice_note}, ID: {voice_note_id}")
        
        # Clean up
        test_file.unlink()
        
        return voice_note_id if passed and has_voice_note else None
    except Exception as e:
        print_test("POST /api/voice-notes", False, str(e))
        test_file.unlink(missing_ok=True)
        return None

def test_get_voice_note(voice_note_id):
    """Test getting a single voice note"""
    print("\n=== Testing Get Voice Note ===")
    
    if not voice_note_id:
        print_test("GET /api/voice-notes/:id", False, "No voice note ID available")
        return False
    
    try:
        response = requests.get(f"{BASE_URL}/api/voice-notes/{voice_note_id}")
        passed = response.status_code == 200
        data = response.json()
        has_voice_note = 'voiceNote' in data
        voice_note = data.get('voiceNote', {})
        has_transcription = voice_note.get('transcription') is not None
        has_summary = voice_note.get('summary') is not None
        
        print_test("GET /api/voice-notes/:id", passed and has_voice_note, 
                   f"Status: {response.status_code}, Has voiceNote: {has_voice_note}")
        print_test("  - Has transcription data", has_transcription, 
                   f"Transcription present: {has_transcription}")
        print_test("  - Has summary data", has_summary, 
                   f"Summary present: {has_summary}")
        
        return passed and has_voice_note
    except Exception as e:
        print_test("GET /api/voice-notes/:id", False, str(e))
        return False

def test_process_voice_note(voice_note_id):
    """Test processing a voice note"""
    print("\n=== Testing Process Voice Note ===")
    
    if not voice_note_id:
        print_test("POST /api/voice-notes/:id/process", False, "No voice note ID available")
        return False
    
    try:
        response = requests.post(f"{BASE_URL}/api/voice-notes/{voice_note_id}/process")
        passed = response.status_code == 200
        data = response.json()
        
        print_test("POST /api/voice-notes/:id/process", passed, 
                   f"Status: {response.status_code}, Response: {data.get('message', 'No message')}")
        
        # Wait a bit for processing
        if passed:
            print("  Waiting 3 seconds for processing...")
            time.sleep(3)
            
            # Check status
            status_response = requests.get(f"{BASE_URL}/api/voice-notes/{voice_note_id}")
            if status_response.status_code == 200:
                status_data = status_response.json()
                status = status_data.get('voiceNote', {}).get('status')
                print(f"  Processing status: {status}")
        
        return passed
    except Exception as e:
        print_test("POST /api/voice-notes/:id/process", False, str(e))
        return False

def test_delete_voice_note(voice_note_id):
    """Test deleting a voice note"""
    print("\n=== Testing Delete Voice Note ===")
    
    if not voice_note_id:
        print_test("DELETE /api/voice-notes/:id", False, "No voice note ID available")
        return False
    
    try:
        response = requests.delete(f"{BASE_URL}/api/voice-notes/{voice_note_id}")
        passed = response.status_code == 204
        
        print_test("DELETE /api/voice-notes/:id", passed, 
                   f"Status: {response.status_code}")
        
        # Verify deletion
        if passed:
            verify_response = requests.get(f"{BASE_URL}/api/voice-notes/{voice_note_id}")
            deleted = verify_response.status_code == 404
            print_test("  - Verify deletion", deleted, 
                       f"Get after delete status: {verify_response.status_code}")
        
        return passed
    except Exception as e:
        print_test("DELETE /api/voice-notes/:id", False, str(e))
        return False

def test_invalid_file_upload():
    """Test uploading an invalid file"""
    print("\n=== Testing Invalid File Upload ===")
    
    # Create an invalid file (text file)
    test_file = Path("invalid_file.txt")
    test_file.write_text("This is not an audio file")
    
    try:
        with open(test_file, 'rb') as f:
            files = {'file': ('invalid_file.txt', f, 'text/plain')}
            data = {
                'title': 'Invalid File Test',
                'userId': TEST_USER_ID,
                'language': 'en'
            }
            response = requests.post(f"{BASE_URL}/api/voice-notes", files=files, data=data)
        
        # Should reject with 400
        passed = response.status_code == 400
        
        print_test("POST /api/voice-notes (invalid file)", passed, 
                   f"Status: {response.status_code} (expected 400)")
        
        # Clean up
        test_file.unlink()
        
        return passed
    except Exception as e:
        print_test("POST /api/voice-notes (invalid file)", False, str(e))
        test_file.unlink(missing_ok=True)
        return False

def test_missing_required_fields():
    """Test upload with missing required fields"""
    print("\n=== Testing Missing Required Fields ===")
    
    test_file = Path("test_missing_fields.m4a")
    test_file.write_bytes(b"fake audio content")
    
    try:
        with open(test_file, 'rb') as f:
            files = {'file': ('test_missing_fields.m4a', f, 'audio/m4a')}
            # Missing userId
            data = {
                'title': 'Missing Fields Test',
                'language': 'en'
            }
            response = requests.post(f"{BASE_URL}/api/voice-notes", files=files, data=data)
        
        # Should reject with 400
        passed = response.status_code == 400
        
        print_test("POST /api/voice-notes (missing userId)", passed, 
                   f"Status: {response.status_code} (expected 400)")
        
        # Clean up
        test_file.unlink()
        
        return passed
    except Exception as e:
        print_test("POST /api/voice-notes (missing userId)", False, str(e))
        test_file.unlink(missing_ok=True)
        return False

def main():
    print("=" * 50)
    print("NANO-GRAZYNKA BACKEND API TEST SUITE")
    print("=" * 50)
    
    # Check if backend is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=2)
    except:
        print("❌ ERROR: Backend not responding at http://localhost:3101")
        print("Please ensure Docker containers are running: docker compose up")
        return 1
    
    results = []
    
    # Run tests
    results.append(test_health_endpoints())
    results.append(test_list_voice_notes())
    
    # Upload and test full CRUD cycle
    voice_note_id = test_upload_voice_note()
    if voice_note_id:
        results.append(True)  # Upload succeeded
        results.append(test_get_voice_note(voice_note_id))
        results.append(test_process_voice_note(voice_note_id))
        results.append(test_delete_voice_note(voice_note_id))
    else:
        results.extend([False, False, False, False])  # Skip dependent tests
    
    # Test error cases
    results.append(test_invalid_file_upload())
    results.append(test_missing_required_fields())
    
    # Summary
    print("\n" + "=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    total = len(results)
    passed = sum(results)
    failed = total - passed
    pass_rate = (passed / total * 100) if total > 0 else 0
    
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Pass Rate: {pass_rate:.1f}%")
    
    if pass_rate == 100:
        print("\n✅ ALL TESTS PASSED!")
        return 0
    else:
        print(f"\n⚠️ {failed} TEST(S) FAILED")
        return 1

if __name__ == "__main__":
    sys.exit(main())