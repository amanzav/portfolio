export interface ExperienceItem {
  id: string;
  company: string;
  shortCompany?: string;
  logo: string;
  role: string;
  shortRole?: string;
  date: string;
  location?: string;
  skills: string[];
  description?: string;
  details?: string;
}

export const experiences: ExperienceItem[] = [
  {
    id: "boomerang",
    company: "Boomerang Inc.",
    shortCompany: "Boomerang",
    logo: "/logos/boomerang.svg",
    role: "Software Engineering Intern",
    shortRole: "SWE Intern",
    date: "Jan 2026 – Present",
    location: "New York, NY",
    skills: ["Kotlin", "PyTorch", "FastAPI", "pgvector", "Redis", "Claude"],
    description:
      "Software factory + neural retriever + NLP search over 2M alumni.",
  },
  {
    id: "ford-2025",
    company: "Ford Motor Company",
    shortCompany: "Ford",
    logo: "/logos/ford.svg",
    role: "Software Engineering Intern",
    shortRole: "SWE Intern",
    date: "May 2025 – Aug 2025",
    location: "Waterloo, ON",
    skills: ["C++", "CAN Bus", "Kafka", "Graph Algorithms"],
    description:
      "C++ TPMS interrupt path on 1.2M cars + fuel-routing for the 2027 F-150 + Mach-E.",
  },
  {
    id: "ford-2024",
    company: "Ford Motor Company",
    shortCompany: "Ford",
    logo: "/logos/ford.svg",
    role: "Software Engineering Intern",
    shortRole: "SWE Intern",
    date: "Sep 2024 – Dec 2024",
    location: "Waterloo, ON",
    skills: ["Python", "FastAPI", "PyTorch", "Kafka", "Slack API"],
    description:
      "Slack LLM copilot over 8M Kafka events + LSTM modem-dropout detector.",
  },
  {
    id: "transpire",
    company: "Transpire Technologies",
    shortCompany: "Transpire",
    logo: "/logos/transpire.svg",
    role: "Software Engineering Intern",
    shortRole: "SWE Intern",
    date: "Jan 2024 – Apr 2024",
    location: "Toronto, ON",
    skills: ["Python", "XGBoost", "Next.js", "Playwright", "Notion API"],
    description:
      "XGBoost lead-ranker + self-serve onboarding flow. Pipeline 3x'd.",
  },
];
