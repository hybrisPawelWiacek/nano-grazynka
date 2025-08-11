import { FastifyInstance } from 'fastify';

export async function testRoutes(fastify: FastifyInstance) {
  // Simple test endpoint
  fastify.post('/api/test-upload', async (request, reply) => {
    console.log('Test upload endpoint hit!');
    
    try {
      const parts = request.parts();
      let count = 0;
      const files = [];
      
      for await (const part of parts) {
        count++;
        console.log(`Part ${count}:`, part.type, part.fieldname, part.filename);
        
        // MUST consume the file stream for the iterator to proceed
        if (part.file) {
          const chunks = [];
          for await (const chunk of part.file) {
            chunks.push(chunk);
          }
          const buffer = Buffer.concat(chunks);
          files.push({
            fieldname: part.fieldname,
            filename: part.filename,
            mimetype: part.mimetype,
            size: buffer.length
          });
          console.log(`File consumed: ${part.filename}, size: ${buffer.length}`);
        }
      }
      
      return reply.send({ 
        success: true, 
        message: `Received ${count} parts, ${files.length} files`,
        files 
      });
    } catch (error: any) {
      console.error('Test upload error:', error);
      return reply.status(500).send({ 
        error: error.message 
      });
    }
  });
}