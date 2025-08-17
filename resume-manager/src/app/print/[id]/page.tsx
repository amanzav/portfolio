'use client';

import { useParams } from 'next/navigation';
import { useProfilesStore } from '@/lib/store';
import { useEffect, useMemo } from 'react';
import { Resume } from '@/components/Resume';

export default function PrintPage() {
  const params = useParams<{ id: string }>();
  const { profiles, data } = useProfilesStore();
  const profile = useMemo(() => profiles.find((p) => p.id === params.id), [profiles, params.id]);

  useEffect(() => {
    // Auto-open print dialog on load for quick PDF export
    if (typeof window !== 'undefined') {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, []);

  if (!profile) return <div className="p-6">Profile not found.</div>;

  return (
    <div className="mx-auto max-w-3xl bg-white p-8">
      <Resume profile={profile} data={data} compact />
    </div>
  );
}