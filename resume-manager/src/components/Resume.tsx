'use client';

import type { DataBundle, Profile } from '@/lib/types';
import clsx from 'classnames';

export function Resume({ profile, data, compact }: { profile: Profile; data: DataBundle; compact?: boolean }) {
  const exp = data.experiences.filter((e) => profile.experienceIds.includes(e.id));
  const pro = data.projects.filter((p) => profile.projectIds.includes(p.id));
  const skl = data.skills.filter((s) => profile.skillIds.includes(s.id));
  const edu = data.education.filter((e) => profile.educationIds.includes(e.id));

  return (
    <div className={clsx('text-[13px] leading-relaxed', compact ? 'space-y-4' : 'space-y-6')}>
      {/* Header */}
      <header className="border-b border-neutral-200 pb-3">
        <h1 className="text-2xl font-semibold">Aman Zaveri</h1>
        <div className="mt-1 text-[12px] text-neutral-700">
          Toronto, ON | 647-676-8981 | a2zaveri@uwaterloo.ca | LinkedIn | GitHub
        </div>
      </header>

      {/* Skills */}
      {skl.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-800">Skills</h2>
          <div className="mt-1 grid grid-cols-1 gap-2 md:grid-cols-2">
            {skl.map((s) => (
              <div key={s.id}>
                <span className="font-medium">{s.name}:</span> {s.details}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {exp.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-800">Work Experiences</h2>
          <div className="mt-1 space-y-3">
            {exp.map((e) => (
              <div key={e.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="font-semibold">{e.title} | {e.company}</div>
                  <div className="text-xs text-neutral-600">{e.date}</div>
                </div>
                <ul className="ml-5 list-disc text-[13px]">
                  {e.bullets.map((b, i) => (<li key={i}>{b}</li>))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {pro.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-800">Projects</h2>
          <div className="mt-1 space-y-3">
            {pro.map((p) => (
              <div key={p.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="font-semibold">{p.title}</div>
                  <div className="text-xs text-neutral-600">{p.link || ''}</div>
                </div>
                <ul className="ml-5 list-disc text-[13px]">
                  {p.bullets.map((b, i) => (<li key={i}>{b}</li>))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {edu.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-800">Education</h2>
          <ul className="ml-5 list-disc text-[13px]">
            {edu.map((e) => (
              <li key={e.id}>
                <span className="font-medium">{e.title}</span> — {e.details}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}