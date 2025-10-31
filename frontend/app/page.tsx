import { Hero } from "@/components/hero";
import { Experience } from "@/components/experience";
import { Projects } from "@/components/projects";
import { Skills } from "@/components/skills";
import { BackgroundElements } from "@/components/background-elements";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full bg-background overflow-x-hidden">
      {/* Abstract background elements */}
      <BackgroundElements />
      
      {/* Main content */}
      <div className="relative z-10">
        <Hero />
        <Experience />
        <Projects />
        <Skills />
      </div>
    </main>
  );
}
