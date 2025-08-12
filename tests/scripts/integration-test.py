#!/usr/bin/env python3
"""
Integration test for nano-Grazynka pipeline
Tests: Upload → Process → Retrieve → Verify
"""
import requests
import json
import time
import sys

BASE_URL = "http://localhost:3101"

def test_full_pipeline():
    print("🚀 Starting nano-Grazynka Integration Test\n")
    
    # Step 1: Upload file
    print("Step 1: Uploading zabka.m4a...")
    with open('./zabka.m4a', 'rb') as f:
        files = {'file': ('zabka.m4a', f, 'audio/m4a')}
        data = {
            'userId': 'test-user',
            'title': 'Zabka Test',
            'language': 'PL',
            'tags': 'test,integration'
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
    print(f"   Status: {process_data.get('status', 'unknown')}")
    
    # Step 3: Wait and check status
    print("\nStep 3: Waiting for processing to complete...")
    max_attempts = 30
    for i in range(max_attempts):
        time.sleep(2)
        
        status_response = requests.get(
            f'{BASE_URL}/api/voice-notes/{voice_note_id}?includeTranscription=true&includeSummary=true'
        )
        
        if status_response.status_code != 200:
            print(f"❌ Status check failed: {status_response.status_code}")
            continue
            
        note_data = status_response.json()
        status = note_data.get('status', 'unknown')
        
        print(f"   Attempt {i+1}/{max_attempts}: Status = {status}")
        
        if status == 'completed':
            print("\n✅ Processing completed successfully!")
            print(f"Response keys: {list(note_data.keys())}")
            
            # Check transcription
            if 'transcription' in note_data and note_data['transcription']:
                trans = note_data['transcription']
                print(f"\n📝 Transcription:")
                print(f"   Language: {trans.get('language', 'unknown')}")
                print(f"   Word count: {trans.get('wordCount', 0)}")
                print(f"   Content preview: {trans.get('content', '')[:200]}...")
            else:
                print("⚠️  No transcription found")
                
            # Check summary
            if 'summary' in note_data and note_data['summary']:
                summary = note_data['summary']
                print(f"\n📋 Summary:")
                print(f"   Content preview: {summary.get('content', '')[:200]}...")
                if summary.get('keyPoints'):
                    print(f"   Key points: {len(summary['keyPoints'])} found")
                if summary.get('actionItems'):
                    print(f"   Action items: {len(summary['actionItems'])} found")
            else:
                print("⚠️  No summary found")
                
            return True
            
        elif status == 'failed':
            print(f"\n❌ Processing failed!")
            print(f"   Error: {note_data.get('errorMessage', 'Unknown error')}")
            return False
    
    print(f"\n⏱️  Timeout: Processing did not complete within {max_attempts*2} seconds")
    return False

# Step 4: Test list endpoint
def test_list_endpoint():
    print("\n\nStep 4: Testing list endpoint...")
    response = requests.get(f'{BASE_URL}/api/voice-notes')
    
    if response.status_code != 200:
        print(f"❌ List failed: {response.status_code}")
        return False
        
    data = response.json()
    
    # Check for correct response structure
    if 'items' in data:
        print(f"✅ List endpoint works! Found {len(data['items'])} items")
        return True
    elif 'voiceNotes' in data:
        print(f"⚠️  List endpoint uses 'voiceNotes' instead of 'items'")
        print(f"   Found {len(data['voiceNotes'])} notes")
        return True
    else:
        print("❌ Unknown response structure")
        print(json.dumps(data, indent=2))
        return False

if __name__ == "__main__":
    print("="*60)
    print("nano-Grazynka Integration Test Suite")
    print("="*60)
    
    # Run tests
    pipeline_pass = test_full_pipeline()
    list_pass = test_list_endpoint()
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Pipeline Test: {'✅ PASSED' if pipeline_pass else '❌ FAILED'}")
    print(f"List Test: {'✅ PASSED' if list_pass else '❌ FAILED'}")
    
    if pipeline_pass and list_pass:
        print("\n🎉 ALL TESTS PASSED!")
        sys.exit(0)
    else:
        print("\n❌ SOME TESTS FAILED")
        sys.exit(1)