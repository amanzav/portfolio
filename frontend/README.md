# Aman Zaveri - Portfolio

A minimal, dark-themed, single-page portfolio built with Next.js, TypeScript, Tailwind CSS, shadcn/ui, and Framer Motion.

## 🚀 Features

- **No Scrolling Design**: All content visible in one viewport
- **Dark Theme**: Elegant dark UI with subtle animations
- **Framer Motion**: Smooth entrance and hover animations
- **shadcn/ui Components**: Modern, accessible UI components
- **Static Export**: Deployable to GitHub Pages or any static host
- **Responsive Grid**: 2x2 grid layout showcasing all sections

## 📦 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Font**: Inter (Google Fonts)

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main page with grid layout
│   └── globals.css         # Global styles and theme
├── components/
│   ├── hero.tsx            # Hero section with name and CTA
│   ├── experience.tsx      # Experience cards
│   ├── projects.tsx        # Project cards
│   ├── skills.tsx          # Skills and footer
│   └── ui/                 # shadcn/ui components
├── data/
│   ├── experience.ts       # Experience data
│   ├── projects.ts         # Projects data
│   └── skills.ts           # Skills data
└── public/
    └── resume.pdf          # Resume PDF for download
```

## 🎨 Customization

### Update Personal Information

1. **Data Files**: Edit files in `data/` folder:
   - `experience.ts` - Add/modify work experience
   - `projects.ts` - Add/modify projects
   - `skills.ts` - Add/modify skills

2. **Contact Info**: Update social links in:
   - `components/hero.tsx`
   - `components/skills.tsx`

3. **Resume**: Replace `public/resume.pdf` with your actual resume

4. **Metadata**: Update SEO information in `app/layout.tsx`

### Styling

- **Colors**: Modify CSS variables in `app/globals.css`
- **Accent Color**: Change `--accent` variable (currently cyan)
- **Fonts**: Update font imports in `app/layout.tsx`

## 🚀 Deployment

### Vercel (Recommended)

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

1. Push to GitHub
2. Import project in Vercel
3. Deploy automatically

### GitHub Pages

1. Build the static export:
```bash
npm run build
```

2. Deploy the `out/` folder to GitHub Pages

### Other Static Hosts

The build output in `out/` folder can be deployed to:
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront
- Any static file host

## 📝 To-Do

- [ ] Replace `public/resume.pdf` with your actual resume
- [ ] Update email addresses in hero and skills components
- [ ] Update GitHub, LinkedIn URLs
- [ ] Add custom domain (optional)

## 📄 License

MIT License - feel free to use this template for your own portfolio!

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Animations by [Framer Motion](https://www.framer.com/motion/)
- Icons from [Lucide](https://lucide.dev/)
