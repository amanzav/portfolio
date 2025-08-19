'use client';

import { motion } from 'framer-motion';
import type { Profile, DataBundle } from '@/lib/types';
import { Resume } from '@/components/Resume';

interface ResumePreviewProps {
  profile: Profile;
  data: DataBundle;
}

export function ResumePreview({ profile, data }: ResumePreviewProps) {
  return (
    <motion.div
      className="fixed top-6 right-0 h-screen flex flex-col glass border-l border-border/10"
      style={{ width: '50vw' }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      {/* Header spacer to match main header */}
      <div className="py-4 px-5 border-b border-transparent">
        <div className="h-6 opacity-0"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <motion.div
          className=""
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          {/* Document-sized container with fixed document height */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-border p-8 h-[1056px] max-w-[8.5in] mx-auto overflow-y-auto">
            <Resume profile={profile} data={data} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
