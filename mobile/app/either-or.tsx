import { JourneyComingSoonScreen } from '../src/components/JourneyComingSoonScreen';

// Either/Or — "what changes in me under either possibility?" One of the
// Journeys named in the Products catalog (products.tsx) with no content
// built yet; see RULES.md's Product/positioning section for the Journey
// family's unifying definition and JourneyComingSoonScreen's own header
// comment for why this is a real screen, not a dead link.
export default function EitherOrScreen() {
  return <JourneyComingSoonScreen titleKey="products.eitherOrLabel" introKey="products.eitherOrDescription" />;
}
