import express from 'express';
import cors from 'cors';
import { config } from './config';

import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chats';
import messageRoutes from './routes/messages';
import userRoutes from './routes/user';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/chats', chatRoutes);
app.use('/chats/:chatId/messages', messageRoutes);
app.use('/user', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const port = config.server.port;
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📝 Environment: ${config.server.nodeEnv}`);
});
