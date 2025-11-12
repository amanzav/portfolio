import { Header } from "@/components/Header";
import { ExperienceTable } from "@/components/ExperienceTable";
import { Projects } from "@/components/Projects";

export default function Home() {
  return (
    <main className="h-screen flex items-center justify-center px-6 py-6">
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
        <Header />
        <ExperienceTable />
        <Projects />
      </div>
    </main>
  );
}
