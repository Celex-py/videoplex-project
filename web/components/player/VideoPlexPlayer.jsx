import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Hls from 'hls.js';
import './VideoPlexPlayer.css';

function formatTime(value) {
  if (!Number.isFinite(value) || value < 0) return '0:00';
  const seconds = Math.floor(value);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export default function VideoPlexPlayer({
  src,
  type = 'mp4',
  sources = [],
  title = 'Now playing',
  isLive = false,
  autoPlay = true,
  poster,
  className = '',
}) {
  const frameRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  const sourceList = useMemo(
    () => [src, ...sources].filter(Boolean).map(item =>
      typeof item === 'string' ? { url: item, type } : item
    ),
    [src, type, sources]
  );
  const sourceKey = sourceList.map(item => `${item.type || type}:${item.url}`).join('|');

  const retry = useCallback(() => {
    setErrorMessage('');
    setStatus('loading');
    setAttempt(value => value + 1);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !sourceList.length) {
      setStatus('error');
      setErrorMessage('No playable video source was provided.');
      return undefined;
    }

    let cancelled = false;
    let activeIndex = 0;
    let hls = null;

    const destroyHls = () => {
      if (hls) {
        hls.destroy();
        hls = null;
      }
      hlsRef.current = null;
    };

    const cleanMedia = () => {
      destroyHls();
      video.pause();
      video.removeAttribute('src');
      video.load();
    };

    const playWhenReady = () => {
      if (cancelled) return;
      setStatus('ready');
      if (autoPlay) video.play().catch(() => setPlaying(false));
    };

    const nextSource = () => {
      if (cancelled) return;
      activeIndex += 1;
      if (activeIndex < sourceList.length) {
        startSource();
      } else {
        setStatus('error');
        setErrorMessage('This stream could not be played. Check the connection or try again.');
      }
    };

    const startSource = () => {
      if (cancelled) return;
      const current = sourceList[activeIndex];
      if (!current?.url) {
        nextSource();
        return;
      }

      destroyHls();
      video.pause();
      video.removeAttribute('src');
      video.load();
      setStatus('loading');
      setErrorMessage('');

      const currentType = String(current.type || type).toLowerCase();
      if (currentType === 'hls' || /\.m3u8(?:$|\?)/i.test(current.url)) {
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = current.url;
          video.load();
        } else if (Hls.isSupported()) {
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 30,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            manifestLoadingMaxRetry: 4,
            levelLoadingMaxRetry: 4,
            fragLoadingMaxRetry: 5,
          });
          hlsRef.current = hls;
          hls.loadSource(current.url);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, playWhenReady);
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (cancelled || !data.fatal) return;
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              try {
                hls.recoverMediaError();
                return;
              } catch {
                // Move to the next source below.
              }
            }
            nextSource();
          });
        } else {
          nextSource();
        }
      } else {
        video.src = current.url;
        video.load();
      }
    };

    const handleMetadata = () => {
      if (!cancelled) {
        setDuration(Number.isFinite(video.duration) ? video.duration : 0);
        setStatus('ready');
        if (autoPlay) video.play().catch(() => setPlaying(false));
      }
    };
    const handlePlaying = () => { if (!cancelled) { setPlaying(true); setStatus('ready'); } };
    const handlePause = () => { if (!cancelled) setPlaying(false); };
    const handleTime = () => {
      if (!cancelled) {
        setCurrentTime(video.currentTime || 0);
        if (Number.isFinite(video.duration)) setDuration(video.duration);
      }
    };
    const handleError = () => {
      if (!cancelled && video.error) nextSource();
    };

    video.addEventListener('loadedmetadata', handleMetadata);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTime);
    video.addEventListener('durationchange', handleTime);
    video.addEventListener('error', handleError);
    startSource();

    return () => {
      cancelled = true;
      video.removeEventListener('loadedmetadata', handleMetadata);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTime);
      video.removeEventListener('durationchange', handleTime);
      video.removeEventListener('error', handleError);
      cleanMedia();
    };
  }, [sourceKey, attempt, autoPlay, type]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted = muted;
  }, [volume, muted]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  const seek = value => {
    const video = videoRef.current;
    if (!video || isLive || !Number.isFinite(video.duration)) return;
    video.currentTime = Number(value);
    setCurrentTime(Number(value));
  };

  const toggleFullscreen = () => {
    const frame = frameRef.current;
    if (!frame) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else frame.requestFullscreen?.();
  };

  const toggleMute = () => setMuted(value => !value);

  return (
    <div ref={frameRef} className={`vp-player ${className}`}>
      <div className="vp-player-screen">
        <video
          ref={videoRef}
          className="vp-player-video"
          playsInline
          preload="auto"
          poster={poster}
          onClick={togglePlayback}
        />
        {status === 'loading' && (
          <div className="vp-player-overlay">
            <span className="vp-player-spinner" />
            <strong>Connecting to {isLive ? 'live stream' : 'video'}…</strong>
            <small>{title}</small>
          </div>
        )}
        {status === 'error' && (
          <div className="vp-player-overlay vp-player-error">
            <span className="vp-player-error-icon">!</span>
            <strong>Playback unavailable</strong>
            <small>{errorMessage}</small>
            <button type="button" className="vp-player-retry" onClick={retry}>Try again</button>
          </div>
        )}
        <div className="vp-player-topline">
          <div className="vp-player-title">{title}</div>
          {isLive && <span className="vp-player-live"><i /> LIVE</span>}
        </div>
        <div className="vp-player-controls">
          <button type="button" className="vp-control-play" onClick={togglePlayback} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? 'Ⅱ' : '▶'}
          </button>
          {!isLive && (
            <div className="vp-player-timeline">
              <span>{formatTime(currentTime)}</span>
              <input
                aria-label="Seek"
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={Math.min(currentTime, duration || 0)}
                onChange={event => seek(event.target.value)}
                disabled={!duration}
              />
              <span>{formatTime(duration)}</span>
            </div>
          )}
          {isLive && <span className="vp-live-label">You're watching live</span>}
          <button type="button" className="vp-control-icon" onClick={toggleMute} aria-label={muted || volume === 0 ? 'Unmute' : 'Mute'}>
            {muted || volume === 0 ? '×' : '◖'}
          </button>
          <input
            className="vp-volume"
            aria-label="Volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={muted ? 0 : volume}
            onChange={event => { setVolume(Number(event.target.value)); setMuted(false); }}
          />
          <button type="button" className="vp-control-icon" onClick={toggleFullscreen} aria-label="Fullscreen">⛶</button>
        </div>
      </div>
    </div>
  );
}
