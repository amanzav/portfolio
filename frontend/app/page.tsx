import { Hero } from "@/components/hero";
import { Experience } from "@/components/experience";
import { Projects } from "@/components/projects";
import { Skills } from "@/components/skills";
import { BackgroundElements } from "@/components/background-elements";

export default function Home() {
  return (
    <main className="relative">
      <BackgroundElements />
      <Hero />
      <Experience />
      <Projects />
      <Skills />
    </main>
  );
}
