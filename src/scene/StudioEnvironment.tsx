import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { PMREMGenerator } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * What the devices' metal reflects.
 *
 * The chassis and rails are `metallic: 1.0`, and a metal has no diffuse term: with nothing in
 * `scene.environment` it can only show the specular hits of the three directional lights, so an
 * aluminium unibody renders as a black slab with a few white streaks across it — which is what
 * made the devices read as cheap however carefully they were modelled. A pre-filtered room gives
 * every metal surface a gradient to catch, and the same lights then read as highlights on top of
 * a body that has form.
 *
 * The room is generated, not fetched: no HDRI download, and the PMREM is built once per canvas.
 */
export function StudioEnvironment() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = pmrem.fromScene(room, 0.04);
    scene.environment = target.texture;
    // The room is a bright white studio. At full strength the metal mirrors it and the devices
    // become the brightest thing on a near-black page, pulling the eye off the product UI they
    // exist to frame. Half strength keeps the gradient and lets them sit in the page.
    scene.environmentIntensity = 0.5;
    // frameloop="demand": the environment lands outside React's render, so nothing would repaint
    // with it until the next scroll.
    invalidate();
    return () => {
      scene.environment = null;
      scene.environmentIntensity = 1;
      target.dispose();
      room.dispose?.();
      pmrem.dispose();
    };
  }, [gl, scene, invalidate]);

  return null;
}
