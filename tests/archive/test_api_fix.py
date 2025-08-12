#!/usr/bin/env python3
"""Test script to verify API response bug fix"""

import requests
import json
import time

BASE_URL = 'http://localhost:3101'

def test_api_fix():
    print("🚀 Testing API Response Fix\n")
    
    # Step 1: Upload file
    print("Step 1: Uploading test file...")
    with open('./tests/zabka.m4a', 'rb') as f:
        files = {'file': ('zabka.m4a', f, 'audio/m4a')}
        data = {
            'userId': 'test-user',
            'title': 'API Fix Test',
            'language': 'PL',
            'tags': 'test,api-fix'
        }
        
        response = requests.post(f'{BASE_URL}/api/voice-notes', files=files, data=data)
        
    if response.status_code != 201:
        print(f"❌ Upload failed: {response.status_code}")
        print(response.text)
        return False
        
    voice_note = response.json()['voiceNote']
    voice_note_id = voice_note['id']
    print(f"✅ Upload successful! ID: {voice_note_id}")
    print(f"   Status: {voice_note['status']}")
    
    # Step 2: Trigger processing
    print("\nStep 2: Triggering processing...")
    process_response = requests.post(
        f'{BASE_URL}/api/voice-notes/{voice_note_id}/process',
        json={'language': 'PL'}
    )
    
    if process_response.status_code != 200:
        print(f"❌ Processing failed: {process_response.status_code}")
        print(process_response.text)
        return False
        
    print("✅ Processing triggered successfully!")
    process_data = process_response.json()
    
    # Check if transcription and summary are present
    print("\n📋 Checking Response Data:")
    print(f"   - voiceNote present: {'voiceNote' in process_data}")
    print(f"   - transcription present: {'transcription' in process_data}")
    print(f"   - summary present: {'summary' in process_data}")
    
    # Step 3: Wait for processing
    print("\nStep 3: Waiting for processing to complete...")
    for i in range(30):  # Wait up to 30 seconds
        time.sleep(1)
        status_response = requests.get(
            f'{BASE_URL}/api/voice-notes/{voice_note_id}?includeTranscription=true&includeSummary=true'
        )
        
        if status_response.status_code == 200:
            data = status_response.json()
            status = data.get('status', 'unknown')
            
            if status == 'completed':
                print(f"✅ Processing completed!")
                
                # Check the final response
                print("\n🔍 Final Response Check:")
                print(f"   - Status: {data.get('status')}")
                print(f"   - Transcription: {'Present ✅' if data.get('transcription') else 'Missing ❌'}")
                print(f"   - Summary: {'Present ✅' if data.get('summary') else 'Missing ❌'}")
                
                if data.get('transcription'):
                    trans_text = data['transcription'].get('text', '')[:100]
                    print(f"   - Transcription preview: {trans_text}...")
                    
                if data.get('summary'):
                    summary_text = data['summary'].get('summary', '')[:100]
                    print(f"   - Summary preview: {summary_text}...")
                    
                # Check if fix worked
                if data.get('transcription') and data.get('summary'):
                    print("\n🎉 SUCCESS: API Response Bug is FIXED! 🎉")
                    return True
                else:
                    print("\n⚠️  WARNING: Data still missing from response")
                    return False
                    
            elif status == 'failed':
                print(f"❌ Processing failed: {data.get('errorMessage', 'Unknown error')}")
                return False
        
        if i % 5 == 0:
            print(f"   Waiting... ({i+1}/30 seconds)")
    
    print("❌ Timeout waiting for processing")
    return False

if __name__ == '__main__':
    success = test_api_fix()
    exit(0 if success else 1)