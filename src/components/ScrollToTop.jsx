import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      document.querySelectorAll(".content-container").forEach((container) => {
        container.scrollTop = 0;
        container.scrollLeft = 0;
      });
    };

    resetScroll();
    const frameId = window.requestAnimationFrame(resetScroll);

    return () => window.cancelAnimationFrame(frameId);
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
