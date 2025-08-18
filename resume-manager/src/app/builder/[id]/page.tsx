"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useProfilesStore } from "@/lib/store";
import type {
  PersonalInfo,
  Experience,
  Project,
  Skill,
  Education,
} from "@/lib/types";
import { motion } from "framer-motion";
import { useBuilderState } from "@/hooks/useBuilderState";
import { BuilderHeader } from "@/components/builder/BuilderHeader";
import { ProfileSettings } from "@/components/builder/ProfileSettings";
import { ContentSections } from "@/components/builder/ContentSections";
import { ResumePreview } from "@/components/builder/ResumePreview";

export default function BuilderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    profiles,
    updateProfile,
    updatePersonalInfo,
    reorderProfileItems,
    deleteProfile,
    data,
    updateProfileExperience,
    updateProfileProject,
    updateProfileSkill,
    updateProfileEducation,
    resetProfileOverride,
  } = useProfilesStore();

  const { saveStatus, createUpdateHandler } = useBuilderState();

  const profile = useMemo(
    () => profiles.find((p) => p.id === params.id),
    [profiles, params.id]
  );

  useEffect(() => {
    if (!profile) {
      const t = setTimeout(() => router.replace("/"), 800);
      return () => clearTimeout(t);
    }
  }, [profile, router]);

  if (!profile) return notFound();

  const syncFromMasterData = () => {
    updatePersonalInfo(profile.id, {
      ...data.personalInfo,
      summary: profile.personalInfo?.summary || "",
    });
  };

  // Create wrapped handlers with save status
  const handleUpdateProfile = createUpdateHandler(
    (patch: Partial<typeof profile>) => updateProfile(profile.id, patch)
  );

  const handleUpdatePersonalInfo = createUpdateHandler(
    (patch: Partial<PersonalInfo>) => updatePersonalInfo(profile.id, patch)
  );

  const handleUpdateProfileExperience = createUpdateHandler(
    (itemId: string, patch: Partial<Experience>) =>
      updateProfileExperience(profile.id, itemId, patch)
  );

  const handleUpdateProfileProject = createUpdateHandler(
    (itemId: string, patch: Partial<Project>) =>
      updateProfileProject(profile.id, itemId, patch)
  );

  const handleUpdateProfileSkill = createUpdateHandler(
    (itemId: string, patch: Partial<Skill>) =>
      updateProfileSkill(profile.id, itemId, patch)
  );

  const handleUpdateProfileEducation = createUpdateHandler(
    (itemId: string, patch: Partial<Education>) =>
      updateProfileEducation(profile.id, itemId, patch)
  );

  const handleResetProfileOverride = createUpdateHandler(
    (itemType: string, itemId: string) =>
      resetProfileOverride(
        profile.id,
        itemType as "experience" | "project" | "skill" | "education",
        itemId
      )
  );

  const handleReorderItems = createUpdateHandler(
    (
      itemType: "experienceIds" | "projectIds" | "skillIds" | "educationIds",
      fromIndex: number,
      toIndex: number
    ) => reorderProfileItems(profile.id, itemType, fromIndex, toIndex)
  );

  const handleSyncFromMasterData = createUpdateHandler(syncFromMasterData);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-hero">
      <BuilderHeader
        profile={profile}
        saveStatus={saveStatus}
        onDeleteProfile={() => deleteProfile(profile.id)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex pt-20">
        {/* Left Side - Editor */}
        <motion.div
          className="overflow-y-auto p-6"
          style={{ width: '50vw' }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex flex-col gap-6">
            <ProfileSettings
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              onUpdatePersonalInfo={handleUpdatePersonalInfo}
              onSyncFromMasterData={handleSyncFromMasterData}
            />

            <ContentSections
              profile={profile}
              data={data}
              onUpdateProfile={handleUpdateProfile}
              onReorderItems={handleReorderItems}
              onUpdateProfileExperience={handleUpdateProfileExperience}
              onUpdateProfileProject={handleUpdateProfileProject}
              onUpdateProfileSkill={handleUpdateProfileSkill}
              onUpdateProfileEducation={handleUpdateProfileEducation}
              onResetProfileOverride={handleResetProfileOverride}
            />
          </div>
        </motion.div>

        {/* Right Side - Resume Preview */}
        <ResumePreview profile={profile} data={data} />
      </div>
    </div>
  );
}
