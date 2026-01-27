import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import argon2 from 'argon2';
import { signAccess, signRefresh } from '../utils/auth';

export default async function authRoutes(fastify: FastifyInstance){
  const signupSchema = z.object({ email: z.string().email(), password: z.string().min(8) });

  fastify.post('/auth/signup', async (req, reply) => {
    const body = signupSchema.parse(req.body);
    const { data: existing } = await fastify.supabase.from('users').select('id').eq('email', body.email).single();
    if(existing) return reply.status(400).send({ error: 'User exists' });
    const hash = await argon2.hash(body.password);
    const { data: user, error } = await fastify.supabase.from('users').insert({ email: body.email, password_hash: hash }).select('id').single();
    if(error || !user) return reply.status(500).send({ error: 'Failed to create user' });
    const access = signAccess({ userId: user.id });
    const refresh = signRefresh({ userId: user.id });
    await fastify.supabase.from('users').update({ refresh_token_hash: await argon2.hash(refresh) }).eq('id', user.id);
    return { accessToken: access, refreshToken: refresh };
  });

  const loginSchema = signupSchema;
  fastify.post('/auth/login', async (req, reply) => {
    const body = loginSchema.parse(req.body);
    const { data: user } = await fastify.supabase.from('users').select('id, password_hash').eq('email', body.email).single();
    if(!user) return reply.status(401).send({ error: 'Invalid' });
    const ok = await argon2.verify(user.passwordHash, body.password);
    if(!ok) return reply.status(401).send({ error: 'Invalid' });
    const access = signAccess({ userId: user.id });
    const refresh = signRefresh({ userId: user.id });
    await fastify.supabase.from('users').update({ refresh_token_hash: await argon2.hash(refresh) }).eq('id', user.id);
    return { accessToken: access, refreshToken: refresh };
  });

  fastify.post('/auth/refresh', async (req, reply) => {
    const { refreshToken } = req.body as any;
    if(!refreshToken) return reply.status(400).send({ error: 'Missing' });
    try{
      const payload: any = fastify.jwt.verify(refreshToken, {secret: process.env.JWT_REFRESH_SECRET || 'dev_refresh'});
    const { data: user } = await fastify.supabase.from('users').select('id, refresh_token_hash').eq('id', payload.userId).single();
    if(!user || !user.refresh_token_hash) return reply.status(401).send({ error: 'Invalid' });
    const ok = await argon2.verify(user.refresh_token_hash, refreshToken);
      if(!ok) return reply.status(401).send({ error: 'Invalid' });
      const access = signAccess({ userId: user.id });
      const refresh = signRefresh({ userId: user.id });
      await fastify.supabase.from('users').update({ refresh_token_hash: await argon2.hash(refresh) }).eq('id', user.id);
      return { accessToken: access, refreshToken: refresh };
    }catch(e){
      return reply.status(401).send({ error: 'Invalid' });
    }
  });

  fastify.post('/auth/logout', async (req, reply) => {
    const { refreshToken } = req.body as any;
    if(!refreshToken) return reply.send({ ok: true });
    try{
      const payload: any = fastify.jwt.verify(refreshToken, {secret: process.env.JWT_REFRESH_SECRET || 'dev_refresh'});
      await fastify.supabase.from('users').update({ refresh_token_hash: null }).eq('id', payload.userId);
    }catch(e){}
    return { ok: true };
  });
}
