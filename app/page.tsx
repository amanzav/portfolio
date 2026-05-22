"use client";

import Link from "next/link";
import { Github, Linkedin, Download, Mail } from "lucide-react";
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

          <div className="mt-7 text-sm leading-7 text-foreground/75 md:text-[0.95rem] md:leading-8">
            <p className="glitch-in [animation-delay:120ms]">
              3A Mechatronics at the{" "}
              <a
                href="https://uwaterloo.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link"
              >
                University of Waterloo
              </a>
              . SWE intern at{" "}
              <Link href="/experience/boomerang" className="text-link">
                Boomerang
              </Link>{" "}
              in New York, building an internal software factory, NLP search
              over the alumni network, and a two-stage neural retriever for job
              matching. At{" "}
              <Link href="/experience/ford-2024" className="text-link">
                Ford
              </Link>
              , shipped fuel-efficient routing in the{" "}
              <strong>2027 F-150 and Mach-E</strong>. Also worked on{" "}
              <Link href="/projects" className="text-link">
                some cool shit
              </Link>
              .
            </p>
          </div>

          <nav
            aria-label="Primary navigation"
            className="glitch-in mt-10 flex flex-wrap items-center gap-5 text-foreground/55 [animation-delay:340ms]"
          >
            <a
              href="https://github.com/amanzav"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              title="GitHub"
              className="transition-all duration-150 hover:scale-110 hover:text-foreground"
            >
              <Github size={19} strokeWidth={1.75} />
            </a>
            <a
              href="https://linkedin.com/in/amanzav"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              title="LinkedIn"
              className="transition-all duration-150 hover:scale-110 hover:text-foreground"
            >
              <Linkedin size={19} strokeWidth={1.75} />
            </a>
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Resume"
              title="Resume"
              className="transition-all duration-150 hover:scale-110 hover:text-foreground"
            >
              <Download size={19} strokeWidth={1.75} />
            </a>
            <a
              href="mailto:a2zaveri@uwaterloo.ca"
              aria-label="Email"
              title="Email"
              className="transition-all duration-150 hover:scale-110 hover:text-foreground"
            >
              <Mail size={19} strokeWidth={1.75} />
            </a>
          </nav>
        </div>
      </section>
    </main>
  );
}
