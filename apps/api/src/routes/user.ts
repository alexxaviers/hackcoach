import { FastifyInstance } from 'fastify';
import { z } from 'zod';

export default async function userRoutes(fastify: FastifyInstance){
  fastify.get('/me', async (req, reply) => {
    const userId = (req.headers as any)['x-user-id'] || null;
    if(!userId) return reply.status(401).send({error:'Unauthorized'});
    const { data: user } = await fastify.supabase.from('users').select('id, email, entitlement, pro_expires_at').eq('id', userId).single();
    return user;
  });

  fastify.get('/me/entitlement', async (req, reply) => {
    const userId = (req.headers as any)['x-user-id'] || null;
    if(!userId) return reply.status(401).send({error:'Unauthorized'});
    const { data: user } = await fastify.supabase.from('users').select('entitlement, pro_expires_at').eq('id', userId).single();
    return { entitlement: user?.entitlement || 'FREE', proExpiresAt: user?.pro_expires_at };
  });

  const ctxSchema = z.object({ role: z.string(), tools: z.string(), goals: z.string(), prefs: z.string() });
  fastify.put('/me/context', async (req, reply) => {
    const userId = (req.headers as any)['x-user-id'] || null;
    if(!userId) return reply.status(401).send({error:'Unauthorized'});
    const body = ctxSchema.parse(req.body);
    const { data: user } = await fastify.supabase.from('users').select('id').eq('id', userId).single();
    if(!user) return reply.status(402).send({ error: 'Pro required' });
    // Save or update
    const { data: existing } = await fastify.supabase.from('user_context').select('id').eq('user_id', userId).single();
    if(existing){
      await fastify.supabase.from('user_context').update({ role: body.role, tools: body.tools, goals: body.goals, prefs: body.prefs }).eq('id', existing.id);
    }else{
      await fastify.supabase.from('user_context').insert({ user_id: userId, role: body.role, tools: body.tools, goals: body.goals, prefs: body.prefs });
    }
    return { ok: true };
  });

  fastify.get('/me/context', async (req, reply) => {
    const userId = (req.headers as any)['x-user-id'] || null;
    if(!userId) return reply.status(401).send({error:'Unauthorized'});
    const { data: ctx } = await fastify.supabase.from('user_context').select('*').eq('user_id', userId).single();
    return ctx || {};
  });
}
