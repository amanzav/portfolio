"use client";

import { useEffect, useRef, useState } from "react";

type Runtime = { mountPortfolio: (root: HTMLElement) => () => void };

export function PortfolioSurface({ markup, children }: { markup: string; children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const root = rootRef.current!;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    const reveal = () => { if (cancelled) return; root.inert = false; setReady(true); };
    const fallback = () => { if (cancelled) return; root.inert = true; setReady(false); dispose?.(); };
    root.inert = true;
    root.addEventListener("portfolio-ready", reveal);
    root.addEventListener("portfolio-error", fallback);
    const runtimeUrl = "/portfolio/home.js";
    import(/* webpackIgnore: true */ runtimeUrl).then((runtime: Runtime) => {
      if (cancelled) return;
      // The runtime owns this opaque subtree; restore it before a Strict Mode remount.
      root.innerHTML = markup;
      dispose = runtime.mountPortfolio(root);
    }).catch(fallback);
    return () => {
      cancelled = true;
      root.removeEventListener("portfolio-ready", reveal);
      root.removeEventListener("portfolio-error", fallback);
      dispose?.();
    };
  }, [markup]);

  return (
    <div className="portfolio-shell" data-ready={ready}>
      <div className="portfolio-fallback" hidden={ready}>{children}</div>
      <div ref={rootRef} className="portfolio-runtime portfolio-mount" aria-hidden={!ready}
        dangerouslySetInnerHTML={{ __html: markup }} />
    </div>
  );
}
