import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { createPortal } from "react-dom";
import App from "../App.jsx";
import LiveTV from "../LiveTV.jsx";
import FeaturedStreams from "../FeaturedStreams.jsx";
import HeroCarousel from "../HeroCarousel.jsx";
import "../LiveTV.css";
import "../FeaturedStreams.css";
import "../HeroCarousel.css";
import "../Theme.css";

function SectionMount() {
  const [view, setView] = useState("home");
  const [host, setHost] = useState(null);

  useEffect(() => {
    const findHost = () => {
      const active = [...document.querySelectorAll(".sb .sbi.on, .mobile-nav button.active")];
      const label = active.map(el => el.textContent || "").join(" ").toLowerCase();
      const nextView = label.includes("spotlight") ? "spotlight" : label.includes("live tv") ? "live" : "home";
      const main = document.querySelector(".mn");
      const home = document.querySelector(".mn .pg");
      const nextHost = nextView === "home" ? home : main;
      if (main) main.classList.toggle("vp-section-standalone", nextView !== "home");
      setView(nextView);
      setHost(nextHost || null);
    };
    const observer = new MutationObserver(findHost);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
    const timer = window.setInterval(findHost, 350);
    findHost();
    return () => { observer.disconnect(); window.clearInterval(timer); };
  }, []);

  if (!host) return null;
  if (view === "spotlight") return createPortal(<FeaturedStreams />, host);
  if (view === "live") return createPortal(<LiveTV />, host);
  return createPortal(<><HeroCarousel /><FeaturedStreams /><LiveTV /></>, host);
}

function Root() {
  return (
    <React.StrictMode>
      <App />
      <SectionMount />
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
