import { Readable } from 'stream';

export class AudioMetadataExtractor {
  /**
   * Extract duration from audio file buffer
   * @param buffer - Audio file buffer
   * @param mimeType - MIME type of the audio file
   * @returns Duration in seconds or null if extraction fails
   */
  async extractDuration(buffer: Buffer, mimeType?: string): Promise<number | null> {
    try {
      console.log('Extracting audio duration for mimeType:', mimeType);
      
      // Use dynamic import to handle ESM module
      const musicMetadata = await import('music-metadata');
      const { parseBuffer } = musicMetadata;
      
      // Map audio/m4a to audio/mp4 which music-metadata understands better
      let parseMimeType = mimeType;
      if (mimeType === 'audio/m4a' || mimeType === 'audio/x-m4a') {
        parseMimeType = 'audio/mp4';
      }
      
      // Parse metadata directly from buffer
      const metadata = await parseBuffer(buffer, parseMimeType);
      
      const duration = metadata.format.duration || null;
      console.log('Extracted duration:', duration, 'seconds from format:', metadata.format);
      
      // Return duration in seconds (music-metadata returns it in seconds)
      return duration;
    } catch (error) {
      console.error('Failed to extract audio duration:', error);
      return null;
    }
  }
}