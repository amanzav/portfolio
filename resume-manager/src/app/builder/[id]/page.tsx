'use client';

import { notFound, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useProfilesStore } from '@/lib/store';
import { CustomizableItemPicker } from '@/components/CustomizableItemPicker';
import { PersonalInfoForm } from '@/components/PersonalInfoForm';
import { Resume } from '@/components/Resume';
import { ArrowLeft, Printer, Save, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

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

  const handleUpdatePersonalInfo = (patch: Partial<any>) => {
    updatePersonalInfo(profile.id, patch);
    handleSaveStatusChange();
  };

  const handleUpdateProfileExperience = (itemId: string, patch: any) => {
    updateProfileExperience(profile.id, itemId, patch);
    handleSaveStatusChange();
  };

  const handleUpdateProfileProject = (itemId: string, patch: any) => {
    updateProfileProject(profile.id, itemId, patch);
    handleSaveStatusChange();
  };

  const handleUpdateProfileSkill = (itemId: string, patch: any) => {
    updateProfileSkill(profile.id, itemId, patch);
    handleSaveStatusChange();
  };

  const handleUpdateProfileEducation = (itemId: string, patch: any) => {
    updateProfileEducation(profile.id, itemId, patch);
    handleSaveStatusChange();
  };

  const handleResetProfileOverride = (itemType: string, itemId: string) => {
    resetProfileOverride(profile.id, itemType as any, itemId);
    handleSaveStatusChange();
  };

  const handleReorderItems = (itemType: any, fromIndex: number, toIndex: number) => {
    reorderProfileItems(profile.id, itemType, fromIndex, toIndex);
    handleSaveStatusChange();
  };

  return (
    <div className='min-h-screen flex flex-col'>
      {/* Sticky Header */}
      <div className={`sticky top-0 z-50 w-full border-b bg-card/75 backdrop-blur-md text-card-foreground transition-all duration-200 ${
        isHeaderCompact ? 'py-3 px-4' : 'py-5 px-5'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft size={16} /> Back
              </Link>
            </Button>
            <h1 className={`font-semibold transition-all duration-200 ${
              isHeaderCompact ? 'text-base' : 'text-lg'
            }`}>{profile.name}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Save Status Indicator */}
            <div className={`flex items-center gap-2 text-muted-foreground transition-all duration-200 ${
              isHeaderCompact ? 'text-xs' : 'text-sm'
            }`}>
              {saveStatus === 'saving' && (
                <>
                  <Save size={isHeaderCompact ? 12 : 14} className="animate-pulse" />
                  <span>Saving...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Check size={isHeaderCompact ? 12 : 14} className="text-green-600" />
                  <span>Saved</span>
                </>
              )}
            </div>
            
            <Button
              variant="outline"
              size={isHeaderCompact ? "sm" : "sm"}
              onClick={() => window.open(`/print/${profile.id}`, '_blank')}
            >
              <Printer size={isHeaderCompact ? 14 : 16} /> Print / PDF
            </Button>
            <Button
              variant="destructive"
              size={isHeaderCompact ? "sm" : "sm"}
              onClick={() => {
                if (confirm('Delete this profile?')) deleteProfile(profile.id);
                router.replace('/');
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area - Flex Layout */}
      <div className="flex-1 flex pl-6 gap-6 mr-[50%] pr-6">
        {/* Left Side - Editor (Scrollable) */}
        <div className="w-full overflow-y-auto ">
          <div className='flex flex-col gap-6 py-6'>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Personal Information</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={syncFromMasterData}
                  >
                    Sync from Master Data
                  </Button>
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
                <div className="mt-4 text-xs text-muted-foreground">
                  Personal information defaults come from{' '}
                  <Button variant="link" className="h-auto p-0 text-xs" asChild>
                    <Link href="/data">Master Data Manager</Link>
                  </Button>
                  . You can customize it here for this specific profile.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">Profile Name</Label>
                    <Input
                      id="profile-name"
                      value={profile.name}
                      onChange={(e) => handleUpdateProfile({ name: e.target.value })}
                      placeholder="Enter profile name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="template-select">Template</Label>
                    <Select
                      value={profile.template || 'classic'}
                      onValueChange={(value) => handleUpdateProfile({ template: value as any })}
                    >
                      <SelectTrigger id="template-select">
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="classic">Classic</SelectItem>
                        <SelectItem value="compact">Compact</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  You can customize content for this specific resume using the edit buttons below. Changes won&apos;t affect your master data in{' '}
                  <Button variant="link" className="h-auto p-0 text-xs" asChild>
                    <Link href="/data">Master Data Manager</Link>
                  </Button>
                  .
                </div>
              </CardContent>
            </Card>

            <CustomizableItemPicker
              title="Work Experiences"
              type="experience"
              items={data.experiences}
              selected={profile.experienceIds}
              profile={profile}
              onChange={(ids) => handleUpdateProfile({ experienceIds: ids })}
              onReorder={(fromIndex, toIndex) => handleReorderItems('experienceIds', fromIndex, toIndex)}
              onUpdateItem={handleUpdateProfileExperience}
              onResetOverride={(itemId) => handleResetProfileOverride('experience', itemId)}
            />

            <CustomizableItemPicker
              title="Projects"
              type="project"
              items={data.projects}
              selected={profile.projectIds}
              profile={profile}
              onChange={(ids) => handleUpdateProfile({ projectIds: ids })}
              onReorder={(fromIndex, toIndex) => handleReorderItems('projectIds', fromIndex, toIndex)}
              onUpdateItem={handleUpdateProfileProject}
              onResetOverride={(itemId) => handleResetProfileOverride('project', itemId)}
            />

            <CustomizableItemPicker
              title="Skills"
              type="skill"
              items={data.skills}
              selected={profile.skillIds}
              profile={profile}
              onChange={(ids) => handleUpdateProfile({ skillIds: ids })}
              onReorder={(fromIndex, toIndex) => handleReorderItems('skillIds', fromIndex, toIndex)}
              onUpdateItem={handleUpdateProfileSkill}
              onResetOverride={(itemId) => handleResetProfileOverride('skill', itemId)}
            />

            <CustomizableItemPicker
              title="Education"
              type="education"
              items={data.education}
              selected={profile.educationIds}
              profile={profile}
              onChange={(ids) => handleUpdateProfile({ educationIds: ids })}
              onReorder={(fromIndex, toIndex) => handleReorderItems('educationIds', fromIndex, toIndex)}
              onUpdateItem={handleUpdateProfileEducation}
              onResetOverride={(itemId) => handleResetProfileOverride('education', itemId)}
            />
          </div>
        </div>

        {/* Right Side - Resume Preview (Fixed) */}
        <div className="w-1/2 fixed top-0 right-0 h-screen flex flex-col bg-background border-l border-border/50">
          <div className={`flex-1 transition-all duration-200 ${
            isHeaderCompact ? 'pt-20' : 'pt-24'
          }`}>
            <ScrollArea className="h-full">
              <div className="px-6 pb-6">
                <Resume profile={profile} data={data} />
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
} 