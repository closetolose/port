import { applyHeroLayout } from './hero-layout.js';

function setMeta(content) {
  document.title = content.site.title;
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', content.site.description);
}

function applyText(selector, text) {
  const el = document.querySelector(selector);
  if (el && text != null) el.textContent = text;
}

function applyHtml(selector, html) {
  const el = document.querySelector(selector);
  if (el && html != null) el.innerHTML = html;
}

function applyHeroList(selector, items) {
  const list = document.querySelector(selector);
  if (!list || !Array.isArray(items)) return;
  list.innerHTML = items.map((item) => `<li>${item}</li>`).join('');
}

function applyPrograms(cards) {
  const articles = document.querySelectorAll('#programs .card');
  cards.forEach((card, i) => {
    const el = articles[i];
    if (!el) return;
    const letter = el.querySelector('.card__icon--letter');
    if (letter) letter.textContent = card.letter;
    const title = el.querySelector('.card__title');
    if (title) title.textContent = card.title;
    const desc = el.querySelector('.card__desc');
    if (desc) desc.textContent = card.desc;
    const rates = el.querySelectorAll('.card__rate-value');
    if (rates[0]) {
      rates[0].innerHTML = `${card.individualPrice}&nbsp;₽<span class="card__rate-time">/ 60 мин</span>`;
    }
    if (rates[1]) {
      rates[1].innerHTML = `${card.groupPrice}&nbsp;₽<span class="card__rate-time">/ 60 мин</span>`;
    }
  });
}

function applyBenefits(items) {
  const cards = document.querySelectorAll('.benefit-card');
  items.forEach((item, i) => {
    const el = cards[i];
    if (!el) return;
    const title = el.querySelector('.benefit-card__title');
    const text = el.querySelector('.benefit-card__text');
    if (title) title.textContent = item.title;
    if (text) text.textContent = item.text;
  });
}

function applyDashboard(d) {
  applyText('.dashboard__eyebrow', d.eyebrow);
  applyText('#dashboard-title', d.title);
  applyHtml('.dashboard__lead', d.lead);
  const features = document.querySelectorAll('.dashboard__feature');
  d.features.forEach((text, i) => {
    const li = features[i];
    if (!li) return;
    [...li.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) child.remove();
    });
    li.append(document.createTextNode(text));
  });
  const cta = document.querySelector('.dashboard__content .btn--primary');
  if (cta) cta.textContent = d.cta;
  const img = document.querySelector('.dashboard-shot__img');
  if (img) {
    img.src = d.screenshot;
    img.alt = d.screenshotAlt;
  }
}

export function buildReviewsTrack(slides) {
  const track = document.querySelector('.reviews-carousel__track');
  if (!track) return;
  track.innerHTML = slides
    .map(
      (slide, i) => `
    <li class="review-slide">
      <figure class="review-shot">
        <img
          class="review-shot__img"
          src="${slide.src}"
          alt="${slide.alt.replace(/"/g, '&quot;')}"
          width="600"
          height="400"
          loading="${i === 0 ? 'eager' : 'lazy'}"
        />
      </figure>
    </li>`
    )
    .join('');
}

function applySkills(skills) {
  applyText('#skills .headline-green', skills.title);
  applyText('.program-section__intro', skills.intro);
  applyProgramCol('.program-col:not(.program-col--oge)', skills.ege);
  applyProgramCol('.program-col--oge', skills.oge);
}

function applyProgramCol(selector, data) {
  const col = document.querySelector(selector);
  if (!col) return;
  const badge = col.querySelector('.program-col__badge');
  if (badge) badge.textContent = data.badge;
  const items = col.querySelectorAll('.skill-item');
  data.items.forEach((item, i) => {
    const row = items[i];
    if (!row) return;
    const label = row.querySelector('.skill-item__label');
    const fill = row.querySelector('.skill-item__fill');
    if (label) label.textContent = item.label;
    if (fill) fill.setAttribute('data-skill-width', String(item.width));
  });
}

