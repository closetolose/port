import { applyHeroLayout, mergeHeroLayout } from './hero-layout.js';

let currentLayout = mergeHeroLayout();
let moveState = null;
let resizeState = null;

function post(type, payload = {}) {
  window.parent.postMessage({ source: 'hero-preview', type, ...payload }, '*');
}

function getSection() {
  return document.getElementById('about');
}

function resolveTarget(el) {
  if (!el) return null;
  if (el.closest('.exam-badge')) return 'badges';
  const block = el.closest('[data-hero-block]');
  if (!block) return null;
  return block.dataset.heroBlock;
}

function highlight(targetId) {
  document.querySelectorAll('[data-hero-block]').forEach((el) => {
    const id = el.dataset.heroBlock;
    const match =
      targetId === id || (targetId === 'badges' && id === 'photo') || targetId === id;
    el.classList.toggle('hero-visual-target', match && targetId !== 'badges');
    el.classList.toggle('hero-visual-target--active', match && targetId !== 'badges');
  });
  if (targetId === 'badges') {
    document.querySelectorAll('[data-hero-block="photo"] .exam-badge').forEach((el) => {
      el.classList.add('hero-visual-target', 'hero-visual-target--active');
    });
  }
}

function bindCanvasEvents() {
  const section = getSection();
  if (!section || section.dataset.visualEventsBound) return;
  section.dataset.visualEventsBound = '1';

  section.addEventListener('click', (e) => {
    const target = resolveTarget(e.target);
    if (!target) return;
    e.preventDefault();
    e.stopPropagation();
    highlight(target);
    post('select', { target });
  });
}

function bindPhotoMove() {
  const stage = document.querySelector('[data-hero-block="photo"]');
  if (!stage || stage.dataset.moveBound) return;
  stage.dataset.moveBound = '1';

  stage.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.hero-visual-resize-handle')) return;
    if (e.target.closest('.exam-badge')) return;
    e.preventDefault();
    moveState = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: currentLayout.photoOffsetX,
      baseY: currentLayout.photoOffsetY,
    };
    stage.setPointerCapture(e.pointerId);
    highlight('photo');
    post('select', { target: 'photo' });
  });

  stage.addEventListener('pointermove', (e) => {
    if (!moveState) return;
    currentLayout = {
      ...currentLayout,
      photoOffsetX: Math.round(moveState.baseX + e.clientX - moveState.startX),
      photoOffsetY: Math.round(moveState.baseY + e.clientY - moveState.startY),
    };
    applyHeroLayout(getSection(), currentLayout);
    post('layout', { layout: currentLayout });
  });

  const endMove = (e) => {
    if (!moveState) return;
    moveState = null;
    try {
      stage.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  stage.addEventListener('pointerup', endMove);
  stage.addEventListener('pointercancel', endMove);
}

function bindPhotoResize() {
  const stage = document.querySelector('[data-hero-block="photo"]');
  if (!stage) return;

  stage.querySelectorAll('.hero-visual-resize-handle').forEach((h) => h.remove());

  const handle = document.createElement('span');
  handle.className = 'hero-visual-resize-handle';
  handle.title = 'Тяните для изменения размера';
  stage.appendChild(handle);

  handle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isMobile = document.documentElement.dataset.heroVisualViewport === 'mobile';
    resizeState = {
      startX: e.clientX,
      base: isMobile ? currentLayout.mobilePhotoSize : currentLayout.photoSize,
      key: isMobile ? 'mobilePhotoSize' : 'photoSize',
    };
    handle.setPointerCapture(e.pointerId);
    highlight('photo');
    post('select', { target: 'photo' });
  });

  handle.addEventListener('pointermove', (e) => {
    if (!resizeState) return;
    const delta = e.clientX - resizeState.startX;
    const next = Math.max(56, Math.min(400, Math.round(resizeState.base + delta)));
    currentLayout = { ...currentLayout, [resizeState.key]: next };
    applyHeroLayout(getSection(), currentLayout);
    post('layout', { layout: currentLayout });
  });

  const endResize = (e) => {
    if (!resizeState) return;
    resizeState = null;
    try {
      handle.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  handle.addEventListener('pointerup', endResize);
  handle.addEventListener('pointercancel', endResize);
}

function refreshEditor() {
  bindPhotoResize();
}

function reportHeight() {
  const section = getSection();
  if (!section) return;

  const body = document.body;
  const bodyPad =
    parseFloat(getComputedStyle(body).paddingTop) + parseFloat(getComputedStyle(body).paddingBottom);
  let badgeOverflow = 0;

  section.querySelectorAll('.exam-badge, .hero-visual-resize-handle').forEach((el) => {
    const overflow = section.getBoundingClientRect().top - el.getBoundingClientRect().top;
    if (overflow > 0) badgeOverflow = Math.max(badgeOverflow, overflow);
  });

  post('measure', { height: Math.ceil(section.offsetHeight + badgeOverflow + bodyPad) });
}

function enableEditMode() {
  document.documentElement.classList.add('hero-visual-edit');
  bindCanvasEvents();
  bindPhotoMove();
  applyHeroLayout(getSection(), currentLayout);
  refreshEditor();
  requestAnimationFrame(() => reportHeight());
  post('ready');
}

export function initHeroVisualBridge() {
  if (!new URLSearchParams(location.search).has('hero-edit')) return;

  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || data.source !== 'hero-admin') return;

    if (data.type === 'layout') {
      currentLayout = mergeHeroLayout(data.layout);
      applyHeroLayout(getSection(), currentLayout);
      refreshEditor();
      if (data.target) highlight(data.target);
      requestAnimationFrame(() => reportHeight());
    }

    if (data.type === 'viewport') {
      document.documentElement.dataset.heroVisualViewport = data.viewport;
    }
  });

  enableEditMode();
}
