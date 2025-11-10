# 🧠 Copilot Instructions

This repository builds a **dark, minimal, one-page portfolio** for **Aman Zaveri**, following the full specifications in `PRD.md`.

---

## 🎯 Primary Objectives
1. Implement the portfolio **exactly as described in `PRD.md`**.
2. Use **Next.js (App Router)** with **Tailwind CSS**, **Framer Motion**, and **shadcn/ui**.
3. Ensure the site is **fully static-exportable** using `next export` (GitHub Pages compatible).
4. Keep all content **above the fold** — no scrolling.
5. Maintain an aesthetic that feels effortless, precise, and balanced.
6. The final product should look *simple*, *fast*, and *professionally minimal*.

---

## ⚙️ Technical Guidelines

- **Framework:** Next.js 14+
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **Components:** shadcn/ui
- **Deployment:** GitHub Pages or Vercel (must support static HTML export)

### When building:
- Use semantic HTML (`<header>`, `<section>`, `<main>`, `<footer>`).
- Favor clean utility classes instead of custom CSS files.
- Optimize for desktop (1440×900) with responsive fallback.
- Keep animations subtle (<250ms), no parallax or bounce.
- All assets (fonts, icons, etc.) must load locally or from free CDNs.

---

## 🧩 Optional AI Section

Include an optional **"Ask Reva"** modal that connects to a **free AI API** (Groq or OpenRouter) via client-side `fetch`.

This is a demo feature — no server code allowed.

---

## 🧠 Context + Reasoning Tools

You are allowed (and encouraged) to use the following LLM tools to improve quality:

- **Context7** → for architectural reasoning, component composition, and best practices.
- **Exa MCP** → for smart file generation, structured layout creation, and context linking.

Use them freely for planning, generating components, and refactoring logic.  
If stuck or uncertain, **query these tools as much as needed** — do not guess blindly.  

---

## 📂 File Layout Guidelines

```
root/
│
├── app/                      # Next.js App Router pages
│   └── page.tsx              # main portfolio page
│
├── components/               # shadcn + Framer Motion components
│
├── public/                   # assets (icons, fonts)
│
├── styles/                   # Tailwind config if needed
│
├── docs/
│   └── PRD.md                # main requirements document
│
├── next.config.mjs           # export configuration
└── copilot-instructions.md
```

---

## 🧭 Behavior Rules for the LLM

- Always follow `PRD.md` as the **single source of truth**.
- Ask Context7 or Exa MCP for clarification before assuming intent.
- Avoid adding unnecessary complexity (no blog, router pages, etc.).
- Prioritize code readability and composability.
- Output clean, production-ready code (no placeholder lorem ipsum).  

---

## ✅ Completion Definition

The portfolio is complete when:

- It perfectly matches the PRD layout and structure.
- It exports cleanly using `next export`.
- All text, projects, and links render correctly.
- The design looks "too simple to be accidental."

---

> “Build something that looks like you didn’t try — but it’s flawless.”