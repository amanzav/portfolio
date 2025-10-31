"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";

export function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let phi = 0;
    let width = 0;

    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth;
      }
    };

    window.addEventListener("resize", onResize);
    onResize();

    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.024, 0.714, 0.831], // accent color
      glowColor: [0.024, 0.714, 0.831],
      markers: [
        // Add some location markers
        { location: [37.7749, -122.4194], size: 0.03 }, // San Francisco
        { location: [40.7128, -74.0060], size: 0.03 },  // New York
        { location: [51.5074, -0.1278], size: 0.03 },   // London
        { location: [35.6762, 139.6503], size: 0.03 },  // Tokyo
      ],
      onRender: (state) => {
        // Auto-rotate
        state.phi = phi;
        phi += 0.003;
      },
    });

    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          maxWidth: "100%",
          aspectRatio: "1",
        }}
      />
    </div>
  );
}
