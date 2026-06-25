const THREE_CLOCK_DEPRECATION =
  "THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.";

let isInstalled = false;

export function suppressThreeClockWarning() {
  if (isInstalled || typeof console === "undefined") {
    return;
  }

  const originalWarn = console.warn.bind(console);

  console.warn = (...args) => {
    if (typeof args[0] === "string" && args[0].includes(THREE_CLOCK_DEPRECATION)) {
      return;
    }

    originalWarn(...args);
  };

  isInstalled = true;
}
