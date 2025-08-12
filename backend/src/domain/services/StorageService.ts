export interface StorageService {
  save(buffer: Buffer, originalName: string, userId?: string): Promise<string>;
  read(filePath: string): Promise<Buffer>;
  delete(filePath: string): Promise<void>;
  exists(filePath: string): Promise<boolean>;
  getUrl(filePath: string): string;
}