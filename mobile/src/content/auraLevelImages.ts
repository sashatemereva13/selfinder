// Pre-baked per-level renders of AuraFigure, one per vibration level slug —
// react-native-svg's filter engine (the "goo" merge + blur used for the
// body/rim) doesn't reproduce correctly live on native devices, leaving the
// body visibly tinted instead of staying dark (see AuraFigure.tsx and
// onboarding's own aura-neutral-body.png, which works around the same
// issue). These were exported from a browser render of the same component,
// where the filters render correctly, then baked to static assets —
// require() needs static, literal paths, so this can't be built from
// LEVEL_COLORS at runtime.
export const AURA_LEVEL_IMAGES: Record<string, number> = {
  shame: require('../../assets/aura/level-shame.png'),
  guilt: require('../../assets/aura/level-guilt.png'),
  apathy: require('../../assets/aura/level-apathy.png'),
  grief: require('../../assets/aura/level-grief.png'),
  fear: require('../../assets/aura/level-fear.png'),
  desire: require('../../assets/aura/level-desire.png'),
  anger: require('../../assets/aura/level-anger.png'),
  pride: require('../../assets/aura/level-pride.png'),
  courage: require('../../assets/aura/level-courage.png'),
  neutrality: require('../../assets/aura/level-neutrality.png'),
  willingness: require('../../assets/aura/level-willingness.png'),
  acceptance: require('../../assets/aura/level-acceptance.png'),
  reason: require('../../assets/aura/level-reason.png'),
  love: require('../../assets/aura/level-love.png'),
  unconditionallove: require('../../assets/aura/level-unconditionallove.png'),
  peace: require('../../assets/aura/level-peace.png'),
  enlightenment: require('../../assets/aura/level-enlightenment.png'),
};

export const AURA_NEUTRAL_IMAGE = require('../../assets/aura/aura-neutral-body.png');
