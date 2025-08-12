#!/usr/bin/env python3

import requests
import json
import os
from pathlib import Path

API_URL = "http://localhost:3101"

def test_validation():
    print("🧪 Testing Validation Rules\n")
    
    # Test 1: Upload without userId (should fail with 400)
    print("1️⃣ Testing upload without userId...")
    with open("../backend/zabka.m4a", "rb") as f:
        files = {"audio": ("zabka.m4a", f, "audio/mp4")}
        data = {"language": "pl"}
        response = requests.post(f"{API_URL}/api/voice-notes", files=files, data=data)
    
    if response.status_code == 400:
        print(f"✅ Correctly rejected with 400: {response.json()['message']}")
    else:
        print(f"❌ Expected 400, got {response.status_code}: {response.text}")
    
    # Test 2: Upload with invalid file type (should fail with 400)
    print("\n2️⃣ Testing upload with invalid file type...")
    
    # Create a text file to test
    with open("test.txt", "w") as f:
        f.write("This is not an audio file")
    
    try:
        with open("test.txt", "rb") as f:
            files = {"audio": ("test.txt", f, "text/plain")}
            data = {"userId": "test-user", "language": "en"}
            response = requests.post(f"{API_URL}/api/voice-notes", files=files, data=data)
        
        if response.status_code == 400:
            print(f"✅ Correctly rejected invalid file type with 400: {response.json()['message']}")
        else:
            print(f"❌ Expected 400 for invalid file type, got {response.status_code}: {response.text}")
    finally:
        os.remove("test.txt")
    
    # Test 3: Valid upload (should succeed)
    print("\n3️⃣ Testing valid upload...")
    with open("../backend/zabka.m4a", "rb") as f:
        files = {"audio": ("zabka.m4a", f, "audio/mp4")}
        data = {"userId": "test-validation", "language": "pl"}
        response = requests.post(f"{API_URL}/api/voice-notes", files=files, data=data)
    
    if response.status_code == 201:
        result = response.json()
        voice_note_id = result['voiceNote']['id']
        print(f"✅ Valid upload succeeded with ID: {voice_note_id}")
        return voice_note_id
    else:
        print(f"❌ Valid upload failed with {response.status_code}: {response.text}")
        return None
    
    print("\n✨ Validation tests completed!")

def test_reprocess(voice_note_id):
    if not voice_note_id:
        print("⚠️  Skipping reprocess test - no voice note ID")
        return
    
    print("\n4️⃣ Testing reprocess endpoint...")
    
    # First process the voice note
    response = requests.post(
        f"{API_URL}/api/voice-notes/{voice_note_id}/process",
        json={"language": "pl"}
    )
    
    if response.status_code != 200:
        print(f"❌ Processing failed: {response.text}")
        return
    
    print("✅ Processing completed")
    
    # Wait for processing
    import time
    time.sleep(3)
    
    # Now test reprocess
    response = requests.post(
        f"{API_URL}/api/voice-notes/{voice_note_id}/reprocess",
        json={
            "systemPrompt": "You are a specialized assistant for extracting key business insights.",
            "userPrompt": "Focus on identifying action items and business opportunities.",
            "language": "PL"
        }
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Reprocess succeeded: {json.dumps(result, indent=2)}")
    else:
        print(f"❌ Reprocess failed with {response.status_code}: {response.text}")

def test_export(voice_note_id):
    if not voice_note_id:
        print("⚠️  Skipping export test - no voice note ID")
        return
    
    print("\n5️⃣ Testing export endpoint...")
    
    # Test markdown export
    response = requests.get(f"{API_URL}/api/voice-notes/{voice_note_id}/export?format=markdown")
    
    if response.status_code == 200:
        print(f"✅ Markdown export succeeded")
        print(f"   Content-Type: {response.headers.get('Content-Type')}")
        print(f"   Content length: {len(response.text)} chars")
    else:
        print(f"❌ Export failed with {response.status_code}: {response.text}")
    
    # Test JSON export
    response = requests.get(f"{API_URL}/api/voice-notes/{voice_note_id}/export?format=json")
    
    if response.status_code == 200:
        print(f"✅ JSON export succeeded")
        print(f"   Content-Type: {response.headers.get('Content-Type')}")
    else:
        print(f"❌ JSON export failed with {response.status_code}: {response.text}")

if __name__ == "__main__":
    voice_note_id = test_validation()
    test_reprocess(voice_note_id)
    test_export(voice_note_id)
    print("\n🎉 All tests completed!")