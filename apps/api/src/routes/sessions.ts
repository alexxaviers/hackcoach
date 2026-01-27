import { FastifyInstance } from 'fastify';
import { generateAssistantReply } from '../services/openai';
import { z } from 'zod';

export default async function sessionRoutes(fastify: FastifyInstance){
  fastify.post('/sessions', async (req, reply) => {
    const { coachId } = req.body as any;
    const userId = (req.headers as any)['x-user-id'] || null;
    if(!userId) return reply.status(401).send({error:'Unauthorized'});
    // enforce free/pro
    const { data: user } = await fastify.supabase.from('users').select('id, entitlement').eq('id', userId).single();
    if(!user) return reply.status(401).send({error:'Unauthorized'});
    if(user.entitlement !== 'PRO' && coachId !== 'focus'){
      return reply.status(402).send({ error: 'Upgrade required' });
    }
    const { data: session, error } = await fastify.supabase.from('sessions').insert({ user_id: userId, coach_id: coachId }).select().single();
    if(error || !session) return reply.status(500).send({error:'Failed to create session'});
    return session;
  });

  fastify.get('/sessions', async (req, reply) => {
    const userId = (req.headers as any)['x-user-id'] || null;
    if(!userId) return reply.status(401).send({error:'Unauthorized'});
    const { data: sessions } = await fastify.supabase.from('sessions').select('*, messages(*)').eq('user_id', userId).order('created_at', { ascending: false });
    return sessions || [];
  });

  fastify.get('/sessions/:id', async (req, reply) => {
    const id = (req.params as any).id;
    const userId = (req.headers as any)['x-user-id'] || null;
    if(!userId) return reply.status(401).send({error:'Unauthorized'});
    const { data: session } = await fastify.supabase.from('sessions').select('*, messages(*)').eq('id', id).single();
    if(!session || session.user_id !== userId) return reply.status(404).send({error:'Not found'});
    return session;
  });

  const msgSchema = z.object({ content: z.string().min(1) });
  fastify.post('/sessions/:id/messages', async (req, reply) => {
    const sid = (req.params as any).id;
    const body = msgSchema.parse(req.body);
    const userId = (req.headers as any)['x-user-id'] || null;
    if(!userId) return reply.status(401).send({error:'Unauthorized'});
    const { data: session } = await fastify.supabase.from('sessions').select('*, messages(*)').eq('id', sid).single();
    if(!session || session.user_id !== userId) return reply.status(404).send({error:'Not found'});

    // Free daily limit enforcement
    const today = new Date();
    const dateOnly = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const { data: existingUsage } = await fastify.supabase.from('user_daily_usage').select('*').eq('user_id', userId).eq('date', dateOnly.toISOString()).single();
    let usage;
    if(existingUsage){
      usage = existingUsage;
    }else{
      const { data: newUsage } = await fastify.supabase.from('user_daily_usage').insert({ user_id: userId, date: dateOnly.toISOString(), assistant_replies: 0 }).select().single();
      usage = newUsage;
    }
    const { data: dbUser } = await fastify.supabase.from('users').select('id, entitlement').eq('id', userId).single();
    if(dbUser?.entitlement !== 'PRO'){
      if(usage && usage.assistant_replies >= 3) return reply.status(402).send({ error: 'Daily limit reached' });
    }

    // store user message
    const { data: userMsg } = await fastify.supabase.from('messages').insert({ session_id: sid, role: 'user', content: body.content }).select().single();

    // prepare messages
    const messages = (session.messages || []).map((m: any)=>({ role: m.role as any, content: m.content })).concat([{ role: 'user', content: body.content }]);

    // find coach prompt
    const coach = (await fastify.inject({ method: 'GET', url: `/coaches/${session.coach_id}` })).json();
    const systemPrompt = coach.systemPrompt || 'You are an assistant.';

    // memory injection if pro and exists
    let memoryBlock: string | undefined = undefined;
    const { data: userWithContext } = await fastify.supabase.from('users').select('*, user_context(*)').eq('id', userId).single();
    if(userWithContext?.entitlement === 'PRO' && userWithContext.user_context){
      const ctx = Array.isArray(userWithContext.user_context) ? userWithContext.user_context[0] : userWithContext.user_context;
      if(ctx && ctx.role){
        memoryBlock = `User Context:\nrole:${ctx.role}\ntools:${ctx.tools}\ngoals:${ctx.goals}\nprefs:${ctx.prefs}`;
      }
    }

    const assistantText = await generateAssistantReply({ systemPrompt, memoryBlock, messages });

    // enforce assistant message ending rules
    let assistantFinal = assistantText;
    if(!assistantFinal.includes('Next action:')) assistantFinal += '\n\nNext action: Provide one concrete next action.';

    const { data: assistantMsg } = await fastify.supabase.from('messages').insert({ session_id: sid, role: 'assistant', content: assistantFinal }).select().single();

    // increment usage count for free
    if(dbUser && dbUser.entitlement !== 'PRO' && usage){
      await fastify.supabase.from('user_daily_usage').update({ assistant_replies: (usage.assistant_replies || 0) + 1 }).eq('id', usage.id);
    }

    return { assistant: assistantMsg };
  });
}
