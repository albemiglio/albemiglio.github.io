import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { PMREMGenerator } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// A metal has no diffuse term: with scene.environment empty it shows only the specular hits of
// the lights and reads as a black slab. The room is generated, so there is no HDRI to download.
export function StudioEnvironment() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = pmrem.fromScene(room, 0.04);
    scene.environment = target.texture;
    scene.environmentIntensity = 0.5;
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
