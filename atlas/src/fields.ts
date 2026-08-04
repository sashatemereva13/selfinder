import type { FieldDefinition, FractalKind, GeometryKind, ParticleMode } from "./types";

type Seed = {
  id: string; name: string; score: number; color: string; observation: string;
  geometry: GeometryKind; particles: ParticleMode; fractal: FractalKind;
  gravity: [number, number, number, number]; time: [number, number, number];
  camera: [number, number, number, number, number];
};

const seeds: Seed[] = [
  { id:"shame", name:"Shame", score:20, color:"160,112,106", observation:"What disappears when being seen feels dangerous?", geometry:"fragments", particles:"collapse", fractal:"apollonian", gravity:[1,0,0,0], time:[.18,.05,.18], camera:[7.2,.003,-.018,.04,0] },
  { id:"guilt", name:"Guilt", score:30, color:"178,118,112", observation:"How long can an action remain inside the body?", geometry:"rings", particles:"orbit", fractal:"mandelbrot", gravity:[.82,0,-1,0], time:[.3,.92,.25], camera:[6.8,.006,.12,.01,0] },
  { id:"apathy", name:"Apathy", score:50, color:"197,134,119", observation:"What moves when nothing seems worth moving toward?", geometry:"cloud", particles:"sleep", fractal:"apollonian", gravity:[.03,0,0,0], time:[.14,.05,.18], camera:[6.6,.002,.012,0,0] },
  { id:"grief", name:"Grief", score:75, color:"216,148,120", observation:"Where does connection go when its object is gone?", geometry:"voids", particles:"separate", fractal:"julia", gravity:[.68,0,0,0], time:[.22,.16,.38], camera:[6.8,.003,-.16,0,0] },
  { id:"fear", name:"Fear", score:100, color:"228,163,124", observation:"How much of your fear belongs to the present moment?", geometry:"tunnel", particles:"retreat", fractal:"koch", gravity:[.96,0,0,-1], time:[1.25,.86,.28], camera:[5.8,.012,0,.16,0] },
  { id:"desire", name:"Desire", score:125, color:"233,176,131", observation:"What shape does distance take when you want?", geometry:"spiral", particles:"chase", fractal:"mandelbrot", gravity:[.72,.7,.1,-.2], time:[.9,.42,.55], camera:[5.5,.018,.22,.02,0] },
  { id:"anger", name:"Anger", score:150, color:"238,190,138", observation:"What boundary is the force trying to restore?", geometry:"cracks", particles:"repel", fractal:"apollonian", gravity:[-.9,0,0,0], time:[1.55,.18,.32], camera:[5.7,.009,.08,.24,0] },
  { id:"pride", name:"Pride", score:175, color:"231,203,144", observation:"What must remain rigid for the image to hold?", geometry:"sphere", particles:"radiate", fractal:"koch", gravity:[-.62,0,1,0], time:[.72,.2,.66], camera:[5.6,.014,.14,.015,0] },
  { id:"courage", name:"Courage", score:200, color:"218,214,150", observation:"What becomes possible when motion includes fear?", geometry:"cone", particles:"advance", fractal:"mandelbrot", gravity:[.55,0,0,-1], time:[.8,.08,.9], camera:[5.5,.012,.12,.01,0] },
  { id:"neutrality", name:"Neutrality", score:250, color:"195,215,163", observation:"What happens when no outcome has to win?", geometry:"sphere", particles:"float", fractal:"julia", gravity:[0,0,0,0], time:[.48,.1,.92], camera:[5.6,.002,0,0,0] },
  { id:"willingness", name:"Willingness", score:310, color:"173,215,182", observation:"Which opening appears before certainty does?", geometry:"network", particles:"connect", fractal:"koch", gravity:[.24,.2,.1,-.4], time:[.68,.12,.9], camera:[5.4,.016,.08,0,0] },
  { id:"acceptance", name:"Acceptance", score:350, color:"157,218,193", observation:"What remains when resistance disappears?", geometry:"membrane", particles:"breathe", fractal:"julia", gravity:[0,0,0,0], time:[.5,.05,.98], camera:[5.5,.018,0,0,0] },
  { id:"reason", name:"Reason", score:400, color:"152,213,207", observation:"How does a pattern know it is coherent?", geometry:"lattice", particles:"align", fractal:"koch", gravity:[.08,0,0,0], time:[.62,.02,1], camera:[5.8,.004,0,0,.95] },
  { id:"love", name:"Love", score:500, color:"160,200,218", observation:"What connects without needing to possess?", geometry:"network", particles:"synchronize", fractal:"apollonian", gravity:[-.22,0,0,0], time:[.52,.12,.95], camera:[5.3,.022,0,0,0] },
  { id:"unconditionallove", name:"Joy", score:540, color:"174,189,226", observation:"What new structure appears when nothing is withheld?", geometry:"spiral", particles:"emerge", fractal:"mandelbrot", gravity:[-.38,0,.3,0], time:[.92,.18,.9], camera:[5.1,.026,.1,0,0] },
  { id:"peace", name:"Peace", score:600, color:"187,181,233", observation:"What happens if nothing is chasing you?", geometry:"sphere", particles:"rest", fractal:"koch", gravity:[0,0,0,0], time:[.14,.02,.98], camera:[5.6,.003,0,0,0] },
  { id:"enlightenment", name:"Enlightenment", score:700, color:"202,171,236", observation:"What remains when no observer stands apart?", geometry:"light", particles:"dissolve", fractal:"julia", gravity:[0,0,0,0], time:[.03,0,1], camera:[5.5,0,0,0,0] },
];

