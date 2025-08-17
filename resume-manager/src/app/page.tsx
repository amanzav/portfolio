'use client';

import Link from 'next/link';
import { useProfilesStore } from '@/lib/store';
import { Plus, FileText, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ModeToggle } from '@/components/mode-toggle';

export default function Page() {
  const { profiles, createProfile, cloneProfile } = useProfilesStore();

  return (
    <div className="mx-auto p-6">
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Resume Builder</h1>
          <Button onClick={() => createProfile()}>
            <Plus size={18} /> New Profile
          </Button>
        </header>

      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          Manage a single source of truth for experiences, projects, skills, and education. Create multiple profiles and export print-ready PDFs.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/data">
            <Database size={14}/> Edit Master Data
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {profiles.map((p) => (
          <Card key={p.id} className="group relative transition-shadow hover:shadow-md">
            <Link href={`/builder/${p.id}`} className="absolute inset-0 z-10" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{p.name}</CardTitle>
                <FileText className="text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <CardDescription>
                {p.personalInfo?.summary || 'No summary yet'}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    cloneProfile?.(p.id);
                  }}
                  className="z-20"
                >
                  Clone
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
    
    {/* Theme selector in bottom right corner */}
    <div className="fixed bottom-6 right-6 z-50">
      <ModeToggle />
    </div>
    </div>
  );
}