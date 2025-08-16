'use client';

import { notFound, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useProfilesStore } from '@/lib/store';
import { data } from '@/lib/data';
import { ItemPicker } from '@/components/ItemPicker';
import { Resume } from '@/components/Resume';
import { ArrowLeft, Printer } from 'lucide-react';

export default function BuilderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { profiles, updateProfile, deleteProfile } = useProfilesStore();

  const profile = useMemo(() => profiles.find((p) => p.id === params.id), [profiles, params.id]);

  useEffect(() => {
    if (!profile) {
      // If profile missing, redirect home after a brief delay
      const t = setTimeout(() => router.replace('/'), 800);
      return () => clearTimeout(t);
    }
  }, [profile, router]);

  if (!profile) return notFound();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900">
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <button
              className="no-print rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-neutral-50"
              onClick={() => window.open(`/print/${profile.id}`, '_blank')}
            >
              <Printer className="inline mr-1" size={16} /> Print / PDF
            </button>
            <button
              className="no-print rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-100"
              onClick={() => {
                if (confirm('Delete this profile?')) deleteProfile(profile.id);
                router.replace('/');
              }}
            >
              Delete
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <label className="block text-sm font-medium">Profile Name</label>
          <input
            value={profile.name}
            onChange={(e) => updateProfile(profile.id, { name: e.target.value })}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
          />
          <label className="mt-4 block text-sm font-medium">Summary (optional)</label>
          <input
            value={profile.summary || ''}
            onChange={(e) => updateProfile(profile.id, { summary: e.target.value })}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        <ItemPicker
          title="Work Experiences"
          items={data.experiences}
          selected={profile.experienceIds}
          onChange={(ids) => updateProfile(profile.id, { experienceIds: ids })}
        />

        <ItemPicker
          title="Projects"
          items={data.projects}
          selected={profile.projectIds}
          onChange={(ids) => updateProfile(profile.id, { projectIds: ids })}
        />

        <ItemPicker
          title="Skills"
          items={data.skills}
          selected={profile.skillIds}
          onChange={(ids) => updateProfile(profile.id, { skillIds: ids })}
        />

        <ItemPicker
          title="Education"
          items={data.education}
          selected={profile.educationIds}
          onChange={(ids) => updateProfile(profile.id, { educationIds: ids })}
        />
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <Resume profile={profile} data={data} />
      </div>
    </div>
  );
}