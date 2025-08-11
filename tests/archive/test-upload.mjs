import fs from 'fs';
import FormData from 'form-data';

const form = new FormData();
form.append('file', fs.createReadStream('/tmp/zabka.m4a'), {
  filename: 'zabka.m4a',
  contentType: 'audio/m4a'
});
form.append('userId', 'test-user');
form.append('language', 'PL');

const response = await fetch('http://localhost:3101/api/voice-notes/upload', {
  method: 'POST',
  body: form,
  headers: form.getHeaders()
});

const result = await response.json();
console.log('Upload result:', JSON.stringify(result, null, 2));

if (result.success) {
  console.log('Voice note ID:', result.data.id);
  
  // Now trigger processing
  console.log('\nTriggering processing...');
  const processResponse = await fetch(`http://localhost:3101/api/voice-notes/${result.data.id}/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  
  const processResult = await processResponse.json();
  console.log('Processing result:', JSON.stringify(processResult, null, 2));
}