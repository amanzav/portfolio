import { Header } from "@/components/Header";
import { ExperienceTable } from "@/components/ExperienceTable";
import { Projects } from "@/components/Projects";

export default function Home() {
  return (
    <main className="min-h-screen flex items-start justify-center pt-[10vh] px-6">
      <div className="w-full max-w-5xl mx-auto space-y-8">
        <Header />
        <ExperienceTable />
        <Projects />
      </div>
    </main>
  );
}
