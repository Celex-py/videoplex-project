import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, requireRole('ADMIN'));

// GET /api/admin/stats
router.get('/stats', async (_req, res: Response) => {
  try {
    const [users, videos, channels, liveStreams, totalViewsAgg, readyVideos, processingVideos] =
      await Promise.all([
        prisma.user.count(),
        prisma.video.count(),
        prisma.channel.count(),
        prisma.liveStream.count({ where: { status: 'LIVE' } }),
        prisma.video.aggregate({ _sum: { views: true } }),
        prisma.video.count({ where: { status: 'READY' } }),
        prisma.video.count({ where: { status: 'PROCESSING' } }),
      ]);

    res.json({
      users, videos, readyVideos, processingVideos, channels,
      liveStreams, totalViews: totalViewsAgg._sum.views ?? 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res: Response) => {
  try {
    const { q, limit = '50', cursor } = req.query as Record<string, string>;
    const where: any = {};
    if (q) where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
      { name:  { contains: q, mode: 'insensitive' } },
    ];

    const take = Math.min(parseInt(limit) || 50, 200);
    const users = await prisma.user.findMany({
      where,
      select: { id: true, email: true, name: true, role: true, createdAt: true,
                channel: { select: { id: true, name: true } } },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users, nextCursor: users.length === take ? users[users.length - 1].id : null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', async (req, res: Response) => {
  try {
    const { role } = req.body;
    if (!['VIEWER', 'OWNER', 'ADMIN'].includes(role))
      return res.status(400).json({ error: 'Invalid role. Must be VIEWER | OWNER | ADMIN' });

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data:  { role },
      select: { id: true, email: true, name: true, role: true },
    });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/users/:id — cascade in a transaction
router.delete('/users/:id', async (req, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where:   { id: req.params.id },
      include: { channel: { include: { videos: { select: { id: true } } } } },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await prisma.$transaction(async (tx) => {
      if (user.channel) {
        const videoIds = user.channel.videos.map((v) => v.id);
        await tx.playlistItem.deleteMany({ where: { videoId:    { in: videoIds } } });
        await tx.video.deleteMany(       { where: { channelId:  user.channel.id } });
        await tx.playlistItem.deleteMany({ where: { playlist:   { channelId: user.channel.id } } });
        await tx.playlist.deleteMany(    { where: { channelId:  user.channel.id } });
        await tx.liveStream.deleteMany(  { where: { channelId:  user.channel.id } });
        await tx.channel.delete(         { where: { id:         user.channel.id } });
      }
      await tx.user.delete({ where: { id: req.params.id } });
    });

    res.json({ message: 'User and all their content deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/videos
router.get('/videos', async (req, res: Response) => {
  try {
    const { status, limit = '50' } = req.query as Record<string, string>;
    const where: any = {};
    if (status) where.status = status;

    const videos = await prisma.video.findMany({
      where,
      include: { channel: { select: { id: true, name: true } } },
      take: Math.min(parseInt(limit) || 50, 200),
      orderBy: { createdAt: 'desc' },
    });
    res.json(videos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/videos/:id/visibility
router.patch('/videos/:id/visibility', async (req, res: Response) => {
  try {
    const { visibility } = req.body;
    if (!['PUBLIC', 'UNLISTED', 'PRIVATE'].includes(visibility))
      return res.status(400).json({ error: 'Invalid visibility' });

    const video = await prisma.video.update({ where: { id: req.params.id }, data: { visibility } });
    res.json(video);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/videos/:id
router.delete('/videos/:id', async (req, res: Response) => {
  try {
    await prisma.$transaction([
      prisma.playlistItem.deleteMany({ where: { videoId: req.params.id } }),
      prisma.video.delete(           { where: { id:      req.params.id } }),
    ]);
    res.json({ message: 'Video deleted by admin' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
