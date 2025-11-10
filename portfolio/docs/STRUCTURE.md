# 📁 Project Structure

```
portfolio/
│
├── .github/
│   ├── copilot-instructions.md    # AI assistant guidelines
│   └── workflows/
│       └── deploy.yml             # GitHub Actions deployment workflow
│
├── app/                           # Next.js App Router
│   ├── layout.tsx                 # Root layout with metadata & fonts
│   ├── page.tsx                   # Main portfolio page
│   └── globals.css                # Global Tailwind styles
│
├── components/                    # Reusable React components
│   ├── ui/                        # shadcn/ui components
│   │   ├── button.tsx             # Button component
│   │   ├── card.tsx               # Card component
│   │   └── tooltip.tsx            # Tooltip component
│   │
│   ├── Header.tsx                 # Portfolio header section
│   ├── About.tsx                  # About quote section
│   ├── ExperienceTable.tsx        # Experience timeline
│   ├── Projects.tsx               # Projects grid
│   ├── SocialLinks.tsx            # Social media links
│   └── AskReva.tsx                # AI chat modal (optional)
│
├── docs/                          # Documentation
│   ├── prd.md                     # Product Requirements Document
│   └── DEPLOYMENT.md              # Deployment guide
│
├── lib/                           # Utilities
│   └── utils.ts                   # Tailwind class merging utility
│
├── public/                        # Static assets (optional)
│
├── .env.example                   # Environment variables template
├── .gitignore                     # Git ignore rules
├── .eslintrc.js                   # ESLint configuration
├── components.json                # shadcn/ui configuration
├── next.config.mjs                # Next.js static export config
├── package.json                   # Dependencies & scripts
├── postcss.config.js              # PostCSS configuration
├── tailwind.config.ts             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # Project overview

```

## 📄 Key Files Explained

### Configuration Files

- **`next.config.mjs`** — Enables static export for GitHub Pages compatibility
- **`tailwind.config.ts`** — Dark theme colors, fonts, and animations
- **`tsconfig.json`** — TypeScript compiler options with path aliases
- **`components.json`** — shadcn/ui component configuration

### App Directory

- **`app/layout.tsx`** — Root layout with Inter font, SEO metadata, and global styles
- **`app/page.tsx`** — Main portfolio page that composes all sections
- **`app/globals.css`** — Tailwind directives and custom CSS variables

### Components

All components are client-side (`"use client"`) to support Framer Motion animations:

- **`Header.tsx`** — Name, title, location, and tagline
- **`About.tsx`** — Single-line mission statement
- **`ExperienceTable.tsx`** — Work/education timeline with tooltips
- **`Projects.tsx`** — Project cards with GitHub links
- **`SocialLinks.tsx`** — GitHub, LinkedIn, Email icons
- **`AskReva.tsx`** — Optional AI chat modal using Groq API

### UI Components (shadcn/ui)

- **`Button.tsx`** — Reusable button with variants (default, ghost, link)
- **`Card.tsx`** — Container for project items
- **`Tooltip.tsx`** — Hover tooltips for experience descriptions

### Utilities

- **`lib/utils.ts`** — `cn()` function for merging Tailwind classes with conditional logic

---

## 🎨 Design System

### Colors (from `tailwind.config.ts`)

```typescript
background: "#0d0d0d"  // Soft black
foreground: "#f5f5f5"  // White text
accent: "#5b5bff"      // Blue accent
muted: "#6b6b6b"       // Gray text
border: "#1a1a1a"      // Subtle borders
```

### Typography

- **Font:** Inter (Google Fonts)
- **Weights:** 400 (regular), 600 (semibold), 700 (bold)
- **Sizes:** Tailwind defaults with minimal customization

### Animations (Framer Motion)

All animations are under 250ms:
- **Fade In:** `opacity: 0 → 1`
- **Slide Up:** `translateY(10px) → 0`
- **Delays:** Staggered by 50-100ms

---

## 🧩 Component Flow

```
app/page.tsx
  ├── Header (name, title, location)
  ├── About (mission statement)
  ├── ExperienceTable (work/education)
  ├── Projects (project cards)
  └── Footer
      ├── SocialLinks (icons)
      └── AskReva (AI modal button)
```

---

## 🚀 Build Output

After `npm run build`, the `/out` folder contains:

```
out/
├── index.html              # Main page
├── 404.html                # 404 page
└── _next/                  # Static assets
    ├── static/
    │   ├── css/            # Compiled CSS
    │   └── chunks/         # JavaScript bundles
    └── ...
```

**Total Size:** ~152KB (First Load JS)

---

## 🔧 Customization Guide

### Update Personal Info

Edit the following files:

1. **`app/layout.tsx`** — Update metadata (title, description)
2. **`components/Header.tsx`** — Change name, title, location
3. **`components/ExperienceTable.tsx`** — Modify work/education entries
4. **`components/Projects.tsx`** — Update project details and links
5. **`components/SocialLinks.tsx`** — Change social media URLs

### Change Colors

Edit `tailwind.config.ts`:

```typescript
colors: {
  background: "#0d0d0d",  // Change to your preferred dark color
  accent: "#5b5bff",      // Change to your preferred accent
  // ...
}
```

### Add/Remove Sections

Edit `app/page.tsx` to add or remove components:

```tsx
<main className="min-h-screen flex items-center justify-center p-8">
  <div className="w-full max-w-5xl space-y-8">
    <Header />
    <About />
    {/* Add new section here */}
    <ExperienceTable />
    <Projects />
    <SocialLinks />
  </div>
</main>
```

---

> **Need help?** Check the [PRD](prd.md) for design guidelines or [DEPLOYMENT.md](DEPLOYMENT.md) for hosting instructions.
