# 🧭 Product Requirements Document (PRD)

**Product:** Aman Zaveri — Minimal One-Page Portfolio

---

## 🎯 Goal

Create a dark, minimal, single-page portfolio that looks effortless yet precise. It should display Aman’s core info, experience, and projects without scrolling. The aesthetic: simple, clean, confident.

---

## 🖥️ Core Requirements

- **No Scrolling:** All content must fit above the fold (≈1440×900).
- **Dark Theme:** Soft black background (#0d0d0d), white text (#f5f5f5), muted accent (#5b5bff).
- **Typography:** Use Inter or Space Grotesk. Two weights max.
- **Layout:** Centered or left-aligned grid, balanced margins, consistent spacing.
- **Animations:** Framer Motion fades/slides under 250 ms. No bounce, no overshoot.
- **Responsive:** Works on desktop and mobile without breaking layout.
- **Deployment:** Fully static — exported for GitHub Pages or Vercel.

---

## 🧩 Tech Stack

- **Next.js (App Router)** → static export mode (`next export`)
- **Tailwind CSS** → utility-first styling
- **Framer Motion** → subtle animations
- **shadcn/ui** → prebuilt minimal components (Button, Card, Tooltip)
- **Optional AI** → free API (Groq / OpenRouter) client-side fetch only

---

## ⚙️ Static Export Setup (GitHub Pages Compatible)

GitHub Pages only serves static files, so Next.js must export HTML.

### `next.config.mjs`

```javascript
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  basePath: '',
};
export default nextConfig;
```

### `package.json`

```json
"scripts": {
  "dev": "next dev",
  "build": "next build && next export"
}
```

After `npm run build`, deploy the `/out` folder to the `gh-pages` branch.  
If needed, set up a GitHub Action to auto-deploy after each commit.

---

## 📦 Content Structure (All Above the Fold)

### ### 1. Header

```
Aman Zaveri
Software Engineer
Toronto, ON
```

Small gray subtitle: *Building minimal, scalable systems across web and embedded.*

### 2. About (1 Line)

> Focused on creating software that's useful, fast, and invisible when done right.

### 3. Experience (Table Style)

| Company                  | Role                         | Date      |
|--------------------------|------------------------------|-----------|
| Ford Motor Company       | Software Engineering Intern  | 2024–2025 |
| Transpire Technologies   | Software Engineering Intern  | 2024      |
| University of Waterloo   | BASc Mechatronics (AI)       | 2023–2028 |

**Tooltips on hover show one-line summaries:**

- **Ford** — Developed route-aware fuel optimization widget (Kotlin).
- **Transpire** — Built real-time analytics platform (Flask + Kubernetes).

### ### 4. Projects (3 Max)

| Project            | Description                                          |
|--------------------|------------------------------------------------------|
| CourseClutch       | Serverless course notifier (FastAPI + AWS Lambda).   |
| Reva               | LLM-based job-matching assistant (Next.js + LangChain). |
| EV Education Game  | Unity + UGS EV learning game for EcoCAR.             |

Each project links to GitHub / live demo.

### 5. Links

Tiny monochrome icons: **GitHub** | **LinkedIn** | **Email**  
Hover → slight scale + accent color.

---

## 🧠 Optional AI Section

Expandable card titled **"Ask Reva"**.  
When clicked, open a small modal chat box that calls a free AI API (Groq / OpenRouter) from the client side using `fetch()`.

---

## 🧩 Visual Vibe Summary

- Minimal, confident, surgical alignment.
- Feels like a terminal that learned graphic design.
- Silence and spacing do the heavy lifting.

---

## 🚀 Deployment Summary

1. Run `npm run build` → static `/out` folder.
2. Deploy `/out` to `gh-pages` branch.
3. Enable Pages in repo settings.
4. Done — portfolio now live at `https://amanzav.github.io/`.
