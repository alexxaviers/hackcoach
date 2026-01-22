import { FastifyInstance } from 'fastify';
import { z } from 'zod';

export default async function userRoutes(fastify: FastifyInstance){
  fastify.get('/me', async (req, reply) => {
    const userId = (req.headers as any)['x-user-id'] || null;
    if(!userId) return reply.status(401).send({error:'Unauthorized'});
    const user = await fastify.prisma.user.findUnique({ where: { id: userId }, select: { id:true, email:true, entitlement:true, proExpiresAt:true } });
    return user;
  });

  fastify.get('/me/entitlement', async (req, reply) => {
    const userId = (req.headers as any)['x-user-id'] || null;
    if(!userId) return reply.status(401).send({error:'Unauthorized'});
    const user = await fastify.prisma.user.findUnique({ where: { id: userId } });
    return { entitlement: user?.entitlement || 'FREE', proExpiresAt: user?.proExpiresAt };
  });

  const ctxSchema = z.object({ role: z.string(), tools: z.string(), goals: z.string(), prefs: z.string() });
  fastify.put('/me/context', async (req, reply) => {
    const userId = (req.headers as any)['x-user-id'] || null;
    if(!userId) return reply.status(401).send({error:'Unauthorized'});
    const body = ctxSchema.parse(req.body);
    const user = await fastify.prisma.user.findUnique({ where: { id: userId } });
    if(!user) return reply.status(402).send({ error: 'Pro required' });
    // Save or update
    const existing = await fastify.prisma.userContext.findUnique({ where: { userId } });
    if(existing){
      await fastify.prisma.userContext.update({ where: { id: existing.id }, data: { role: body.role, tools: body.tools, goals: body.goals, prefs: body.prefs } });
    }else{
      await fastify.prisma.userContext.create({ data: { userId, role: body.role, tools: body.tools, goals: body.goals, prefs: body.prefs } });
    }
    return { ok: true };
  });

  fastify.get('/me/context', async (req, reply) => {
    const userId = (req.headers as any)['x-user-id'] || null;
    if(!userId) return reply.status(401).send({error:'Unauthorized'});
    const ctx = await fastify.prisma.userContext.findUnique({ where: { userId } });
    return ctx || {};
  });
}
