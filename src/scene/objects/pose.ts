export type Vec3 = [number, number, number];
export type PartPose = { offset: Vec3; rotation?: Vec3; scale?: number };
export type Pose = { parts: Record<string, PartPose> };
export const HIDDEN = 0.001; // scale for parts that are "not there" (scale 0 breaks matrix inversion)
