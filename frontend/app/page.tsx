import { Hero } from "@/components/hero";
import { Experience } from "@/components/experience";
import { Projects } from "@/components/projects";
import { Skills } from "@/components/skills";
import { BackgroundElements } from "@/components/background-elements";
import { AnimatedGrid } from "@/components/animated-grid";
import { FloatingElements } from "@/components/floating-elements";

export default function Home() {
  return (
    <main className="relative">
      <AnimatedGrid />
      <FloatingElements />
      <BackgroundElements />
      <Hero />
      <Experience />
      <Projects />
      <Skills />
    </main>
  );
}
