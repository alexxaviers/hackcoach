import { Router } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { supabase } from '../db';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const createChatSchema = z.object({
  title: z.string().min(1),
});

const updateChatSchema = z.object({
  title: z.string().min(1),
});

// Get all chats for the user
router.get('/', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('chats')
      .select('id, title, created_at, updated_at')
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new chat
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { title } = createChatSchema.parse(req.body);

    const { data, error } = await supabase
      .from('chats')
      .insert({
        user_id: req.user.id,
        title,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Update a chat (rename)
router.put('/:chatId', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { chatId } = req.params;
    const { title } = updateChatSchema.parse(req.body);

    // Verify ownership
    const { data: chat, error: fetchError } = await supabase
      .from('chats')
      .select('id')
      .eq('id', chatId)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const { data, error } = await supabase
      .from('chats')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', chatId)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a chat
router.delete('/:chatId', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { chatId } = req.params;

    // Verify ownership
    const { data: chat, error: fetchError } = await supabase
      .from('chats')
      .select('id')
      .eq('id', chatId)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId);

    if (error) throw error;

    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
