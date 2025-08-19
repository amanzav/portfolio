'use client';

import Link from 'next/link';
import { Settings, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { motion } from 'framer-motion';
import type { Profile, PersonalInfo } from '@/lib/types';
import { PersonalInfoForm } from '@/components/PersonalInfoForm';

interface ProfileSettingsProps {
  profile: Profile;
  onUpdateProfile: (patch: Partial<Profile>) => void;
  onUpdatePersonalInfo: (patch: Partial<PersonalInfo>) => void;
  onSyncFromMasterData: () => void;
}

export function ProfileSettings({
  profile,
  onUpdateProfile,
  onUpdatePersonalInfo,
  onSyncFromMasterData,
}: ProfileSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Profile Settings Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-lg">Profile Settings</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure name and template
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Profile Name</Label>
                <Input
                  id="profile-name"
                  value={profile.name}
                  onChange={(e) => onUpdateProfile({ name: e.target.value })}
                  placeholder="Enter profile name"
                  className="border-border focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-select">Template Style</Label>
                <Select
                  value={profile.template || 'classic'}
                  onValueChange={(value) =>
                    onUpdateProfile({
                      template: value as 'classic' | 'compact',
                    })
                  }
                >
                  <SelectTrigger
                    id="template-select"
                    className="border-border focus:border-primary"
                  >
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-primary/80">
                ✨ Customize content below without affecting your{' '}
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                  asChild
                >
                  <Link href="/data">Master Data</Link>
                </Button>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Personal Information Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Contact details and professional summary
                  </p>
                </div>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSyncFromMasterData}
                  className="border-border hover:bg-accent"
                >
                  Sync from Master Data
                </Button>
              </motion.div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <PersonalInfoForm
              personalInfo={
                profile.personalInfo || {
                  fullName: '',
                  email: '',
                  phone: '',
                  location: '',
                  linkedin: '',
                  github: '',
                  website: '',
                  summary: '',
                }
              }
              onUpdate={onUpdatePersonalInfo}
            />
            <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                💡 Personal information defaults come from{' '}
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500"
                  asChild
                >
                  <Link href="/data">Master Data Manager</Link>
                </Button>
                . Customize it here for this specific profile.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
