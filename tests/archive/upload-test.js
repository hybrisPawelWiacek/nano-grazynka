const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const http = require('http');

const filePath = path.join(__dirname, 'zabka.m4a');

console.log('Checking file:', filePath);
console.log('File exists:', fs.existsSync(filePath));

if (!fs.existsSync(filePath)) {
  console.error('File not found!');
  process.exit(1);
}

const stats = fs.statSync(filePath);
console.log('File size:', stats.size, 'bytes');

// Create form
const form = new FormData();
form.append('file', fs.createReadStream(filePath), {
  filename: 'zabka.m4a',
  contentType: 'audio/m4a'
});
form.append('userId', 'test-user');
form.append('language', 'PL');
form.append('tags', 'test,zabka');

// Submit form
const options = {
  hostname: 'localhost',
  port: 3101,
  path: '/api/voice-notes',
  method: 'POST',
  headers: form.getHeaders()
};

console.log('\nUploading zabka.m4a...');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    
    if (res.statusCode === 201) {
      const result = JSON.parse(data);
      console.log('✅ Upload successful!');
      console.log('Voice note ID:', result.voiceNote.id);
      console.log('\nFull response:', JSON.stringify(result, null, 2));
      
      // Now trigger processing
      processVoiceNote(result.voiceNote.id);
    } else {
      console.log('❌ Upload failed');
      console.log('Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

form.pipe(req);

function processVoiceNote(id) {
  console.log('\n📝 Triggering transcription for', id);
  
  const data = JSON.stringify({ language: 'PL' });
  
  const options = {
    hostname: 'localhost',
    port: 3101,
    path: `/api/voice-notes/${id}/process`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };
  
  const req = http.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('Processing status:', res.statusCode);
      
      if (res.statusCode === 200) {
        console.log('✅ Processing started!');
        
        // Check status after 15 seconds
        setTimeout(() => checkTranscription(id), 15000);
      } else {
        console.log('❌ Processing failed');
        console.log('Response:', responseData);
      }
    });
  });
  
  req.on('error', console.error);
  req.write(data);
  req.end();
}

function checkTranscription(id) {
  console.log('\n🔍 Checking transcription status...');
  
  const options = {
    hostname: 'localhost',
    port: 3101,
    path: `/api/voice-notes/${id}?includeTranscription=true&includeSummary=true`,
    method: 'GET'
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      const result = JSON.parse(data);
      
      console.log('Status:', result.status);
      
      if (result.transcriptions && result.transcriptions.length > 0) {
        const trans = result.transcriptions[0];
        console.log('\n=== 🎙️ TRANSCRIPTION RESULT ===');
        console.log('Text:', trans.text);
        console.log('Language:', trans.language);
        console.log('Duration:', trans.duration, 'seconds');
      }
      
      if (result.summaries && result.summaries.length > 0) {
        const summary = result.summaries[0];
        console.log('\n=== 📋 SUMMARY ===');
        console.log('Summary:', summary.summary);
        console.log('Key Points:', summary.keyPoints);
        console.log('Action Items:', summary.actionItems);
      }
      
      if (result.status !== 'completed') {
        console.log('\nProcessing not complete yet. Checking again in 10 seconds...');
        setTimeout(() => checkTranscription(id), 10000);
      } else {
        console.log('\n✅ Transcription complete!');
      }
    });
  });
  
  req.on('error', console.error);
  req.end();
}