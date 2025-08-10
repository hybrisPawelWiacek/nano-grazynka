import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { ZodError } from 'zod';
import { 
  ValidationError, 
  NotFoundError, 
  ProcessingError, 
  ConflictError 
} from '../../../application/base/Result';

export async function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const traceId = request.id;
  
  request.log.error({
    err: error,
    traceId,
    path: request.url,
    method: request.method
  });

  if (error instanceof ZodError) {
    await reply.status(400).send({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: error.errors,
      traceId
    });
    return;
  }

  if (error instanceof ValidationError) {
    await reply.status(400).send({
      error: 'Validation Error',
      message: error.message,
      traceId
    });
    return;
  }

  if (error instanceof NotFoundError) {
    await reply.status(404).send({
      error: 'Not Found',
      message: error.message,
      traceId
    });
    return;
  }

  if (error instanceof ProcessingError) {
    await reply.status(500).send({
      error: 'Processing Error',
      message: error.message,
      traceId
    });
    return;
  }

  if (error instanceof ConflictError) {
    await reply.status(409).send({
      error: 'Conflict',
      message: error.message,
      traceId
    });
    return;
  }

  if ('statusCode' in error && error.statusCode) {
    await reply.status(error.statusCode).send({
      error: error.name || 'Error',
      message: error.message,
      traceId
    });
    return;
  }

  await reply.status(500).send({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    traceId
  });
}