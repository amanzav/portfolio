"use client";

import { useProfilesStore } from '@/lib/store';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { PersonalInfoForm } from '@/components/PersonalInfoForm';

export default function DataManagerPage() {
  const {
    data,
    updateMasterPersonalInfo,
    updateExperience, addExperience, deleteExperience,
    updateProject, addProject, deleteProject,
    updateSkill, addSkill, deleteSkill,
    updateEducation, addEducation, deleteEducation
  } = useProfilesStore();

  return (
    <div className="mx-auto p-6">
      <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft size={16} /> Back
          </Link>
        </Button>
        <h1 className="ml-2 text-xl font-semibold">Master Data Manager</h1>
      </div>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="experiences">Experiences</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <div className="space-y-4">
            <div>
              <h2 className="font-medium mb-2">Master Personal Information</h2>
              <p className="text-sm text-muted-foreground mb-4">
                This information will be used as the default for all new resume profiles. You can still customize it for individual profiles if needed.
              </p>
            </div>
            <PersonalInfoForm
              personalInfo={data.personalInfo}
              onUpdate={updateMasterPersonalInfo}
            />
          </div>
        </TabsContent>

        <TabsContent value="experiences" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Experiences</h2>
            <Button onClick={addExperience} size="sm">
              <Plus size={14}/> Add Experience
            </Button>
          </div>
          <div className="space-y-4">
            {data.experiences.map(e => (
              <Card key={e.id}>
                <CardHeader className="pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Input 
                      value={e.title} 
                      onChange={ev=>updateExperience(e.id,{title: ev.target.value})} 
                      className="flex-1 min-w-[120px]" 
                      placeholder="Title"
                    />
                    <Input 
                      value={e.company} 
                      onChange={ev=>updateExperience(e.id,{company: ev.target.value})} 
                      className="flex-1 min-w-[120px]" 
                      placeholder="Company"
                    />
                    <Input 
                      value={e.date} 
                      onChange={ev=>updateExperience(e.id,{date: ev.target.value})} 
                      className="w-32 min-w-[100px]" 
                      placeholder="Date"
                    />
                    <Button 
                      variant="destructive" 
                      size="icon"
                      onClick={()=>deleteExperience(e.id)}
                    >
                      <Trash2 size={16}/>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {e.bullets.map((b,i)=>(
                    <RichTextEditor
                      key={i} 
                      value={b} 
                      onChange={(value)=>{const bullets=[...e.bullets]; bullets[i]=value; updateExperience(e.id,{bullets});}} 
                      className="text-sm border-border focus:border-primary" 
                      placeholder="Achievement or responsibility - use bold and italic to highlight key points"
                    />
                  ))}
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={()=>updateExperience(e.id,{bullets:[...e.bullets,'New accomplishment']})}
                    className="h-auto p-0 text-xs"
                  >
                    + Add bullet point
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Projects</h2>
            <Button onClick={addProject} size="sm">
              <Plus size={14}/> Add Project
            </Button>
          </div>
          <div className="space-y-4">
            {data.projects.map(p => (
              <Card key={p.id}>
                <CardHeader className="pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Input 
                      value={p.title} 
                      onChange={ev=>updateProject(p.id,{title: ev.target.value})} 
                      className="flex-1 min-w-[140px]" 
                      placeholder="Project Title"
                    />
                    <Input 
                      value={p.link||''} 
                      onChange={ev=>updateProject(p.id,{link: ev.target.value})} 
                      className="flex-1 min-w-[140px]" 
                      placeholder="Link (optional)"
                    />
                    <Button 
                      variant="destructive" 
                      size="icon"
                      onClick={()=>deleteProject(p.id)}
                    >
                      <Trash2 size={16}/>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {p.bullets.map((b,i)=>(
                    <RichTextEditor
                      key={i} 
                      value={b} 
                      onChange={(value)=>{const bullets=[...p.bullets]; bullets[i]=value; updateProject(p.id,{bullets});}} 
                      className="text-sm border-border focus:border-primary"
                      placeholder="Project impact or feature - use bold and italic to emphasize technologies and results"
                    />
                  ))}
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={()=>updateProject(p.id,{bullets:[...p.bullets,'New impact statement']})}
                    className="h-auto p-0 text-xs"
                  >
                    + Add bullet point
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Skills</h2>
            <Button onClick={addSkill} size="sm">
              <Plus size={14}/> Add Skill
            </Button>
          </div>
          <div className="space-y-4">
            {data.skills.map(s => (
              <Card key={s.id}>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Input 
                      value={s.name} 
                      onChange={ev=>updateSkill(s.id,{name: ev.target.value})} 
                      className="border-border focus:border-primary" 
                      placeholder="Skill Category (e.g. Programming Languages)"
                    />
                    <RichTextEditor
                      value={s.details} 
                      onChange={(value)=>updateSkill(s.id,{details: value})} 
                      className="border-border focus:border-primary" 
                      placeholder="Skills details - use bold for skill names and italic for proficiency levels"
                    />
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="w-full"
                      onClick={()=>deleteSkill(s.id)}
                    >
                      <Trash2 size={16}/>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="education" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Education</h2>
            <Button onClick={addEducation} size="sm">
              <Plus size={14}/> Add Education
            </Button>
          </div>
          <div className="space-y-4">
            {data.education.map(ed => (
              <Card key={ed.id}>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Input 
                      value={ed.title} 
                      onChange={ev=>updateEducation(ed.id,{title: ev.target.value})} 
                      className="border-border focus:border-primary" 
                      placeholder="Program/Degree"
                    />
                    <RichTextEditor
                      value={ed.details} 
                      onChange={(value)=>updateEducation(ed.id,{details: value})} 
                      className="border-border focus:border-primary" 
                      placeholder="Institution, Year, GPA, Honors - use bold for institution names and italic for specializations"
                    />
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="w-full"
                      onClick={()=>deleteEducation(ed.id)}
                    >
                      <Trash2 size={16}/>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </div>
  );
}
