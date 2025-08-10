import { Language, LanguageCode } from '../Language';

describe('Language', () => {
  describe('static instances', () => {
    it('should have EN and PL static instances', () => {
      expect(Language.EN.getCode()).toBe(LanguageCode.EN);
      expect(Language.PL.getCode()).toBe(LanguageCode.PL);
    });
  });

  describe('fromCode', () => {
    it('should create Language from various English codes', () => {
      expect(Language.fromCode('en').equals(Language.EN)).toBe(true);
      expect(Language.fromCode('EN').equals(Language.EN)).toBe(true);
      expect(Language.fromCode('eng').equals(Language.EN)).toBe(true);
      expect(Language.fromCode('english').equals(Language.EN)).toBe(true);
    });

    it('should create Language from various Polish codes', () => {
      expect(Language.fromCode('pl').equals(Language.PL)).toBe(true);
      expect(Language.fromCode('PL').equals(Language.PL)).toBe(true);
      expect(Language.fromCode('pol').equals(Language.PL)).toBe(true);
      expect(Language.fromCode('polish').equals(Language.PL)).toBe(true);
    });

    it('should throw error for unsupported language code', () => {
      expect(() => Language.fromCode('de')).toThrow('Unsupported language code: de');
      expect(() => Language.fromCode('fr')).toThrow('Unsupported language code: fr');
    });
  });

  describe('getName', () => {
    it('should return correct language names', () => {
      expect(Language.EN.getName()).toBe('English');
      expect(Language.PL.getName()).toBe('Polish');
    });
  });

  describe('toString', () => {
    it('should return language code as string', () => {
      expect(Language.EN.toString()).toBe('en');
      expect(Language.PL.toString()).toBe('pl');
    });
  });

  describe('equals', () => {
    it('should return true for same language', () => {
      expect(Language.EN.equals(Language.EN)).toBe(true);
      expect(Language.PL.equals(Language.PL)).toBe(true);
    });

    it('should return false for different languages', () => {
      expect(Language.EN.equals(Language.PL)).toBe(false);
      expect(Language.PL.equals(Language.EN)).toBe(false);
    });
  });
});