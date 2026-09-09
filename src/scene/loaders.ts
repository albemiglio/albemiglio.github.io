import { useGLTF } from '@react-three/drei';
import { isSoftwareGL } from './useSceneGate';
import { sceneTier } from './tier';

const lowLod = () => typeof window !== 'undefined' && sceneTier(window.innerWidth, isSoftwareGL()).lod === 'low';

export function modelUrl(name: string) {
  return `/models/${name}${lowLod() ? '.low' : ''}.glb`;
}

// Meshopt-compressed GLBs; drei wires three's MeshoptDecoder when useMeshOpt is true.
export function useModel(name: string) {
  return useGLTF(modelUrl(name), false, true);
}

export function preloadModel(name: string) {
  useGLTF.preload(modelUrl(name), false, true);
}
