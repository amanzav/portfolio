"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { experiences } from "@/data/experience";
import { Briefcase } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};

export function Experience() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="experience" className="py-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <Briefcase className="h-6 w-6 text-accent" />
            <h2 className="text-4xl md:text-5xl font-bold">Experience</h2>
          </div>
          <p className="text-gray-400 text-lg">Where I've worked and what I've built</p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="space-y-6"
        >
          {experiences.map((exp, idx) => (
            <motion.div key={idx} variants={item}>
              <Card className="group bg-card/30 backdrop-blur-sm border-white/10 hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5">
                <CardHeader className="pb-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-1 group-hover:text-accent transition-colors">
                        {exp.company}
                      </CardTitle>
                      <p className="text-accent font-medium">{exp.role}</p>
                    </div>
                    <span className="text-sm text-gray-500 font-mono whitespace-nowrap">
                      {exp.period}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {exp.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-300">
                        <span className="text-accent mt-1.5 flex-shrink-0">▹</span>
                        <span className="leading-relaxed">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {exp.tags.map((tag, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="bg-secondary/30 hover:bg-accent/20 hover:text-accent border border-white/5 transition-colors"
                      >
                        {tag}
                      </Badge>
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
