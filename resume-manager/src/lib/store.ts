'use client';

import { create } from 'zustand';
import { nanoid } from './util';
import type { Profile, DataBundle, Experience, Project, Skill, Education, PersonalInfo } from './types';

export type ProfilesState = {
  profiles: Profile[];
  data: DataBundle; // mutable master data
  createProfile: () => void;
  updateProfile: (id: string, patch: Partial<Profile>) => void;
  reorderProfileItems: (profileId: string, itemType: 'experienceIds' | 'projectIds' | 'skillIds' | 'educationIds', fromIndex: number, toIndex: number) => void;
  updatePersonalInfo: (id: string, patch: Partial<PersonalInfo>) => void;
  updateMasterPersonalInfo: (patch: Partial<PersonalInfo>) => void;
  // Profile-specific override functions
  updateProfileExperience: (profileId: string, experienceId: string, patch: Partial<Experience>) => void;
  updateProfileProject: (profileId: string, projectId: string, patch: Partial<Project>) => void;
  updateProfileSkill: (profileId: string, skillId: string, patch: Partial<Skill>) => void;
  updateProfileEducation: (profileId: string, educationId: string, patch: Partial<Education>) => void;
  resetProfileOverride: (profileId: string, itemType: 'experience' | 'project' | 'skill' | 'education', itemId: string) => void;
  deleteProfile: (id: string) => void;
  cloneProfile?: (id: string) => void;
  updateData: (patch: Partial<DataBundle>) => void;
  updateExperience: (id: string, patch: Partial<Experience>) => void;
  addExperience: () => void;
  deleteExperience: (id: string) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  addProject: () => void;
  deleteProject: (id: string) => void;
  updateSkill: (id: string, patch: Partial<Skill>) => void;
  addSkill: () => void;
  deleteSkill: (id: string) => void;
  updateEducation: (id: string, patch: Partial<Education>) => void;
  addEducation: () => void;
  deleteEducation: (id: string) => void;
  resetAll: () => void;
};

const STORAGE_KEY = 'resume_profiles_v2';

type PersistShape = { profiles: Profile[]; data: DataBundle };

// Default seed data imported lazily to avoid SSR differences
import { data as seedData } from './data';

const load = (): PersistShape => {
  if (typeof window === 'undefined') return { profiles: [], data: seedData };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaults: Profile[] = [
        {
          id: nanoid(),
          name: 'AI Resume',
          personalInfo: {
            fullName: 'Aman Zaveri',
            email: 'a2zaveri@uwaterloo.ca',
            phone: '647-676-8981',
            location: 'Toronto, ON',
            linkedin: 'linkedin.com/in/aman-zaveri',
            github: 'github.com/azaveri7',
            website: '',
            summary: 'AI + Embedded + Systems'
          },
          experienceIds: ['ford-se-2025', 'ford-wlan-2024'],
          projectIds: ['letterly', 'autonomous-parking'],
          skillIds: ['langs', 'tools', 'devops'],
          educationIds: ['uw-ai'],
          template: 'classic'
        },
        {
          id: nanoid(),
          name: 'General Software',
          personalInfo: {
            fullName: 'Aman Zaveri',
            email: 'a2zaveri@uwaterloo.ca',
            phone: '647-676-8981',
            location: 'Toronto, ON',
            linkedin: 'linkedin.com/in/aman-zaveri',
            github: 'github.com/azaveri7',
            website: '',
            summary: 'Full‑stack + DevOps'
          },
          experienceIds: ['ford-se-2025', 'transpire-2024'],
          projectIds: ['course-clutch', 'letterly'],
          skillIds: ['langs', 'tools', 'devops'],
          educationIds: ['uw-ai'],
          template: 'classic'
        }
      ];
      return { profiles: defaults, data: seedData };
    }
    const parsed = JSON.parse(raw) as PersistShape;
    
    // Migrate old data that doesn't have personalInfo in data bundle
    if (!parsed.data.personalInfo) {
      parsed.data.personalInfo = {
        fullName: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        github: '',
        website: '',
        summary: ''
      };
    }
    
    // Migrate old profiles that don't have personalInfo
    const migratedProfiles = parsed.profiles.map(profile => {
      if (!profile.personalInfo) {
        return {
          ...profile,
          personalInfo: {
            fullName: '',
            email: '',
            phone: '',
            location: '',
            linkedin: '',
            github: '',
            website: '',
            summary: (profile as any).summary || '' // Migrate old summary field
          }
        } as Profile;
      }
      return profile;
    });
    
    return { profiles: migratedProfiles, data: parsed.data };
  } catch {
    return { profiles: [], data: seedData };
  }
};

