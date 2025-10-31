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
    <section id="experience" className="py-16 px-6 md:px-12 lg:px-24">
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
            <Briefcase className="h-5 w-5 text-accent" />
            <h2 className="text-3xl md:text-4xl font-bold">Experience</h2>
          </motion.div>
          <motion.p 
            className="text-gray-400 text-base"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3 }}
          >
            Where I've worked and what I've built
          </motion.p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="space-y-6"
        >
          {experiences.map((exp, idx) => (
            <motion.div 
              key={idx} 
              variants={item}
              whileHover={{ x: 10, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="group bg-card/30 backdrop-blur-sm border-white/10 hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5">
                <CardHeader className="pb-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div className="flex-1">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: idx * 0.2 + 0.3 }}
                      >
                        <CardTitle className="text-xl mb-1 group-hover:text-accent transition-colors">
                          {exp.company}
                        </CardTitle>
                      </motion.div>
                      <p className="text-accent font-medium text-sm">{exp.role}</p>
                    </div>
                    <motion.span 
                      className="text-sm text-gray-500 font-mono whitespace-nowrap"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ delay: idx * 0.2 + 0.4 }}
                    >
                      {exp.period}
                    </motion.span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-1.5">
                    {exp.highlights.map((highlight, i) => (
                      <motion.li 
                        key={i} 
                        className="flex items-start gap-3 text-gray-300 text-sm"
                        initial={{ opacity: 0, x: -20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: idx * 0.2 + 0.5 + i * 0.1 }}
                        whileHover={{ x: 5 }}
                      >
                        <span className="text-accent mt-0.5 shrink-0">▹</span>
                        <span className="leading-relaxed">{highlight}</span>
                      </motion.li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {exp.tags.map((tag, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ delay: idx * 0.2 + 0.7 + i * 0.05 }}
                        whileHover={{ scale: 1.15, rotate: 3 }}
                      >
                        <Badge
                          variant="secondary"
                          className="bg-secondary/30 hover:bg-accent/20 hover:text-accent border border-white/5 transition-colors"
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
