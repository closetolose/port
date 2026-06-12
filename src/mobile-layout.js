const LAYOUTS = {
  stack: 'Стек',
  cards: 'Карточки',
  snap: 'Свайп',
};

const STORAGE_KEY = 'port-mobile-layout';
const DEFAULT_LAYOUT = 'stack';

export function initMobileLayout() {
  const lab = document.getElementById('layout-lab');
  if (!lab) return;

  const mq = window.matchMedia('(max-width: 900px)');
  const buttons = [...lab.querySelectorAll('[data-layout]')];

  const apply = (layout) => {
    const next = LAYOUTS[layout] ? layout : DEFAULT_LAYOUT;
    document.documentElement.dataset.mobileLayout = next;
    localStorage.setItem(STORAGE_KEY, next);
    buttons.forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.layout === next);
    });
  };

  const saved = localStorage.getItem(STORAGE_KEY);
  apply(saved && LAYOUTS[saved] ? saved : DEFAULT_LAYOUT);

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => apply(btn.dataset.layout));
  });

  const syncVisibility = () => {
    lab.hidden = !mq.matches;
    if (!mq.matches) {
      delete document.documentElement.dataset.mobileLayout;
    } else {
      const current = document.documentElement.dataset.mobileLayout;
      if (!current || !LAYOUTS[current]) apply(DEFAULT_LAYOUT);
    }
  };

  syncVisibility();
  mq.addEventListener('change', syncVisibility);
}
