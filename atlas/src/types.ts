export type GeometryKind = "fragments" | "rings" | "cloud" | "voids" | "tunnel" | "spiral" | "cracks" | "sphere" | "cone" | "membrane" | "lattice" | "network" | "light";
export type FractalKind = "mandelbrot" | "julia" | "apollonian" | "sierpinski" | "koch";
export type ParticleMode = "collapse" | "orbit" | "sleep" | "separate" | "retreat" | "chase" | "repel" | "radiate" | "advance" | "float" | "connect" | "breathe" | "align" | "synchronize" | "emerge" | "rest" | "dissolve";

/** The renderer accepts only this DNA. No scene-specific code is permitted. */
export interface FieldDefinition {
  id: string;
  name: string;
  score: number;
  observation: string;
  color: string;
  gravity: { strength: number; direction: [number, number, number] };
  spatialCoherence: number;
  entropy: number;
  resonance: number;
  informationFlow: number;
  permeability: number;
  timeBehavior: { speed: number; looping: number; continuity: number };
  fieldLines: { density: number; integrity: number; tremor: number };
  particleBehavior: { mode: ParticleMode; speed: number; cohesion: number; visibility: number };
  dominantGeometry: { primary: GeometryKind; morph: number; scale: number };
  lightBehavior: { emission: number; absorption: number; scatter: number; bloom: number };
  cameraBehavior: { distance: number; orbit: number; drift: number; shake: number; orthographic: number };
  motionProfile: { acceleration: number; pulse: number; fluidity: number };
  shaderBehavior: { fractal: FractalKind; symmetry: number; recursion: number; distortion: number; matte: number };
  audioBehavior: { density: number; harmonicity: number; pulse: number; silence: number };
  interactionBehavior: { responsiveness: number; attraction: number; memory: number };
}
