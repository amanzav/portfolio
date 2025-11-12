import { Header } from "@/components/Header";
import { ExperienceTable } from "@/components/ExperienceTable";
import { Projects } from "@/components/Projects";

export default function Home() {
  return (
    <main className="h-screen overflow-hidden md:overflow-hidden sm:overflow-auto flex items-center justify-center px-6 py-6">
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-4 max-h-full overflow-y-auto md:overflow-y-hidden">
        <Header />
        <ExperienceTable />
        <Projects />
      </div>
    </main>
  );
}
