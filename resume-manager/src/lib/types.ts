export type BaseItem = {
  id: string;
  title?: string; // for experiences/projects/education
  name?: string;  // for skills groups
  subtitle?: string; // optional secondary line
};

export type Experience = BaseItem & {
  title: string;
  company: string;
  date: string;
  bullets: string[];
  tags?: string[];
};

export type Project = BaseItem & {
  title: string;
  link?: string;
  bullets: string[];
  tags?: string[];
};

export type Skill = BaseItem & {
  name: string;
  details: string;
};

export type Education = BaseItem & {
  title: string;
  details: string;
};

export type DataBundle = {
  experiences: Experience[];
  projects: Project[];
  skills: Skill[];
  education: Education[];
};

export type Profile = {
  id: string;
  name: string;
  summary?: string;
  experienceIds: string[];
  projectIds: string[];
  skillIds: string[];
  educationIds: string[];
};