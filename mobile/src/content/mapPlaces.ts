import { Href } from 'expo-router';
import type { DepthsMenuSymbolId } from '../components/depths/DepthsMenuSymbol';

// The map (RULES.md, "Navigation is a map") — every place in the app a
// person can go, in one list, read by both the minimap (MapBar) and the
// expanded map (MapOverlay). One list on purpose: Depths used to carry its
// own separate menu of these same destinations, and two lists of the same
// places drift apart.
//
// Coordinates are in the map's own 390×652 design box (MapOverlay scales
// the whole box to fit the screen): Your Arc's sky on top, Journeys'
// contoured land in the middle, Depths' rings around the figure (you) at
// the bottom — see docs/app-architecture-concept.md, "Navigation as a map".

export type MapRegion = 'depths' | 'journeys' | 'arc';

export type MapPlaceId =
  | 'measure'
  | 'levels'
  | 'symbol'
  | 'message'
  | 'talk'
  | 'spill'
  | 'breathing'
  | 'tunein'
  | 'journeys'
  | 'control'
  | 'choice'
  | 'loop'
  | 'past'
  | 'now'
  | 'future';

export interface MapPlace {
  id: MapPlaceId;
  region: MapRegion;
  labelKey: string;
  // null for 'talk' — opening the conversation isn't a plain route (it
  // carries the current reading into it; see usePhilosopherStep).
  href: Href | null;
  // Which pathname(s) count as "you are here" for this place.
  matches: (pathname: string) => boolean;
  x: number;
  y: number;
  // Which side of the dot its label sits on.
  side: 'left' | 'right';
  // The glyph drawn in place of a plain dot — the symbols first designed
  // for Depths' old spiral menu (DepthsMenuSymbol), reused here for the
  // same destinations; 'philosopher' draws the current philosopher's own
  // mark. Places without one keep a dot.
  symbol?: DepthsMenuSymbolId | 'philosopher';
}

const is = (...paths: string[]) => (p: string) => paths.includes(p);
const under = (...prefixes: string[]) => (p: string) =>
  prefixes.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));

export const MAP_PLACES: MapPlace[] = [
  { id: 'past', region: 'arc', labelKey: 'map.past', href: '/your-arc-past', matches: is('/your-arc-past'), x: 102, y: 83, side: 'left' },
  { id: 'now', region: 'arc', labelKey: 'map.now', href: '/center', matches: is('/center'), x: 195, y: 56, side: 'right' },
  { id: 'future', region: 'arc', labelKey: 'map.future', href: '/your-arc-future', matches: is('/your-arc-future'), x: 288, y: 83, side: 'right' },

  { id: 'journeys', region: 'journeys', labelKey: 'map.allJourneys', href: '/(tabs)/journeys', matches: is('/journeys'), x: 275, y: 191, side: 'right' },
  { id: 'loop', region: 'journeys', labelKey: 'products.theLoopLabel', href: '/the-loop', matches: is('/the-loop'), x: 105, y: 216, side: 'left' },
  { id: 'choice', region: 'journeys', labelKey: 'products.theChoiceLabel', href: '/the-choice', matches: is('/the-choice'), x: 285, y: 281, side: 'right' },
  { id: 'control', region: 'journeys', labelKey: 'products.controlLabel', href: '/control', matches: is('/control'), x: 100, y: 334, side: 'left' },

  { id: 'measure', region: 'depths', labelKey: 'depths.measureLabel', href: '/(tabs)/depths/measure', matches: under('/depths/measure'), x: 195, y: 446, side: 'right', symbol: 'measure' },
  { id: 'levels', region: 'depths', labelKey: 'depths.levelsLabel', href: '/(tabs)/depths/levels', matches: under('/depths/levels', '/depths/level'), x: 262, y: 469, side: 'right', symbol: 'exploreMap' },
  { id: 'symbol', region: 'depths', labelKey: 'map.symbol', href: '/(tabs)/depths/cards', matches: under('/depths/cards'), x: 290, y: 526, side: 'right', symbol: 'stay' },
  { id: 'message', region: 'depths', labelKey: 'map.message', href: '/(tabs)/depths/feeling-lucky', matches: under('/depths/feeling-lucky'), x: 262, y: 583, side: 'right', symbol: 'feelingLucky' },
  { id: 'talk', region: 'depths', labelKey: 'depths.understandItDescription', href: null, matches: is('/guide'), x: 195, y: 606, side: 'right', symbol: 'philosopher' },
  { id: 'spill', region: 'depths', labelKey: 'depths.spillLabel', href: '/(tabs)/depths/spill', matches: under('/depths/spill'), x: 128, y: 583, side: 'left' },
  { id: 'breathing', region: 'depths', labelKey: 'depths.breathingLabel', href: '/(tabs)/depths/breathing', matches: under('/depths/breathing'), x: 100, y: 526, side: 'left', symbol: 'shift' },
  { id: 'tunein', region: 'depths', labelKey: 'depths.tuneInLabel', href: '/(tabs)/depths/tunein', matches: under('/depths/tunein'), x: 128, y: 469, side: 'left', symbol: 'shift' },
];

// Which region a pathname belongs to — for the minimap's "you are here"
// dot and the expanded map's brighter territory border.
export function regionForPath(pathname: string): MapRegion {
  const place = MAP_PLACES.find((p) => p.matches(pathname));
  if (place) return place.region;
  if (pathname.startsWith('/your-arc')) return 'arc';
  if (pathname.startsWith('/journeys')) return 'journeys';
  return 'depths';
}

export function placeForPath(pathname: string): MapPlace | undefined {
  return MAP_PLACES.find((p) => p.matches(pathname));
}

// The three regions' own home routes — the minimap's three stops.
export const REGION_HOME: Record<MapRegion, Href> = {
  depths: '/(tabs)/depths',
  journeys: '/(tabs)/journeys',
  arc: '/(tabs)/your-arc',
};
