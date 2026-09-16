import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Hls from 'hls.js';

const API_DEFAULT = 'http://localhost:4000';

function apiBase() {
  const raw = import.meta.env.VITE_API_URL || localStorage.getItem('videoplex_api_url') || API_DEFAULT;
  return String(raw).replace(/\/$/, '');
}

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase() || 'TV';
}

function LivePlayer({ channel, onClose }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const retryTimerRef = useRef(null);
  const [state, setState] = useState('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !channel?.streamUrl) return undefined;
    let cancelled = false;
    setState('loading');

    const cleanup = () => {
      if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.pause();
      video.removeAttribute('src');
      video.load();
    };

    const retryHls = (hls) => {
      if (cancelled) return;
      setState('loading');
      try { hls.startLoad(-1); } catch (_) {}
      retryTimerRef.current = window.setTimeout(() => {
        if (!cancelled && video.readyState < 2) setState('error');
      }, 12000);
    };

    // Safari/iOS has a native HLS implementation; use it first there.
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = channel.streamUrl;
      const onLoaded = () => { if (!cancelled) { setState('ready'); video.play().catch(() => {}); } };
      const onError = () => { if (!cancelled) setState('error'); };
      video.addEventListener('loadedmetadata', onLoaded);
      video.addEventListener('error', onError);
      return () => {
        cancelled = true;
        video.removeEventListener('loadedmetadata', onLoaded);
        video.removeEventListener('error', onError);
        cleanup();
      };
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 30,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        manifestLoadingMaxRetry: 3,
        manifestLoadingRetryDelay: 1000,
        levelLoadingMaxRetry: 4,
        levelLoadingRetryDelay: 1000,
        fragLoadingMaxRetry: 5,
        fragLoadingRetryDelay: 1000,
        fragLoadingTimeOut: 20000,
        manifestLoadingTimeOut: 15000,
        levelLoadingTimeOut: 15000,
      });
      hlsRef.current = hls;
      hls.loadSource(channel.streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (cancelled) return;
        setState('ready');
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (cancelled || !data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          retryHls(hls);
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          try { hls.recoverMediaError(); } catch (_) { setState('error'); }
        } else {
          setState('error');
        }
      });

      return () => {
        cancelled = true;
        cleanup();
      };
    }

    setState('unsupported');
    return cleanup;
  }, [channel, attempt]);

  const retry = () => {
    setState('loading');
    setAttempt(value => value + 1);
  };

  return (
    <div className="iptv-modal" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="iptv-player-card">
        <div className="iptv-player-head">
          <div>
            <div className="iptv-live-pill"><span /> LIVE TV</div>
            <div className="iptv-player-title">{channel.name}</div>
          </div>
          <button className="btn bg" onClick={onClose}>Close</button>
        </div>
        <div className="iptv-player-stage">
          <video ref={videoRef} controls playsInline preload="auto" />
          {state === 'loading' && <div className="iptv-player-state"><div className="spinner" /><div>Connecting to stream…</div><small>Trying the HLS stream</small></div>}
          {state === 'error' && <div className="iptv-player-state"><div style={{ fontSize: 24 }}>⚠</div><div>That stream could not be played right now.</div><small>The channel provider may be offline or blocking browser playback.</small><button className="btn bg" onClick={retry}>Try stream again</button></div>}
          {state === 'unsupported' && <div className="iptv-player-state"><div style={{ fontSize: 24 }}>▶</div><div>This browser does not support HLS playback.</div></div>}
        </div>
        <div className="iptv-player-meta">
          <div className="iptv-logo-small">{channel.logo ? <img src={channel.logo} alt="" /> : initials(channel.name)}</div>
          <div><div className="iptv-player-name">{channel.name}</div><div className="iptv-player-sub">{channel.country || 'International'}{channel.category ? ` · ${channel.category}` : ''}</div></div>
        </div>
      </div>
    </div>
  );
}

