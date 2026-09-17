import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import './FeaturedStreams.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const STREAMS = [
  { id: 'sintel', name: 'Sintel Trailer', type: 'mp4', url: 'https://media.w3.org/2010/05/sintel/trailer.mp4', meta: 'Featured video' },
  {
    id: 'kntv',
    name: 'KN TV',
    type: 'hls',
    url: 'https://cdn4.yayin.com.tr/kntv/tracks-v1a1/mono.m3u8',
    alternatives: ['https://cdn-1.pishow.tv/live/965/master.m3u8'],
    meta: 'Live stream',
  },
  { id: 'football', name: 'Football Spotlight', type: 'webm', url: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Latvia-Gibraltar%20football%202026-03-31.webm', meta: 'Football match preview' },
  { id: 'city-life', name: 'Big City Life', type: 'webm', url: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Big_City_Life.webm', meta: 'City video' },
  { id: 'aforevo', name: 'Aforevo Live', type: 'hls', url: 'https://feeds.aforevo.com/masslink/r=live_65323240f20911ee95dad7a8d3bcb8ba/playlist.m3u8', meta: 'Live stream' },
];

function isHls(stream) { return stream.type === 'hls'; }
function mediaUrl(stream, url) {
  if (!isHls(stream)) return url;
  return `${API_BASE}/api/iptv/proxy?url=${encodeURIComponent(url)}`;
}

function StreamPreview({ stream, onStatus }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const sourceIndexRef = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    const sources = [stream.url, ...(stream.alternatives || [])];
    let destroyed = false;
    const cleanup = () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      video.pause(); video.removeAttribute('src'); video.load();
    };
    const trySource = () => {
      if (destroyed) return;
      const source = sources[sourceIndexRef.current];
      if (!source) { onStatus('error'); return; }
      onStatus('checking');
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      if (isHls(stream)) {
        const proxied = mediaUrl(stream, source);
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = proxied; video.play().catch(() => {});
        } else if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: false, backBufferLength: 15, maxBufferLength: 20, manifestLoadingMaxRetry: 2, levelLoadingMaxRetry: 2, fragLoadingMaxRetry: 2 });
          hlsRef.current = hls; hls.loadSource(proxied); hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
          hls.on(Hls.Events.ERROR, (_event, data) => { if (data.fatal) { sourceIndexRef.current += 1; trySource(); } });
        }
      } else { video.src = source; video.play().catch(() => {}); }
    };
    const handlePlaying = () => onStatus('active');
    const handleError = () => { sourceIndexRef.current += 1; trySource(); };
    video.addEventListener('playing', handlePlaying); video.addEventListener('error', handleError); trySource();
    return () => { destroyed = true; video.removeEventListener('playing', handlePlaying); video.removeEventListener('error', handleError); cleanup(); };
  }, [stream, onStatus]);

  return <video ref={videoRef} className="featured-preview-video" muted autoPlay loop={!isHls(stream)} playsInline preload="auto" controls={false} disablePictureInPicture aria-hidden="true" />;
}

function Player({ stream, onClose }) {
  const [status, setStatus] = useState('loading');
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  useEffect(() => {
    const video = videoRef.current; if (!video) return undefined;
    const sources = [stream.url, ...(stream.alternatives || [])]; let sourceIndex = 0; let destroyed = false;
    const cleanup = () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } video.pause(); video.removeAttribute('src'); video.load(); };
    const trySource = () => {
      if (destroyed) return; const source = sources[sourceIndex]; if (!source) { setStatus('error'); return; } setStatus('loading');
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      if (isHls(stream)) {
        const proxied = mediaUrl(stream, source);
        if (video.canPlayType('application/vnd.apple.mpegurl')) video.src = proxied;
        else if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: false, maxBufferLength: 30, backBufferLength: 30, manifestLoadingMaxRetry: 3, levelLoadingMaxRetry: 3, fragLoadingMaxRetry: 4 });
          hlsRef.current = hls; hls.loadSource(proxied); hls.attachMedia(video); hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
          hls.on(Hls.Events.ERROR, (_event, data) => { if (data.fatal) { sourceIndex += 1; trySource(); } });
        } else setStatus('error');
      } else video.src = source;
    };
    const ready = () => { setStatus('ready'); video.play().catch(() => {}); };
    const playing = () => setStatus('ready'); const error = () => { sourceIndex += 1; trySource(); };
    video.addEventListener('loadedmetadata', ready); video.addEventListener('playing', playing); video.addEventListener('error', error); trySource();
    return () => { destroyed = true; video.removeEventListener('loadedmetadata', ready); video.removeEventListener('playing', playing); video.removeEventListener('error', error); cleanup(); };
  }, [stream]);
  return <div className="featured-modal" onClick={e => e.target === e.currentTarget && onClose()}><div className="featured-player-card"><div className="featured-player-head"><div><span className={`featured-live-dot ${status === 'ready' ? 'is-active' : ''}`} /> {isHls(stream) ? 'LIVE' : 'PREVIEW'}<h3>{stream.name}</h3></div><button onClick={onClose}>Close</button></div><div className="featured-stage"><video ref={videoRef} controls playsInline preload="auto" />{status === 'loading' && <div className="featured-state">Connecting to video…</div>}{status === 'error' && <div className="featured-state">This video is unavailable right now.</div>}</div></div></div>;
}

export default function FeaturedStreams() {
  const [active, setActive] = useState(null); const [statuses, setStatuses] = useState({});
  const updateStatus = (id, status) => setStatuses(prev => ({ ...prev, [id]: status }));
  return <section className="featured-streams">
    <div className="featured-heading"><div><div className="featured-kicker"><span /> CURATED</div><h2>Spotlight Streams</h2><p>A small hand-picked collection, separate from the main Live TV library.</p></div><span className="featured-count">{STREAMS.length} streams</span></div>
    <div className="featured-grid">
      {STREAMS.map(stream => {
        const status = statuses[stream.id] || 'checking'; const label = status === 'active' ? 'ACTIVE' : status === 'error' ? 'OFFLINE' : 'CHECKING';
        return <button className="featured-card" data-stream-id={stream.id} key={stream.id} onClick={() => setActive(stream)}>
          <div className="featured-thumb"><StreamPreview stream={stream} onStatus={value => updateStatus(stream.id, value)} /><div className="featured-play">▶</div><span className={`featured-badge status-${status}`}><span className="featured-status-dot" />{isHls(stream) ? 'LIVE' : 'PREVIEW'} · {label}</span></div>
          <div className="featured-info"><strong>{stream.name}</strong><span>{stream.meta}{stream.alternatives?.length ? ' · fallback available' : ''}</span></div>
        </button>;
      })}
    </div>
    {active && <Player stream={active} onClose={() => setActive(null)} />}
  </section>;
}
