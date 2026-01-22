import { FastifyInstance } from 'fastify';

const seedCoaches = [
  { id: 'focus', name: 'Focus Coach', description: 'Break tasks into next actions and timeboxes', isPremium: false, systemPrompt: 'You are the Focus Coach: break tasks into next actions, timebox, reduce overwhelm. Direct tone.' },
  { id: 'creator', name: 'Creator Coach', description: 'Consistency and content pipeline ideas', isPremium: true, systemPrompt: 'You are the Creator Coach: consistency, content pipeline ideas, repurposing. Practical.' },
  { id: 'builder', name: 'Builder Coach', description: 'Shipping mindset and MVP framing', isPremium: true, systemPrompt: 'You are the Builder Coach: shipping mindset, scope cuts, MVP framing, technical planning.' },
  { id: 'reflection', name: 'Reflection Coach', description: 'Weekly review and lessons', isPremium: true, systemPrompt: 'You are the Reflection Coach: weekly review, lessons, next week plan, gentle but structured.' }
];

export default async function coachRoutes(fastify: FastifyInstance){
  fastify.get('/coaches', async (req, reply) => {
    return seedCoaches;
  });

  fastify.get('/coaches/:id', async (req, reply) => {
    const id = (req.params as any).id;
    const c = seedCoaches.find(s=>s.id===id);
    if(!c) return reply.status(404).send({error:'Not found'});
    return c;
  });
}
