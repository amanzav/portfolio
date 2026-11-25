"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

function subscribeReducedMotion(update: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", update);
  return () => query.removeEventListener("change", update);
}

function reducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function RouteGlitchFrame({ reducedMotion }: { reducedMotion: boolean }) {
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (reducedMotion) return;
    const timeout = window.setTimeout(() => setActive(false), 620);
    return () => window.clearTimeout(timeout);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    let timeout: number;
    const interval = window.setInterval(() => {
      setActive(true);
      timeout = window.setTimeout(() => setActive(false), 190);
    }, 12000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [reducedMotion]);

  return <div className={`route-glitch ${!reducedMotion && active ? "route-glitch-active" : ""}`} aria-hidden />;
}

export function RouteGlitch() {
  const pathname = usePathname();
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, reducedMotionSnapshot, () => false);
  return <RouteGlitchFrame key={pathname} reducedMotion={reducedMotion} />;
}
