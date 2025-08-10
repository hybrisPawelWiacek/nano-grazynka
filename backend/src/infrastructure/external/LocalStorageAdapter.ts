import { StorageService } from '../../domain/services/StorageService';
import * as fs from 'fs/promises';
import * as path from 'path';

export class LocalStorageAdapter implements StorageService {
  constructor(private uploadDir: string) {}

  async save(buffer: Buffer, filename: string): Promise<string> {
    await this.ensureDirectoryExists();
    
    const uniqueFilename = `${Date.now()}-${filename}`;
    const filePath = path.join(this.uploadDir, uniqueFilename);
    
    await fs.writeFile(filePath, buffer);
    return filePath;
  }

  async read(filePath: string): Promise<Buffer> {
    return await fs.readFile(filePath);
  }

  async delete(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File might not exist, ignore error
      console.warn(`Failed to delete file ${filePath}:`, error);
    }
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }
}