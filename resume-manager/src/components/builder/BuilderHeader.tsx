'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Save, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import type { Profile } from '@/lib/types';

interface BuilderHeaderProps {
  profile: Profile;
  saveStatus: 'saved' | 'saving' | 'idle';
  onDeleteProfile: () => void;
}

export function BuilderHeader({ profile, saveStatus, onDeleteProfile }: BuilderHeaderProps) {
  const router = useRouter();

  const handleDelete = () => {
    if (confirm('Delete this profile? This action cannot be undone.')) {
      onDeleteProfile();
      router.replace('/');
    }
  };

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 w-full border-b glass backdrop-blur-xl py-4 px-5"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hover:bg-white/10"
            >
              <Link href="/">
                <ArrowLeft size={16} className="mr-2" />
                Back to Home
              </Link>
            </Button>
          </motion.div>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-lg font-semibold">{profile.name}</h1>
            <p className="text-xs text-muted-foreground">Resume Builder</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Save Status Indicator */}
          <AnimatePresence mode="wait">
            {saveStatus === 'saving' && (
              <motion.div
                key="saving"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                >
                  <Save size={14} />
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
                className="flex items-center gap-2 text-sm text-emerald-600"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <Check size={14} />
                </motion.div>
                <span>Saved</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/print/${profile.id}`, '_blank')}
              className="border-border hover:bg-accent"
            >
              <Printer size={16} className="mr-2" />
              Export PDF
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="border-border hover:bg-destructive/90"
            >
              Delete
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
