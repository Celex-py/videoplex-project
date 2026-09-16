import { useState } from 'react';
import Hls from 'hls.js';
import './FeaturedStreams.css';

const STREAMS = [
  { id: 'sintel', name: 'Sintel Trailer', type: 'mp4', url: 'https://media.w3.org/2010/05/sintel/trailer.mp4', meta: 'Featured video' },
  { id: 'kntv', name: 'KN TV', type: 'hls', url: 'https://cdn4.yayin.com.tr/kntv/tracks-v1a1/mono.m3u8', meta: 'Live stream' },
  { id: 'spotlight-1', name: 'Spotlight Channel 01', type: 'hls', url: 'https://jmp2.uk/plu-656df599c0fc8800089c75ab.m3u8', meta: 'Live stream' },
  { id: 'spotlight-2', name: 'Spotlight Channel 02', type: 'hls', url: 'https://jmp2.uk/plu-62ac405b3874370007419b7f.m3u8', meta: 'Live stream' },
  { id: 'aforevo', name: 'Aforevo Live', type: 'hls', url: 'https://feeds.aforevo.com/masslink/r=live_65323240f20911ee95dad7a8d3bcb8ba/playlist.m3u8', meta: 'Live stream' },
];

function Player({ stream, onClose }) {
  const [status, setStatus] = useState('loading');

  const attachHls = (video) => {
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = stream.url;
      video.onloadedmetadata = () => { setStatus('ready'); video.play().catch(() => {}); };
      video.onerror = () => setStatus('error');
      return () => { video.pause(); video.removeAttribute('src'); video.load(); };
    }
    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false, maxBufferLength: 30, backBufferLength: 30, manifestLoadingMaxRetry: 3, levelLoadingMaxRetry: 3, fragLoadingMaxRetry: 4 });
      hls.loadSource(stream.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { setStatus('ready'); video.play().catch(() => {}); });
      hls.on(Hls.Events.ERROR, (_e, data) => { if (data.fatal) setStatus('error'); });
      return () => { hls.destroy(); video.pause(); video.removeAttribute('src'); video.load(); };
    }
    setStatus('error');
    return () => {};
  };

  const ref = (video) => {
    if (!video) return;
    const cleanup = stream.type === 'mp4' ? (() => {
      video.src = stream.url;
      const loaded = () => { setStatus('ready'); video.play().catch(() => {}); };
      const error = () => setStatus('error');
      video.addEventListener('loadedmetadata', loaded);
      video.addEventListener('error', error);
      return () => { video.removeEventListener('loadedmetadata', loaded); video.removeEventListener('error', error); video.pause(); video.removeAttribute('src'); video.load(); };
    })() : attachHls(video);
    video._featuredCleanup = cleanup;
  };

  return (
    <div className="featured-modal" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="featured-player-card">
        <div className="featured-player-head">
          <div><span className="featured-live-dot" /> {stream.type === 'mp4' ? 'FEATURED VIDEO' : 'LIVE'}<h3>{stream.name}</h3></div>
          <button onClick={onClose}>Close</button>
        </div>
        <div className="featured-stage">
          <video ref={ref} controls playsInline preload="auto" />
          {status === 'loading' && <div className="featured-state">Connecting to stream…</div>}
          {status === 'error' && <div className="featured-state">This stream is unavailable right now.</div>}
        </div>
      </div>
    </div>
  );
}

export default function FeaturedStreams() {
  const [active, setActive] = useState(null);
  return (
    <section className="featured-streams">
      <div className="featured-heading">
        <div><div className="featured-kicker"><span /> CURATED</div><h2>Spotlight Streams</h2><p>A small hand-picked collection, separate from the main Live TV library.</p></div>
        <span className="featured-count">{STREAMS.length} streams</span>
      </div>
      <div className="featured-grid">
        {STREAMS.map(stream => (
          <button className="featured-card" key={stream.id} onClick={() => setActive(stream)}>
            <div className="featured-thumb">
              <div className="featured-thumb-bg" />
              <div className="featured-play">▶</div>
              <span className="featured-badge">{stream.type === 'mp4' ? 'VIDEO' : 'LIVE'}</span>
            </div>
            <div className="featured-info"><strong>{stream.name}</strong><span>{stream.meta}</span></div>
          </button>
        ))}
      </div>
      {active && <Player stream={active} onClose={() => setActive(null)} />}
    </section>
  );
}
