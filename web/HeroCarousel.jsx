import { useEffect, useRef, useState } from "react";
import "./HeroCarousel.css";

const SLIDES = [
  { id: "home", title: "Your Streaming Platform", description: "Trending movies, shows, live channels and creator streams — all in one place, ready when you are.", image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1800&q=85", kicker: "TRENDING NOW", meta: "Global movies · Series · Live" },
  { id: "news", title: "News", description: "Stay ahead with breaking stories, live alerts and rolling coverage from around the world.", image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1800&q=85", kicker: "BREAKING", meta: "Live newsroom · Real-time updates", ticker: "BREAKING  •  GLOBAL MARKETS UPDATE  •  WEATHER ALERTS  •  WORLD NEWS LIVE" },
  { id: "football", title: "Live Football", description: "Catch the action with live score tickers, match coverage and the fixtures everyone is watching.", image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1800&q=85", kicker: "LIVE MATCH", meta: "Scores · Fixtures · Highlights", score: "ARS 2  —  1 CHE", fixture: "Next fixture · 20:00 · Champions Night" },
  { id: "music", title: "Music Videos", description: "Turn up the volume with fresh releases, neon visuals, album art and artist spotlights.", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1800&q=85", kicker: "NOW PLAYING", meta: "New releases · Artist spotlight", artist: "AYRA STARR", track: "Rhythm After Dark" },
  { id: "movies", title: "Movies & Cartoons", description: "Blockbusters for movie night and colorful animated adventures for the whole family.", image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1800&q=85", kicker: "FAMILY NIGHT", meta: "Blockbusters · Animation · Kids" },
];

export default function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef(null);
  const slide = SLIDES[active];

  const next = () => setActive((index) => (index + 1) % SLIDES.length);
  const previous = () => setActive((index) => (index - 1 + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    if (paused) return undefined;
    const timer = window.setInterval(next, 7000);
    return () => window.clearInterval(timer);
  }, [paused]);

  const onTouchStart = (event) => { touchStart.current = event.touches[0]?.clientX ?? null; };
  const onTouchEnd = (event) => {
    if (touchStart.current === null) return;
    const end = event.changedTouches[0]?.clientX ?? touchStart.current;
    const distance = end - touchStart.current;
    touchStart.current = null;
    if (Math.abs(distance) < 45) return;
    if (distance < 0) next(); else previous();
  };

  return (
    <section className="hero-carousel" aria-label="Videoplex featured categories"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="hero-carousel-media" key={slide.id}>
        <img src={slide.image} alt="" aria-hidden="true" />
        <div className="hero-carousel-wash" />
        <div className="hero-carousel-glow" />
      </div>

      <div className="hero-carousel-content">
        <div className="hero-carousel-copy">
          <span className="hero-carousel-kicker">{slide.kicker}</span>
          <h2>{slide.title}</h2>
          <p>{slide.description}</p>
          {slide.id === "news" && <div className="hero-news-ticker"><b>LIVE</b><span>{slide.ticker}</span></div>}
          {slide.id === "football" && <div className="hero-football-meta"><div className="hero-score">{slide.score}</div><div className="hero-fixture">{slide.fixture}</div></div>}
          {slide.id === "music" && <div className="hero-music-meta"><div className="hero-album-art">♪</div><div><strong>{slide.artist}</strong><span>{slide.track}</span></div></div>}
          {slide.id === "movies" && <div className="hero-family-posters" aria-hidden="true"><span className="hero-poster movie-poster">BLOCKBUSTER</span><span className="hero-poster cartoon-poster">TOON<br />WORLD</span></div>}
          <span className="hero-meta">{slide.meta}</span>
        </div>
      </div>

      <button type="button" className="hero-edge-arrow hero-edge-arrow-prev" onClick={previous} aria-label="Previous slide">‹</button>
      <button type="button" className="hero-edge-arrow hero-edge-arrow-next" onClick={next} aria-label="Next slide">›</button>

      <div className="hero-carousel-counter">{String(active + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}</div>
    </section>
  );
}
