'use client';

import { create } from 'zustand';
import { nanoid } from './util';
import type { Profile } from './types';

export type ProfilesState = {
  profiles: Profile[];
  createProfile: () => void;
  updateProfile: (id: string, patch: Partial<Profile>) => void;
  deleteProfile: (id: string) => void;
};

const STORAGE_KEY = 'resume_profiles_v1';

const load = (): Profile[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [
      {
        id: nanoid(),
        name: 'AI Resume',
        summary: 'AI + Embedded + Systems',
        experienceIds: ['ford-se-2025', 'ford-wlan-2024'],
        projectIds: ['letterly', 'autonomous-parking'],
        skillIds: ['langs', 'tools', 'devops'],
        educationIds: ['uw-ai']
      },
      {
        id: nanoid(),
        name: 'General Software',
        summary: 'Full‑stack + DevOps',
        experienceIds: ['ford-se-2025', 'transpire-2024'],
        projectIds: ['course-clutch', 'letterly'],
        skillIds: ['langs', 'tools', 'devops'],
        educationIds: ['uw-ai']
      }
    ];
    const parsed = JSON.parse(raw) as Profile[];
    return parsed;
  } catch {
    return [];
  }
};

const save = (profiles: Profile[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
};

export const useProfilesStore = create<ProfilesState>((set, get) => ({
  profiles: load(),
  createProfile: () => {
    const next: Profile = {
      id: nanoid(),
      name: 'New Profile',
      summary: '',
      experienceIds: [],
      projectIds: [],
      skillIds: [],
      educationIds: []
    };
    const all = [next, ...get().profiles];
    save(all);
    set({ profiles: all });
  },
  updateProfile: (id, patch) => {
    const all = get().profiles.map((p) => (p.id === id ? { ...p, ...patch } : p));
    save(all);
    set({ profiles: all });
  },
  deleteProfile: (id) => {
    const all = get().profiles.filter((p) => p.id !== id);
    save(all);
    set({ profiles: all });
  }
}));