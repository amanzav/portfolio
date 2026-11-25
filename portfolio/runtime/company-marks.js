import vooma from './assets/company-vooma.svg?raw';
import boomerang from './assets/company-boomerang.svg?raw';
import ford from './assets/company-ford.svg?raw';

const marks = { vooma, boomerang, ford };
const aliases = { 'boomerang inc.': 'boomerang', 'boomerang inc': 'boomerang', boomeranghr: 'boomerang', 'ford motor company': 'ford' };

export function createCompanyMark(company) {
  const name = String(company ?? '').trim().toLowerCase();
  const key = aliases[name] ?? name;
  const wrapper = document.createElement('span');
  wrapper.className = `company-mark company-mark--${marks[key] ? key : 'unknown'}`;
  wrapper.setAttribute('aria-hidden', 'true');
  if (!marks[key]) { wrapper.hidden = true; return wrapper; }
  wrapper.innerHTML = marks[key];
  wrapper.style.display = 'inline-flex';
  wrapper.style.verticalAlign = 'middle';
  wrapper.style.lineHeight = '0';
  const svg = wrapper.querySelector('svg');
  const [, , width, height] = svg.getAttribute('viewBox').split(/\s+/).map(Number);
  svg.setAttribute('height', '18');
  svg.setAttribute('width', String(18 * width / height));
  svg.style.display = 'block';
  return wrapper;
}
