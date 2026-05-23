export interface BlogMeta {
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  stack: string[];
  blurb: string;
}

export const blogs: BlogMeta[] = [
  {
    slug: "trade",
    title: "Trade Reasoning Agent",
    subtitle:
      "An LLM that explains the why behind politician and insider trades, with a second pass that tries to break its own answer.",
    date: "Apr 2026",
    stack: ["Claude", "Exa", "EDGAR", "Next.js", "Firebase"],
    blurb:
      "Filing-date-aware backtest. 12% paper-trading gain over 90 days. Mostly defenses against hallucinated rationales.",
  },
  {
    slug: "tennis",
    title: "AI Tennis Coach",
    subtitle:
      "Match film in, rally trace + coaching report out. Catches what I miss watching live.",
    date: "Mar 2026",
    stack: ["YOLO", "OpenCV", "Homography", "Claude"],
    blurb:
      "Player + ball tracking, top-down homography, Claude reads the rally trace and tells me what I'm doing wrong.",
  },
  {
    slug: "autopark",
    title: "Auto Park",
    subtitle:
      "Autonomous parking stack for UWAFT's competition EV. Perception → planning → control, validated in CARLA.",
    date: "Feb 2026",
    stack: ["ROS2", "CARLA", "YOLO", "Hybrid A*", "PID"],
    blurb:
      "Why parking is harder than driving. Hybrid A* + Reeds-Shepp, 8 cm tracking RMSE across 50+ scenarios.",
  },
  {
    slug: "multibot",
    title: "Multi-Bot Traffic Sim",
    subtitle:
      "Three TurtleBots, one mini-city, zero deadlocks. Intent broadcast + behaviour trees.",
    date: "Jan 2026",
    stack: ["ROS2", "TurtleBot", "Behaviour Trees", "Hybrid A*", "DWA"],
    blurb:
      "Deadlocks down 8x vs baseline. The single change that did 80% of the work was broadcasting ETA-at-intersection.",
  },
];

export const blogBySlug = (slug: string) =>
  blogs.find((b) => b.slug === slug);
