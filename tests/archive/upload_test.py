#!/usr/bin/env python3
import requests
import json

# Read the file
with open('./zabka.m4a', 'rb') as f:
    files = {
        'file': ('zabka.m4a', f, 'audio/m4a')
    }
    data = {
        'userId': 'test-user',
        'language': 'PL',
        'tags': 'test,zabka'
    }
    
    print("Uploading zabka.m4a...")
    response = requests.post('http://localhost:3101/api/voice-notes', files=files, data=data)
    
    print(f"Status code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 201:
        voice_note_id = response.json()['voiceNote']['id']
        print(f"\nUpload successful! Voice note ID: {voice_note_id}")
        
        # Trigger processing
        print("\nTriggering transcription processing...")
        process_response = requests.post(
            f'http://localhost:3101/api/voice-notes/{voice_note_id}/process',
            json={'language': 'PL'}
        )
        print(f"Processing status: {process_response.status_code}")
        print(f"Processing response: {json.dumps(process_response.json(), indent=2)}")