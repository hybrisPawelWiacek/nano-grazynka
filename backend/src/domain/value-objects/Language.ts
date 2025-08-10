export enum LanguageCode {
  EN = 'en',
  PL = 'pl'
}

export class Language {
  private constructor(private readonly code: LanguageCode) {}

  static EN = new Language(LanguageCode.EN);
  static PL = new Language(LanguageCode.PL);

  static fromString(code: string): Language {
    return Language.fromCode(code);
  }

  static fromCode(code: string): Language {
    const normalizedCode = code.toLowerCase();
    switch (normalizedCode) {
      case 'en':
      case 'eng':
      case 'english':
        return Language.EN;
      case 'pl':
      case 'pol':
      case 'polish':
        return Language.PL;
      default:
        throw new Error(`Unsupported language code: ${code}`);
    }
  }

  getCode(): LanguageCode {
    return this.code;
  }

  getValue(): string {
    return this.code;
  }

  toString(): string {
    return this.code;
  }

  equals(other: Language): boolean {
    return this.code === other.code;
  }

  getName(): string {
    switch (this.code) {
      case LanguageCode.EN:
        return 'English';
      case LanguageCode.PL:
        return 'Polish';
    }
  }
}