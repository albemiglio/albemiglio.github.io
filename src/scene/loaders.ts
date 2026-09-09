import { useGLTF } from '@react-three/drei';

const isSmall = () => typeof window !== 'undefined' && window.innerWidth < 768;

export function modelUrl(name: string) {
  return `/models/${name}${isSmall() ? '.low' : ''}.glb`;
}

// Meshopt-compressed GLBs; drei wires three's MeshoptDecoder when useMeshOpt is true.
export function useModel(name: string) {
  return useGLTF(modelUrl(name), false, true);
}

export function preloadModel(name: string) {
  useGLTF.preload(modelUrl(name), false, true);
}
