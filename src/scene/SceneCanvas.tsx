import { Canvas } from '@react-three/fiber';
import { Lights } from './Lights';
import { CameraRig, CAMERA_FOV, CAMERA_DIST } from './CameraRig';
import { HeroSculpture } from './HeroSculpture';
import { isSoftwareGL } from './useSceneGate';
import { sceneTier } from './tier';
import { sceneStore } from './store';
import './scene.css';

export default function SceneCanvas() {
  const tier = sceneTier(window.innerWidth, isSoftwareGL(), window.devicePixelRatio);
  return (
    <div className="scene" aria-hidden="true">
      <Canvas
        frameloop="demand"
        dpr={tier.dpr}
        camera={{ fov: CAMERA_FOV, position: [0, 0, CAMERA_DIST], near: 0.1, far: 50 }}
        shadows={tier.shadows}
        gl={{ antialias: tier.antialias, alpha: true, powerPreference: 'high-performance' }}
        // I2: a lost GPU context (driver crash, tab discard) leaves the canvas blank with no
        // React error to catch — flip the scene closed so Chapter's static fallback takes over.
        onCreated={({ gl }) => gl.domElement.addEventListener(
          'webglcontextlost',
          () => sceneStore.set({ sceneOpen: false }),
          { once: true },
        )}
      >
        <Lights shadows={tier.shadows} />
        <CameraRig />
        <HeroSculpture shadows={tier.shadows} />
      </Canvas>
    </div>
  );
}
