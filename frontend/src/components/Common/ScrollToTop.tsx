import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * react-router does not reset scroll on navigation — it leaves the window where it was, which on
 * a long page means the next one opens halfway down. It looked fine without this only because the
 * detail pages collapse to a short loading view and the browser clamps the offset; any navigation
 * that renders immediately would have kept the old position.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return null;
}
