'use client';

import { notFound, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useProfilesStore } from '@/lib/store';
import { PersonalInfo, Experience, Project, Skill, Education } from '@/lib/types';
import { CustomizableItemPicker } from '@/components/CustomizableItemPicker';
import { PersonalInfoForm } from '@/components/PersonalInfoForm';
import { Resume } from '@/components/Resume';
import { ArrowLeft, Printer, Save, Check, Settings, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

export default function BuilderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { profiles, updateProfile, updatePersonalInfo, reorderProfileItems, deleteProfile, data, updateProfileExperience, updateProfileProject, updateProfileSkill, updateProfileEducation, resetProfileOverride } = useProfilesStore();
  
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);

  const profile = useMemo(() => profiles.find((p) => p.id === params.id), [profiles, params.id]);

  // Debounced save status handler
  const handleSaveStatusChange = useCallback(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => setSaveStatus('saved'), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!profile) {
      // If profile missing, redirect home after a brief delay
      const t = setTimeout(() => router.replace('/'), 800);
      return () => clearTimeout(t);
    }
  }, [profile, router]);

  // Trigger save status on any profile change
  useEffect(() => {
    const cleanup = handleSaveStatusChange();
    return cleanup;
  }, [profile, handleSaveStatusChange]);

  // Handle scroll for header compacting
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsHeaderCompact(scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!profile) return notFound();

  const syncFromMasterData = () => {
    updatePersonalInfo(profile.id, {
      ...data.personalInfo,
      summary: profile.personalInfo?.summary || '' // Keep existing summary
    });
    handleSaveStatusChange();
  };

  // Enhanced update functions with save status
  const handleUpdateProfile = (patch: Partial<typeof profile>) => {
    updateProfile(profile.id, patch);
    handleSaveStatusChange();
  };

  const handleUpdatePersonalInfo = (patch: Partial<PersonalInfo>) => {
    updatePersonalInfo(profile.id, patch);
    handleSaveStatusChange();
  };

  const handleUpdateProfileExperience = (itemId: string, patch: Partial<Experience>) => {
    updateProfileExperience(profile.id, itemId, patch);
    handleSaveStatusChange();
  };

  const handleUpdateProfileProject = (itemId: string, patch: Partial<Project>) => {
    updateProfileProject(profile.id, itemId, patch);
    handleSaveStatusChange();
  };

  const handleUpdateProfileSkill = (itemId: string, patch: Partial<Skill>) => {
    updateProfileSkill(profile.id, itemId, patch);
    handleSaveStatusChange();
  };

  const handleUpdateProfileEducation = (itemId: string, patch: Partial<Education>) => {
    updateProfileEducation(profile.id, itemId, patch);
    handleSaveStatusChange();
  };

  const handleResetProfileOverride = (itemType: string, itemId: string) => {
    resetProfileOverride(profile.id, itemType as 'experience' | 'project' | 'skill' | 'education', itemId);
    handleSaveStatusChange();
  };

  const handleReorderItems = (itemType: 'experienceIds' | 'projectIds' | 'skillIds' | 'educationIds', fromIndex: number, toIndex: number) => {
    reorderProfileItems(profile.id, itemType, fromIndex, toIndex);
    handleSaveStatusChange();
  };

  return (
    <div className='min-h-screen flex flex-col bg-gradient-hero'>
      {/* Enhanced Sticky Header */}
      <motion.div 
        className={`sticky top-0 z-50 w-full border-b glass backdrop-blur-xl transition-all duration-300 ${
          isHeaderCompact ? 'py-3 px-4' : 'py-5 px-5'
        }`}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="sm" asChild className="hover:bg-white/10">
                <Link href="/">
                  <ArrowLeft size={16} className="mr-2" /> 
                  Back to Home
                </Link>
              </Button>
            </motion.div>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className={`font-semibold transition-all duration-200 ${
                isHeaderCompact ? 'text-base' : 'text-lg'
              }`}>
                {profile.name}
              </h1>
              {!isHeaderCompact && (
                <p className="text-xs text-muted-foreground">Resume Builder</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Enhanced Save Status Indicator */}
            <AnimatePresence mode="wait">
              {saveStatus === 'saving' && (
                <motion.div
                  key="saving"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`flex items-center gap-2 text-muted-foreground transition-all duration-200 ${
                    isHeaderCompact ? 'text-xs' : 'text-sm'
                  }`}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Save size={isHeaderCompact ? 12 : 14} />
                  </motion.div>
                  <span>Saving...</span>
                </motion.div>
              )}
              {saveStatus === 'saved' && (
                <motion.div
                  key="saved"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`flex items-center gap-2 text-emerald-600 transition-all duration-200 ${
                    isHeaderCompact ? 'text-xs' : 'text-sm'
                  }`}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Check size={isHeaderCompact ? 12 : 14} />
                  </motion.div>
                  <span>Saved</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size={isHeaderCompact ? "sm" : "sm"}
                onClick={() => window.open(`/print/${profile.id}`, '_blank')}
                className="bg-white/10 hover:bg-white/20 border-white/20 text-foreground backdrop-blur-sm"
              >
                <Printer size={isHeaderCompact ? 14 : 16} className="mr-2" /> 
                Export PDF
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="destructive"
                size={isHeaderCompact ? "sm" : "sm"}
                onClick={() => {
                  if (confirm('Delete this profile? This action cannot be undone.')) {
                    deleteProfile(profile.id);
                    router.replace('/');
                  }
                }}
                className="bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-600 dark:text-red-400"
              >
                Delete
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area - Enhanced Layout */}
      <div className="flex-1 flex pl-6 gap-6 mr-[50%] pr-6">
        {/* Left Side - Editor (Scrollable) */}
        <motion.div 
          className="w-full overflow-y-auto"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className='flex flex-col gap-6 py-6'>
            {/* Personal Information Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="glass shadow-glass border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-primary">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>Personal Information</CardTitle>
                        <p className="text-sm text-muted-foreground">Contact details and professional summary</p>
                      </div>
                    </div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={syncFromMasterData}
                        className="bg-white/10 hover:bg-white/20 border-white/20 backdrop-blur-sm"
                      >
                        Sync from Master Data
                      </Button>
                    </motion.div>
                  </div>
                </CardHeader>
                <CardContent>
                  <PersonalInfoForm
                    personalInfo={profile.personalInfo || {
                      fullName: '',
                      email: '',
                      phone: '',
                      location: '',
                      linkedin: '',
                      github: '',
                      website: '',
                      summary: ''
                    }}
                    onUpdate={handleUpdatePersonalInfo}
                  />
                  <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      💡 Personal information defaults come from{' '}
                      <Button variant="link" className="h-auto p-0 text-xs text-blue-600 dark:text-blue-400" asChild>
                        <Link href="/data">Master Data Manager</Link>
                      </Button>
                      . Customize it here for this specific profile.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Profile Settings Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="glass shadow-glass border-0">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-primary">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>Profile Settings</CardTitle>
                      <p className="text-sm text-muted-foreground">Configure name and template</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="profile-name">Profile Name</Label>
                      <Input
                        id="profile-name"
                        value={profile.name}
                        onChange={(e) => handleUpdateProfile({ name: e.target.value })}
                        placeholder="Enter profile name"
                        className="bg-white/50 dark:bg-black/50 border-white/20 focus:border-purple-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="template-select">Template Style</Label>
                      <Select
                        value={profile.template || 'classic'}
                        onValueChange={(value) => handleUpdateProfile({ template: value as 'classic' | 'compact' })}
                      >
                        <SelectTrigger id="template-select" className="bg-white/50 dark:bg-black/50 border-white/20">
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="classic">Classic</SelectItem>
                          <SelectItem value="compact">Compact</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-purple-700 dark:text-purple-300">
                      ✨ Customize content below without affecting your{' '}
                      <Button variant="link" className="h-auto p-0 text-xs text-purple-600 dark:text-purple-400" asChild>
                        <Link href="/data">Master Data</Link>
                      </Button>
                      .
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Content Sections */}
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
                onChange={(ids: string[]) => handleUpdateProfile({ experienceIds: ids })}
                onReorder={(fromIndex: number, toIndex: number) => handleReorderItems('experienceIds', fromIndex, toIndex)}
                onUpdateItem={handleUpdateProfileExperience}
                onResetOverride={(itemId: string) => handleResetProfileOverride('experience', itemId)}
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
                onChange={(ids: string[]) => handleUpdateProfile({ projectIds: ids })}
                onReorder={(fromIndex: number, toIndex: number) => handleReorderItems('projectIds', fromIndex, toIndex)}
                onUpdateItem={handleUpdateProfileProject}
                onResetOverride={(itemId: string) => handleResetProfileOverride('project', itemId)}
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
                onChange={(ids: string[]) => handleUpdateProfile({ skillIds: ids })}
                onReorder={(fromIndex: number, toIndex: number) => handleReorderItems('skillIds', fromIndex, toIndex)}
                onUpdateItem={handleUpdateProfileSkill}
                onResetOverride={(itemId: string) => handleResetProfileOverride('skill', itemId)}
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
                onChange={(ids: string[]) => handleUpdateProfile({ educationIds: ids })}
                onReorder={(fromIndex: number, toIndex: number) => handleReorderItems('educationIds', fromIndex, toIndex)}
                onUpdateItem={handleUpdateProfileEducation}
                onResetOverride={(itemId: string) => handleResetProfileOverride('education', itemId)}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side - Resume Preview (Fixed) */}
        <motion.div 
          className="w-1/2 fixed top-0 right-0 h-screen flex flex-col glass border-l border-white/10"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className={`flex-1 transition-all duration-200 ${
            isHeaderCompact ? 'pt-20' : 'pt-24'
          }`}>
            <div className="p-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Live Preview</h3>
                  <p className="text-xs text-muted-foreground">Real-time resume preview</p>
                </div>
                <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                  Auto-sync
                </Badge>
              </div>
            </div>
            <ScrollArea className="h-full">
              <motion.div 
                className="px-6 pb-6 pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                {/* Paper-like container */}
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-8 min-h-[11in] max-w-[8.5in] mx-auto">
                  <Resume profile={profile} data={data} />
                </div>
              </motion.div>
            </ScrollArea>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 