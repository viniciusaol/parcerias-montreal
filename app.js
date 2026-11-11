'use strict';

const deck = document.querySelector('#apresentacao');
const slides = Array.from(deck.querySelectorAll('.slide'));
const index = document.querySelector('#index-dialog');
const indexLinks = document.querySelector('#index-links');
const openMenu = document.querySelector('#open-menu');
const readAll = document.querySelector('#read-all');
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const nextLabel = document.querySelector('#next-label');
const nextArrow = document.querySelector('#next-arrow');
const nav = document.querySelector('#deck-nav');
const count = document.querySelector('#slide-count');
const slideName = document.querySelector('#slide-name');
const progress = document.querySelector('#progress');
const slideNumbers = new Map(slides.map((slide, i) => [slide.id, i]));
const items = [];
let current = 0;
let reading = false;
let touchStart;

function padded(number) {
  return String(number).padStart(2, '0');
}

function showSlide(i, { focus = false, animate = false } = {}) {
  current = i;
  const active = slides[i];
  slides.forEach((slide, number) => {
    slide.hidden = !reading && number !== i;
    slide.classList.remove('is-entering');
    if (number === i) {
      items[number].setAttribute('aria-current', 'step');
    } else {
      items[number].removeAttribute('aria-current');
    }
  });
  if (animate && !reading) active.classList.add('is-entering');

  const last = i === slides.length - 1;
  count.textContent = `${padded(i + 1)} / ${padded(slides.length)}`;
  slideName.textContent = active.dataset.label;
  progress.style.width = `${(i + 1) / slides.length * 100}%`;
  previous.disabled = i === 0;
  nextLabel.textContent = last ? 'Início' : 'Próximo';
  nextArrow.textContent = last ? '↺' : '→';

  if (!reading) window.scrollTo(0, 0);
  if (focus) {
    const heading = active.querySelector('h1, h2');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
  if (reading && focus) active.scrollIntoView({ block: 'start' });
}

function goTo(i, focus = true) {
  if (i < 0 || i >= slides.length) return;
  const fragment = `#${slides[i].id}`;
  if (location.hash !== fragment) history.pushState(null, '', fragment);
  showSlide(i, { focus, animate: !reading });
}

let groupName;
slides.forEach((slide, i) => {
  if (groupName !== slide.dataset.group) {
    groupName = slide.dataset.group;
    const title = document.createElement('h3');
    title.textContent = groupName;
    indexLinks.append(title);
  }
  const item = document.createElement('a');
  item.href = `#${slide.id}`;
  const number = document.createElement('span');
  number.textContent = padded(i + 1);
  number.setAttribute('aria-hidden', 'true');
  item.append(number, slide.dataset.label);
  items.push(item);
  indexLinks.append(item);
});

function readHash() {
  const i = slideNumbers.get(location.hash.slice(1));
  if (i === undefined && reading) return;
  showSlide(i ?? 0);
}

function toggleReading() {
  reading = !reading;
  document.body.classList.toggle('carousel', !reading);
  nav.hidden = reading;
  readAll.firstChild.textContent = reading ? 'Voltar ao carrossel ' : 'Ler tudo em uma página ';
  readAll.lastElementChild.textContent = reading ? '↑' : '↓';
  index.close();
  showSlide(current, { focus: true });
}

function handleSlideLink(event) {
  const link = event.target.closest('a[href^="#"]');
  if (!link || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const i = slideNumbers.get(link.hash.slice(1));
  if (i === undefined) return;
  event.preventDefault();
  if (index.open) index.close();
  goTo(i);
}

document.addEventListener('click', handleSlideLink);
openMenu.addEventListener('click', () => index.showModal());
readAll.addEventListener('click', toggleReading);
previous.addEventListener('click', () => goTo(current - 1));
next.addEventListener('click', () => goTo(current === slides.length - 1 ? 0 : current + 1));
window.addEventListener('hashchange', readHash);

document.addEventListener('keydown', event => {
  if (reading || index.open || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const offset = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
  if (typeof offset !== 'number') return;
  event.preventDefault();
  goTo(current + offset);
});

deck.addEventListener('pointerdown', event => {
  touchStart = undefined;
  if (reading || !event.isPrimary || event.pointerType !== 'touch' || event.target.closest('a, button')) return;
  touchStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
});

deck.addEventListener('pointerup', event => {
  if (!touchStart || touchStart.id !== event.pointerId) return;
  const dx = event.clientX - touchStart.x;
  const dy = event.clientY - touchStart.y;
  touchStart = undefined;
  if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(current + (dx < 0 ? 1 : -1));
});

deck.addEventListener('pointercancel', () => { touchStart = undefined; });
document.body.classList.add('carousel');
openMenu.hidden = false;
nav.hidden = false;
deck.setAttribute('aria-roledescription', 'carrossel');
readHash();
