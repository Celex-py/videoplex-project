import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Hls from 'hls.js';
import './VideoPlexPlayer.css';

const EMPTY_SOURCES = [];
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function formatTime(value) {
  if (!Number.isFinite(value) || value < 0) return '0:00';
  const seconds = Math.floor(value);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}` : `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function Icon({ name, size = 20 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    play: <><path d="m8 5 12 7-12 7z" fill="currentColor" stroke="none" /></>,
    pause: <><path d="M8 5h3v14H8zM15 5h3v14h-3z" fill="currentColor" stroke="none" /></>,
    volume: <><path d="M4 10v4h4l5 4V6l-5 4H4z" /><path d="M16 9a5 5 0 0 1 0 6M18.5 6.5a9 9 0 0 1 0 11" /></>,
    mute: <><path d="M4 10v4h4l5 4V6l-5 4H4z" /><path d="m17 9 5 6m0-6-5 6" /></>,
    fullscreen: <><path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3" /></>,
    shrink: <><path d="M8 3v5H3m13-5v5h5M3 16h5v5m13-5h-5v5" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.8 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.8-1l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.8-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.8 1l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2z" transform="translate(-1 -1) scale(1.08)" /></>,
    pip: <><rect x="3" y="4" width="18" height="16" rx="2" /><rect x="12" y="12" width="7" height="5" rx="1" fill="currentColor" stroke="none" /></>,
    back: <><path d="M11 5 4 12l7 7" /><path d="M20 12H4" /></>,
    forward: <><path d="m13 5 7 7-7 7" /><path d="M4 12h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  };
  return <svg {...common}>{paths[name] || null}</svg>;
}

export default function VideoPlexPlayer({
  src,
  type = 'mp4',
  sources = EMPTY_SOURCES,
  title = 'Now playing',
  isLive = false,
  autoPlay = true,
  poster,
  className = '',
}) {
  const frameRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const hideTimerRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const sourceList = useMemo(() => [src, ...sources].filter(Boolean).map(item => typeof item === 'string' ? { url: item, type } : item), [src, type, sources]);
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
      if (hls) { hls.destroy(); hls = null; }
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
      if (activeIndex < sourceList.length) startSource();
      else {
        setStatus('error');
        setErrorMessage('This stream could not be played. Check the connection or try again.');
      }
    };
    const startSource = () => {
      if (cancelled) return;
      const current = sourceList[activeIndex];
      if (!current?.url) { nextSource(); return; }
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
          hls = new Hls({ enableWorker: true, lowLatencyMode: false, backBufferLength: 30, maxBufferLength: 30, maxMaxBufferLength: 60, manifestLoadingMaxRetry: 4, levelLoadingMaxRetry: 4, fragLoadingMaxRetry: 5 });
          hlsRef.current = hls;
          hls.loadSource(current.url);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, playWhenReady);
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (cancelled || !data.fatal) return;
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              try { hls.recoverMediaError(); return; } catch { /* fall through to fallback source */ }
            }
            nextSource();
          });
        } else nextSource();
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
    const handleError = () => { if (!cancelled && video.error) nextSource(); };
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
    video.playbackRate = playbackRate;
  }, [volume, muted, playbackRate]);

  useEffect(() => {
    const onFullscreen = () => setFullscreen(document.fullscreenElement === frameRef.current);
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => document.removeEventListener('fullscreenchange', onFullscreen);
  }, []);

  useEffect(() => () => window.clearTimeout(hideTimerRef.current), []);

  const revealControls = () => {
    setControlsVisible(true);
    window.clearTimeout(hideTimerRef.current);
    if (playing && !settingsOpen) {
      hideTimerRef.current = window.setTimeout(() => setControlsVisible(false), 3200);
    }
  };
  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
    revealControls();
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
  const skip = amount => {
    const video = videoRef.current;
    if (video && !isLive) video.currentTime = Math.min(Math.max(0, video.currentTime + amount), duration || video.currentTime + amount);
  };
  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video || !document.pictureInPictureEnabled) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch { /* PiP may be unavailable for this stream */ }
  };

  return (
    <div
      ref={frameRef}
      className={`vp-player ${fullscreen ? 'is-fullscreen' : ''} ${controlsVisible ? 'controls-visible' : 'controls-hidden'} ${className}`}
      onMouseMove={revealControls}
      onMouseEnter={revealControls}
      onMouseLeave={() => { if (playing && !settingsOpen) setControlsVisible(false); }}
      onTouchStart={revealControls}
      onDoubleClick={event => { if (event.target === videoRef.current) toggleFullscreen(); }}
      onKeyDown={event => {
        if (['INPUT', 'BUTTON', 'SELECT'].includes(event.target.tagName)) return;
        if (event.key === ' ' || event.key.toLowerCase() === 'k') { event.preventDefault(); togglePlayback(); }
        if (!isLive && event.key === 'ArrowLeft') skip(-10);
        if (!isLive && event.key === 'ArrowRight') skip(10);
        if (event.key.toLowerCase() === 'f') toggleFullscreen();
        if (event.key.toLowerCase() === 'm') toggleMute();
      }}
      tabIndex={0}
      aria-label={`Video player: ${title}`}
    >
      <div className="vp-player-screen">
        <video ref={videoRef} className="vp-player-video" playsInline preload="auto" poster={poster} onClick={togglePlayback} />
        <div className="vp-player-vignette" />
        <div className="vp-player-topline">
          <div className="vp-player-brand"><span className="vp-brand-mark">V</span><span>VIDEOPLEX</span><span className="vp-player-title-inline">{title}</span></div>
          <div className="vp-player-top-actions">
            {isLive && <span className="vp-player-live"><i /> LIVE</span>}
            <button type="button" className="vp-icon-button" onClick={toggleFullscreen} aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}><Icon name={fullscreen ? 'shrink' : 'fullscreen'} /></button>
          </div>
        </div>
        {status === 'loading' && <div className="vp-player-overlay"><span className="vp-player-spinner" /><strong>Preparing your stream</strong><small>{title}</small></div>}
        {status === 'error' && <div className="vp-player-overlay vp-player-error"><span className="vp-player-error-icon">!</span><strong>Playback unavailable</strong><small>{errorMessage}</small><button type="button" className="vp-player-retry" onClick={retry}>Try again</button></div>}
        {status === 'ready' && !playing && <button type="button" className="vp-center-play" onClick={togglePlayback} aria-label="Play"><Icon name="play" size={30} /></button>}
        <div className="vp-player-controls">
          <div className="vp-control-row">
            <button type="button" className="vp-main-play" onClick={togglePlayback} aria-label={playing ? 'Pause' : 'Play'}><Icon name={playing ? 'pause' : 'play'} size={19} /></button>{!isLive && <button type="button" className="vp-icon-button vp-skip-button" onClick={() => skip(-10)} aria-label="Back 10 seconds"><Icon name="back" size={18} /><span>10</span></button>}
            {!isLive && <div className="vp-timeline"><span>{formatTime(currentTime)}</span><span className="vp-time-divider">/</span><span>{formatTime(duration)}</span></div>}
            {isLive && <div className="vp-live-caption"><span className="vp-live-pulse" /> You're watching live</div>}
            {!isLive && <button type="button" className="vp-icon-button vp-skip-button" onClick={() => skip(10)} aria-label="Forward 10 seconds"><Icon name="forward" size={18} /><span>10</span></button>}
            <div className="vp-control-spacer" />
            <div className="vp-volume-control">
              <button type="button" className="vp-icon-button" onClick={toggleMute} aria-label={muted || volume === 0 ? 'Unmute' : 'Mute'}><Icon name={muted || volume === 0 ? 'mute' : 'volume'} /></button>
              <input aria-label="Volume" type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={event => { setVolume(Number(event.target.value)); setMuted(false); }} style={{ '--vp-progress': `${(muted ? 0 : volume) * 100}%` }} />
            </div>
            <div className="vp-settings-wrap">
              <button type="button" className={`vp-icon-button ${settingsOpen ? 'is-active' : ''}`} onClick={() => { setSettingsOpen(value => !value); setControlsVisible(true); }} aria-label="Playback settings"><Icon name="settings" /></button>
              {settingsOpen && <div className="vp-settings-menu"><span>Playback speed</span>{SPEEDS.map(speed => <button type="button" key={speed} className={playbackRate === speed ? 'selected' : ''} onClick={() => { setPlaybackRate(speed); setSettingsOpen(false); }}>{speed === 1 ? 'Normal' : `${speed}×`}{playbackRate === speed && <b>✓</b>}</button>)}</div>}
            </div>
            {!isLive && document.pictureInPictureEnabled && <button type="button" className="vp-icon-button vp-pip" onClick={togglePiP} aria-label="Picture in picture"><Icon name="pip" /></button>}
            <button type="button" className="vp-icon-button" onClick={toggleFullscreen} aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}><Icon name={fullscreen ? 'shrink' : 'fullscreen'} /></button>
          </div>
          {!isLive && <div className="vp-progress-wrap"><input className="vp-progress" aria-label="Video progress" type="range" min="0" max={duration || 0} step="0.1" value={Math.min(currentTime, duration || 0)} onChange={event => seek(event.target.value)} disabled={!duration} style={{ '--vp-progress': `${duration ? (currentTime / duration) * 100 : 0}%` }} /></div>}
        </div>
      </div>
    </div>
  );
}
