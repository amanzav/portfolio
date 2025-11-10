# ⚡ Quick Start Guide

Get your portfolio up and running in 5 minutes.

---

## 📋 Prerequisites

- **Node.js** 18+ ([download here](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Git** ([download here](https://git-scm.com/))

---

## 🚀 Setup Steps

### 1. Install Dependencies

```bash
npm install
```

This installs all required packages:
- Next.js 14
- React 18
- Tailwind CSS
- Framer Motion
- shadcn/ui components
- Lucide icons

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should see your portfolio with:
- ✅ Dark theme (#0d0d0d background)
- ✅ All content above the fold
- ✅ Smooth Framer Motion animations
- ✅ Interactive tooltips on experience items
- ✅ Hover effects on social links

### 3. Customize Your Content

Edit these files to personalize your portfolio:

**Personal Info:**
```tsx
// components/Header.tsx
<h1>Aman Zaveri</h1> → <h1>Your Name</h1>
<p>Toronto, ON</p> → <p>Your Location</p>
```

**Experience:**
```tsx
// components/ExperienceTable.tsx
const experiences = [
  {
    company: "Your Company",
    role: "Your Role",
    date: "2024–2025",
    description: "What you did",
  },
  // Add more...
];
```

**Projects:**
```tsx
// components/Projects.tsx
const projects = [
  {
    name: "Your Project",
    description: "Project description",
    github: "https://github.com/yourusername/project",
  },
  // Add more...
];
```

**Social Links:**
```tsx
// components/SocialLinks.tsx
const links = [
  {
    name: "GitHub",
    href: "https://github.com/yourusername",
  },
  // Update LinkedIn and Email too
];
```

### 4. Test the Build

```bash
npm run build
```

This generates a static export in the `/out` folder.

**Success indicators:**
- ✅ No TypeScript errors
- ✅ No build errors
- ✅ `/out/index.html` exists
- ✅ Bundle size under 200KB

### 5. Deploy (Optional)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

**Quick deploy to Vercel:**
```bash
npm install -g vercel
vercel
```

**Quick deploy to Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --dir=out --prod
```

---

## 🎨 Optional: Enable AI Chat

The **"Ask Reva"** feature requires a free Groq API key.

1. Get a free API key from [console.groq.com](https://console.groq.com/)
2. Create `.env.local`:
   ```
   NEXT_PUBLIC_GROQ_API_KEY=your_api_key_here
   ```
3. Restart the dev server: `npm run dev`

---

## 🧪 Testing Checklist

Before deploying, verify:

- [ ] All personal info is updated
- [ ] All external links work
- [ ] Tooltips appear on hover (experience section)
- [ ] Social icons have correct URLs
- [ ] "Ask Reva" button appears (bottom right)
- [ ] Page fits above the fold (no scrolling)
- [ ] Animations are smooth (under 250ms)
- [ ] Dark theme is consistent
- [ ] Build completes without errors

---

## 📦 Project Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 🐛 Common Issues

**Problem: Port 3000 already in use**
```bash
# Kill the process
npx kill-port 3000
# Or use a different port
npm run dev -- -p 3001
```

**Problem: TypeScript errors**
```bash
# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Problem: Build fails**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**Problem: Styles not loading**
```bash
# Verify Tailwind config
npx tailwindcss init --check
```

---

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

## 💡 Tips

1. **Keep it minimal** — Remove sections you don't need
2. **Test on mobile** — Use browser dev tools
3. **Optimize images** — Use WebP format if adding photos
4. **Check accessibility** — Use semantic HTML
5. **Monitor bundle size** — Keep First Load JS under 200KB

---

> **Ready?** Run `npm install && npm run dev` and start customizing!
