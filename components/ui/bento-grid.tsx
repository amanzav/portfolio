import { ComponentPropsWithoutRef, ReactNode } from "react"
import { ArrowRightIcon } from "@radix-ui/react-icons"
import { Github, ExternalLink, ChevronRight } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode
  className?: string
}

interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
  name: string
  className: string
  background: ReactNode
  Icon: React.ElementType
  description: string
  href: string
  cta: string
  siteUrl?: string
  detailSlug?: string // Optional slug for detail page navigation
}

const BentoGrid = ({ children, className, ...props }: BentoGridProps) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-2 gap-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  siteUrl,
  detailSlug,
  ...props
}: BentoCardProps) => {
  const baseClasses = cn(
    "group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-lg",
    "bg-transparent border border-border",
    "h-auto",
    className
  );

  if (detailSlug) {
    return (
      <div
        key={name}
        className={baseClasses}
        onClick={(e) => {
          // Only navigate if not clicking on a link
          if (!(e.target as HTMLElement).closest('a')) {
            window.location.href = `/projects/${detailSlug}`;
          }
        }}
        style={{ cursor: 'pointer' }}
        {...props}
      >
        <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-110">
          {background}
        </div>
        <div className="relative z-10 p-4 mt-auto">
          <div className="pointer-events-none flex transform-gpu flex-col gap-1 transition-all duration-300 sm:group-hover:-translate-y-6">
            <Icon className="h-6 w-6 sm:h-8 sm:w-8 origin-left transform-gpu text-foreground/70 transition-all duration-300 ease-in-out group-hover:scale-85" />
            <h3 className="text-xs sm:text-sm font-medium text-foreground/90 tracking-tight">
              {name}
            </h3>
            <p className="max-w-lg text-[11px] sm:text-xs text-foreground/70 truncate">{description}</p>
          </div>
        </div>

        <div
          className={cn(
            "pointer-events-none absolute bottom-0 hidden w-full translate-y-4 transform-gpu flex-row items-center gap-3 px-4 pb-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:flex z-20"
          )}
        >
          {siteUrl && (
            <a 
              href={siteUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="pointer-events-auto p-0 group/icon"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4 text-foreground/60 group-hover/icon:text-foreground group-hover/icon:scale-[1.01] transition-all duration-150" />
            </a>
          )}
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="pointer-events-auto p-0 group/icon"
            onClick={(e) => e.stopPropagation()}
          >
            <Github className="h-4 w-4 text-foreground/60 group-hover/icon:text-foreground group-hover/icon:scale-[1.01] transition-all duration-150" />
          </a>
          
          <div className="ml-auto pointer-events-auto inline-flex items-center justify-center w-8 h-8 text-foreground/70 hover:text-foreground transition-colors group/chevron">
            <ChevronRight className="w-5 h-5 transition-transform group-hover/chevron:-rotate-45" />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[.03] group-hover:dark:bg-neutral-800/10 z-[5]" />
      </div>
    );
  }

  return (
    <div
      key={name}
      className={baseClasses}
      {...props}
    >
      <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-110">
        {background}
      </div>
      <div className="relative z-10 p-4 mt-auto">
        <div className="pointer-events-none flex transform-gpu flex-col gap-1 transition-all duration-300 sm:group-hover:-translate-y-6">
          <Icon className="h-6 w-6 sm:h-8 sm:w-8 origin-left transform-gpu text-foreground/70 transition-all duration-300 ease-in-out group-hover:scale-85" />
          <h3 className="text-sm font-medium text-foreground/90 tracking-tight">
            {name}
          </h3>
          <p className="max-w-lg text-xs sm:text-sm text-foreground/70">{description}</p>
        </div>
      </div>

      <div
        className={cn(
          "pointer-events-none absolute bottom-0 hidden w-full translate-y-4 transform-gpu flex-row items-center gap-3 px-4 pb-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:flex z-20"
        )}
      >
        {siteUrl && (
          <a 
            href={siteUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="pointer-events-auto p-0 group/icon"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-4 w-4 text-foreground/60 group-hover/icon:text-foreground group-hover/icon:scale-[1.01] transition-all duration-150" />
          </a>
        )}
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="pointer-events-auto p-0 group/icon"
          onClick={(e) => e.stopPropagation()}
        >
          <Github className="h-4 w-4 text-foreground/60 group-hover/icon:text-foreground group-hover/icon:scale-[1.01] transition-all duration-150" />
        </a>
      </div>

      <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[.03] group-hover:dark:bg-neutral-800/10 z-[5]" />
    </div>
  );
}

export { BentoCard, BentoGrid }
