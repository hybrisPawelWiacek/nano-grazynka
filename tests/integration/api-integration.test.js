const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const API_BASE = 'http://localhost:3101';

describe('API Integration Tests', () => {
  let sessionId;
  let voiceNoteId;

  beforeAll(() => {
    sessionId = uuidv4();
  });

  describe('Health Endpoints', () => {
    test('GET /health should return healthy status', async () => {
      const response = await axios.get(`${API_BASE}/health`);
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('healthy');
      expect(response.data.database).toBe('connected');
    });

    test('GET /ready should return ready status', async () => {
      const response = await axios.get(`${API_BASE}/ready`);
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('ready');
    });
  });

  describe('Anonymous Upload Flow', () => {
    test('POST /api/anonymous/upload should accept file', async () => {
      const form = new FormData();
      const filePath = path.join(__dirname, '../test-data/test-audio.mp3');
      
      form.append('file', fs.createReadStream(filePath));
      form.append('language', 'en');
      form.append('title', 'Test Audio');

      const response = await axios.post(
        `${API_BASE}/api/anonymous/upload`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            'x-session-id': sessionId
          }
        }
      );

      expect(response.status).toBe(201);
      expect(response.data.voiceNote).toBeDefined();
      expect(response.data.voiceNote.id).toBeTruthy();
      voiceNoteId = response.data.voiceNote.id;
    });

    test('GET /api/anonymous/usage should return usage count', async () => {
      const response = await axios.get(
        `${API_BASE}/api/anonymous/usage`,
        {
          headers: {
            'x-session-id': sessionId
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.used).toBeGreaterThanOrEqual(1);
      expect(response.data.remaining).toBeLessThanOrEqual(4);
      expect(response.data.limit).toBe(5);
    });
  });

  describe('Voice Note Operations', () => {
    test('GET /api/voice-notes/:id should return note details', async () => {
      if (!voiceNoteId) {
        console.warn('Skipping test - no voice note ID available');
        return;
      }

      const response = await axios.get(
        `${API_BASE}/api/voice-notes/${voiceNoteId}`,
        {
          headers: {
            'x-session-id': sessionId
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.voiceNote).toBeDefined();
      expect(response.data.voiceNote.id).toBe(voiceNoteId);
    });

    test('POST /api/voice-notes/:id/process should trigger processing', async () => {
      if (!voiceNoteId) {
        console.warn('Skipping test - no voice note ID available');
        return;
      }

      const response = await axios.post(
        `${API_BASE}/api/voice-notes/${voiceNoteId}/process`,
        { language: 'en' },
        {
          headers: {
            'x-session-id': sessionId
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.message).toContain('processing');
    });
  });

  describe('Error Handling', () => {
    test('should return 400 for invalid file type', async () => {
      const form = new FormData();
      form.append('file', Buffer.from('not an audio file'), 'test.txt');
      form.append('language', 'en');

      try {
        await axios.post(
          `${API_BASE}/api/anonymous/upload`,
          form,
          {
            headers: {
              ...form.getHeaders(),
              'x-session-id': sessionId
            }
          }
        );
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toBeDefined();
      }
    });

    test('should return 403 after usage limit', async () => {
      const limitTestSessionId = uuidv4();
      
      for (let i = 0; i < 5; i++) {
        const form = new FormData();
        form.append('file', Buffer.from('test'), `test${i}.mp3`);
        form.append('language', 'en');
        
        await axios.post(
          `${API_BASE}/api/anonymous/upload`,
          form,
          {
            headers: {
              ...form.getHeaders(),
              'x-session-id': limitTestSessionId
            }
          }
        );
      }

      const form = new FormData();
      form.append('file', Buffer.from('test'), 'test6.mp3');
      form.append('language', 'en');

      try {
        await axios.post(
          `${API_BASE}/api/anonymous/upload`,
          form,
          {
            headers: {
              ...form.getHeaders(),
              'x-session-id': limitTestSessionId
            }
          }
        );
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(403);
        expect(error.response.data.error).toContain('limit');
      }
    });

    test('should return 404 for non-existent voice note', async () => {
      try {
        await axios.get(
          `${API_BASE}/api/voice-notes/non-existent-id`,
          {
            headers: {
              'x-session-id': sessionId
            }
          }
        );
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });
  });
});