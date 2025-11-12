import { Header } from "@/components/Header";
import { ExperienceTable } from "@/components/ExperienceTable";
import { Projects } from "@/components/Projects";

export default function Home() {
  return (
    <main className="h-screen flex items-center justify-center px-12 py-8">
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-3">
        <Header />
        <ExperienceTable />
        <Projects />
      </div>
    </main>
  );
}
