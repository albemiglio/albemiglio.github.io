import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

// `frameloop="demand"` renders only on invalidate(), and the store's signature check only fires
// once the rAF-gated rect readers have run — a frame late. The DOM frames move with the page the
// instant it scrolls (the compositor does that), so that late frame is one where the projected
// screen and the frames disagree. Asking for a render straight off the scroll event closes it:
// the request costs nothing when nothing moved, since the render itself is still on demand.
export function ScrollSync() {
  const { invalidate } = useThree();
  useEffect(() => {
    const ask = () => invalidate();
    window.addEventListener('scroll', ask, { passive: true });
    window.addEventListener('resize', ask);
    return () => { window.removeEventListener('scroll', ask); window.removeEventListener('resize', ask); };
  }, [invalidate]);
  return null;
}
