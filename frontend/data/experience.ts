export interface Experience {
  company: string;
  role: string;
  period: string;
  highlights: string[];
  tags: string[];
}

export const experiences: Experience[] = [
  {
    company: "Ford Motor Company",
    role: "Software Engineering Intern",
    period: "May–Aug 2025",
    highlights: [
      "Route-aware fuel optimization Android widget (Kotlin + Java)",
      "Tire-pressure alert system (C++ HAL + AIDL)",
      "CI/CD pipeline with AST-based LLM analysis",
      "Async queue refactor for 5K+ CAN signals/s"
    ],
    tags: ["Kotlin", "Java", "C++", "AIDL", "Android", "CI/CD"]
  },
  {
    company: "Ford Motor Company",
    role: "Python Software Engineering Intern",
    period: "Sep–Dec 2024",
    highlights: [
      "ML anomaly detection on 50K+ samples",
      "Jenkins + MQTT automation",
      "Linux-based regression suite (250+ cases)",
      "IPv6 log analysis (32% improvement)"
    ],
    tags: ["Python", "ML", "Jenkins", "MQTT", "Linux"]
  },
  {
    company: "Transpire Technologies",
    role: "Software Engineering Intern",
    period: "Jan–Apr 2024",
    highlights: [
      "AppSync & Supabase optimization",
      "Real-time React analytics dashboard",
      "Automated event anomaly detection (Selenium + Vector)"
    ],
    tags: ["React", "AppSync", "Supabase", "Selenium"]
  }
];
