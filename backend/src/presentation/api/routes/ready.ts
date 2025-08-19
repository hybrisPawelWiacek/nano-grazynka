import { FastifyInstance } from 'fastify';

export default async function readyRoutes(fastify: FastifyInstance) {
  // Ready endpoint that verifies all routes are loaded
  fastify.get('/ready', async (request, reply) => {
    const routes = fastify.printRoutes({ commonPrefix: false });
    
    // Check for critical routes
    const criticalRoutes = [
      '/health',
      '/api/auth/register',
      '/api/auth/login',
      '/api/voice-notes/upload',
      '/api/voice-notes',
      '/api/entities',
      '/api/projects'
    ];
    
    const routeList = routes.split('\n').filter(r => r.trim());
    const missingRoutes = [];
    
    for (const route of criticalRoutes) {
      const found = routeList.some(r => r.includes(route));
      if (!found) {
        missingRoutes.push(route);
      }
    }
    
    if (missingRoutes.length > 0) {
      return reply.code(503).send({
        status: 'not_ready',
        message: 'Some critical routes are not loaded',
        missingRoutes,
        totalRoutes: routeList.length
      });
    }
    
    return {
      status: 'ready',
      message: 'All critical routes are loaded',
      totalRoutes: routeList.length,
      timestamp: new Date().toISOString()
    };
  });
}