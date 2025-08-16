'use client';

import Link from 'next/link';
import { useProfilesStore } from '@/lib/store';
import { Plus, FileText } from 'lucide-react';

export default function Page() {
  const { profiles, createProfile } = useProfilesStore();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Resume Builder</h1>
        <button
          onClick={() => createProfile()}
          className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-2 text-white shadow hover:bg-neutral-800"
        >
          <Plus size={18} /> New Profile
        </button>
      </header>

      <p className="text-sm text-neutral-600">
        Manage a single source of truth for experiences, projects, skills, and education. Create multiple profiles and export print-ready PDFs.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {profiles.map((p) => (
          <Link
            key={p.id}
            href={`/builder/${p.id}`}
            className="group rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">{p.name}</h2>
              <FileText className="text-neutral-400 group-hover:text-neutral-900" />
            </div>
            <div className="mt-2 text-xs text-neutral-500">
              {p.summary || 'No summary yet'}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}