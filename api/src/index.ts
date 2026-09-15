import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load env before any other imports that read process.env
dotenv.config();

import authRoutes     from './routes/auth';
import channelRoutes  from './routes/channels';
import videoRoutes    from './routes/videos';
import playlistRoutes from './routes/playlists';
import liveRoutes     from './routes/live';
import adminRoutes    from './routes/admin';
import webhookRoutes  from './routes/webhooks';

const app  = express();
const port = process.env.PORT || 4000;

// 1. CORS — before body parsers so OPTIONS preflight works correctly
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 2. Raw body for Mux webhook signature verification (must come BEFORE express.json)
app.use('/api/webhooks/mux', express.raw({ type: 'application/json' }));

// 3. JSON parser for all other routes
app.use(express.json());

// 4. Routes
app.use('/api/auth',      authRoutes);
app.use('/api/channels',  channelRoutes);
app.use('/api/videos',    videoRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/live',      liveRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/webhooks',  webhookRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// 5. Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
