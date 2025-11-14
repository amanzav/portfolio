export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  Icon: string; // Icon name for dynamic import
  href: string;
  siteUrl?: string;
  skills: string[];
  details?: string;
}

export const projects: ProjectItem[] = [
  {
    id: "courseclutch",
    name: "CourseClutch",
    description: "Serverless course notifier",
    Icon: "GraduationCap",
    href: "https://github.com/amanzav/course-clutch",
    siteUrl: "https://courseclutch.com",
    skills: ["AWS Lambda", "DynamoDB", "React", "Terraform"],
    details: "Built a serverless course availability notification system that monitors university course openings and alerts students in real-time.\n\nArchitected a scalable AWS Lambda backend with DynamoDB for persistent storage, processing 10,000+ course checks daily with sub-100ms latency.\n\nImplemented a React-based frontend with real-time notifications, serving 500+ active users during peak registration periods.\n\nDeployed infrastructure-as-code using Terraform, ensuring reproducible and maintainable cloud resources across multiple environments.",
  },
  {
    id: "reva",
    name: "Reva",
    description: "LLM-based job-matching assistant",
    Icon: "Pencil",
    href: "https://github.com/amanzav/reva",
    skills: ["Python", "LangChain", "FastAPI", "ChromaDB"],
    details: "Developed an intelligent job-matching assistant powered by large language models to help job seekers find relevant opportunities.\n\nIntegrated LangChain with ChromaDB for semantic search across 50,000+ job postings, achieving 85% relevance in top-5 matches.\n\nBuilt a FastAPI backend with streaming responses, enabling real-time conversational job recommendations.\n\nImplemented resume parsing and skill extraction using transformer models, automatically matching candidate profiles with job requirements.",
  },
  {
    id: "ev-education-game",
    name: "EV Education Game",
    description: "Unity + UGS EV learning game for EcoCAR.",
    Icon: "Car",
    href: "https://github.com/amanzav/uwaft-cav-game",
    skills: ["Unity", "C#", "Unity Gaming Services", "WebGL"],
    details: "Created an educational game for the EcoCAR Mobility Challenge to teach electric vehicle concepts through interactive gameplay.\n\nDeveloped in Unity with C#, featuring physics-based vehicle simulations and real-world EV scenarios for engaging learning experiences.\n\nIntegrated Unity Gaming Services for multiplayer capabilities, leaderboards, and cloud saves, supporting 100+ concurrent players.\n\nDeployed as a WebGL build, making it accessible via browser with no installation required, reaching 1,000+ students across multiple universities.",
  },
];
