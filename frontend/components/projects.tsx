"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Folder } from "lucide-react";
import { projects } from "@/data/projects";
import { Counter } from "@/components/counter";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};

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
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <motion.div 
            className="flex items-center gap-3 mb-3"
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Folder className="h-5 w-5 text-accent" />
            <h2 className="text-3xl md:text-4xl font-bold">Featured Projects</h2>
          </motion.div>
          <motion.p 
            className="text-gray-400 text-base"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3 }}
          >
            Things I've built that I'm proud of
          </motion.p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {projects.map((project, idx) => (
            <motion.div 
              key={idx} 
              variants={item}
              whileHover={{ y: -10, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="group h-full bg-card/30 backdrop-blur-sm border-white/10 hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Folder className="h-4 w-4 text-accent" />
                        <motion.a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-accent transition-colors"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </motion.a>
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
                      <motion.li 
                        key={i} 
                        className="flex items-start gap-3 text-gray-300"
                        initial={{ opacity: 0, x: -20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: idx * 0.15 + i * 0.1 }}
                        whileHover={{ x: 5 }}
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
                      </motion.li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {project.tags.map((tag, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ delay: idx * 0.15 + 0.5 + i * 0.05 }}
                        whileHover={{ scale: 1.15, rotate: 3 }}
                      >
                        <Badge
                          variant="outline"
                          className="border-white/20 hover:border-accent hover:text-accent transition-colors text-xs"
                        >
                          {tag}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
