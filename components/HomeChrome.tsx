"use client";

import { useEffect, useState } from "react";

const BOOT_ID = "0xa12f";

function formatUptime(ms: number) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `0d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
}

export function HomeChrome() {
  const [uptime, setUptime] = useState("0d 17h 42m");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const start = Date.now() - (17 * 60 + 42) * 60 * 1000;
    const id = window.setInterval(() => {
      setUptime(formatUptime(Date.now() - start));
      setTick((t) => (t + 1) % 1000);
    }, 30000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <>
      <div className="home-topbar" aria-hidden>
        <span>az://operator-handoff</span>
        <span className="home-topbar-mid">
          <span className="home-rec-dot" />
          <span>rec · 2026.05.18 · signal stable</span>
        </span>
        <span>build · 4.7 · {BOOT_ID}</span>
      </div>

      <div className="home-edge home-edge-left" aria-hidden>
        <div className="home-edge-text">
          az://signal-monitor · channel 04 · lat 43.4643 / lon −80.5204
        </div>
      </div>
      <div className="home-edge home-edge-right" aria-hidden>
        <div className="home-edge-text">
          uptime {uptime} · boot {BOOT_ID} · sync ok · tick {String(tick).padStart(3, "0")}
        </div>
      </div>

      <div className="home-edge-bar home-edge-bar-left" aria-hidden />
      <div className="home-edge-bar home-edge-bar-right" aria-hidden />

      <span className="home-tick home-tick-l1" aria-hidden />
      <span className="home-tick home-tick-l2" aria-hidden />
      <span className="home-tick home-tick-l3" aria-hidden />
      <span className="home-tick home-tick-r1" aria-hidden />
      <span className="home-tick home-tick-r2" aria-hidden />
      <span className="home-tick home-tick-r3" aria-hidden />

      <div className="home-corner home-corner-tl" aria-hidden />
      <div className="home-corner home-corner-tr" aria-hidden />
      <div className="home-corner home-corner-bl" aria-hidden />
      <div className="home-corner home-corner-br" aria-hidden />

      <div className="home-bottombar" aria-hidden>
        <span>{"// "}channel 04 · operator at console</span>
        <span>amplitude · ▁▂▃▅▇▆▄▂▁ · stable</span>
      </div>
    </>
  );
}
