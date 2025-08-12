import fs from 'fs/promises';
import path from 'path';
import { StorageService } from '../../domain/services/StorageService';
import { ConfigLoader } from '../../config/loader';

export class LocalStorageAdapter implements StorageService {
  private readonly basePath: string;

  constructor() {
    this.basePath = ConfigLoader.get('storage.uploadDir');
    this.ensureDirectoryExists();
  }

  async save(buffer: Buffer, originalName: string, userId?: string): Promise<string> {
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}-${sanitizedName}`;
    
    const fullPath = this.getFullPath(fileName);
    const directory = path.dirname(fullPath);
    
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(fullPath, buffer);
    
    // Return the full path so WhisperAdapter can find the file
    return fullPath;
  }

  async read(filePath: string): Promise<Buffer> {
    const fullPath = this.getFullPath(filePath);
    return fs.readFile(fullPath);
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = this.getFullPath(filePath);
    
    try {
      await fs.unlink(fullPath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async exists(filePath: string): Promise<boolean> {
    const fullPath = this.getFullPath(filePath);
    
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  getUrl(filePath: string): string {
    return `/files/${filePath}`;
  }

  private getFullPath(filePath: string): string {
    const sanitized = filePath.replace(/^\/+/, '');
    return path.join(this.basePath, sanitized);
  }

  private async ensureDirectoryExists(): Promise<void> {
    await fs.mkdir(this.basePath, { recursive: true });
  }
}