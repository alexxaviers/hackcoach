import { FastifyInstance } from 'fastify';
import { generateAssistantReply } from '../services/openai';
import { z } from 'zod';

export default async function sessionRoutes(fastify: FastifyInstance){
  fastify.post('/sessions', async (req, reply) => {
    const { coachId } = req.body as any;
    const userId = (req.headers as any)['x-user-id'] || null;
    if(!userId) return reply.status(401).send({error:'Unauthorized'});
    // enforce free/pro
    const user = await fastify.prisma.user.findUnique({ where: { id: userId } });
    if(!user) return reply.status(401).send({error:'Unauthorized'});
    if(user.entitlement !== 'PRO' && coachId !== 'focus'){
      return reply.status(402).send({ error: 'Upgrade required' });
    }
    const session = await fastify.prisma.session.create({ data: { userId, coachId } });
    return session;
  });

  fastify.get('/sessions', async (req, reply) => {
    const userId = (req.headers as any)['x-user-id'] || null;
    if(!userId) return reply.status(401).send({error:'Unauthorized'});
    const sessions = await fastify.prisma.session.findMany({ where: { userId }, include: { messages: true } });
    return sessions;
  });

  fastify.get('/sessions/:id', async (req, reply) => {
    const id = (req.params as any).id;
    const userId = (req.headers as any)['x-user-id'] || null;
    if(!userId) return reply.status(401).send({error:'Unauthorized'});
    const session = await fastify.prisma.session.findUnique({ where: { id }, include: { messages: true } });
    if(!session || session.userId !== userId) return reply.status(404).send({error:'Not found'});
    return session;
  });

  const msgSchema = z.object({ content: z.string().min(1) });
  fastify.post('/sessions/:id/messages', async (req, reply) => {
    const sid = (req.params as any).id;
    const body = msgSchema.parse(req.body);
    const userId = (req.headers as any)['x-user-id'] || null;
    if(!userId) return reply.status(401).send({error:'Unauthorized'});
    const session = await fastify.prisma.session.findUnique({ where: { id: sid }, include: { messages: true } });
    if(!session || session.userId !== userId) return reply.status(404).send({error:'Not found'});

    // Free daily limit enforcement
    const today = new Date();
    const dateOnly = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const usage = await fastify.prisma.userDailyUsage.upsert({ where: { userId_date: { userId, date: dateOnly } }, create: { userId, date: dateOnly, assistantReplies: 0 }, update: {} });
    const dbUser = await fastify.prisma.user.findUnique({ where: { id: userId } });
    if(dbUser?.entitlement !== 'PRO'){
      if(usage.assistantReplies >= 3) return reply.status(402).send({ error: 'Daily limit reached' });
    }

    // store user message
    const userMsg = await fastify.prisma.message.create({ data: { sessionId: sid, role: 'user', content: body.content } });

    // prepare messages
    const messages = session.messages.map(m=>({ role: m.role as any, content: m.content })).concat([{ role: 'user', content: body.content }]);

    // find coach prompt
    const coach = (await fastify.inject({ method: 'GET', url: `/coaches/${session.coachId}` })).json();
    const systemPrompt = coach.systemPrompt || 'You are an assistant.';

    // memory injection if pro and exists
    let memoryBlock: string | undefined = undefined;
    const user = dbUser;
    const userWithContext = await fastify.prisma.user.findUnique({ where: { id: userId }, include: { context: true } });
    if(userWithContext?.entitlement === 'PRO' && userWithContext.context){
      memoryBlock = `User Context:\nrole:${userWithContext.context.role}\ntools:${userWithContext.context.tools}\ngoals:${userWithContext.context.goals}\nprefs:${userWithContext.context.prefs}`;
    }

    const assistantText = await generateAssistantReply({ systemPrompt, memoryBlock, messages });

    // enforce assistant message ending rules
    let assistantFinal = assistantText;
    if(!assistantFinal.includes('Next action:')) assistantFinal += '\n\nNext action: Provide one concrete next action.';

    const assistantMsg = await fastify.prisma.message.create({ data: { sessionId: sid, role: 'assistant', content: assistantFinal } });

    // increment usage count for free
    if(dbUser && dbUser.entitlement !== 'PRO'){
      await fastify.prisma.userDailyUsage.update({ where: { userId_date: { userId, date: dateOnly } }, data: { assistantReplies: { increment: 1 } } });
    }

    return { assistant: assistantMsg };
  });
}
