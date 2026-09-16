import { Router } from 'express';

const router = Router();

const PLAYLIST_URL = 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8';
const CACHE_TTL_MS = 5 * 60 * 1000;

interface IptvChannel {
  id: string;
  name: string;
  logo: string;
  country: string;
  category: string;
  tvgId: string;
  streamUrl: string;
  type: 'hls' | 'youtube' | 'twitch' | 'other';
}

let cachedChannels: IptvChannel[] = [];
let cachedAt = 0;
let refreshPromise: Promise<IptvChannel[]> | null = null;

function attr(attrs: string, key: string): string {
  const match = attrs.match(new RegExp(`${key}="([^"]*)"`, 'i'));
  return match?.[1]?.trim() || '';
}

function classify(url: string): IptvChannel['type'] {
  const lower = url.toLowerCase();
  if (/\.m3u8(?:$|\?)/i.test(lower)) return 'hls';
  if (lower.includes('youtube.com/') || lower.includes('youtu.be/')) return 'youtube';
  if (lower.includes('twitch.tv/')) return 'twitch';
  return 'other';
}

function stableId(name: string, url: string): string {
  let hash = 2166136261;
  for (const char of `${name}|${url}`) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `iptv-${(hash >>> 0).toString(16)}`;
}

function parseM3U(text: string): IptvChannel[] {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const channels: IptvChannel[] = [];
  let pending: Omit<IptvChannel, 'streamUrl' | 'type' | 'id'> | null = null;

  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      const comma = line.indexOf(',');
      const metadata = comma >= 0 ? line.slice(0, comma) : line;
      const name = (comma >= 0 ? line.slice(comma + 1) : attr(metadata, 'tvg-name')) || 'Unknown channel';
      const group = attr(metadata, 'group-title');

      pending = {
        name: attr(metadata, 'tvg-name') || name.trim(),
        logo: attr(metadata, 'tvg-logo'),
        country: attr(metadata, 'tvg-country'),
        category: group,
        tvgId: attr(metadata, 'tvg-id'),
      };
      continue;
    }

    if (line.startsWith('#')) continue;
    if (!pending || !/^https?:\/\//i.test(line)) continue;

    const type = classify(line);
    channels.push({
      ...pending,
      id: stableId(pending.name, line),
      streamUrl: line,
      type,
    });
    pending = null;
  }

  return channels;
}

async function loadChannels(force = false): Promise<IptvChannel[]> {
  const fresh = cachedChannels.length > 0 && Date.now() - cachedAt < CACHE_TTL_MS;
  if (!force && fresh) return cachedChannels;
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch(PLAYLIST_URL, {
    headers: { 'User-Agent': 'Videoplex/1.0 IPTV reader' },
    signal: AbortSignal.timeout(20_000),
  })
    .then(async response => {
      if (!response.ok) throw new Error(`Playlist returned ${response.status}`);
      return parseM3U(await response.text());
    })
    .then(channels => {
      cachedChannels = channels;
      cachedAt = Date.now();
      return channels;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

router.get('/channels', async (req, res) => {
  try {
    const force = req.query.refresh === '1';
    const all = await loadChannels(force);

    const q = String(req.query.q || '').trim().toLowerCase();
    const country = String(req.query.country || '').trim().toLowerCase();
    const category = String(req.query.category || '').trim().toLowerCase();
    const type = String(req.query.type || '').trim().toLowerCase();

    const filtered = all.filter(channel => {
      const matchesQ = !q || `${channel.name} ${channel.tvgId} ${channel.country} ${channel.category}`.toLowerCase().includes(q);
      const matchesCountry = !country || channel.country.toLowerCase() === country;
      const matchesCategory = !category || channel.category.toLowerCase() === category;
      const matchesType = !type || channel.type === type;
      return matchesQ && matchesCountry && matchesCategory && matchesType;
    });

    const offset = Math.max(0, Number(req.query.offset || 0));
    const limit = Math.min(60, Math.max(1, Number(req.query.limit || 24)));
    const items = filtered.slice(offset, offset + limit);

    const countries = [...new Set(all.map(c => c.country).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const categories = [...new Set(all.map(c => c.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));

    res.json({
      items,
      total: filtered.length,
      offset,
      limit,
      hasMore: offset + items.length < filtered.length,
      source: PLAYLIST_URL,
      cachedAt: cachedAt ? new Date(cachedAt).toISOString() : null,
      countries,
      categories,
    });
  } catch (error) {
    console.error('IPTV playlist error:', error);
    res.status(502).json({ error: 'Unable to load the live TV playlist right now.' });
  }
});

export default router;
