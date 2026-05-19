"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

export function RouteGlitch() {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (reducedMotion) return undefined;

    setActive(true);
    const timeout = window.setTimeout(() => setActive(false), 620);
    return () => window.clearTimeout(timeout);
  }, [pathname, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return undefined;

    const interval = window.setInterval(() => {
      setActive(true);
      window.setTimeout(() => setActive(false), 190);
    }, 12000);

    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  return <div className={`route-glitch ${active ? "route-glitch-active" : ""}`} aria-hidden />;
}
