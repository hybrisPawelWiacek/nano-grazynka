const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function uploadFile() {
  try {
    const form = new FormData();
    
    // Read the file
    const fileStream = fs.createReadStream('./zabka.m4a');
    form.append('file', fileStream, 'zabka.m4a');
    form.append('title', 'Zabka Test Recording');
    form.append('language', 'PL');
    form.append('tags', 'test,zabka');
    
    const response = await axios.post('http://localhost:3101/api/voice-notes', form, {
      headers: {
        ...form.getHeaders()
      },
      maxBodyLength: Infinity,
      timeout: 30000
    });
    
    console.log('Upload successful!');
    console.log('Voice Note ID:', response.data.id);
    console.log('Status:', response.data.status);
    
    // Now trigger processing
    if (response.data.id) {
      console.log('\nTriggering processing...');
      const processResponse = await axios.post(
        `http://localhost:3101/api/voice-notes/${response.data.id}/process`
      );
      console.log('Processing started:', processResponse.data);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

uploadFile().then(result => {
  if (result && result.id) {
    console.log('\nChecking status after 5 seconds...');
    setTimeout(async () => {
      try {
        const statusResponse = await axios.get(
          `http://localhost:3101/api/voice-notes/${result.id}`
        );
        console.log('Current status:', statusResponse.data.status);
        if (statusResponse.data.transcription) {
          console.log('\n=== TRANSCRIPTION ===');
          console.log(statusResponse.data.transcription.content);
        }
      } catch (error) {
        console.error('Error checking status:', error.message);
      }
    }, 5000);
  }
});