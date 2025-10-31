"use client";

import { motion } from "framer-motion";

export function FloatingElements() {
  const elements = [
    { size: 20, x: "10%", y: "20%", duration: 20, color: "bg-cyan-500/5" },
    { size: 25, x: "80%", y: "15%", duration: 25, color: "bg-purple-500/5" },
    { size: 18, x: "85%", y: "70%", duration: 22, color: "bg-blue-500/5" },
    { size: 22, x: "15%", y: "80%", duration: 28, color: "bg-pink-500/5" },
    { size: 15, x: "50%", y: "10%", duration: 18, color: "bg-green-500/5" },
    { size: 28, x: "70%", y: "50%", duration: 30, color: "bg-indigo-500/5" },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {elements.map((el, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full ${el.color} backdrop-blur-xl`}
          style={{
            width: el.size,
            height: el.size,
            left: el.x,
            top: el.y,
          }}
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -80, 60, 0],
            scale: [1, 1.2, 0.8, 1],
            opacity: [0.3, 0.6, 0.4, 0.3],
          }}
          transition={{
            duration: el.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
