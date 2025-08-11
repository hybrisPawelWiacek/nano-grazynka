#!/usr/bin/env python3
import urllib.request
import urllib.parse
import mimetypes
import os
import json
import time
from typing import Dict, Any

def create_multipart_form_data(fields: Dict[str, str], file_path: str) -> tuple:
    """Create multipart/form-data request body"""
    boundary = '----WebKitFormBoundary' + os.urandom(16).hex()
    body = []
    
    # Add regular fields
    for key, value in fields.items():
        body.append(f'--{boundary}'.encode())
        body.append(f'Content-Disposition: form-data; name="{key}"'.encode())
        body.append(b'')
        body.append(value.encode())
    
    # Add file
    filename = os.path.basename(file_path)
    with open(file_path, 'rb') as f:
        file_data = f.read()
    
    body.append(f'--{boundary}'.encode())
    body.append(f'Content-Disposition: form-data; name="file"; filename="{filename}"'.encode())
    body.append(b'Content-Type: audio/m4a')
    body.append(b'')
    body.append(file_data)
    
    body.append(f'--{boundary}--'.encode())
    
    # Join with CRLF
    body_bytes = b'\r\n'.join(body)
    content_type = f'multipart/form-data; boundary={boundary}'
    
    return body_bytes, content_type

def upload_file():
    """Upload zabka.m4a to the backend"""
    file_path = 'zabka.m4a'
    
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found")
        return None
    
    print(f"Uploading {file_path} ({os.path.getsize(file_path)} bytes)...")
    
    fields = {
        'userId': 'test-user',
        'language': 'PL',
        'tags': 'test,zabka'
    }
    
    body, content_type = create_multipart_form_data(fields, file_path)
    
    request = urllib.request.Request(
        'http://localhost:3101/api/voice-notes',
        data=body,
        headers={
            'Content-Type': content_type,
            'Content-Length': str(len(body))
        },
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(request) as response:
            data = json.loads(response.read().decode())
            print(f"✅ Upload successful!")
            print(f"Voice note ID: {data['voiceNote']['id']}")
            print(f"Status: {data['voiceNote']['status']}")
            return data['voiceNote']['id']
    except urllib.error.HTTPError as e:
        print(f"❌ Upload failed with status {e.code}")
        print(e.read().decode())
        return None
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return None

def trigger_processing(voice_note_id: str):
    """Trigger transcription processing"""
    print(f"\nTriggering processing for {voice_note_id}...")
    
    data = json.dumps({'language': 'PL'}).encode()
    request = urllib.request.Request(
        f'http://localhost:3101/api/voice-notes/{voice_note_id}/process',
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(request) as response:
            result = json.loads(response.read().decode())
            print(f"✅ Processing triggered!")
            print(f"Status: {result.get('voiceNote', {}).get('status', 'unknown')}")
            return True
    except Exception as e:
        print(f"❌ Processing error: {e}")
        return False

def check_status(voice_note_id: str):
    """Check transcription status"""
    print(f"\nChecking status for {voice_note_id}...")
    
    url = f'http://localhost:3101/api/voice-notes/{voice_note_id}?includeTranscription=true&includeSummary=true'
    
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            
            print(f"Status: {data.get('status', 'unknown')}")
            
            if 'transcriptions' in data and data['transcriptions']:
                trans = data['transcriptions'][0]
                print("\n=== TRANSCRIPTION ===")
                print(f"Text: {trans.get('text', 'N/A')}")
                print(f"Language: {trans.get('language', 'N/A')}")
                print(f"Duration: {trans.get('duration', 'N/A')} seconds")
            
            if 'summaries' in data and data['summaries']:
                summary = data['summaries'][0]
                print("\n=== SUMMARY ===")
                print(f"Summary: {summary.get('summary', 'N/A')}")
                print(f"Key Points: {summary.get('keyPoints', [])}")
                print(f"Action Items: {summary.get('actionItems', [])}")
            
            return data.get('status') == 'completed'
    except Exception as e:
        print(f"❌ Status check error: {e}")
        return False

if __name__ == '__main__':
    # Upload file
    voice_note_id = upload_file()
    
    if voice_note_id:
        # Trigger processing
        if trigger_processing(voice_note_id):
            # Wait and check status
            print("\nWaiting 10 seconds for processing...")
            time.sleep(10)
            
            # Check status
            if not check_status(voice_note_id):
                # Try again after another wait
                print("\nWaiting another 10 seconds...")
                time.sleep(10)
                check_status(voice_note_id)