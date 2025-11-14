"use client";

import { motion } from "motion/react";
import { Github, Linkedin, Mail, FileText } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const links = [
  {
    name: "GitHub",
    icon: Github,
    href: "https://github.com/Aman-Zaveri",
    ariaLabel: "GitHub Profile",
  },
  {
    name: "LinkedIn",
    icon: Linkedin,
    href: "https://linkedin.com/in/aman-zaveri",
    ariaLabel: "LinkedIn Profile",
  },
  {
    name: "Email",
    icon: Mail,
    href: "mailto:a2zaveri@uwaterloo.ca",
    ariaLabel: "Email",
  },
  {
    name: "Resume",
    icon: FileText,
    href: "https://drive.google.com/file/d/1DOLowv0a3LmPOgfNjQUud1WuSEisGB6l/view?usp=drive_link",
    ariaLabel: "Resume",
  },
];

export function SocialLinks() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut", delay: 0.2 }}
      className="flex gap-6 items-center"
    >
      <TooltipProvider delayDuration={100}>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Tooltip key={link.name}>
              <TooltipTrigger asChild>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.ariaLabel}
                  className="text-muted hover:text-foreground hover:scale-105 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
                >
                  <Icon size={20} />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>{link.name}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </motion.footer>
  );
}
