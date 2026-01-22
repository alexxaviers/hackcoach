import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import argon2 from 'argon2';
import { signAccess, signRefresh } from '../utils/auth';

export default async function authRoutes(fastify: FastifyInstance){
  const signupSchema = z.object({ email: z.string().email(), password: z.string().min(8) });

  fastify.post('/auth/signup', async (req, reply) => {
    const body = signupSchema.parse(req.body);
    const existing = await fastify.prisma.user.findUnique({ where: { email: body.email } });
    if(existing) return reply.status(400).send({ error: 'User exists' });
    const hash = await argon2.hash(body.password);
    const user = await fastify.prisma.user.create({ data: { email: body.email, passwordHash: hash } });
    const access = signAccess({ userId: user.id });
    const refresh = signRefresh({ userId: user.id });
    await fastify.prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: await argon2.hash(refresh) } });
    return { accessToken: access, refreshToken: refresh };
  });

  const loginSchema = signupSchema;
  fastify.post('/auth/login', async (req, reply) => {
    const body = loginSchema.parse(req.body);
    const user = await fastify.prisma.user.findUnique({ where: { email: body.email } });
    if(!user) return reply.status(401).send({ error: 'Invalid' });
    const ok = await argon2.verify(user.passwordHash, body.password);
    if(!ok) return reply.status(401).send({ error: 'Invalid' });
    const access = signAccess({ userId: user.id });
    const refresh = signRefresh({ userId: user.id });
    await fastify.prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: await argon2.hash(refresh) } });
    return { accessToken: access, refreshToken: refresh };
  });

  fastify.post('/auth/refresh', async (req, reply) => {
    const { refreshToken } = req.body as any;
    if(!refreshToken) return reply.status(400).send({ error: 'Missing' });
    try{
      const payload: any = fastify.jwt.verify(refreshToken, {secret: process.env.JWT_REFRESH_SECRET || 'dev_refresh'});
      const user = await fastify.prisma.user.findUnique({ where: { id: payload.userId } });
      if(!user || !user.refreshTokenHash) return reply.status(401).send({ error: 'Invalid' });
      const ok = await argon2.verify(user.refreshTokenHash, refreshToken);
      if(!ok) return reply.status(401).send({ error: 'Invalid' });
      const access = signAccess({ userId: user.id });
      const refresh = signRefresh({ userId: user.id });
      await fastify.prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: await argon2.hash(refresh) } });
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
      await fastify.prisma.user.update({ where: { id: payload.userId }, data: { refreshTokenHash: null } });
    }catch(e){}
    return { ok: true };
  });
}
