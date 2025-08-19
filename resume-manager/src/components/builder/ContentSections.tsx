'use client';

import { motion } from 'framer-motion';
import type { Profile, DataBundle } from '@/lib/types';
import { CustomizableItemPicker } from '@/components/CustomizableItemPicker';

interface ContentSectionsProps {
  profile: Profile;
  data: DataBundle;
  onUpdateProfile: (patch: Partial<Profile>) => void;
  onReorderItems: (
    itemType: 'experienceIds' | 'projectIds' | 'skillIds' | 'educationIds',
    fromIndex: number,
    toIndex: number
  ) => void;
  onUpdateProfileExperience: (itemId: string, patch: any) => void;
  onUpdateProfileProject: (itemId: string, patch: any) => void;
  onUpdateProfileSkill: (itemId: string, patch: any) => void;
  onUpdateProfileEducation: (itemId: string, patch: any) => void;
  onResetProfileOverride: (itemType: string, itemId: string) => void;
}

export function ContentSections({
  profile,
  data,
  onUpdateProfile,
  onReorderItems,
  onUpdateProfileExperience,
  onUpdateProfileProject,
  onUpdateProfileSkill,
  onUpdateProfileEducation,
  onResetProfileOverride,
}: ContentSectionsProps) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <CustomizableItemPicker
          title="Work Experiences"
          type="experience"
          items={data.experiences}
          selected={profile.experienceIds}
          profile={profile}
          onChange={(ids: string[]) =>
            onUpdateProfile({ experienceIds: ids })
          }
          onReorder={(fromIndex: number, toIndex: number) =>
            onReorderItems('experienceIds', fromIndex, toIndex)
          }
          onUpdateItem={onUpdateProfileExperience}
          onResetOverride={(itemId: string) =>
            onResetProfileOverride('experience', itemId)
          }
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <CustomizableItemPicker
          title="Projects"
          type="project"
          items={data.projects}
          selected={profile.projectIds}
          profile={profile}
          onChange={(ids: string[]) => onUpdateProfile({ projectIds: ids })}
          onReorder={(fromIndex: number, toIndex: number) =>
            onReorderItems('projectIds', fromIndex, toIndex)
          }
          onUpdateItem={onUpdateProfileProject}
          onResetOverride={(itemId: string) =>
            onResetProfileOverride('project', itemId)
          }
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <CustomizableItemPicker
          title="Skills"
          type="skill"
          items={data.skills}
          selected={profile.skillIds}
          profile={profile}
          onChange={(ids: string[]) => onUpdateProfile({ skillIds: ids })}
          onReorder={(fromIndex: number, toIndex: number) =>
            onReorderItems('skillIds', fromIndex, toIndex)
          }
          onUpdateItem={onUpdateProfileSkill}
          onResetOverride={(itemId: string) =>
            onResetProfileOverride('skill', itemId)
          }
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <CustomizableItemPicker
          title="Education"
          type="education"
          items={data.education}
          selected={profile.educationIds}
          profile={profile}
          onChange={(ids: string[]) => onUpdateProfile({ educationIds: ids })}
          onReorder={(fromIndex: number, toIndex: number) =>
            onReorderItems('educationIds', fromIndex, toIndex)
          }
          onUpdateItem={onUpdateProfileEducation}
          onResetOverride={(itemId: string) =>
            onResetProfileOverride('education', itemId)
          }
        />
      </motion.div>
    </div>
  );
}
