const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

export function initScrollReveals() {
  const revealTargets = document.querySelectorAll('.reveal');

  if (prefersReducedMotion) {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
    document.querySelectorAll('.program-col').forEach((col) => {
      col.querySelectorAll('.skill-item').forEach((el) => {
        el.classList.add('is-visible');
      });
    });
    document.querySelectorAll('.section__visual').forEach((el) => {
      el.classList.add('is-visible');
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        if (entry.target.classList.contains('program-col')) {
          revealSkillItems(entry.target);
        }
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
  );

  revealTargets.forEach((el) => observer.observe(el));
  document.querySelectorAll('.section__visual, .hero__portrait-stage, .exam-badge').forEach((el) => {
    observer.observe(el);
  });
  document.querySelectorAll('.program-col').forEach((col) => {
    observer.observe(col);
  });
}

function revealSkillItems(col) {
  col.querySelectorAll('.skill-item').forEach((item, index) => {
    item.classList.add('is-visible');
    item.style.setProperty('--skill-i', String(index));
  });
}

export function initHeroEntrance() {
  const hero = document.querySelector('.hero');
  const header = document.querySelector('.header');
  if (!hero) return;

  requestAnimationFrame(() => {
    hero.classList.add('hero--loaded');
    header?.classList.add('header--loaded');
  });
}

export function initSkillBars() {
  document.querySelectorAll('.skill-item').forEach((item, index) => {
    const fill = item.querySelector('.skill-item__fill');
    if (!fill) return;

    const target =
      fill.dataset.skillWidth || fill.style.width.replace('%', '');
    if (target) {
      item.style.setProperty('--skill-i', String(index));
      fill.style.removeProperty('width');
      fill.style.setProperty('--skill-scale', String(Number(target) / 100));
    }
  });
}
