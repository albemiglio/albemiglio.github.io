import { Canvas } from '@react-three/fiber';
import { Lights } from './Lights';
import { CameraRig, CAMERA_FOV, CAMERA_DIST } from './CameraRig';
import { ChapterObjects } from './ChapterObjects';
import { isSoftwareRenderer } from './useSceneGate';
import './scene.css';

export default function SceneCanvas() {
  const lite = window.innerWidth < 768 || isSoftwareRenderer();
  return (
    <div className="scene" aria-hidden="true">
      <Canvas
        frameloop="demand"
        dpr={lite ? 1 : [1, Math.min(window.devicePixelRatio, 1.5)]}
        camera={{ fov: CAMERA_FOV, position: [0, 0, CAMERA_DIST], near: 0.1, far: 50 }}
        shadows={!lite}
        gl={{ antialias: !lite, alpha: true, powerPreference: 'high-performance' }}
      >
        <Lights shadows={!lite} />
        <CameraRig />
        <ChapterObjects shadows={!lite} />
      </Canvas>
    </div>
  );
}
