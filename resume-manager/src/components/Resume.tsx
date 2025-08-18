'use client';

import type { DataBundle, Profile } from '@/lib/types';
import { getEffectiveProfileData } from '@/lib/utils';
import { RichTextDisplay } from '@/components/ui/rich-text-editor';
import clsx from 'classnames';

export function Resume({ profile, data, compact }: { profile: Profile; data: DataBundle; compact?: boolean }) {
  const effectiveData = getEffectiveProfileData(profile, data);
  const exp = effectiveData.experiences.filter((e) => profile.experienceIds.includes(e.id));
  const pro = effectiveData.projects.filter((p) => profile.projectIds.includes(p.id));
  const skl = effectiveData.skills.filter((s) => profile.skillIds.includes(s.id));
  const edu = effectiveData.education.filter((e) => profile.educationIds.includes(e.id));

  const template = profile.template || 'classic';

  if (template === 'compact') {
    return (
      <div className={clsx('text-[12px] leading-snug space-y-3')}>        
        <header className="border-b border-border pb-2">
          <h1 className="text-xl font-semibold">{profile.personalInfo?.fullName || 'Your Name'}</h1>
          {profile.personalInfo?.summary && <RichTextDisplay content={profile.personalInfo.summary} className="mt-1 text-[11px] text-neutral-700" />}
        </header>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-3">
            {exp.length>0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-wide">Experience</h2>
                {exp.map(e => (
                  <div key={e.id} className="mt-1">
                    <div className="flex justify-between text-[11px] font-medium"><span>{e.title} @ {e.company}</span><span className="text-neutral-500">{e.date}</span></div>
                    <ul className="ml-4 list-disc">
                      {e.bullets.slice(0,3).map((b,i)=>(<li key={i}><RichTextDisplay content={b} /></li>))}
                    </ul>
                  </div>
                ))}
              </section>
            )}
            {pro.length>0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-wide">Projects</h2>
                {pro.map(p => (
                  <div key={p.id} className="mt-1">
                    <div className="flex justify-between text-[11px] font-medium"><span>{p.title}</span><span className="text-neutral-500">{p.link||''}</span></div>
                    <ul className="ml-4 list-disc">
                      {p.bullets.slice(0,2).map((b,i)=>(<li key={i}><RichTextDisplay content={b} /></li>))}
                    </ul>
                  </div>
                ))}
              </section>
            )}
          </div>
          <div className="col-span-1 space-y-3">
            {skl.length>0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-wide">Skills</h2>
                <ul className="mt-1 space-y-1">
                  {skl.map(s => <li key={s.id}><span className="font-medium">{s.name}:</span> <RichTextDisplay content={s.details} className="inline" /></li>)}
                </ul>
              </section>
            )}
            {edu.length>0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-wide">Education</h2>
                <ul className="ml-4 list-disc">
                  {edu.map(e => <li key={e.id}>{e.title} — <RichTextDisplay content={e.details} className="inline" /></li>)}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('text-[14px] leading-relaxed', compact ? 'space-y-4' : 'space-y-6')}>
      {/* Header */}
      <header className="border-b border-border pb-3">
        <h1 className={clsx('font-semibold', compact ? 'text-xl' : 'text-2xl')}>
          {profile.personalInfo?.fullName || 'Your Name'}
        </h1>
        <div className={clsx('mt-1 text-neutral-700 break-words', compact ? 'text-[12px]' : 'text-[12px]')}>
          {[
            profile.personalInfo?.location,
            profile.personalInfo?.phone,
            profile.personalInfo?.email,
            profile.personalInfo?.linkedin,
            profile.personalInfo?.github
          ].filter(Boolean).join(' | ')}
        </div>
        {profile.personalInfo?.summary && (
          <RichTextDisplay 
            content={profile.personalInfo.summary} 
            className={clsx('mt-1 text-neutral-700 break-words', compact ? 'text-[12px]' : 'text-[12px]')}
          />
        )}
      </header>

      {/* Skills */}
      {skl.length > 0 && (
        <section>
          <h2 className={clsx('font-bold uppercase tracking-wide text-neutral-800', compact ? 'text-sm' : 'text-sm')}>
            Skills
          </h2>
          <div className={clsx('mt-1 gap-2', compact ? 'grid grid-cols-1' : 'grid grid-cols-1 md:grid-cols-2')}>
            {skl.map((s) => (
              <div key={s.id} className={clsx('break-words', compact ? 'text-[12px]' : 'text-[13px]')}>
                <span className="font-medium">{s.name}:</span> <RichTextDisplay content={s.details} className="inline" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {exp.length > 0 && (
        <section>
          <h2 className={clsx('font-bold uppercase tracking-wide text-neutral-800', compact ? 'text-sm' : 'text-sm')}>
            Work Experiences
          </h2>
          <div className="mt-1 space-y-3">
            {exp.map((e) => (
              <div key={e.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className={clsx('font-semibold', compact ? 'text-[13px]' : 'text-[14px]')}>
                    {e.title} | {e.company}
                  </div>
                  <div className={clsx('text-neutral-600', compact ? 'text-[11px]' : 'text-xs')}>
                    {e.date}
                  </div>
                </div>
                <ul className={clsx('ml-5 list-disc', compact ? 'text-[12px]' : 'text-[13px]')}>
                  {e.bullets.slice(0, compact ? 3 : undefined).map((b, i) => (
                    <li key={i} className="break-words"><RichTextDisplay content={b} /></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {pro.length > 0 && (
        <section>
          <h2 className={clsx('font-bold uppercase tracking-wide text-neutral-800', compact ? 'text-sm' : 'text-sm')}>
            Projects
          </h2>
          <div className="mt-1 space-y-3">
            {pro.map((p) => (
              <div key={p.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className={clsx('font-semibold', compact ? 'text-[13px]' : 'text-[14px]')}>
                    {p.title}
                  </div>
                  <div className={clsx('text-neutral-600', compact ? 'text-[11px]' : 'text-xs')}>
                    {p.link || ''}
                  </div>
                </div>
                <ul className={clsx('ml-5 list-disc', compact ? 'text-[12px]' : 'text-[13px]')}>
                  {p.bullets.slice(0, compact ? 2 : undefined).map((b, i) => (
                    <li key={i} className="break-words"><RichTextDisplay content={b} /></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {edu.length > 0 && (
        <section>
          <h2 className={clsx('font-bold uppercase tracking-wide text-neutral-800', compact ? 'text-sm' : 'text-sm')}>
            Education
          </h2>
          <div className={clsx('ml-5 space-y-1', compact ? 'text-[12px]' : 'text-[13px]')}>
            {edu.map((e) => (
              <div key={e.id} className="overflow-hidden">
                <span className="font-medium">{e.title}</span> — <RichTextDisplay content={e.details} className="truncate inline-block max-w-xs" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}