export interface Project {
  title: string;
  description: string;
  link: string;
  tags: string[];
  highlights: string[];
}

export const projects: Project[] = [
  {
    title: "CourseClutch",
    description: "Serverless course notifier with real-time updates",
    link: "https://courseclutch.com",
    tags: ["FastAPI", "AWS Lambda", "DynamoDB", "Redis"],
    highlights: [
      "12K+ courses tracked",
      "99.8% uptime",
      "Redis caching layer"
    ]
  },
  {
    title: "Reva - Job Application Assistant",
    description: "Full-stack platform for intelligent job matching",
    link: "https://github.com/amanzav/reva",
    tags: ["Next.js", "Prisma", "LangChain", "PostgreSQL"],
    highlights: [
      "Zod-validated feedback loop",
      "Embeddings-based matching",
      "94% accuracy on job matches"
    ]
  }
];