export default function LiveTV({ apiUrl }) {
  const base = useMemo(() => (apiUrl || apiBase()).replace(/\/$/, ''), [apiUrl]);
  const [channels, setChannels] = useState([]);
  const [countries, setCountries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState('');
  const [country, setCountry] = useState('');
  const [category, setCategory] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState(null);

  const load = useCallback(async (reset = false) => {
    setLoading(true);
    setError('');
    const nextOffset = reset ? 0 : offset;
    try {
      const params = new URLSearchParams({ limit: '30', offset: String(nextOffset), type: 'hls' });
      if (q.trim()) params.set('q', q.trim());
      if (country) params.set('country', country);
      if (category) params.set('category', category);
      const response = await fetch(`${base}/api/iptv/channels?${params}`);
      if (!response.ok) throw new Error('Unable to load live TV channels.');
      const data = await response.json();
      setChannels(prev => reset ? data.items : [...prev, ...data.items]);
      setCountries(data.countries || []);
      setCategories(data.categories || []);
      setHasMore(Boolean(data.hasMore));
      setOffset(nextOffset + data.items.length);
    } catch (err) {
      setError(err?.message || 'Unable to load live TV channels.');
    } finally {
      setLoading(false);
    }
  }, [base, q, country, category, offset]);

  useEffect(() => {
    const timer = setTimeout(() => load(true), 300);
    return () => clearTimeout(timer);
  }, [base, q, country, category]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="iptv-section">
      <div className="iptv-heading">
        <div>
          <div className="iptv-kicker"><span /> LIVE TV</div>
          <h2>Watch live channels</h2>
          <p>Browse live television from around the world, right inside Videoplex.</p>
        </div>
        <div className="iptv-count">{channels.length}{hasMore ? '+' : ''} channels loaded</div>
      </div>

      <div className="iptv-controls">
        <div className="iptv-search"><span>⌕</span><input value={q} onChange={e => { setQ(e.target.value); setOffset(0); }} placeholder="Search live channels…" /></div>
        <select value={country} onChange={e => { setCountry(e.target.value); setOffset(0); }}><option value="">All countries</option>{countries.map(x => <option key={x} value={x}>{x}</option>)}</select>
        <select value={category} onChange={e => { setCategory(e.target.value); setOffset(0); }}><option value="">All categories</option>{categories.map(x => <option key={x} value={x}>{x}</option>)}</select>
      </div>

      {loading && channels.length === 0 && <div className="iptv-state"><div className="spinner" /><div>Loading live channels…</div></div>}
      {error && <div className="errbanner">⚠ {error}<button className="btn bg" onClick={() => load(true)}>Try again</button></div>}
      {!loading && !error && channels.length === 0 && <div className="iptv-state"><div style={{ fontSize: 25 }}>📺</div><div>No live channels matched your search.</div></div>}

      {channels.length > 0 && <div className="iptv-grid">
        {channels.map(channel => (
          <button key={channel.id} className="iptv-card" onClick={() => setActive(channel)}>
            <div className="iptv-thumb">
              {channel.logo ? <img src={channel.logo} alt="" loading="lazy" onError={e => { e.currentTarget.style.display = 'none'; }} /> : <div className="iptv-fallback-logo">{initials(channel.name)}</div>}
              <div className="iptv-thumb-shade" />
              <div className="iptv-live-badge"><span /> LIVE</div>
              <div className="iptv-play">▶</div>
            </div>
            <div className="iptv-info">
              <div className="iptv-channel-avatar">{channel.logo ? <img src={channel.logo} alt="" loading="lazy" /> : initials(channel.name)}</div>
              <div className="iptv-copy"><div className="iptv-name">{channel.name}</div><div className="iptv-sub">{channel.country || 'International'}{channel.category ? ` · ${channel.category}` : ''}</div></div>
            </div>
          </button>
        ))}
      </div>}

      {hasMore && !loading && channels.length > 0 && <div className="iptv-more"><button className="btn bg" onClick={() => load(false)}>Load more channels</button></div>}
      {loading && channels.length > 0 && <div className="iptv-more"><div className="spinner" /></div>}

      {active && <LivePlayer channel={active} onClose={() => setActive(null)} />}
    </section>
  );
}
