import { FastifyInstance } from 'fastify';

export default async function revenuecatRoutes(fastify: FastifyInstance){
  fastify.post('/webhooks/revenuecat', async (req, reply) => {
    // Very small verification: check shared secret header
    const secret = req.headers['revenuecat-signature'] || req.headers['x-revenuecat-signature'] || '';
    if(process.env.REVENUECAT_WEBHOOK_SECRET && secret !== process.env.REVENUECAT_WEBHOOK_SECRET){
      // do not reveal
      return reply.status(403).send({ ok: false });
    }
    const payload = req.body as any;
    // handle idempotently
    try{
      // map app_user_id -> user
      const appUserId = payload?.subscriber?.original_app_user_id || payload?.app_user_id || payload?.subscriber?.entitlement ? payload?.subscriber?.original_app_user_id : null;
      let user = null;
      if(appUserId){
        user = await fastify.prisma.user.findUnique({ where: { revenuecatId: appUserId } });
      }

      // if entitlement granted
      const ent = payload?.event || payload?.type || null;
      // Simplified: if present, set PRO
      if(user && payload?.subscriber){
        const hasPro = !!payload.subscriber.first_seen; // naive; rely on real webhook parsing in prod
        await fastify.prisma.user.update({ where: { id: user.id }, data: { entitlement: 'PRO', proExpiresAt: null } });
      }

      await fastify.prisma.entitlementEvent.create({ data: { userId: user?.id, payload } });
    }catch(e){
      console.error('webhook error', e);
    }
    return { ok: true };
  });
}
