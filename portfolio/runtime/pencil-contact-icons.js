import './pencil-contact-icons.css';
import githubIcon from './assets/pencil-contact-github.svg?raw';
import mailIcon from './assets/pencil-contact-mail.svg?raw';
import documentIcon from './assets/pencil-contact-file-text.svg?raw';

export function createPencilContactLinks() {
  const nav = document.createElement('nav');
  nav.className = 'pencil-contact-links';
  nav.setAttribute('aria-label', 'Contact links');
  const destinations = [
    ['GitHub', 'https://github.com/amanzav', githubIcon],
    ['Contact', 'mailto:a2zaveri@uwaterloo.ca', mailIcon],
    ['Résumé', new URL('./assets/aman-zaveri-resume.pdf', import.meta.url).href, documentIcon],
  ];
  for (const [label, href, icon] of destinations) {
    const link = document.createElement('a');
    link.className = 'pencil-contact-link';
    link.setAttribute('aria-label', label);
    link.href = href;
    if (!href.startsWith('mailto:')) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    link.innerHTML = icon;
    const tooltip = document.createElement('span');
    tooltip.className = 'pencil-contact-tooltip';
    tooltip.setAttribute('aria-hidden', 'true');
    tooltip.textContent = label;
    link.append(tooltip);
    nav.append(link);
  }
  return nav;
}
