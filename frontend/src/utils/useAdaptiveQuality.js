import { useEffect, useMemo, useState } from "react";

function detectQuality() {
  if (typeof window === "undefined") {
    return {
      tier: "medium",
      dpr: [1, 1.5],
      reduceMotion: false,
      isCompactScreen: false,
    };
  }

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const width = window.innerWidth || 1280;
  const isCompactScreen = width < 860;
  const memory = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;
  const highDpr = window.devicePixelRatio > 1.8;

  const lowSignals = [reduceMotion, isCompactScreen, memory <= 4, cores <= 4, highDpr].filter(Boolean).length;
  const tier = lowSignals >= 3 ? "low" : lowSignals >= 1 ? "medium" : "high";
  const dpr = tier === "low" ? [1, 1.25] : tier === "medium" ? [1, 1.5] : [1, 1.8];

  return { tier, dpr, reduceMotion, isCompactScreen };
}

export function useAdaptiveQuality() {
  const [quality, setQuality] = useState(detectQuality);

  useEffect(() => {
    const update = () => setQuality(detectQuality());
    window.addEventListener("resize", update);
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    mq?.addEventListener?.("change", update);

    return () => {
      window.removeEventListener("resize", update);
      mq?.removeEventListener?.("change", update);
    };
  }, []);

  return useMemo(() => quality, [quality]);
}
