import "@/public/portfolio/home.css";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PortfolioSurface } from "@/components/portfolio/PortfolioSurface";
import { EXPERIENCE_NOTES } from "@/portfolio/runtime/experience-notes";

const markup = readFileSync(path.join(process.cwd(), "components/portfolio/shell.html"), "utf8");
const contacts = [
  ["GitHub", "https://github.com/amanzav", "github"],
  ["Contact", "mailto:a2zaveri@uwaterloo.ca", "mail"],
  ["Résumé", "/portfolio-assets/aman-zaveri-resume.pdf", "file-text"],
].map(([label, href, icon]) => ({ label, href, icon: readFileSync(path.join(process.cwd(), `public/portfolio-assets/pencil-contact-${icon}.svg`), "utf8") }));

export default function Home() {
  return (
    <>
      <PortfolioSurface markup={markup}>
        <main className="static-portfolio">
          <header>
            <h1>I’m <span>Aman</span>, a mechatronics student at Waterloo.</h1>
            <p>Currently building AI systems at Vooma.</p>
            <nav aria-label="Contact links" className="static-contacts">
              {contacts.map(({ label, href, icon }) => <a key={label} href={href} aria-label={label}
                target={href.startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer">
                <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: icon }} />
                <span className="static-tooltip" aria-hidden="true">{label}</span>
              </a>)}
            </nav>
          </header>
          <section className="static-work" aria-label="Selected work">
            {EXPERIENCE_NOTES.map(item => <details key={item.id}>
              <summary><span>{item.company}</span><h2>{item.text}</h2></summary>
              <p>{item.summary.join(" ")}</p>
            </details>)}
          </section>
        </main>
      </PortfolioSurface>
    </>
  );
}
