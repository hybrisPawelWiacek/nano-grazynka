import { Transcription } from '../Transcription';
import { Language } from '../../value-objects/Language';

describe('Transcription', () => {
  describe('create', () => {
    it('should create a valid transcription', () => {
      const transcription = Transcription.create(
        'This is a test transcription',
        Language.EN,
        120,
        0.95
      );

      expect(transcription.getText()).toBe('This is a test transcription');
      expect(transcription.getLanguage()).toBe(Language.EN);
      expect(transcription.getDuration()).toBe(120);
      expect(transcription.getConfidence()).toBe(0.95);
      expect(transcription.getTimestamp()).toBeInstanceOf(Date);
    });

    it('should create with custom timestamp', () => {
      const timestamp = new Date('2024-01-01T10:00:00Z');
      const transcription = Transcription.create(
        'Test text',
        Language.EN,
        60,
        0.9,
        timestamp
      );

      expect(transcription.getTimestamp()).toBe(timestamp);
    });

    it('should use default confidence of 0.0 if not provided', () => {
      const transcription = Transcription.create(
        'Test text',
        Language.EN,
        60
      );

      expect(transcription.getConfidence()).toBe(0.0);
    });

    it('should throw error for empty text', () => {
      expect(() => {
        Transcription.create('', Language.EN, 60);
      }).toThrow('Transcription text cannot be empty');

      expect(() => {
        Transcription.create('   ', Language.EN, 60);
      }).toThrow('Transcription text cannot be empty');
    });

    it('should throw error for invalid duration', () => {
      expect(() => {
        Transcription.create('Test text', Language.EN, 0);
      }).toThrow('Duration must be positive');

      expect(() => {
        Transcription.create('Test text', Language.EN, -1);
      }).toThrow('Duration must be positive');
    });

    it('should throw error for invalid confidence', () => {
      expect(() => {
        Transcription.create('Test text', Language.EN, 60, -0.1);
      }).toThrow('Confidence must be between 0 and 1');

      expect(() => {
        Transcription.create('Test text', Language.EN, 60, 1.1);
      }).toThrow('Confidence must be between 0 and 1');
    });
  });

  describe('getWordCount', () => {
    it('should count words correctly', () => {
      const transcription = Transcription.create(
        'This is a test with five words.',
        Language.EN,
        60
      );

      expect(transcription.getWordCount()).toBe(7);
    });

    it('should handle multiple spaces', () => {
      const transcription = Transcription.create(
        'This   has    multiple     spaces',
        Language.EN,
        60
      );

      expect(transcription.getWordCount()).toBe(4);
    });

    it('should handle single word', () => {
      const transcription = Transcription.create(
        'Word',
        Language.EN,
        60
      );

      expect(transcription.getWordCount()).toBe(1);
    });
  });
});