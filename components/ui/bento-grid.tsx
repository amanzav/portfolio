import { ComponentPropsWithoutRef, ReactNode } from "react"
import { ArrowRightIcon } from "@radix-ui/react-icons"
import { Github, ExternalLink } from "lucide-react"

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
}

const BentoGrid = ({ children, className, ...props }: BentoGridProps) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-1 gap-4",
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
  ...props
}: BentoCardProps) => (
  <div
    key={name}
    className={cn(
      "group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-xl",
      // transparent with subtle border
      "bg-transparent border border-border",
      className
    )}
    {...props}
  >
    <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-110">
      {background}
    </div>
    <div className="relative z-10 p-4 mt-auto">
      <div className="pointer-events-none flex transform-gpu flex-col gap-1 transition-all duration-300 sm:group-hover:-translate-y-4">
        <Icon className="h-8 w-8 origin-left transform-gpu text-foreground/70 transition-all duration-300 ease-in-out group-hover:scale-85" />
        <h3 className="text-sm font-medium text-foreground/90 tracking-tight">
          {name}
        </h3>
        <p className="max-w-lg text-xs text-foreground/70 truncate">{description}</p>
      </div>

      <div
        className={cn(
          "pointer-events-none flex w-full translate-y-0 transform-gpu flex-row items-center gap-3 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:hidden"
        )}
      >
        {siteUrl && (
          <Button
            variant="link"
            asChild
            size="sm"
            className="pointer-events-auto p-0"
          >
            <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="group/icon">
              <ExternalLink className="h-4 w-4 text-foreground/60 group-hover/icon:text-foreground group-hover/icon:scale-[1.01] transition-all duration-150" />
            </a>
          </Button>
        )}
        <Button
          variant="link"
          asChild
          size="sm"
          className="pointer-events-auto p-0"
        >
          <a href={href} target="_blank" rel="noopener noreferrer" className="group/icon">
            <Github className="h-4 w-4 text-foreground/60 group-hover/icon:text-foreground group-hover/icon:scale-[1.01] transition-all duration-150" />
          </a>
        </Button>
      </div>
    </div>

    <div
      className={cn(
        "pointer-events-none absolute bottom-0 hidden w-full translate-y-4 transform-gpu flex-row items-center gap-3 px-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:flex z-20"
      )}
    >
      {siteUrl && (
        <Button
          variant="link"
          asChild
          size="sm"
          className="pointer-events-auto p-0"
        >
          <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="group/icon">
            <ExternalLink className="h-4 w-4 text-foreground/60 group-hover/icon:text-foreground group-hover/icon:scale-[1.01] transition-all duration-150" />
          </a>
        </Button>
      )}
      <Button
        variant="link"
        asChild
        size="sm"
        className="pointer-events-auto p-0"
      >
        <a href={href} target="_blank" rel="noopener noreferrer" className="group/icon">
          <Github className="h-4 w-4 text-foreground/60 group-hover/icon:text-foreground group-hover/icon:scale-[1.01] transition-all duration-150" />
        </a>
      </Button>
    </div>

    <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[.03] group-hover:dark:bg-neutral-800/10 z-[5]" />
  </div>
)

export { BentoCard, BentoGrid }
