#!/usr/bin/env python3
import requests
import json

url = "http://localhost:3101/api/voice-notes"

with open("zabka.m4a", "rb") as f:
    files = {"file": ("zabka.m4a", f, "audio/m4a")}
    data = {
        "title": "Zabka Test Recording",
        "language": "PL",
        "tags": "test,zabka"
    }
    
    try:
        response = requests.post(url, files=files, data=data, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        if hasattr(e.response, 'text'):
            print(f"Response text: {e.response.text}")