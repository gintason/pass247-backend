import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls to the top of the page whenever the route changes.
 *
 * React Router does not reset scroll position on navigation — the browser
 * keeps whatever offset the previous page had. So moving from a long page
 * (or any page the user had scrolled) to a new one leaves the visitor
 * partway down, which reads as "the page loaded showing the footer".
 *
 * Roughly a third of the page components worked around this with their own
 * `window.scrollTo(0, 0)` in a useEffect; the rest did not. Handling it once
 * here covers every route consistently, including ones added later.
 *
 * A hash link (#section) is left alone, so in-page anchors still work.
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;

    // 'instant' rather than smooth: this is a page change, not a nudge
    // within a page, and animating it makes navigation feel sluggish.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
