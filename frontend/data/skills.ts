export interface SkillCategory {
  category: string;
  skills: string[];
}

export const skillCategories: SkillCategory[] = [
  {
    category: "Languages",
    skills: ["Python", "Rust", "TypeScript", "C/C++", "Kotlin", "Java"]
  },
  {
    category: "Frameworks",
    skills: ["React", "Next.js", "Prisma", "LangChain", "FastAPI"]
  },
  {
    category: "Cloud & DevOps",
    skills: ["AWS", "Docker", "Kubernetes", "Jenkins", "Vercel"]
  },
  {
    category: "Databases",
    skills: ["PostgreSQL", "Supabase", "Redis", "MongoDB", "DynamoDB"]
  }
];
