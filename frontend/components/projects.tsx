"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Folder } from "lucide-react";
import { projects } from "@/data/projects";
import { Counter } from "@/components/counter";

export function Projects() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="projects" className="py-16 px-6 md:px-12 lg:px-24 bg-secondary/20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-3">
            <Folder className="h-5 w-5 text-accent" />
            <h2 className="text-3xl md:text-4xl font-bold">Featured Projects</h2>
          </div>
          <p className="text-gray-400 text-base">
            Things I've built that I'm proud of
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Card className="group h-full bg-card/50 backdrop-blur-sm border-white/5 hover:border-accent/30 transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Folder className="h-4 w-4 text-accent" />
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-accent transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                      <CardTitle className="text-lg group-hover:text-accent transition-colors">
                        {project.title}
                      </CardTitle>
                      <CardDescription className="text-gray-400 mt-2 text-sm">
                        {project.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    {project.highlights.map((highlight, i) => (
                      <li 
                        key={i} 
                        className="flex items-start gap-3 text-gray-300"
                      >
                        <span className="text-accent mt-0.5">▹</span>
                        <span>
                          {highlight.includes("12,000+") ? (
                            <>Aggregates <Counter value={12000} suffix="+" /> courses from leading universities</>
                          ) : highlight.includes("94%") ? (
                            <>Achieved <Counter value={94} suffix="%" /> accuracy in malware detection</>
                          ) : (
                            highlight
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {project.tags.map((tag, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="border-white/10 hover:border-accent hover:text-accent transition-colors text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
