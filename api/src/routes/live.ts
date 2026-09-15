import { Router, Response } from 'express';
import Mux from '@mux/mux-node';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const mux = new Mux({
  tokenId: process.env.MUX_ACCESS_TOKEN!,
  tokenSecret: process.env.MUX_SECRET_KEY!,
});

async function ownsStream(userId: string, streamId: string) {
  const stream = await prisma.liveStream.findUnique({
    where: { id: streamId },
    include: { channel: true },
  });
  return stream?.channel.ownerId === userId ? stream : null;
}

// ── STATIC ROUTES before /:id ───────────────────────────────────────────────

// GET /api/live/active — public live streams (must be before GET /:id)
router.get('/active', async (_req, res: Response) => {
  try {
    const streams = await prisma.liveStream.findMany({
      where: { status: 'LIVE' },
      include: { channel: { select: { id: true, name: true, logo: true } } },
      orderBy: { startedAt: 'desc' },
    });
    res.json(streams);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/live — owner's own streams
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const channel = await prisma.channel.findUnique({ where: { ownerId: req.user!.userId } });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    const streams = await prisma.liveStream.findMany({
      where: { channelId: channel.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(streams);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/live — create live stream + Mux live stream
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, scheduledAt } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const channel = await prisma.channel.findUnique({ where: { ownerId: req.user!.userId } });
    if (!channel) return res.status(400).json({ error: 'Channel not found' });

    const muxStream = await mux.video.liveStreams.create({
      playback_policy: ['public'],
      new_asset_settings: { playback_policy: ['public'] },
      reconnect_window: 60,
    });

    const stream = await prisma.liveStream.create({
      data: {
        title,
        description,
        channelId: channel.id,
        streamKey: muxStream.stream_key!,
        ingestUrl: 'rtmps://global-live.mux.com:443/app',
        playbackId: muxStream.playback_ids?.[0]?.id,
        status: 'SCHEDULED',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
    });

    res.status(201).json({
      ...stream,
      hlsUrl: stream.playbackId ? `https://stream.mux.com/${stream.playbackId}.m3u8` : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/live/:id
router.get('/:id', async (req, res: Response) => {
  try {
    const stream = await prisma.liveStream.findUnique({
      where: { id: req.params.id },
      include: { channel: { select: { id: true, name: true, logo: true } } },
    });
    if (!stream) return res.status(404).json({ error: 'Stream not found' });

    res.json({
      ...stream,
      hlsUrl: stream.playbackId ? `https://stream.mux.com/${stream.playbackId}.m3u8` : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/live/:id/end
router.post('/:id/end', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const stream = await ownsStream(req.user!.userId, req.params.id);
    if (!stream) return res.status(403).json({ error: 'Not authorized' });

    // Disable via Mux live stream ID (not stream key)
    try {
      await mux.video.liveStreams.disable(req.params.id);
    } catch {
      // May already be idle — continue
    }

    const updated = await prisma.liveStream.update({
      where: { id: stream.id },
      data: { status: 'ENDED', endedAt: new Date() },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/live/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const stream = await ownsStream(req.user!.userId, req.params.id);
    if (!stream) return res.status(403).json({ error: 'Not authorized' });

    await prisma.liveStream.delete({ where: { id: stream.id } });
    res.json({ message: 'Stream deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
