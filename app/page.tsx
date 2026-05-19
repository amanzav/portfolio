"use client";

import Link from "next/link";
import { HomeChrome } from "@/components/HomeChrome";

const resumeUrl =
  "https://drive.google.com/file/d/1DOLowv0a3LmPOgfNjQUud1WuSEisGB6l/view?usp=drive_link";

export default function Home() {
  return (
    <main className="home-screen min-h-screen px-6 py-10 md:px-10">
      <div className="home-bottom-roll" aria-hidden />
      <HomeChrome />

      <section className="relative z-[3] mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl items-center">
        <div className="w-full">
          <p className="glitch-in home-frame-label">
            {"// "}operator · channel 04 · live
          </p>

          <h1 className="glitch-in mt-4 text-2xl font-medium tracking-[-0.03em] text-foreground md:text-3xl [animation-delay:40ms]">
            Aman Zaveri
          </h1>

          <div className="mt-7 space-y-5 text-sm leading-7 text-foreground/75 md:text-[0.95rem] md:leading-8">
            <p className="glitch-in [animation-delay:120ms]">
              I&apos;m studying Mechatronics Engineering at the{" "}
              <a
                href="https://uwaterloo.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link"
              >
                University of Waterloo
              </a>
              .
            </p>

            <p className="glitch-in [animation-delay:180ms]">
              Currently an SWE intern at{" "}
              <Link href="/experience/boomerang" className="text-link">
                Boomerang
              </Link>{" "}
              in New York — building Claude-driven internal tooling, an NLP
              search layer over the alumni network, and a two-stage neural
              retriever for candidate-to-job matching. Previously at{" "}
              <Link href="/experience/ford-2024" className="text-link">
                Ford
              </Link>
              , wrote the C++ graph router shipping in the{" "}
              <strong>2027 F-150 and Mach-E</strong> lineup, and owned the
              tire-pressure interrupt path that runs in production cars.
            </p>

            <p className="glitch-in [animation-delay:280ms]">
              Notable independent work:{" "}
              <Link href="/trade" className="text-link">
                Trade Reasoning Agent
              </Link>
              ,{" "}
              <Link href="/tennis" className="text-link">
                AI Tennis Coach
              </Link>
              ,{" "}
              <Link href="/autopark" className="text-link">
                Auto Park
              </Link>
              ,{" "}
              <Link href="/multibot" className="text-link">
                Multi-Bot Traffic Sim
              </Link>
              , and{" "}
              <Link href="/projects" className="text-link">
                more
              </Link>
              .
            </p>
          </div>

          <nav
            aria-label="Primary navigation"
            className="glitch-in mt-10 flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground/60 [animation-delay:340ms]"
          >
            <a
              href="https://github.com/Aman-Zaveri"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link"
            >
              GitHub
            </a>
            <a
              href="https://linkedin.com/in/aman-zaveri"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link"
            >
              LinkedIn
            </a>
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link"
            >
              Resume
            </a>
            <a href="mailto:a2zaveri@uwaterloo.ca" className="text-link">
              Email
            </a>
          </nav>
        </div>
      </section>
    </main>
  );
}