const save = (state: PersistShape) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const useProfilesStore = create<ProfilesState>((set, get) => ({
  ...load(),
  createProfile: () => {
    const masterPersonalInfo = get().data.personalInfo;
    const next: Profile = {
      id: nanoid(),
      name: 'New Profile',
      personalInfo: {
        ...masterPersonalInfo,
        summary: '' // Keep summary empty for new profiles
      },
      experienceIds: [],
      projectIds: [],
      skillIds: [],
      educationIds: [],
      template: 'classic'
    };
    const all = [next, ...get().profiles];
    const bundle = get().data;
    save({ profiles: all, data: bundle });
    set({ profiles: all });
  },
  updateProfile: (id, patch) => {
    const all = get().profiles.map((p) => (p.id === id ? { ...p, ...patch } : p));
    save({ profiles: all, data: get().data });
    set({ profiles: all });
  },
  reorderProfileItems: (profileId: string, itemType: 'experienceIds' | 'projectIds' | 'skillIds' | 'educationIds', fromIndex: number, toIndex: number) => {
    const all = get().profiles.map((p) => {
      if (p.id === profileId) {
        const items = [...p[itemType]];
        const [movedItem] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, movedItem);
        return { ...p, [itemType]: items };
      }
      return p;
    });
    save({ profiles: all, data: get().data });
    set({ profiles: all });
  },
  updatePersonalInfo: (id, patch) => {
    const all = get().profiles.map((p) => {
      if (p.id === id) {
        const currentPersonalInfo = p.personalInfo || {
          fullName: '',
          email: '',
          phone: '',
          location: '',
          linkedin: '',
          github: '',
          website: '',
          summary: ''
        };
        return { ...p, personalInfo: { ...currentPersonalInfo, ...patch } };
      }
      return p;
    });
    save({ profiles: all, data: get().data });
    set({ profiles: all });
  },
  updateMasterPersonalInfo: (patch) => {
    const data = get().data;
    const updatedData = {
      ...data,
      personalInfo: { ...data.personalInfo, ...patch }
    };
    save({ profiles: get().profiles, data: updatedData });
    set({ data: updatedData });
  },
  updateProfileExperience: (profileId, experienceId, patch) => {
    const all = get().profiles.map((p) => {
      if (p.id === profileId) {
        const overrides = p.experienceOverrides || {};
        return {
          ...p,
          experienceOverrides: {
            ...overrides,
            [experienceId]: { ...overrides[experienceId], ...patch }
          }
        };
      }
      return p;
    });
    save({ profiles: all, data: get().data });
    set({ profiles: all });
  },
  updateProfileProject: (profileId, projectId, patch) => {
    const all = get().profiles.map((p) => {
      if (p.id === profileId) {
        const overrides = p.projectOverrides || {};
        return {
          ...p,
          projectOverrides: {
            ...overrides,
            [projectId]: { ...overrides[projectId], ...patch }
          }
        };
      }
      return p;
    });
    save({ profiles: all, data: get().data });
    set({ profiles: all });
  },
  updateProfileSkill: (profileId, skillId, patch) => {
    const all = get().profiles.map((p) => {
      if (p.id === profileId) {
        const overrides = p.skillOverrides || {};
        return {
          ...p,
          skillOverrides: {
            ...overrides,
            [skillId]: { ...overrides[skillId], ...patch }
          }
        };
      }
      return p;
    });
    save({ profiles: all, data: get().data });
    set({ profiles: all });
  },
  updateProfileEducation: (profileId, educationId, patch) => {
    const all = get().profiles.map((p) => {
      if (p.id === profileId) {
        const overrides = p.educationOverrides || {};
        return {
          ...p,
          educationOverrides: {
            ...overrides,
            [educationId]: { ...overrides[educationId], ...patch }
          }
        };
      }
      return p;
    });
    save({ profiles: all, data: get().data });
    set({ profiles: all });
  },
  resetProfileOverride: (profileId, itemType, itemId) => {
    const all = get().profiles.map((p) => {
      if (p.id === profileId) {
        const overrideKey = `${itemType}Overrides` as keyof Profile;
        const overrides = { ...(p[overrideKey] as Record<string, any> || {}) };
        delete overrides[itemId];
        return { ...p, [overrideKey]: overrides };
      }
      return p;
    });
    save({ profiles: all, data: get().data });
    set({ profiles: all });
  },
  deleteProfile: (id) => {
    const all = get().profiles.filter((p) => p.id !== id);
    save({ profiles: all, data: get().data });
    set({ profiles: all });
  },
  cloneProfile: (id) => {
    const src = get().profiles.find(p => p.id === id);
    if (!src) return;
    const cloned: Profile = { ...src, id: nanoid(), name: src.name + ' Copy' };
    const all = [cloned, ...get().profiles];
    save({ profiles: all, data: get().data });
    set({ profiles: all });
  },
  updateData: (patch) => {
    const merged: DataBundle = { ...get().data, ...patch } as DataBundle;
    save({ profiles: get().profiles, data: merged });
    set({ data: merged });
  },
  updateExperience: (id, patch) => {
    const experiences = get().data.experiences.map(e => e.id === id ? { ...e, ...patch } : e);
    get().updateData({ experiences });
  },
  addExperience: () => {
    const experiences = [
      { id: nanoid(), title: 'New Role', company: 'Company', date: '2025', bullets: ['Achievement one'], tags: [] },
      ...get().data.experiences
    ];
    get().updateData({ experiences });
  },
  deleteExperience: (id) => {
    const experiences = get().data.experiences.filter(e => e.id !== id);
    get().updateData({ experiences });
  },
  updateProject: (id, patch) => {
    const projects = get().data.projects.map(p => p.id === id ? { ...p, ...patch } : p);
    get().updateData({ projects });
  },
  addProject: () => {
    const projects = [
      { id: nanoid(), title: 'New Project', link: '', bullets: ['Did something cool'], tags: [] },
      ...get().data.projects
    ];
    get().updateData({ projects });
  },
  deleteProject: (id) => {
    const projects = get().data.projects.filter(p => p.id !== id);
    get().updateData({ projects });
  },
  updateSkill: (id, patch) => {
    const skills = get().data.skills.map(s => s.id === id ? { ...s, ...patch } : s);
    get().updateData({ skills });
  },
  addSkill: () => {
    const skills = [
      { id: nanoid(), name: 'New Category', details: 'List, of, skills' },
      ...get().data.skills
    ];
    get().updateData({ skills });
  },
  deleteSkill: (id) => {
    const skills = get().data.skills.filter(s => s.id !== id);
    get().updateData({ skills });
  },
  updateEducation: (id, patch) => {
    const education = get().data.education.map(e => e.id === id ? { ...e, ...patch } : e);
    get().updateData({ education });
  },
  addEducation: () => {
    const education = [
      { id: nanoid(), title: 'New Program', details: 'Institution & year' },
      ...get().data.education
    ];
    get().updateData({ education });
  },
  deleteEducation: (id) => {
    const education = get().data.education.filter(e => e.id !== id);
    get().updateData({ education });
  },
  resetAll: () => {
    save({ profiles: [], data: seedData });
    set({ profiles: [], data: seedData });
  }
}));