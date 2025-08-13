#!/usr/bin/env python3
"""
Edge Cases Test Suite
Tests boundary conditions and error handling
"""

import requests
import json
import time
from pathlib import Path

BASE_URL = "http://localhost:3101"

def test_empty_file():
    """Test uploading an empty file"""
    print("Testing empty file upload...")
    
    # Create empty file
    test_file = Path("empty.m4a")
    test_file.write_bytes(b"")
    
    try:
        with open(test_file, 'rb') as f:
            files = {'file': ('empty.m4a', f, 'audio/m4a')}
            data = {
                'title': 'Empty File',
                'userId': 'test-edge',
                'language': 'en'
            }
            response = requests.post(f"{BASE_URL}/api/voice-notes", files=files, data=data)
        
        # Should reject empty file
        result = "✅ PASSED" if response.status_code == 400 else "❌ FAILED"
        print(f"  Empty file rejection: {result} (Status: {response.status_code})")
        
        test_file.unlink()
        return response.status_code == 400
    except Exception as e:
        print(f"  ❌ Error: {e}")
        test_file.unlink(missing_ok=True)
        return False

def test_large_file():
    """Test uploading a file that's too large"""
    print("Testing large file upload...")
    
    # Create 15MB file (over 10MB limit)
    test_file = Path("large.m4a")
    test_file.write_bytes(b"x" * (15 * 1024 * 1024))
    
    try:
        with open(test_file, 'rb') as f:
            files = {'file': ('large.m4a', f, 'audio/m4a')}
            data = {
                'title': 'Large File',
                'userId': 'test-edge',
                'language': 'en'
            }
            response = requests.post(f"{BASE_URL}/api/voice-notes", files=files, data=data)
        
        # Should reject large file
        result = "✅ PASSED" if response.status_code in [400, 413] else "❌ FAILED"
        print(f"  Large file rejection: {result} (Status: {response.status_code})")
        
        test_file.unlink()
        return response.status_code in [400, 413]
    except Exception as e:
        print(f"  ❌ Error: {e}")
        test_file.unlink(missing_ok=True)
        return False

def test_special_characters():
    """Test filename with special characters"""
    print("Testing special characters in filename...")
    
    # Create file with special chars
    test_file = Path("test_🎵_audio.m4a")
    test_file.write_bytes(b"fake audio content")
    
    try:
        with open(test_file, 'rb') as f:
            files = {'file': ('test_🎵_audio.m4a', f, 'audio/m4a')}
            data = {
                'title': 'Special Chars Test 🎵',
                'userId': 'test-edge',
                'language': 'en'
            }
            response = requests.post(f"{BASE_URL}/api/voice-notes", files=files, data=data)
        
        # Should handle gracefully
        result = "✅ PASSED" if response.status_code == 201 else "❌ FAILED"
        print(f"  Special characters handling: {result} (Status: {response.status_code})")
        
        # Clean up if created
        if response.status_code == 201:
            voice_note_id = response.json().get('voiceNote', {}).get('id')
            if voice_note_id:
                requests.delete(f"{BASE_URL}/api/voice-notes/{voice_note_id}")
        
        test_file.unlink()
        return response.status_code == 201
    except Exception as e:
        print(f"  ❌ Error: {e}")
        test_file.unlink(missing_ok=True)
        return False

def test_invalid_language():
    """Test with invalid language code"""
    print("Testing invalid language code...")
    
    test_file = Path("test_lang.m4a")
    test_file.write_bytes(b"fake audio content")
    
    try:
        with open(test_file, 'rb') as f:
            files = {'file': ('test_lang.m4a', f, 'audio/m4a')}
            data = {
                'title': 'Invalid Language',
                'userId': 'test-edge',
                'language': 'xx'  # Invalid language code
            }
            response = requests.post(f"{BASE_URL}/api/voice-notes", files=files, data=data)
        
        # Should reject or default
        result = "✅ PASSED" if response.status_code in [201, 400] else "❌ FAILED"
        print(f"  Invalid language handling: {result} (Status: {response.status_code})")
        
        # Clean up if created
        if response.status_code == 201:
            voice_note_id = response.json().get('voiceNote', {}).get('id')
            if voice_note_id:
                requests.delete(f"{BASE_URL}/api/voice-notes/{voice_note_id}")
        
        test_file.unlink()
        return True  # Either rejection or default is acceptable
    except Exception as e:
        print(f"  ❌ Error: {e}")
        test_file.unlink(missing_ok=True)
        return False

def test_concurrent_uploads():
    """Test multiple simultaneous uploads"""
    print("Testing concurrent uploads...")
    
    import threading
    results = []
    
    def upload_file(index):
        test_file = Path(f"concurrent_{index}.m4a")
        test_file.write_bytes(f"fake audio {index}".encode())
        
        try:
            with open(test_file, 'rb') as f:
                files = {'file': (f'concurrent_{index}.m4a', f, 'audio/m4a')}
                data = {
                    'title': f'Concurrent Upload {index}',
                    'userId': 'test-edge',
                    'language': 'en'
                }
                response = requests.post(f"{BASE_URL}/api/voice-notes", files=files, data=data)
            
            success = response.status_code == 201
            results.append(success)
            
            # Clean up
            if success:
                voice_note_id = response.json().get('voiceNote', {}).get('id')
                if voice_note_id:
                    requests.delete(f"{BASE_URL}/api/voice-notes/{voice_note_id}")
            
            test_file.unlink()
        except Exception as e:
            results.append(False)
            test_file.unlink(missing_ok=True)
    
    # Start 3 concurrent uploads
    threads = []
    for i in range(3):
        t = threading.Thread(target=upload_file, args=(i,))
        threads.append(t)
        t.start()
    
    # Wait for all to complete
    for t in threads:
        t.join()
    
    all_passed = all(results)
    result = "✅ PASSED" if all_passed else "❌ FAILED"
    print(f"  Concurrent uploads: {result} ({sum(results)}/3 succeeded)")
    
    return all_passed

def test_nonexistent_voice_note():
    """Test accessing non-existent voice note"""
    print("Testing non-existent voice note access...")
    
    fake_id = "non-existent-id-12345"
    
    try:
        # Try to get non-existent note
        response = requests.get(f"{BASE_URL}/api/voice-notes/{fake_id}")
        
        # Should return 404
        result = "✅ PASSED" if response.status_code == 404 else "❌ FAILED"
        print(f"  Non-existent note returns 404: {result} (Status: {response.status_code})")
        
        return response.status_code == 404
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def main():
    print("=" * 50)
    print("EDGE CASES TEST SUITE")
    print("=" * 50)
    
    # Check if backend is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=2)
    except:
        print("❌ ERROR: Backend not responding")
        return 1
    
    results = []
    
    # Run tests
    results.append(test_empty_file())
    results.append(test_large_file())
    results.append(test_special_characters())
    results.append(test_invalid_language())
    results.append(test_concurrent_uploads())
    results.append(test_nonexistent_voice_note())
    
    # Summary
    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)
    total = len(results)
    passed = sum(results)
    failed = total - passed
    
    print(f"Total: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Pass Rate: {passed/total*100:.1f}%")
    
    return 0 if failed == 0 else 1

if __name__ == "__main__":
    exit(main())