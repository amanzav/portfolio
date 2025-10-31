"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { experiences } from "@/data/experience";
import { Briefcase } from "lucide-react";

export function Experience() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="experience" className="py-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-5xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-3">
            <Briefcase className="h-5 w-5 text-accent" />
            <h2 className="text-2xl md:text-3xl font-bold">Experience</h2>
          </div>
          <p className="text-gray-400 text-sm">
            Where I've worked and what I've built
          </p>
        </motion.div>

        <div className="space-y-8">
          {experiences.map((exp, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Card className="group bg-card/50 backdrop-blur-sm border-white/5 hover:border-accent/30 transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1 group-hover:text-accent transition-colors">
                        {exp.company}
                      </CardTitle>
                      <p className="text-accent font-medium text-sm">{exp.role}</p>
                    </div>
                    <span className="text-sm text-gray-500 font-mono whitespace-nowrap">
                      {exp.period}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-1.5">
                    {exp.highlights.map((highlight, i) => (
                      <li 
                        key={i} 
                        className="flex items-start gap-3 text-gray-300 text-sm"
                      >
                        <span className="text-accent mt-0.5 shrink-0">▹</span>
                        <span className="leading-relaxed">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {exp.tags.map((tag, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="bg-secondary/30 hover:bg-accent/10 hover:text-accent border border-white/5 transition-colors text-xs"
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
