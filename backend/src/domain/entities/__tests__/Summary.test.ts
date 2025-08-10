import { Summary } from '../Summary';
import { Language } from '../../value-objects/Language';

describe('Summary', () => {
  describe('create', () => {
    it('should create a valid summary', () => {
      const summary = Summary.create(
        'This is a general summary.',
        ['Point 1', 'Point 2', 'Point 3'],
        ['Do this', 'Do that'],
        Language.EN
      );

      expect(summary.getSummary()).toBe('This is a general summary.');
      expect(summary.getKeyPoints()).toEqual(['Point 1', 'Point 2', 'Point 3']);
      expect(summary.getActionItems()).toEqual(['Do this', 'Do that']);
      expect(summary.getLanguage()).toBe(Language.EN);
      expect(summary.getTimestamp()).toBeInstanceOf(Date);
    });

    it('should create with custom timestamp', () => {
      const timestamp = new Date('2024-01-01T10:00:00Z');
      const summary = Summary.create(
        'Summary text',
        ['Key point'],
        [],
        Language.EN,
        timestamp
      );

      expect(summary.getTimestamp()).toBe(timestamp);
    });

    it('should create with empty action items', () => {
      const summary = Summary.create(
        'Summary text',
        ['Key point'],
        [],
        Language.EN
      );

      expect(summary.getActionItems()).toEqual([]);
    });

    it('should throw error for empty summary text', () => {
      expect(() => {
        Summary.create('', ['Key point'], [], Language.EN);
      }).toThrow('Summary text cannot be empty');

      expect(() => {
        Summary.create('   ', ['Key point'], [], Language.EN);
      }).toThrow('Summary text cannot be empty');
    });

    it('should throw error for empty key points', () => {
      expect(() => {
        Summary.create('Summary text', [], [], Language.EN);
      }).toThrow('Key points cannot be empty');
    });
  });

  describe('getters return copies', () => {
    it('should return a copy of key points array', () => {
      const summary = Summary.create(
        'Summary text',
        ['Point 1', 'Point 2'],
        ['Action 1'],
        Language.EN
      );

      const keyPoints = summary.getKeyPoints();
      keyPoints.push('Point 3');

      expect(summary.getKeyPoints()).toEqual(['Point 1', 'Point 2']);
    });

    it('should return a copy of action items array', () => {
      const summary = Summary.create(
        'Summary text',
        ['Point 1'],
        ['Action 1', 'Action 2'],
        Language.EN
      );

      const actionItems = summary.getActionItems();
      actionItems.push('Action 3');

      expect(summary.getActionItems()).toEqual(['Action 1', 'Action 2']);
    });
  });
});