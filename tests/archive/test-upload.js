const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function uploadFile() {
  try {
    const form = new FormData();
    
    // Add file
    const fileStream = fs.createReadStream('./zabka.m4a');
    form.append('file', fileStream, {
      filename: 'zabka.m4a',
      contentType: 'audio/m4a'
    });
    
    // Add other fields
    form.append('userId', 'test-user');
    form.append('language', 'PL');
    form.append('tags', 'test,zabka');
    
    console.log('Uploading file...');
    
    const response = await fetch('http://localhost:3101/api/voice-notes/upload', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('Upload successful! Voice note ID:', data.data.id);
      return data.data.id;
    } else {
      console.error('Upload failed:', responseText);
    }
  } catch (error) {
    console.error('Error uploading file:', error);
  }
}

uploadFile();