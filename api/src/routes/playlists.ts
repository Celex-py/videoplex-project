import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

async function ownsPlaylist(userId: string, playlistId: string) {
  const playlist = await prisma.playlist.findUnique({
    where:   { id: playlistId },
    include: { channel: true },
  });
  return playlist?.channel.ownerId === userId ? playlist : null;
}

// GET /api/playlists/:id — public
router.get('/:id', async (req, res: Response) => {
  try {
    const playlist = await prisma.playlist.findUnique({
      where:   { id: req.params.id },
      include: {
        channel: { select: { id: true, name: true, logo: true } },
        items:   {
          include: { video: { include: { channel: { select: { id: true, name: true } } } } },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    res.json(playlist);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/playlists
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const channel = await prisma.channel.findUnique({ where: { ownerId: req.user!.userId } });
    if (!channel) return res.status(400).json({ error: 'Channel not found' });

    const playlist = await prisma.playlist.create({ data: { name, description, channelId: channel.id } });
    res.status(201).json(playlist);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/playlists/:id
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const pl = await ownsPlaylist(req.user!.userId, req.params.id);
    if (!pl) return res.status(403).json({ error: 'Not authorized' });

    const updated = await prisma.playlist.update({
      where: { id: pl.id },
      data:  {
        ...(req.body.name        !== undefined && { name:        req.body.name }),
        ...(req.body.description !== undefined && { description: req.body.description }),
      },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/playlists/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const pl = await ownsPlaylist(req.user!.userId, req.params.id);
    if (!pl) return res.status(403).json({ error: 'Not authorized' });

    await prisma.$transaction([
      prisma.playlistItem.deleteMany({ where: { playlistId: pl.id } }),
      prisma.playlist.delete(        { where: { id:         pl.id } }),
    ]);
    res.json({ message: 'Playlist deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/playlists/:id/videos — add video
router.post('/:id/videos', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const pl = await ownsPlaylist(req.user!.userId, req.params.id);
    if (!pl) return res.status(403).json({ error: 'Not authorized' });

    const { videoId } = req.body;
    if (!videoId) return res.status(400).json({ error: 'videoId is required' });

    const last = await prisma.playlistItem.findFirst({
      where:   { playlistId: pl.id },
      orderBy: { order: 'desc' },
    });

    const item = await prisma.playlistItem.create({
      data:    { playlistId: pl.id, videoId, order: (last?.order ?? 0) + 1 },
      include: { video: true },
    });
    res.status(201).json(item);
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Video already in playlist' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/playlists/:id/videos/:videoId — remove video
router.delete('/:id/videos/:videoId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const pl = await ownsPlaylist(req.user!.userId, req.params.id);
    if (!pl) return res.status(403).json({ error: 'Not authorized' });

    await prisma.playlistItem.delete({
      where: { playlistId_videoId: { playlistId: pl.id, videoId: req.params.videoId } },
    });
    res.json({ message: 'Removed from playlist' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/playlists/:id/reorder — { items: [{id, order}] }
router.patch('/:id/reorder', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const pl = await ownsPlaylist(req.user!.userId, req.params.id);
    if (!pl) return res.status(403).json({ error: 'Not authorized' });

    const { items } = req.body as { items: { id: string; order: number }[] };
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items array is required' });

    await prisma.$transaction(
      items.map(({ id, order }) => prisma.playlistItem.update({ where: { id }, data: { order } }))
    );

    const updated = await prisma.playlist.findUnique({
      where:   { id: pl.id },
      include: { items: { include: { video: true }, orderBy: { order: 'asc' } } },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
