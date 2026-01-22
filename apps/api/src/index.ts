import Fastify from 'fastify';
import cors from 'fastify-cors';
import jwt from 'fastify-jwt';
import prismaPlugin from './plugins/prisma';
import authRoutes from './routes/auth';
import coachRoutes from './routes/coaches';
import sessionRoutes from './routes/sessions';
import revenuecatRoutes from './routes/revenuecat';
import userRoutes from './routes/user';

const server = Fastify({ logger: true });

server.register(cors, { origin: true });
server.register(jwt, { secret: process.env.JWT_ACCESS_SECRET || 'dev' });
server.register(prismaPlugin);

server.get('/', async () => ({ status: 'ok' }));

server.register(authRoutes);
server.register(coachRoutes);
server.register(sessionRoutes);
server.register(revenuecatRoutes);
server.register(userRoutes);

const start = async () => {
  try{
    const port = Number(process.env.PORT || 4000);
    await server.listen({ port, host: '0.0.0.0' });
    console.log('Server listening on', port);
  }catch(e){
    server.log.error(e);
    process.exit(1);
  }
};

start();
