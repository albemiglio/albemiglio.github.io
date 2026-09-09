import { Canvas } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { Lights } from './Lights';
import { CameraRig, CAMERA_FOV, CAMERA_DIST } from './CameraRig';
import { ChapterObjects } from './ChapterObjects';
import './scene.css';

export default function SceneCanvas() {
  const small = window.innerWidth < 768;
  return (
    <div className="scene" aria-hidden="true">
      <Canvas
        frameloop="demand"
        dpr={[1, Math.min(window.devicePixelRatio, 1.5)]}
        camera={{ fov: CAMERA_FOV, position: [0, 0, CAMERA_DIST], near: 0.1, far: 50 }}
        shadows={!small}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <Lights shadows={!small} />
        <CameraRig />
        <ChapterObjects />
        {!small && <ContactShadows position={[0, -2.2, 0]} opacity={0.35} scale={12} blur={2.5} far={4} />}
      </Canvas>
    </div>
  );
}
