import { Router } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { supabase } from '../db';
import { OpenAI } from 'openai';
import { config } from '../config';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

const sendMessageSchema = z.object({
  content: z.string().min(1),
  context: z.record(z.string()).optional(),
});

// Get all messages for a chat
router.get('/:chatId', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { chatId } = req.params;

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

    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Send a message and get AI response
router.post('/:chatId/send', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { chatId } = req.params;
    const { content, context } = sendMessageSchema.parse(req.body);

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

    // Save user message
    const { data: userMessage, error: userMsgError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        role: 'user',
        content,
      })
      .select()
      .single();

    if (userMsgError) throw userMsgError;

    // Get conversation history for context
    const { data: messages, error: historyError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (historyError) throw historyError;

    // Build system message from context
    let systemContent = '';
    if (context && Object.keys(context).length > 0) {
      const contextLines = Object.entries(context)
        .map(([key, value]) => `- ${key}: ${value}`)
        .filter(line => !line.includes('(not answered)'));
      
      if (contextLines.length > 0) {
        systemContent = `User context from onboarding:\n${contextLines.join('\n')}`;
      }
    }

    // Build messages array for OpenAI
    const chatMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
    
    if (systemContent) {
      chatMessages.push({ role: 'system', content: systemContent });
    }

    chatMessages.push(...messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })));

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: chatMessages,
      max_tokens: 1024,
    });

    const assistantContent = response.choices[0]?.message?.content?.trim() || 'No response';

    // Save assistant message
    const { data: assistantMessage, error: assistantMsgError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        role: 'assistant',
        content: assistantContent,
      })
      .select()
      .single();

    if (assistantMsgError) throw assistantMsgError;

    res.json({
      userMessage,
      assistantMessage,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