export async function loadContent() {
  try {
    const res = await fetch('/content.json');
    if (!res.ok) return null;
    const content = await res.json();

    setMeta(content);

    applyText('.logo span', content.site.logo);
    applyText('.header__cta', content.site.ctaHeader);

    const h = content.hero;
    applyText('.exam-badge--ege', h.badgeEge);
    applyText('.exam-badge--oge', h.badgeOge);
    const heroPhoto = document.querySelector('.hero .portrait');
    if (heroPhoto) {
      heroPhoto.src = h.photo;
      heroPhoto.alt = h.photoAlt;
    }
    applyText('.hero__tagline', h.tagline);
    applyText('[data-hero-block="title"]', h.title);
    const heroIntro = document.querySelector('.hero__intro');
    if (heroIntro) heroIntro.innerHTML = h.intro ?? '';
    applyText('.hero__block-title--approach', h.approachTitle);
    applyText('.hero__block-title--lessons', h.lessonsTitle);
    applyHeroList('.hero__list--approach', h.approachItems);
    applyHeroList('.hero__list--lessons', h.lessonsItems);
    applyText('.hero__note', h.note);
    const heroBtns = document.querySelectorAll('.hero__cta .btn');
    if (heroBtns[0]) heroBtns[0].textContent = h.ctaPrimary;
    if (heroBtns[1]) heroBtns[1].textContent = h.ctaSecondary;
    applyHeroLayout(document.getElementById('about'), h.layout);

    const p = content.programs;
    applyText('#programs .headline-green', p.title);
    applyText('#programs .body-text', p.intro);
    applyPrograms(p.cards);

    const b = content.benefits;
    applyText('#benefits .headline-green', b.title);
    applyText('.benefits__intro', b.intro);
    applyBenefits(b.items);

    applyDashboard(content.dashboard);

    const r = content.reviews;
    applyText('#reviews .headline-green', r.title);
    applyText('.reviews__intro', r.intro);
    buildReviewsTrack(r.slides);

    applySkills(content.skills);

    const c = content.contact;
    const contactSection = document.querySelector('#contact');
    if (contactSection) {
      applyText('#contact .section__content .headline-green', c.title);
      applyText('#contact .section__content .body-text', c.text);
      const form = contactSection.querySelector('.contact-form');
      if (form) {
        const [nameIn, emailIn, msgIn, submitBtn] = [
          form.querySelector('[name="name"]'),
          form.querySelector('[name="email"]'),
          form.querySelector('[name="message"]'),
          form.querySelector('.btn--primary'),
        ];
        if (nameIn) nameIn.placeholder = c.formNamePlaceholder;
        if (emailIn) emailIn.placeholder = c.formEmailPlaceholder;
        if (msgIn) msgIn.placeholder = c.formMessagePlaceholder;
        if (submitBtn) submitBtn.textContent = c.formSubmit;
      }
      applyText('.contact-card__header', c.cardHeader);
      const cardPhoto = contactSection.querySelector('.contact-card__avatar');
      if (cardPhoto) {
        cardPhoto.src = c.photo;
        if (c.photoAlt) cardPhoto.alt = c.photoAlt;
      }
      applyText('.contact-card__name', c.name);
      applyText('.contact-card__role', c.role);
      const phoneLink = contactSection.querySelector('.contact-card__link--phone');
      if (phoneLink) {
        phoneLink.textContent = c.phone;
        phoneLink.href = c.phoneHref;
      }
      const tgLink = contactSection.querySelector('.contact-card__link--telegram');
      if (tgLink) {
        tgLink.textContent = c.telegram;
        tgLink.href = c.telegramHref;
      }
      const emailLink = contactSection.querySelector(
        '.contact-card__list li:last-child .contact-card__link'
      );
      if (emailLink) {
        emailLink.textContent = c.email;
        emailLink.href = c.emailHref;
      }
    }

    const t = content.tools;
    applyText('.tools-showcase__title', t.title);
    applyText('.tools-showcase__subtitle', t.subtitle);
    applyText('.tools-showcase .btn--sky', t.cta);

    return content;
  } catch {
    return null;
  }
}
