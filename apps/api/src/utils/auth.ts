import jwt from 'jsonwebtoken';
import { FastifyReply } from 'fastify';

export function signAccess(payload: object){
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET || 'dev', { expiresIn: '15m' });
}

export function signRefresh(payload: object){
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'dev_refresh', { expiresIn: '30d' });
}

export function sendUnauthorized(reply: FastifyReply){
  return reply.status(401).send({error:'Unauthorized'});
}
