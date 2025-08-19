import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Profile, DataBundle, Experience, Project, Skill, Education } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get the effective data for a profile (master data + profile overrides)
export function getEffectiveProfileData(profile: Profile, masterData: DataBundle) {
  const experiences: Experience[] = masterData.experiences.map(exp => ({
    ...exp,
    ...(profile.experienceOverrides?.[exp.id] || {})
  }));

  const projects: Project[] = masterData.projects.map(proj => ({
    ...proj,
    ...(profile.projectOverrides?.[proj.id] || {})
  }));

  const skills: Skill[] = masterData.skills.map(skill => ({
    ...skill,
    ...(profile.skillOverrides?.[skill.id] || {})
  }));

  const education: Education[] = masterData.education.map(edu => ({
    ...edu,
    ...(profile.educationOverrides?.[edu.id] || {})
  }));

  return {
    personalInfo: masterData.personalInfo,
    experiences,
    projects,
    skills,
    education
  };
}

// Check if an item has profile-specific overrides
export function hasProfileOverride(profile: Profile, itemType: 'experience' | 'project' | 'skill' | 'education', itemId: string): boolean {
  const overrideKey = `${itemType}Overrides` as keyof Profile;
  const overrides = profile[overrideKey] as Record<string, any> | undefined;
  return !!(overrides && overrides[itemId] && Object.keys(overrides[itemId]).length > 0);
}
