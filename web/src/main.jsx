import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { createPortal } from "react-dom";
import App from "../App.jsx";
import LiveTV from "../LiveTV.jsx";
import "../LiveTV.css";

function LiveTVMount() {
  const [host, setHost] = useState(null);

  useEffect(() => {
    const findHost = () => {
      const home = [...document.querySelectorAll('.sbi.on')].find(el => el.textContent?.includes('Home'));
      const nextHost = home ? document.querySelector('.mn .pg') : null;
      setHost(nextHost || null);
    };

    const observer = new MutationObserver(findHost);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
    const timer = window.setInterval(findHost, 500);
    findHost();

    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, []);

  if (!host) return null;
  return createPortal(<LiveTV />, host);
}

function Root() {
  return (
    <React.StrictMode>
      <App />
      <LiveTVMount />
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
