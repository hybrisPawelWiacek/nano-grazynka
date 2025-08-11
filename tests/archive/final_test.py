#!/usr/bin/env python3
import requests
import json
import time

# Upload the file
print("Uploading zabka.m4a...")
with open('./zabka.m4a', 'rb') as f:
    files = {'file': ('zabka.m4a', f, 'audio/m4a')}
    data = {
        'userId': 'test-user',
        'title': 'Final Pipeline Test',
        'language': 'EN'
    }
    response = requests.post('http://localhost:3101/api/voice-notes', files=files, data=data)
    
if response.status_code == 201:
    voice_note = response.json()['data']
    voice_id = voice_note['id']
    print(f"✅ Uploaded successfully with ID: {voice_id}")
    
    # Trigger processing
    print(f"\nTriggering processing for {voice_id}...")
    process_response = requests.post(f'http://localhost:3101/api/voice-notes/{voice_id}/process')
    
    if process_response.status_code == 200:
        print("✅ Processing triggered successfully")
        
        # Poll for completion
        print("\nPolling for completion...")
        for i in range(30):  # Poll for up to 30 seconds
            time.sleep(1)
            status_response = requests.get(f'http://localhost:3101/api/voice-notes/{voice_id}')
            if status_response.status_code == 200:
                note = status_response.json()
                status = note['status']
                print(f"  Status: {status}")
                
                if status == 'completed':
                    print("\n✅ Processing completed successfully!")
                    print(json.dumps(note, indent=2))
                    break
                elif status == 'failed':
                    print(f"\n❌ Processing failed: {note.get('errorMessage', 'Unknown error')}")
                    break
            else:
                print(f"  Failed to get status: {status_response.status_code}")
        else:
            print("\n⏱️ Timeout waiting for completion")
    else:
        print(f"❌ Failed to trigger processing: {process_response.status_code}")
        print(process_response.text)
else:
    print(f"❌ Upload failed: {response.status_code}")
    print(response.text)