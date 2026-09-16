import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import './FeaturedStreams.css';

const STREAMS = [
  { id: 'sintel', name: 'Sintel Trailer', type: 'mp4', url: 'https://media.w3.org/2010/05/sintel/trailer.mp4', meta: 'Featured video' },
  { id: 'kntv', name: 'KN TV', type: 'hls', url: 'https://cdn4.yayin.com.tr/kntv/tracks-v1a1/mono.m3u8', meta: 'Live stream' },
  { id: 'football', name: 'Football Spotlight', type: 'webm', url: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/VIDEO-2026-05-21-22-53-29.webm', meta: 'Football video' },
  { id: 'city-life', name: 'Big City Life', type: 'webm', url: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Big_City_Life.webm', meta: 'City video' },
  { id: 'aforevo', name: 'Aforevo Live', type: 'hls', url: 'https://feeds.aforevo.com/masslink/r=live_65323240f20911ee95dad7a8d3bcb8ba/playlist.m3u8', meta: 'Live stream' },
];

function isHls(stream) { return stream.type === 'hls'; }

function StreamPreview({ stream }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const cleanup = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.pause();
      video.removeAttribute('src');
      video.load();
    };

    if (isHls(stream)) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream.url;
        video.play().catch(() => {});
      } else if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 15,
          maxBufferLength: 20,
          manifestLoadingMaxRetry: 2,
          levelLoadingMaxRetry: 2,
          fragLoadingMaxRetry: 2,
        });
        hlsRef.current = hls;
        hls.loadSource(stream.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      }
    } else {
      video.src = stream.url;
      video.play().catch(() => {});
    }

    return cleanup;
  }, [stream]);

  return (
    <video
      ref={videoRef}
      className="featured-preview-video"
      muted
      autoPlay
      loop={!isHls(stream)}
      playsInline
      preload="metadata"
    />
  );
}

function Player({ stream, onClose }) {
  const [status, setStatus] = useState('loading');
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const cleanup = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.pause();
      video.removeAttribute('src');
      video.load();
    };

    const ready = () => {
      setStatus('ready');
      video.play().catch(() => {});
    };
    const error = () => setStatus('error');

    video.addEventListener('loadedmetadata', ready);
    video.addEventListener('error', error);

    if (isHls(stream)) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream.url;
      } else if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          maxBufferLength: 30,
          backBufferLength: 30,
          manifestLoadingMaxRetry: 3,
          levelLoadingMaxRetry: 3,
          fragLoadingMaxRetry: 4,
        });
        hlsRef.current = hls;
        hls.loadSource(stream.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, ready);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) setStatus('error');
        });
      } else {
        setStatus('error');
      }
    } else {
      video.src = stream.url;
    }

    return () => {
      video.removeEventListener('loadedmetadata', ready);
      video.removeEventListener('error', error);
      cleanup();
    };
  }, [stream]);

  return (
    <div className="featured-modal" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="featured-player-card">
        <div className="featured-player-head">
          <div><span className="featured-live-dot" /> {isHls(stream) ? 'LIVE' : 'VIDEO'}<h3>{stream.name}</h3></div>
          <button onClick={onClose}>Close</button>
        </div>
        <div className="featured-stage">
          <video ref={videoRef} controls playsInline preload="auto" />
          {status === 'loading' && <div className="featured-state">Connecting to video…</div>}
          {status === 'error' && <div className="featured-state">This video is unavailable right now.</div>}
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
              <StreamPreview stream={stream} />
              <div className="featured-play">▶</div>
              <span className="featured-badge">{isHls(stream) ? 'LIVE' : 'VIDEO'}</span>
            </div>
            <div className="featured-info"><strong>{stream.name}</strong><span>{stream.meta}</span></div>
          </button>
        ))}
      </div>
      {active && <Player stream={active} onClose={() => setActive(null)} />}
    </section>
  );
}
