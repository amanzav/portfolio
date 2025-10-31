# 🧭 Product Requirements Document (PRD)

## Product: Aman Zaveri — Minimal One-Page Portfolio

### Goal
Create a **dark, minimal, single-page developer portfolio** that displays all of Aman Zaveri’s experience, projects, skills, and contact info **without requiring scrolling**. The portfolio should look elegant, modern, and fast — with subtle Framer Motion animations and clean shadcn/ui components.

---

## 🎯 Objectives
1. Present Aman Zaveri’s profile, experience, projects, and skills **at a glance**.
2. Be visually minimal with **no scrolling** — all content visible above the fold.
3. Be deployable via **GitHub Pages** (static Next.js export).
4. Integrate **Framer Motion** for elegant component animations.
5. Use **shadcn/ui** for consistent, modern, accessible components.

---

## 🧱 Tech Stack
- **Next.js (App Router)**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** (Button, Card, Badge, Separator, Tooltip)
- **Framer Motion**
- **Lucide React** (for icons)
- **Vercel / GitHub Pages** (deployment)

---

## 🪶 Visual Design

### Layout
- **Single screen** (no vertical scroll, responsive for desktop only)
- **Dark theme** (#0b0b0b background, white/gray text)
- **Centered layout**, max width 1100px
- **Grid system**: 2x2 or 3x1 layout depending on viewport width
- **Font:** Inter or Space Grotesk
- **Accent color:** subtle cyan or white hover states
- **Rounded corners:** `rounded-2xl`
- **Shadow depth:** minimal `shadow-lg shadow-white/[0.03]`

---

## 🖼️ Components

### 1. Hero Section
**Content:**
- Name: “Aman Zaveri”
- Tagline: “Full-Stack & Embedded Engineer | Building Systems that Ship”
- Buttons:
  - Resume (PDF download)
  - Contact (mailto link)
- Icons: GitHub, LinkedIn, Email

**Animation:**
- Fade in + slight translateY
- Subtle spring hover on buttons

---

### 2. Experience Cards (from resume)
Each experience is a **card** with compact text. All visible in one row.

**Data:**
- **Ford Motor Company** (2 roles)
  - Software Engineering Intern (May–Aug 2025)
    - Route-aware fuel optimization Android widget (Kotlin + Java)
    - Tire-pressure alert system (C++ HAL + AIDL)
    - CI/CD pipeline with AST-based LLM analysis
    - Async queue refactor for 5K+ CAN signals/s
  - Python Software Engineering Intern (Sep–Dec 2024)
    - ML anomaly detection on 50K+ samples
    - Jenkins + MQTT automation
    - Linux-based regression suite (250+ cases)
    - IPv6 log analysis (32% improvement)
- **Transpire Technologies** (Jan–Apr 2024)
  - AppSync & Supabase optimization
  - Real-time React analytics dashboard
  - Automated event anomaly detection (Selenium + Vector)

---

### 3. Projects Grid
Display in **two-column cards** with titles, brief descriptions, and tech tags.

**Projects:**
- **CourseClutch** (courseclutch.com)
  - Serverless course notifier (FastAPI + AWS Lambda + DynamoDB)
  - 12K+ courses, 99.8% uptime, Redis caching
- **Job Application Assistant (Reva)** (github.com/amanzav/reva)
  - Full-stack platform (Next.js + Prisma + LangChain)
  - Zod-validated feedback loop, embeddings-based matching
  - 94% accuracy on job matches

---

### 4. Skills Cluster
Grouped badges, minimal style:
- **Languages:** Python, Rust, TypeScript, C/C++, Kotlin, Java  
- **Frameworks:** React, Next.js, Prisma, LangChain  
- **Cloud & DevOps:** AWS, Docker, Kubernetes, Jenkins, Vercel  
- **Databases:** PostgreSQL, Supabase, Redis, MongoDB  

---

### 5. Contact & Footer
Compact footer area with icons only (GitHub, LinkedIn, Email).

---

## 🧩 Layout Logic (for LLM generation)
- Use **CSS grid** to display all content within one view height (no scroll).  
- Each major section (Hero, Experience, Projects, Skills, Footer) should occupy equal grid cells.  
- Compress long text with ellipsis or smart wrapping to fit visually.
- Animations trigger sequentially when page loads, not on scroll.

Example structure:
```tsx
<main className="grid grid-cols-2 grid-rows-2 h-screen">
  <Hero />
  <Experience />
  <Projects />
  <SkillsAndFooter />
</main>
```

---

## ⚙️ Animations (Framer Motion)

| Component | Motion | Details |
|-----------|--------|---------|
| Hero | Fade-in + spring-up | duration: 0.4s |
| Cards | Staggered fade-in | delayChildren: 0.1 |
| Buttons | Scale hover | spring stiffness 300 |
| Footer | Fade-in bottom | opacity transition only |

---

## 📦 Assets

- `/public/resume.pdf`
- `/public/favicon.ico`
- Social icons: LucideReact (Mail, GitHub, LinkedIn)
- Font: Inter (Google Fonts)

---

## 🧠 Functional Requirements

| Requirement | Description |
|-------------|-------------|
| R1 | Display all resume experience and project data in single viewport. |
| R2 | Implement framer-motion entrance animations. |
| R3 | Buttons link to resume.pdf and mailto. |
| R4 | Use shadcn/ui Button, Card, Badge, and Separator components. |
| R5 | No external dependencies beyond specified stack. |
| R6 | Fully responsive layout (but maintain single viewport on desktop). |

---

## 🧪 Non-Functional Requirements

- Load under 1s (static export)
- Fully accessible (ARIA roles)
- Deployed via GitHub Pages
- Compatible with all major browsers

---

## 📁 Deliverables

- `src/app/page.tsx` — main entry
- `src/components/hero.tsx`, `experience.tsx`, `projects.tsx`, `skills.tsx`
- `src/data/experience.ts`, `projects.ts`, `skills.ts`
- `public/resume.pdf`
- `next.config.ts` — configured for static export

---

## ✅ Success Criteria

- No vertical scrolling
- All text legible within viewport
- Animations subtle and responsive
- Fully generated, deployable static site

---

## 💡 Style Keywords

"Minimal, technical, dark, elegant, confident."