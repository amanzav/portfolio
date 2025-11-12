export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  date: string;
  skills: string[];
  description?: string;
  details?: string;
}

export const experiences: ExperienceItem[] = [
  {
    id: "ford-developer-2025",
    company: "Ford Motor Company",
    role: "Software Developer Intern",
    date: "May 2025 – Aug 2025",
    skills: ["Kotlin", "Java", "C++"],
    description: "Route-aware fuel optimization & tire-pressure alert systems.",
    details: "Led end-to-end development of a route-aware fuel optimization Android widget (Kotlin + Java) for the infotainment system, with a graph-ranking algorithm that yielded 30% more fuel-optimal routes.\n\nOwned, design, and deployed a tire-pressure alert system in C++ using HAL + AIDL, delivering sub-second alerts with 700ms latency in offline and edge-connectivity conditions for the Phoenix infotainment system.\n\nBuilt a Docker CI/CD pipeline integrating LLM-based AST analysis (GitHub Actions + sentence-transformers) to detect unit test gaps and auto-route PRs, reducing deployment reviews by 20 min per PR.\n\nRefactored 30+ in-vehicle data handlers using async queues and lock-free buffers to eliminate contention during CAN message bursts, sustaining stable throughput under 5K+ signal updates per second.",
  },
  {
    id: "ford-engineering-2024",
    company: "Ford Motor Company",
    role: "Software Engineering Intern",
    date: "Sep 2024 – Dec 2024",
    skills: ["TensorFlow", "Python", "Docker"],
    description: "ML anomaly detection & automated infotainment testing.",
    details: "Developed an ML proof-of-concept (TensorFlow + Scikit-learn) trained on 50K+ connectivity samples to classify network anomalies, outperforming baseline rule-based detection.\n\nCreated Jenkins pipelines (Docker + MQTT) for automated infotainment fault validation, running 100+ tests per nightly build and eliminating manual QA loops.\n\nBuilt a Linux-based Slash test suite covering 250+ regression cases across multiple firmware releases, improving reliability in pre-production environments.\n\nAnalyzed IPv6 connectivity logs via Pandas/NumPy to identify gaps and improve signal accuracy by 32%.",
  },
  {
    id: "transpire-2024",
    company: "Transpire Technologies",
    role: "Member of Technical Staff",
    date: "Jan 2024 – Apr 2024",
    skills: ["React", "Flask", "Kubernetes"],
    description: "Real-time analytics platform serving 1,000+ enterprise users.",
    details: "Optimized AppSync subscription schema and Supabase triggers to avoid redundant payloads, trimming ~1.8 KB per message and dropping subscription traffic from 120 KB/s → 65 KB/s during peak streams.\n\nDelivered a real-time React analytics platform with Flask, PostgreSQL, and Kubernetes-based microservices, serving 1,000 enterprise users with auto-scaled deployment and minimal downtime.\n\nAutomated event anomaly-detection pipelines using Selenium + Vector, enabling 3x more outreach.",
  },
];
