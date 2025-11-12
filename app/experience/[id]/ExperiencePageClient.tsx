"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExperienceItem } from "@/lib/experiences";

const sections = [
  { id: "overview", label: "Overview" },
  { id: "responsibilities", label: "Responsibilities" },
  { id: "technical", label: "Technical Details" },
  { id: "achievements", label: "Achievements" },
  { id: "skills", label: "Skills & Tools" },
];

export default function ExperiencePageClient({ experience }: { experience: ExperienceItem }) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("overview");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;

    const handleScroll = () => {
      const scrollTop = viewport.scrollTop;

      // Update active section based on scroll position
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = sectionRefs.current[sections[i].id];
        if (el && el.offsetTop - 200 <= scrollTop) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    viewport.addEventListener("scroll", handleScroll);
    return () => viewport.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    const el = sectionRefs.current[id];
    if (viewport && el) {
      viewport.scrollTo({ top: el.offsetTop - 100, behavior: "smooth" });
    }
  };

  return (
    <div className="fixed inset-0 bg-background">
      {/* Back button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-6 left-6 z-40"
        onClick={() => router.push("/")}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <div className="flex h-full">
        {/* Vertical tabs - centered vertically */}
        <aside className="w-64 shrink-0 flex items-center justify-center">
          <nav className="flex flex-col gap-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollTo(section.id)}
                className={cn(
                  "text-left py-2 px-4 transition-colors text-sm",
                  "hover:text-foreground",
                  activeSection === section.id ? "text-foreground font-medium" : "text-muted"
                )}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Scrollable content area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 h-full">
          <main className="py-16 px-12 max-w-4xl mx-auto">
            <section 
              id="overview" 
              ref={(el) => { sectionRefs.current.overview = el; }}
              className="mb-32"
            >
              <h1 className="text-4xl font-bold mb-2 text-center">{experience.company}</h1>
              <p className="text-xl text-foreground/80 mb-4 text-center">{experience.role}</p>
              <p className="text-muted text-center mb-8">{experience.date}</p>
              <p className="text-foreground/80 text-center">{experience.description}</p>
            </section>

            <section 
              id="responsibilities"
              ref={(el) => { sectionRefs.current.responsibilities = el; }}
              className="mb-32"
            >
              <h2 className="text-3xl font-semibold mb-8 text-center">Responsibilities</h2>
              <div className="space-y-4 text-center">
                <p className="text-foreground/80">
                  {experience.details?.split('\n\n')[0]}
                </p>
              </div>
            </section>

            <section 
              id="technical"
              ref={(el) => { sectionRefs.current.technical = el; }}
              className="mb-32"
            >
              <h2 className="text-3xl font-semibold mb-8 text-center">Technical Details</h2>
              <div className="space-y-4 text-center">
                <p className="text-foreground/80 whitespace-pre-line">
                  {experience.details}
                </p>
              </div>
            </section>

            <section 
              id="achievements"
              ref={(el) => { sectionRefs.current.achievements = el; }}
              className="mb-32"
            >
              <h2 className="text-3xl font-semibold mb-8 text-center">Achievements</h2>
              <div className="space-y-4 text-center">
                <p className="text-foreground/80">
                  Key accomplishments and impact metrics from this role.
                </p>
              </div>
            </section>

            <section 
              id="skills"
              ref={(el) => { sectionRefs.current.skills = el; }}
              className="mb-32 pb-16"
            >
              <h2 className="text-3xl font-semibold mb-8 text-center">Skills & Tools</h2>
              <div className="flex flex-wrap gap-2 justify-center">
                {experience.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-muted text-foreground/80 rounded text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          </main>
        </ScrollArea>
      </div>
    </div>
  );
}
