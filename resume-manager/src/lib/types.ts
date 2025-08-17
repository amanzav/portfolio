export type BaseItem = {
  id: string;
  title?: string; // for experiences/projects/education
  name?: string;  // for skills groups
  subtitle?: string; // optional secondary line
};

export type PersonalInfo = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  website?: string;
  summary?: string;
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
  personalInfo: PersonalInfo;
  experiences: Experience[];
  projects: Project[];
  skills: Skill[];
  education: Education[];
};

export type Profile = {
  id: string;
  name: string;
  personalInfo?: PersonalInfo;
  experienceIds: string[];
  projectIds: string[];
  skillIds: string[];
  educationIds: string[];
  // Profile-specific overrides that don't affect master data
  experienceOverrides?: Record<string, Partial<Experience>>;
  projectOverrides?: Record<string, Partial<Project>>;
  skillOverrides?: Record<string, Partial<Skill>>;
  educationOverrides?: Record<string, Partial<Education>>;
  template?: 'classic' | 'compact';
};