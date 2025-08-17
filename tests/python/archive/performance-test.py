#!/usr/bin/env python3
"""
Performance test for nano-Grazynka pipeline
Tests: Processing time, throughput, and resource usage
"""
import requests
import time
import statistics
import json

BASE_URL = "http://localhost:3101"

def measure_processing_time():
    """Measure time taken for complete processing pipeline"""
    print("📊 Performance Test: Processing Time\n")
    
    # Upload file
    with open('./zabka.m4a', 'rb') as f:
        files = {'file': ('zabka.m4a', f, 'audio/m4a')}
        data = {
            'userId': 'perf-test',
            'title': 'Performance Test',
            'language': 'PL',
            'tags': 'performance'
        }
        
        upload_start = time.time()
        response = requests.post(f'{BASE_URL}/api/voice-notes', files=files, data=data)
        upload_time = time.time() - upload_start
        
    if response.status_code != 201:
        print(f"❌ Upload failed: {response.status_code}")
        return None
        
    voice_note = response.json()['voiceNote']
    voice_note_id = voice_note['id']
    print(f"Upload time: {upload_time:.2f}s")
    
    # Trigger processing
    process_start = time.time()
    process_response = requests.post(
        f'{BASE_URL}/api/voice-notes/{voice_note_id}/process',
        json={'language': 'PL'}
    )
    
    if process_response.status_code != 200:
        print(f"❌ Processing failed: {process_response.status_code}")
        return None
    
    # Poll for completion
    max_attempts = 60  # 2 minutes max
    for i in range(max_attempts):
        time.sleep(2)
        
        status_response = requests.get(
            f'{BASE_URL}/api/voice-notes/{voice_note_id}?includeTranscription=true&includeSummary=true'
        )
        
        if status_response.status_code == 200:
            note_data = status_response.json()
            if note_data.get('status') == 'completed':
                process_time = time.time() - process_start
                print(f"Processing time: {process_time:.2f}s")
                
                # Breakdown
                if 'transcription' in note_data:
                    print(f"  - Transcription word count: {note_data['transcription'].get('wordCount', 0)}")
                if 'summary' in note_data:
                    summary = note_data['summary']
                    print(f"  - Summary generated: Yes")
                    if summary.get('keyPoints'):
                        print(f"  - Key points: {len(summary['keyPoints'])}")
                    if summary.get('actionItems'):
                        print(f"  - Action items: {len(summary['actionItems'])}")
                
                return {
                    'upload_time': upload_time,
                    'process_time': process_time,
                    'total_time': upload_time + process_time
                }
            elif note_data.get('status') == 'failed':
                print(f"❌ Processing failed: {note_data.get('errorMessage')}")
                return None
    
    print("⏱️ Timeout waiting for processing")
    return None

def test_api_response_times():
    """Test response times for various API endpoints"""
    print("\n📊 Performance Test: API Response Times\n")
    
    endpoints = [
        ('GET /api/voice-notes', 'GET', '/api/voice-notes', None),
        ('GET /health', 'GET', '/health', None),
        ('GET /ready', 'GET', '/ready', None),
    ]
    
    results = {}
    
    for name, method, path, data in endpoints:
        times = []
        for _ in range(5):  # 5 samples each
            start = time.time()
            
            if method == 'GET':
                response = requests.get(f'{BASE_URL}{path}')
            else:
                response = requests.post(f'{BASE_URL}{path}', json=data)
            
            elapsed = (time.time() - start) * 1000  # Convert to ms
            times.append(elapsed)
            time.sleep(0.1)  # Small delay between requests
        
        avg_time = statistics.mean(times)
        min_time = min(times)
        max_time = max(times)
        
        results[name] = {
            'avg': avg_time,
            'min': min_time,
            'max': max_time
        }
        
        print(f"{name}:")
        print(f"  Avg: {avg_time:.2f}ms")
        print(f"  Min: {min_time:.2f}ms")
        print(f"  Max: {max_time:.2f}ms")
    
    return results

def test_concurrent_uploads():
    """Test system behavior with concurrent uploads"""
    print("\n📊 Performance Test: Concurrent Operations\n")
    
    # For MVP, just test sequential operations
    print("Testing sequential uploads (MVP mode)...")
    
    times = []
    for i in range(3):
        with open('./zabka.m4a', 'rb') as f:
            files = {'file': ('zabka.m4a', f, 'audio/m4a')}
            data = {
                'userId': f'concurrent-test-{i}',
                'title': f'Concurrent Test {i}',
                'language': 'PL'
            }
            
            start = time.time()
            response = requests.post(f'{BASE_URL}/api/voice-notes', files=files, data=data)
            elapsed = time.time() - start
            
            if response.status_code == 201:
                times.append(elapsed)
                print(f"  Upload {i+1}: {elapsed:.2f}s ✅")
            else:
                print(f"  Upload {i+1}: Failed ❌")
    
    if times:
        print(f"\nAverage upload time: {statistics.mean(times):.2f}s")
        print(f"Total time for 3 uploads: {sum(times):.2f}s")
    
    return times

if __name__ == "__main__":
    print("="*60)
    print("nano-Grazynka Performance Test Suite")
    print("="*60)
    
    # Test 1: Processing time
    processing_result = measure_processing_time()
    
    # Test 2: API response times
    api_results = test_api_response_times()
    
    # Test 3: Concurrent operations
    concurrent_results = test_concurrent_uploads()
    
    # Summary
    print("\n" + "="*60)
    print("PERFORMANCE SUMMARY")
    print("="*60)
    
    if processing_result:
        print(f"✅ End-to-end processing: {processing_result['total_time']:.2f}s")
        print(f"   - Upload: {processing_result['upload_time']:.2f}s")
        print(f"   - Processing: {processing_result['process_time']:.2f}s")
    else:
        print("❌ Processing test failed")
    
    print(f"\n✅ API Response Times:")
    for endpoint, times in api_results.items():
        print(f"   {endpoint}: {times['avg']:.2f}ms avg")
    
    if concurrent_results:
        print(f"\n✅ Sequential uploads: {statistics.mean(concurrent_results):.2f}s avg")
    
    # Performance thresholds (MVP targets)
    print("\n" + "="*60)
    print("MVP PERFORMANCE TARGETS")
    print("="*60)
    
    targets_met = []
    targets_failed = []
    
    # Check processing time (should be < 30s for MVP)
    if processing_result and processing_result['total_time'] < 30:
        targets_met.append("Processing < 30s")
    else:
        targets_failed.append("Processing < 30s")
    
    # Check API response times (should be < 500ms for MVP)
    slow_endpoints = [k for k, v in api_results.items() if v['avg'] > 500]
    if not slow_endpoints:
        targets_met.append("API responses < 500ms")
    else:
        targets_failed.append(f"API responses < 500ms ({', '.join(slow_endpoints)} too slow)")
    
    print(f"✅ Targets met: {len(targets_met)}")
    for target in targets_met:
        print(f"   - {target}")
    
    if targets_failed:
        print(f"\n❌ Targets failed: {len(targets_failed)}")
        for target in targets_failed:
            print(f"   - {target}")
    
    print("\n🎯 Performance test complete!")