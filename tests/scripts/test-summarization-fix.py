#!/usr/bin/env python3
"""
Test script for summarization fix
Tests that summarization now works correctly after fixing the prompt issue
"""
import requests
import json
import time
import sys
import uuid

BASE_URL = "http://localhost:3101"

def test_summarization():
    print("🚀 Testing Summarization Fix\n")
    
    # Generate unique session ID
    session_id = f"test-session-{uuid.uuid4().hex[:8]}"
    print(f"Using session ID: {session_id}")
    
    # Step 1: Upload file with session header
    print("\n📤 Step 1: Uploading zabka.m4a...")
    with open('./zabka.m4a', 'rb') as f:
        files = {'audio': ('zabka.m4a', f, 'audio/m4a')}
        data = {
            'language': 'PL',
            'whisperPrompt': 'Polish language voice note'
        }
        headers = {'x-session-id': session_id}
        
        response = requests.post(
            f'{BASE_URL}/api/voice-notes', 
            files=files, 
            data=data,
            headers=headers
        )
        
    if response.status_code != 201:
        print(f"❌ Upload failed: {response.status_code}")
        print(f"Response: {response.text}")
        return False
        
    result = response.json()
    voice_note_id = result.get('voiceNote', {}).get('id')
    print(f"✅ Upload successful! ID: {voice_note_id}")
    
    # Step 2: Trigger processing
    print("\n⚙️  Step 2: Triggering processing...")
    response = requests.post(
        f'{BASE_URL}/api/voice-notes/{voice_note_id}/process',
        headers={'Content-Type': 'application/json', 'x-session-id': session_id},
        json={'language': 'PL'}
    )
    
    if response.status_code != 200:
        print(f"❌ Processing failed: {response.status_code}")
        print(f"Response: {response.text}")
        return False
        
    print("✅ Processing triggered successfully!")
    
    # Step 3: Wait for completion and check result
    print("\n⏳ Step 3: Waiting for processing to complete...")
    max_attempts = 30
    for i in range(max_attempts):
        time.sleep(2)
        
        response = requests.get(
            f'{BASE_URL}/api/voice-notes/{voice_note_id}',
            headers={'x-session-id': session_id},
            params={'includeTranscription': 'true', 'includeSummary': 'true'}
        )
        
        if response.status_code == 200:
            data = response.json()
            voice_note = data.get('voiceNote', {})
            status = voice_note.get('status')
            
            print(f"   Status: {status}")
            
            if status == 'completed':
                print("\n✅ Processing completed successfully!")
                
                # Check for transcription
                transcription = voice_note.get('transcriptions', [None])[0]
                if transcription:
                    text = transcription.get('text', '')[:100]
                    print(f"\n📝 Transcription found:")
                    print(f"   {text}...")
                else:
                    print("⚠️  No transcription found")
                
                # Check for summary (THIS IS THE KEY TEST)
                summary = voice_note.get('summaries', [None])[0]
                if summary:
                    summary_text = summary.get('summary', '')[:100]
                    key_points = summary.get('keyPoints', [])
                    print(f"\n✨ Summary found:")
                    print(f"   {summary_text}...")
                    print(f"   Key points: {len(key_points)} items")
                    
                    print("\n🎉 SUMMARIZATION IS WORKING!")
                    return True
                else:
                    print("\n❌ No summary found - summarization still failing")
                    return False
                    
            elif status == 'failed':
                print(f"\n❌ Processing failed: {voice_note.get('errorMessage')}")
                return False
                
    print("\n⏱️  Processing timeout after 60 seconds")
    return False

if __name__ == "__main__":
    try:
        success = test_summarization()
        if success:
            print("\n✅ ALL TESTS PASSED! Summarization fix is working!")
            sys.exit(0)
        else:
            print("\n❌ Test failed - summarization issue persists")
            sys.exit(1)
    except Exception as e:
        print(f"\n💥 Error: {str(e)}")
        sys.exit(1)