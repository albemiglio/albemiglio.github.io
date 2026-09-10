import { Canvas } from '@react-three/fiber';
import { Lights } from './Lights';
import { StudioEnvironment } from './StudioEnvironment';
import { CameraRig, CAMERA_FOV, CAMERA_DIST } from './CameraRig';
import { ChapterObjects } from './ChapterObjects';
import { HeroSculpture } from './HeroSculpture';
import { ScrollSync } from './ScrollSync';
import { isSoftwareGL } from './useSceneGate';
import { sceneTier } from './tier';
import { sceneStore } from './store';
import './scene.css';

export default function SceneCanvas() {
  // A CPU rasteriser pays for every fragment: pre-filtering an environment map is several heavy
  // blur passes it cannot afford (it hung CI's SwiftShader runner past a two-minute screenshot
  // timeout), and a hero that asks for a frame every tick starves everything else. Both are
  // comfort, not correctness, so they come off there — the metals go flat and the ring stands
  // still, which is the right trade on a machine with no GPU.
  const software = isSoftwareGL();
  const tier = sceneTier(window.innerWidth, software, window.devicePixelRatio);
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
        <ScrollSync />
        {!software && <StudioEnvironment />}
        <Lights shadows={tier.shadows} />
        <CameraRig />
        <ChapterObjects shadows={tier.shadows} />
        <HeroSculpture still={software} />
      </Canvas>
    </div>
  );
}
