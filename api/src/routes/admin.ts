import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// All admin routes require authentication. Catalogue management is available to
// platform admins and channel owners; platform-wide admin tools remain ADMIN-only.
router.use(authenticate);
router.use('/library', requireRole('ADMIN', 'OWNER'));


const allowedSources = ['youtube', 'mp4', 'webm', 'hls', 'external'];
const validUrl = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) return false;
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol); } catch { return false; }
};

// GET /api/admin/library — catalogue management
router.get('/library', async (_req, res: Response) => {
  try {
    const items = await prisma.libraryContent.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ items });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/library — create a catalogue entry
router.post('/library', async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, posterUrl, videoUrl, sourceType, category, releaseYear, featured, visibility } = req.body;
    if (!title?.trim() || !validUrl(videoUrl) || !allowedSources.includes(sourceType))
      return res.status(400).json({ error: 'A title, valid video URL and supported source type are required' });
    if (posterUrl && !validUrl(posterUrl)) return res.status(400).json({ error: 'Poster URL must be a valid HTTP or HTTPS URL' });
    if (releaseYear !== undefined && releaseYear !== null && (!Number.isInteger(Number(releaseYear)) || Number(releaseYear) < 1888 || Number(releaseYear) > new Date().getFullYear() + 5))
      return res.status(400).json({ error: 'Release year is invalid' });
    if (visibility && !['PUBLIC', 'UNLISTED', 'PRIVATE'].includes(visibility))
      return res.status(400).json({ error: 'Invalid visibility' });
    const item = await prisma.libraryContent.create({ data: {
      title: title.trim(), description: description || null, posterUrl: posterUrl || null,
      videoUrl: videoUrl.trim(), sourceType, category: category?.trim() || 'Movies',
      releaseYear: releaseYear ? Number(releaseYear) : null, featured: Boolean(featured),
      visibility: visibility || 'UNLISTED',
    } });
    res.status(201).json({ item });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/admin/library/:id — edit or publish/unpublish
router.patch('/library/:id', async (req, res: Response) => {
  try {
    const { title, description, posterUrl, videoUrl, sourceType, category, releaseYear, featured, visibility } = req.body;
    if (videoUrl !== undefined && !validUrl(videoUrl)) return res.status(400).json({ error: 'Video URL must be a valid HTTP or HTTPS URL' });
    if (posterUrl && !validUrl(posterUrl)) return res.status(400).json({ error: 'Poster URL must be a valid HTTP or HTTPS URL' });
    if (sourceType !== undefined && !allowedSources.includes(sourceType)) return res.status(400).json({ error: 'Unsupported source type' });
    if (visibility !== undefined && !['PUBLIC', 'UNLISTED', 'PRIVATE'].includes(visibility)) return res.status(400).json({ error: 'Invalid visibility' });
    const item = await prisma.libraryContent.update({ where: { id: req.params.id }, data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description || null }),
      ...(posterUrl !== undefined && { posterUrl: posterUrl || null }),
      ...(videoUrl !== undefined && { videoUrl: videoUrl.trim() }),
      ...(sourceType !== undefined && { sourceType }),
      ...(category !== undefined && { category: category.trim() || 'Movies' }),
      ...(releaseYear !== undefined && { releaseYear: releaseYear ? Number(releaseYear) : null }),
      ...(featured !== undefined && { featured: Boolean(featured) }),
      ...(visibility !== undefined && { visibility }),
    } });
    res.json({ item });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/admin/library/:id
router.delete('/library/:id', async (req, res: Response) => {
  try {
    await prisma.libraryContent.delete({ where: { id: req.params.id } });
    res.json({ message: 'Catalogue item deleted' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// The remaining platform-wide administration endpoints are ADMIN-only.
router.use(requireRole('ADMIN'));

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
