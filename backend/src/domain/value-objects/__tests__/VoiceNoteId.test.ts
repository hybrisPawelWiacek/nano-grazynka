import { VoiceNoteId } from '../VoiceNoteId';

describe('VoiceNoteId', () => {
  describe('create', () => {
    it('should create a new VoiceNoteId with a valid UUID', () => {
      const id = VoiceNoteId.create();
      expect(id.toString()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should create unique IDs', () => {
      const id1 = VoiceNoteId.create();
      const id2 = VoiceNoteId.create();
      expect(id1.toString()).not.toBe(id2.toString());
    });
  });

  describe('fromString', () => {
    it('should create VoiceNoteId from valid string', () => {
      const idString = '123e4567-e89b-12d3-a456-426614174000';
      const id = VoiceNoteId.fromString(idString);
      expect(id.toString()).toBe(idString);
    });

    it('should throw error for empty string', () => {
      expect(() => VoiceNoteId.fromString('')).toThrow('VoiceNoteId cannot be empty');
    });

    it('should throw error for whitespace string', () => {
      expect(() => VoiceNoteId.fromString('   ')).toThrow('VoiceNoteId cannot be empty');
    });
  });

  describe('equals', () => {
    it('should return true for equal IDs', () => {
      const idString = '123e4567-e89b-12d3-a456-426614174000';
      const id1 = VoiceNoteId.fromString(idString);
      const id2 = VoiceNoteId.fromString(idString);
      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different IDs', () => {
      const id1 = VoiceNoteId.create();
      const id2 = VoiceNoteId.create();
      expect(id1.equals(id2)).toBe(false);
    });
  });
});