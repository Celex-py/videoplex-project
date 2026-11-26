import { Router, Response } from 'express';
import Mux from '@mux/mux-node';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const mux = new Mux({
  tokenId: process.env.MUX_ACCESS_TOKEN!,
  tokenSecret: process.env.MUX_SECRET_KEY!,
});

async function ownsVideo(userId: string, videoId: string) {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: { channel: true },
  });
  return video?.channel.ownerId === userId ? video : null;
}

// ── STATIC ROUTES FIRST — prevents :id from swallowing "upload-url" / "confirm" ──

// GET /api/videos/upload-url
router.get('/upload-url', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const channel = await prisma.channel.findUnique({ where: { ownerId: req.user!.userId } });
    if (!channel)
      return res.status(400).json({ error: 'Create a channel before uploading' });

    const upload = await mux.video.uploads.create({
      cors_origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      new_asset_settings: { playback_policy: ['public'], mp4_support: 'standard' },
    });

    res.json({ url: upload.url, uploadId: upload.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/videos/confirm
router.post('/confirm', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { uploadId, title, description, visibility = 'PUBLIC' } = req.body;
    if (!uploadId || !title)
      return res.status(400).json({ error: 'uploadId and title are required' });

    const channel = await prisma.channel.findUnique({ where: { ownerId: req.user!.userId } });
    if (!channel)
      return res.status(400).json({ error: 'Channel not found. Create one first.' });

    const upload = await mux.video.uploads.retrieve(uploadId);

    const video = await prisma.video.create({
      data: {
        title,
        description,
        visibility: visibility as any,
        channelId: channel.id,
        // Store asset_id if Mux has already linked it; otherwise store the upload id
        // as a temporary key. The video.upload.asset_created webhook corrects it.
        muxAssetId: upload.asset_id ?? uploadId,
        status: 'PROCESSING',
      },
    });

    res.status(201).json(video);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/videos — public feed
router.get('/', async (req, res: Response) => {
  try {
    const { q, channelId, limit = '24', cursor } = req.query as Record<string, string>;
    const where: any = { status: 'READY', visibility: 'PUBLIC' };
    if (q) where.title = { contains: q, mode: 'insensitive' };
    if (channelId) where.channelId = channelId;

    const take = Math.min(parseInt(limit) || 24, 100);
    const videos = await prisma.video.findMany({
      where,
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'desc' },
      include: { channel: { select: { id: true, name: true, logo: true } } },
    });

    res.json({ videos, nextCursor: videos.length === take ? videos[videos.length - 1].id : null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/videos/:id/playback — must be before GET /:id
router.get('/:id/playback', async (req, res: Response) => {
  try {
    const video = await prisma.video.findUnique({ where: { id: req.params.id } });
    if (!video) return res.status(404).json({ error: 'Video not found' });
    if (video.status !== 'READY' || !video.muxPlaybackId)
      return res.status(202).json({ error: 'Video is still processing' });

    res.json({
      playbackId:   video.muxPlaybackId,
      hlsUrl:       `https://stream.mux.com/${video.muxPlaybackId}.m3u8`,
      thumbnailUrl: `https://image.mux.com/${video.muxPlaybackId}/thumbnail.jpg`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/videos/:id
router.get('/:id', async (req, res: Response) => {
  try {
    const video = await prisma.video.findUnique({
      where: { id: req.params.id },
      include: { channel: { select: { id: true, name: true, logo: true, ownerId: true } } },
    });
    if (!video) return res.status(404).json({ error: 'Video not found' });
    if (video.visibility === 'PRIVATE')
      return res.status(403).json({ error: 'This video is private' });

    prisma.video.update({ where: { id: video.id }, data: { views: { increment: 1 } } }).catch(() => {});
    res.json(video);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/videos/:id
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const video = await ownsVideo(req.user!.userId, req.params.id);
    if (!video) return res.status(403).json({ error: 'Not authorized' });

    const { title, description, visibility, thumbnail } = req.body;
    const updated = await prisma.video.update({
      where: { id: video.id },
      data: {
        ...(title       !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(visibility  !== undefined && { visibility }),
        ...(thumbnail   !== undefined && { thumbnail }),
      },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/videos/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const video = await ownsVideo(req.user!.userId, req.params.id);
    if (!video) return res.status(403).json({ error: 'Not authorized' });

    if (video.muxAssetId) {
      mux.video.assets.delete(video.muxAssetId).catch((e) =>
        console.warn('Mux delete warning:', e.message)
      );
    }

    await prisma.playlistItem.deleteMany({ where: { videoId: video.id } });
    await prisma.video.delete({ where: { id: video.id } });
    res.json({ message: 'Video deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
