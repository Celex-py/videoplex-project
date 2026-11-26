import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/channels — public list
router.get('/', async (_req, res: Response) => {
  try {
    const channels = await prisma.channel.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { videos: true, playlists: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(channels);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/channels/me — must be before /:id
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const channel = await prisma.channel.findUnique({
      where: { ownerId: req.user!.userId },
      include: {
        videos:    { orderBy: { createdAt: 'desc' }, include: { _count: { select: { playlistItems: true } } } },
        playlists: { include: { items: { include: { video: true }, orderBy: { order: 'asc' } } } },
        owner:     { select: { id: true, name: true, email: true } },
      },
    });
    if (!channel)
      return res.status(404).json({ error: 'Channel not found. Create one first.' });
    res.json(channel);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/channels — create channel
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Channel name is required' });

    const existing = await prisma.channel.findUnique({ where: { ownerId: req.user!.userId } });
    if (existing) return res.status(409).json({ error: 'You already have a channel' });

    const nameTaken = await prisma.channel.findUnique({ where: { name } });
    if (nameTaken) return res.status(409).json({ error: 'Channel name already taken' });

    const channel = await prisma.channel.create({
      data: { name, description, ownerId: req.user!.userId },
    });

    await prisma.user.update({ where: { id: req.user!.userId }, data: { role: 'OWNER' } });
    res.status(201).json(channel);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/channels/me
router.patch('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const channel = await prisma.channel.findUnique({ where: { ownerId: req.user!.userId } });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    const { name, description, logo, banner } = req.body;
    if (name && name !== channel.name) {
      const taken = await prisma.channel.findUnique({ where: { name } });
      if (taken) return res.status(409).json({ error: 'Channel name already taken' });
    }

    const updated = await prisma.channel.update({
      where: { id: channel.id },
      data: {
        ...(name        !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(logo        !== undefined && { logo }),
        ...(banner      !== undefined && { banner }),
      },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/channels/me — full cascade in a transaction
// DELETE /api/channels/me — owner-only channel removal with dependent content cleanup
router.delete('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user!.userId;
    const channel = await prisma.channel.findUnique({
      where: { ownerId },
      include: { videos: { select: { id: true } } },
    });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    await prisma.$transaction(async (tx) => {
      const videoIds = channel.videos.map((video) => video.id);
      await tx.playlistItem.deleteMany({ where: { videoId: { in: videoIds } } });
      await tx.video.deleteMany({ where: { channelId: channel.id } });
      await tx.playlistItem.deleteMany({ where: { playlist: { channelId: channel.id } } });
      await tx.playlist.deleteMany({ where: { channelId: channel.id } });
      await tx.liveStream.deleteMany({ where: { channelId: channel.id } });
      await tx.channel.delete({ where: { id: channel.id, ownerId } });
      // Channel ownership is separate from platform ADMIN privileges.
      await tx.user.updateMany({ where: { id: ownerId, role: 'OWNER' }, data: { role: 'VIEWER' } });
    });

    res.json({ message: 'Channel and associated content deleted' });
  } catch (err: any) {
    console.error('Channel deletion failed:', err);
    res.status(500).json({ error: 'Could not delete channel. No changes were applied.' });
  }
});

// GET /api/channels/:id — public channel page
router.get('/:id', async (req, res: Response) => {
  try {
    const channel = await prisma.channel.findUnique({
      where: { id: req.params.id },
      include: {
        videos:    { where: { visibility: 'PUBLIC', status: 'READY' }, orderBy: { createdAt: 'desc' } },
        playlists: { include: { items: { include: { video: true }, orderBy: { order: 'asc' } } } },
        owner:     { select: { id: true, name: true } },
        _count:    { select: { videos: true } },
      },
    });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    res.json(channel);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
