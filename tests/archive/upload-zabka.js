const fs = require('fs');
const FormData = require('form-data');
const http = require('http');

async function uploadFile() {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    
    // Read file from project root
    const fileStream = fs.createReadStream('./zabka.m4a');
    form.append('file', fileStream, {
      filename: 'zabka.m4a',
      contentType: 'audio/m4a'
    });
    
    form.append('userId', 'test-user');
    form.append('language', 'PL');
    form.append('tags', 'test,zabka');
    
    const options = {
      hostname: 'localhost',
      port: 3101,
      path: '/api/voice-notes',
      method: 'POST',
      headers: form.getHeaders()
    };
    
    console.log('Uploading zabka.m4a...');
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', data);
        
        if (res.statusCode === 201) {
          const result = JSON.parse(data);
          console.log('Upload successful! Voice note ID:', result.voiceNote.id);
          
          // Now trigger processing
          processVoiceNote(result.voiceNote.id);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Error:', error);
      reject(error);
    });
    
    form.pipe(req);
  });
}

function processVoiceNote(voiceNoteId) {
  const postData = JSON.stringify({ language: 'PL' });
  
  const options = {
    hostname: 'localhost',
    port: 3101,
    path: `/api/voice-notes/${voiceNoteId}/process`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  console.log('\nTriggering transcription processing...');
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Processing status:', res.statusCode);
      console.log('Processing response:', data);
      
      // Wait a bit then check status
      setTimeout(() => checkStatus(voiceNoteId), 5000);
    });
  });
  
  req.on('error', console.error);
  req.write(postData);
  req.end();
}

function checkStatus(voiceNoteId) {
  const options = {
    hostname: 'localhost',
    port: 3101,
    path: `/api/voice-notes/${voiceNoteId}?includeTranscription=true&includeSummary=true`,
    method: 'GET'
  };
  
  console.log('\nChecking transcription status...');
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      const result = JSON.parse(data);
      console.log('Status:', result.status);
      
      if (result.transcriptions && result.transcriptions.length > 0) {
        console.log('\n=== TRANSCRIPTION RESULT ===');
        console.log('Text:', result.transcriptions[0].text);
        console.log('Language:', result.transcriptions[0].language);
        console.log('Duration:', result.transcriptions[0].duration, 'seconds');
      }
      
      if (result.summaries && result.summaries.length > 0) {
        console.log('\n=== SUMMARY ===');
        console.log('Summary:', result.summaries[0].summary);
        console.log('Key Points:', result.summaries[0].keyPoints);
        console.log('Action Items:', result.summaries[0].actionItems);
      }
    });
  });
  
  req.on('error', console.error);
  req.end();
}

uploadFile().catch(console.error);