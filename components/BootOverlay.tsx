"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

const BOOT_STORAGE_KEY = "az-portfolio-booted";
const BOOT_DURATION_MS = 2050;
const REDUCED_BOOT_DURATION_MS = 360;

const bootLines = [
  ["power", "diagnostic rail stable", "ok"],
  ["display", "signal acquired", "sync"],
  ["memory", "portfolio index ready", "ok"],
  ["input", "route matrix mapped", "ok"],
  ["video", "horizontal hold corrected", "sync"],
  ["system", "operator handoff", "ready"],
];

export function BootOverlay() {
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const alreadyBooted = window.sessionStorage.getItem(BOOT_STORAGE_KEY);
    if (alreadyBooted) return undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduceMotion ? REDUCED_BOOT_DURATION_MS : BOOT_DURATION_MS;

    setReducedMotion(reduceMotion);
    setVisible(true);

    const timeout = window.setTimeout(() => {
      window.sessionStorage.setItem(BOOT_STORAGE_KEY, "true");
      setVisible(false);
    }, duration);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="boot-overlay"
      style={
        {
          "--boot-duration": `${reducedMotion ? REDUCED_BOOT_DURATION_MS : BOOT_DURATION_MS}ms`,
        } as CSSProperties
      }
      aria-hidden
    >
      <div className="boot-topline">
        <span>display booting</span>
        <span>az://diagnostic-monitor</span>
      </div>

      <div className="boot-sync-band" />

      <div className="boot-frame">
        <div className="boot-lines">
          {bootLines.map(([channel, line, status], index) => (
            <div
              key={line}
              className={`boot-line boot-line-${status}`}
              style={{ animationDelay: reducedMotion ? "0ms" : `${220 + index * 145}ms` }}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <span>{channel}</span>
              <span>{line}</span>
              <span>{status}</span>
            </div>
          ))}
        </div>

        <div className="boot-progress" />
      </div>
    </div>
  );
}
