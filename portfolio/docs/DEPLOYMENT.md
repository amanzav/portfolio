# 🚀 Deployment Guide

This portfolio is built with Next.js and configured for **static export**, making it compatible with GitHub Pages, Vercel, Netlify, and other static hosting platforms.

---

## 📦 Build Process

The project uses Next.js's static export feature to generate a complete static site in the `/out` folder.

```bash
npm run build
```

This command:
1. Compiles the Next.js application
2. Generates static HTML/CSS/JS files
3. Outputs everything to the `/out` directory

---

## 🌐 GitHub Pages Deployment

### Option 1: Manual Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. The static files will be in the `/out` folder

3. Push the `/out` folder to the `gh-pages` branch:
   ```bash
   git subtree push --prefix out origin gh-pages
   ```

4. Enable GitHub Pages in your repository settings:
   - Go to **Settings** → **Pages**
   - Set **Source** to `gh-pages` branch
   - Click **Save**

5. Your site will be live at: `https://yourusername.github.io/repository-name/`

### Option 2: Automatic Deployment (Recommended)

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys to GitHub Pages on every push to `main`.

**Setup Steps:**

1. Go to your repository **Settings** → **Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Push your code to the `main` branch
4. The workflow will automatically build and deploy your site

---

## 🎨 Vercel Deployment

Vercel provides zero-config deployment for Next.js:

1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Click **Import Project**
4. Select your GitHub repository
5. Vercel will automatically detect Next.js and deploy

Your site will be live at: `https://your-project.vercel.app`

---

## 💡 Netlify Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Visit [netlify.com](https://netlify.com)
3. Drag and drop the `/out` folder to deploy

Or use the Netlify CLI:
```bash
npm install -g netlify-cli
netlify deploy --dir=out --prod
```

---

## 🔧 Environment Variables

If you want to use the **Ask Reva** AI feature, you need to set up a Groq API key:

1. Get a free API key from [console.groq.com](https://console.groq.com/)
2. Create a `.env.local` file in the project root:
   ```
   NEXT_PUBLIC_GROQ_API_KEY=your_api_key_here
   ```

For GitHub Actions deployment, add the API key as a **repository secret**:
- Go to **Settings** → **Secrets and variables** → **Actions**
- Click **New repository secret**
- Name: `NEXT_PUBLIC_GROQ_API_KEY`
- Value: your API key

---

## ✅ Pre-Deployment Checklist

- [ ] Update personal information in `components/` files
- [ ] Add real GitHub URLs for projects
- [ ] Test the build locally: `npm run build`
- [ ] Verify the `/out` folder contains all necessary files
- [ ] Check that all animations and interactions work
- [ ] Test on different screen sizes
- [ ] Verify SEO metadata in `app/layout.tsx`

---

## 🐛 Troubleshooting

**Issue: Images not loading after deployment**
- Ensure `next.config.mjs` has `images: { unoptimized: true }`

**Issue: 404 on refresh (for non-GitHub Pages)**
- This is normal for static exports; the site is single-page only

**Issue: CSS not loading**
- Check that `basePath` in `next.config.mjs` matches your deployment path

---

## 📊 Performance Tips

- All assets are optimized during build
- Framer Motion animations are under 250ms
- Total bundle size is ~152KB (First Load JS)
- Perfect Lighthouse scores expected

---

> **Ready to deploy?** Run `npm run build` and choose your platform!
