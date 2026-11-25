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
      "I trained a simulated car in PyBullet, starting with goal points and then following planned paths.",
    date: "Feb 2026",
    stack: ["PyBullet", "Gym", "PyTorch", "PPO", "TRPO"],
    blurb:
      "I compared PPO and TRPO updates and worked through why learning one path didn’t transfer reliably to new ones.",
  },
  {
    slug: "multibot",
    title: "Multi-Bot Traffic Sim",
    subtitle:
      "I coordinated three simulated TurtleBots through shared crossings using intent messages and behavior trees.",
    date: "Jan 2026",
    stack: ["ROS2", "TurtleBot", "Behaviour Trees", "Hybrid A*", "DWA"],
    blurb:
      "I worked on arrival estimates, right-of-way decisions, and local motion, then checked both safe arrival and whether the robots kept making progress.",
  },
];

export const blogBySlug = (slug: string) =>
  blogs.find((b) => b.slug === slug);