export const fields: FieldDefinition[] = seeds.map((s, index) => {
  const t = index / 16;
  const lowDisorder = index === 6 ? .94 : .88 - t * .73;
  return {
    id:s.id, name:s.name, score:s.score, observation:s.observation, color:`rgb(${s.color})`,
    gravity:{ strength:s.gravity[0], direction:[s.gravity[1],s.gravity[2],s.gravity[3]] },
    spatialCoherence: .12 + t * .82,
    entropy: Math.max(.03, lowDisorder),
    resonance: .08 + t * .86,
    informationFlow: .05 + t * .9,
    permeability: .04 + t * .9,
    timeBehavior:{ speed:s.time[0], looping:s.time[1], continuity:s.time[2] },
    fieldLines:{ density:index===2?.38:.22+t*.66, integrity:index===2?.3:.08+t*.86, tremor:Math.max(.02,.82-t*.72) },
    particleBehavior:{ mode:s.particles, speed:.08+t*.72, cohesion:.08+t*.85, visibility:index===16?.04:.5+t*.35 },
    dominantGeometry:{ primary:s.geometry, morph:.08+t*.86, scale:index<4?.72:1 },
    lightBehavior:{ emission:index===16?.62:index===2?.2:.08+t*.58, absorption:index===2?.62:Math.max(.02,.88-t*.76), scatter:.72-t*.48, bloom:index===2?.09:.03+t*.22 },
    cameraBehavior:{ distance:s.camera[0], orbit:s.camera[1], drift:s.camera[2], shake:s.camera[3], orthographic:s.camera[4] },
    motionProfile:{ acceleration:index===6?.94:.12+t*.58, pulse:index===4?.85:.12+t*.24, fluidity:.08+t*.88 },
    shaderBehavior:{ fractal:s.fractal, symmetry:3+Math.round(t*9), recursion:.45+t*.5, distortion:Math.max(.02,.72-t*.62), matte:Math.max(.08,.92-t*.62) },
    audioBehavior:{ density:index===16?0:.12+t*.5, harmonicity:.06+t*.9, pulse:.6-t*.42, silence:index===16?1:.15+t*.55 },
    interactionBehavior:{ responsiveness:.05+t*.72, attraction:s.gravity[0], memory:.12+t*.76 },
  };
});

export const getField = (id: string) => fields.find((field) => field.id === id) ?? fields[8];
