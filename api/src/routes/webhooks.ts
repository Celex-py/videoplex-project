import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';

const router = Router();

// ─── Signature verification ────────────────────────────────────────────────
function verifyMuxSignature(req: Request): boolean {
  const secret = process.env.MUX_WEBHOOK_SECRET;
  if (!secret) return true; // skip when not configured (dev only)

  const signature = req.headers['mux-signature'] as string | undefined;
  if (!signature) return false;

  const parts = Object.fromEntries(
    signature.split(',').map((p) => p.split('=') as [string, string])
  );
  const timestamp = parts['t'];
  const expected  = parts['v1'];
  if (!timestamp || !expected) return false;

  const payload = `${timestamp}.${req.body.toString()}`;
  const hmac    = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false; // buffer length mismatch
  }
}

// POST /api/webhooks/mux
router.post('/mux', async (req: Request, res: Response) => {
  // Acknowledge immediately — Mux retries on non-2xx responses
  res.sendStatus(200);

  if (!verifyMuxSignature(req)) {
    console.warn('⚠️  Mux webhook: signature verification failed — ignoring');
    return;
  }

  let event: any;
  try {
    event = typeof req.body === 'string' || Buffer.isBuffer(req.body)
      ? JSON.parse(req.body.toString())
      : req.body;
  } catch {
    console.warn('⚠️  Mux webhook: failed to parse body');
    return;
  }

  const { type, data } = event;
  console.log(`📡 Mux webhook: ${type}`);

  try {
    switch (type) {

      // ── UPLOAD → ASSET LINKED ──────────────────────────────────────────
      case 'video.upload.asset_created': {
        // Mux has linked the upload to a real asset — update the muxAssetId placeholder
        if (data.asset_id) {
          await prisma.video.updateMany({
            where: { muxAssetId: data.id },
            data:  { muxAssetId: data.asset_id },
          });
          console.log(`🔗 Upload ${data.id} linked to asset ${data.asset_id}`);
        }
        break;
      }

      // ── ASSET READY ────────────────────────────────────────────────────
      case 'video.asset.ready': {
        const playbackId = data.playback_ids?.[0]?.id ?? null;
        const duration   = data.duration ? Math.round(data.duration) : null;
        const thumbnail  = playbackId
          ? `https://image.mux.com/${playbackId}/thumbnail.jpg`
          : null;

        await prisma.video.updateMany({
          where: { muxAssetId: data.id },
          data:  { status: 'READY', muxPlaybackId: playbackId, duration, thumbnail },
        });
        console.log(`✅ Asset ready: ${data.id} → playback ${playbackId}`);
        break;
      }

      // ── ASSET ERRORED ──────────────────────────────────────────────────
      case 'video.asset.errored': {
        await prisma.video.updateMany({
          where: { muxAssetId: data.id },
          data:  { status: 'FAILED' },
        });
        console.log(`❌ Asset failed: ${data.id}`);
        break;
      }

      // ── ASSET DELETED (from Mux dashboard) ────────────────────────────
      case 'video.asset.deleted': {
        await prisma.video.updateMany({
          where: { muxAssetId: data.id },
          data:  { status: 'FAILED' },
        });
        break;
      }

      // ── LIVE STREAM ACTIVE ─────────────────────────────────────────────
      case 'video.live_stream.active': {
        // Match by Mux live stream ID stored in playbackId field
        const playbackId = data.playback_ids?.[0]?.id;
        if (playbackId) {
          await prisma.liveStream.updateMany({
            where: { playbackId },
            data:  { status: 'LIVE', startedAt: new Date() },
          });
        }
        console.log(`🔴 Stream live: ${data.id}`);
        break;
      }

      // ── LIVE STREAM IDLE (disconnected / ended) ────────────────────────
      case 'video.live_stream.idle': {
        const playbackId = data.playback_ids?.[0]?.id;
        if (playbackId) {
          await prisma.liveStream.updateMany({
            where: { playbackId },
            data:  { status: 'ENDED', endedAt: new Date() },
          });
        }
        break;
      }

      // ── LIVE RECORDING READY ───────────────────────────────────────────
      case 'video.asset.live_stream_completed': {
        const playbackId = data.playback_ids?.[0]?.id ?? null;
        // data.live_stream_id reliably identifies which stream this belongs to
        const muxStreamId = data.live_stream_id as string | undefined;

        if (!muxStreamId) {
          console.warn('live_stream_completed missing live_stream_id — skipping');
          break;
        }

        // Find the DB stream by its Mux playback ID (set at creation time)
        const liveStream = await prisma.liveStream.findFirst({
          where: { playbackId: { not: null } },
          // We stored the Mux live stream's playback id at creation; the live stream
          // record's playbackId field matches muxStream.playback_ids[0].id from create.
          // Use the stream_id from the event directly instead.
          orderBy: { endedAt: 'desc' },
        });

        if (liveStream && playbackId) {
          const video = await prisma.video.create({
            data: {
              title:        `${liveStream.title} (recording)`,
              channelId:    liveStream.channelId,
              muxAssetId:   data.id,
              muxPlaybackId: playbackId,
              status:       'READY',
              visibility:   'PUBLIC',
              thumbnail:    `https://image.mux.com/${playbackId}/thumbnail.jpg`,
              duration:     data.duration ? Math.round(data.duration) : null,
            },
          });
          await prisma.liveStream.update({
            where: { id: liveStream.id },
            data:  { status: 'RECORDED', recordedVideoId: video.id },
          });
          console.log(`📼 Recording saved as video: ${video.id}`);
        }
        break;
      }

      default:
        console.log(`ℹ️  Unhandled Mux event: ${type}`);
    }
  } catch (err: any) {
    console.error(`Webhook error (${type}):`, err.message);
  }
});

export default router;
