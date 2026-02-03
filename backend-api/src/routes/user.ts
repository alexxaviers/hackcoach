import { Router } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { supabase } from '../db';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const contextSchema = z.object({
  context_data: z.record(z.string()),
});

// Get user's context (questionnaire answers)
router.get('/context', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('user_context')
      .select('id, context_data, chat_id, created_at, updated_at')
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save/update user context for a chat
router.post('/context/:chatId?', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { chatId } = req.params;
    const { context_data } = contextSchema.parse(req.body);

    if (chatId) {
      // Verify ownership
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('id')
        .eq('id', chatId)
        .eq('user_id', req.user.id)
        .single();

      if (chatError || !chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }

      // Check if context exists for this chat
      const { data: existing } = await supabase
        .from('user_context')
        .select('id')
        .eq('chat_id', chatId)
        .eq('user_id', req.user.id)
        .single();

      if (existing) {
        const { data, error } = await supabase
          .from('user_context')
          .update({
            context_data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return res.json(data);
      }
    }

    // Insert new context
    const { data, error } = await supabase
      .from('user_context')
      .insert({
        user_id: req.user.id,
        chat_id: chatId || null,
        context_data,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
